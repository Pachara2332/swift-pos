import { NextResponse } from 'next/server'
import { isStoreRole } from '@/lib/role-constants'
import { changeRolePassword } from '@/lib/roles'

export async function POST(request: Request) {
  try {
    const { role, phone, otp, newPassword } = await request.json()

    if (!isStoreRole(role) || typeof phone !== 'string' || typeof otp !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'Role, phone, OTP, and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const result = await changeRolePassword(role, phone.trim(), otp.trim(), newPassword)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Role password reset confirm error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
