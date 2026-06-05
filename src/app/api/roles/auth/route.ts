import { NextResponse } from 'next/server'
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

    return NextResponse.json({ role, storeId })
  } catch (error) {
    console.error('Role auth error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
