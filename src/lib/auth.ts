import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { isStoreRole, type StoreRole } from '@/lib/role-constants'
import { DEFAULT_STORE_ID } from '@/lib/store-scope'

export const roleSessionCookieName = 'swift-pos-role-session'

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 10

type RoleSessionPayload = {
  role: StoreRole
  storeId: string
  expiresAt: number
}

function sessionSecret() {
  return process.env.SWIFT_POS_SESSION_SECRET
    ?? process.env.SWIFT_POS_DEFAULT_ROLE_PASSWORD
    ?? process.env.DATABASE_URL
    ?? 'swift-pos-dev-session-secret'
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(value: string) {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url')
}

function verifySignature(value: string, signature: string) {
  const expected = Buffer.from(sign(value))
  const actual = Buffer.from(signature)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function createRoleSession(role: StoreRole, storeId = DEFAULT_STORE_ID) {
  const payload: RoleSessionPayload = {
    role,
    storeId,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  }
  const encoded = encodeBase64Url(JSON.stringify(payload))
  return `${encoded}.${sign(encoded)}`
}

export function readRoleSessionToken(token: string | undefined) {
  if (!token) return null

  const [encoded, signature] = token.split('.')
  if (!encoded || !signature || !verifySignature(encoded, signature)) return null

  try {
    const payload = JSON.parse(decodeBase64Url(encoded)) as Partial<RoleSessionPayload>
    if (!isStoreRole(payload.role) || typeof payload.storeId !== 'string' || typeof payload.expiresAt !== 'number') {
      return null
    }
    if (payload.expiresAt <= Date.now()) return null

    return payload as RoleSessionPayload
  } catch {
    return null
  }
}

export async function getRoleSession() {
  const cookieStore = await cookies()
  return readRoleSessionToken(cookieStore.get(roleSessionCookieName)?.value)
}

export function setRoleSessionCookie(response: NextResponse, role: StoreRole, storeId = DEFAULT_STORE_ID) {
  response.cookies.set(roleSessionCookieName, createRoleSession(role, storeId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export function clearRoleSessionCookie(response: NextResponse) {
  response.cookies.set(roleSessionCookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export async function requireRole(storeId: string, allowedRoles: StoreRole[]) {
  const session = await getRoleSession()
  if (!session || session.storeId !== storeId || !allowedRoles.includes(session.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { ok: true as const, session }
}
