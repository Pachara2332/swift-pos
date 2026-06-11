import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRequestStoreId } from '@/lib/store-scope'

export async function GET(request: Request) {
  try {
    const storeId = await getRequestStoreId(request)
    const auth = await requireRole(storeId, ['Admin', 'Manager', 'Cashier'])
    if (!auth.ok) return auth.response

    const customers = await prisma.debtCustomer.findMany({
      where: { storeId },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      createdAt: customer.createdAt.toISOString(),
    })))
  } catch (error) {
    console.error('Debt customers load error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const storeId = await getRequestStoreId(request)
    const auth = await requireRole(storeId, ['Admin', 'Manager', 'Cashier'])
    if (!auth.ok) return auth.response

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const phone = typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null

    if (!name) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }

    const customer = await prisma.debtCustomer.create({
      data: { storeId, name, phone },
    })

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      createdAt: customer.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Debt customer save error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
