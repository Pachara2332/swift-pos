import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { storeRoles, type StoreRole } from '@/lib/role-constants'

const DEFAULT_ROLE_PASSWORD = process.env.SWIFT_POS_DEFAULT_ROLE_PASSWORD ?? '123456'
const OTP_TTL_MINUTES = 10

function hashSecret(secret: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(secret, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

function verifySecret(secret: string, storedHash: string) {
  const [salt, key] = storedHash.split(':')
  if (!salt || !key) return false

  const expected = Buffer.from(key, 'hex')
  const actual = scryptSync(secret, salt, 64)

  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export async function ensureRoleCredentials() {
  for (const role of storeRoles) {
    const existing = await prisma.roleCredential.findUnique({ where: { role } })
    if (!existing) {
      await prisma.roleCredential.create({
        data: {
          role,
          passwordHash: hashSecret(DEFAULT_ROLE_PASSWORD),
        },
      })
    }
  }
}

export async function verifyRolePassword(role: StoreRole, password: string) {
  await ensureRoleCredentials()

  const credential = await prisma.roleCredential.findUnique({ where: { role } })
  if (!credential) return false

  return verifySecret(password, credential.passwordHash)
}

export async function createPasswordReset(role: StoreRole, phone: string, currentPassword: string) {
  const isValid = await verifyRolePassword(role, currentPassword)
  if (!isValid) {
    return { ok: false as const, error: 'Current password is incorrect' }
  }

  const credential = await prisma.roleCredential.findUnique({ where: { role } })
  if (credential?.phone && credential.phone !== phone) {
    return { ok: false as const, error: 'Phone number does not match this role' }
  }

  const code = randomBytes(3).readUIntBE(0, 3).toString().slice(0, 6).padStart(6, '0')
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

  await prisma.rolePasswordReset.create({
    data: {
      role,
      phone,
      codeHash: hashSecret(code),
      expiresAt,
    },
  })

  return { ok: true as const, code, expiresAt }
}

export async function changeRolePassword(role: StoreRole, phone: string, code: string, newPassword: string) {
  const reset = await prisma.rolePasswordReset.findFirst({
    where: {
      role,
      phone,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!reset || !verifySecret(code, reset.codeHash)) {
    return { ok: false as const, error: 'OTP is invalid or expired' }
  }

  await prisma.$transaction([
    prisma.roleCredential.upsert({
      where: { role },
      update: {
        phone,
        passwordHash: hashSecret(newPassword),
      },
      create: {
        role,
        phone,
        passwordHash: hashSecret(newPassword),
      },
    }),
    prisma.rolePasswordReset.update({
      where: { id: reset.id },
      data: { consumedAt: new Date() },
    }),
  ])

  return { ok: true as const }
}
