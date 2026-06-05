import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isStoreRole } from '@/lib/role-constants'
import { changeRolePassword } from '@/lib/roles'
import { isTwilioVerifyConfigured, verifyRolePasswordOtp } from '@/lib/sms'
import { isValidE164PhoneNumber } from '@/lib/phone'
import { getRequestStoreId } from '@/lib/store-scope'

export async function POST(request: Request) {
  try {
    const { role, otp, newPassword } = await request.json()

    if (!isStoreRole(role) || typeof otp !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'Role, OTP, and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const cleanOtp = otp.trim()
    const storeId = await getRequestStoreId(request)
    const store = await prisma.store.findUnique({ where: { id: storeId } })
    const ownerPhone = store?.ownerPhone

    if (!ownerPhone || !isValidE164PhoneNumber(ownerPhone)) {
      return NextResponse.json({ error: 'Owner phone is not set for this store' }, { status: 400 })
    }

    const providerApproved = await verifyRolePasswordOtp(ownerPhone, cleanOtp)
    if (!providerApproved) {
      return NextResponse.json({ error: 'OTP is invalid or expired' }, { status: 401 })
    }

    const result = await changeRolePassword(role, ownerPhone, cleanOtp, newPassword, {
      skipLocalOtpCheck: isTwilioVerifyConfigured(),
      storeId,
    })
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Role password reset confirm error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
