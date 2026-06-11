import { NextResponse } from 'next/server'
import { clearRoleSessionCookie, getRoleSession } from '@/lib/auth'

export async function GET() {
  const session = await getRoleSession()
  return NextResponse.json({
    authenticated: Boolean(session),
    role: session?.role ?? null,
    storeId: session?.storeId ?? null,
  })
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  clearRoleSessionCookie(response)
  return response
}
