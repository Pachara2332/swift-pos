import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isStoreRole } from '@/lib/role-constants'
import { createPasswordReset } from '@/lib/roles'
import { sendRolePasswordOtp } from '@/lib/sms'
import { isValidE164PhoneNumber } from '@/lib/phone'
import { getRequestStoreId } from '@/lib/store-scope'

export async function POST(request: Request) {
  try {
    const { role, currentPassword } = await request.json()

    if (!isStoreRole(role) || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'Role and current password are required' }, { status: 400 })
    }

    const storeId = await getRequestStoreId(request)
    const store = await prisma.store.findUnique({ where: { id: storeId } })
    const ownerPhone = store?.ownerPhone

    if (!ownerPhone || !isValidE164PhoneNumber(ownerPhone)) {
      return NextResponse.json({ error: 'Owner phone is not set for this store' }, { status: 400 })
    }

    const reset = await createPasswordReset(role, ownerPhone, currentPassword, storeId)
    if (!reset.ok) {
      return NextResponse.json({ error: reset.error }, { status: 401 })
    }

    await sendRolePasswordOtp({
      to: ownerPhone,
      role,
      fallbackCode: reset.code,
    })

    return NextResponse.json({ expiresAt: reset.expiresAt })
  } catch (error) {
    console.error('Role password reset request error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
