import { NextResponse } from 'next/server'
import { isStoreRole } from '@/lib/role-constants'
import { createPasswordReset } from '@/lib/roles'
import { sendSms } from '@/lib/sms'

export async function POST(request: Request) {
  try {
    const { role, phone, currentPassword } = await request.json()

    if (!isStoreRole(role) || typeof phone !== 'string' || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'Role, phone, and current password are required' }, { status: 400 })
    }

    const cleanPhone = phone.trim()
    if (cleanPhone.length < 8) {
      return NextResponse.json({ error: 'Phone number is invalid' }, { status: 400 })
    }

    const reset = await createPasswordReset(role, cleanPhone, currentPassword)
    if (!reset.ok) {
      return NextResponse.json({ error: reset.error }, { status: 401 })
    }

    await sendSms({
      to: cleanPhone,
      message: `Swift POS ${role} password reset code: ${reset.code}. This code expires in 10 minutes.`,
    })

    return NextResponse.json({ expiresAt: reset.expiresAt })
  } catch (error) {
    console.error('Role password reset request error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
