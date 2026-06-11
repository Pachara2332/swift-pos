import { NextResponse } from 'next/server'
import { setRoleSessionCookie } from '@/lib/auth'
import { isStoreRole } from '@/lib/role-constants'
import { verifyRolePassword } from '@/lib/roles'
import { getRequestStoreId } from '@/lib/store-scope'

export async function POST(request: Request) {
  try {
    const { role, password } = await request.json()

    if (!isStoreRole(role) || typeof password !== 'string' || password.length === 0) {
      return NextResponse.json({ error: 'Role and password are required' }, { status: 400 })
    }

    const storeId = await getRequestStoreId(request)
    const isValid = await verifyRolePassword(role, password, storeId)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid role password' }, { status: 401 })
    }

    const response = NextResponse.json({ role, storeId })
    setRoleSessionCookie(response, role, storeId)
    return response
  } catch (error) {
    console.error('Role auth error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
