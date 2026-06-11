import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRequestStoreId } from '@/lib/store-scope'

function serializeEntry(entry: {
  id: string
  customerId: string
  type: string
  amount: number
  note: string
  createdAt: Date
}) {
  return {
    id: entry.id,
    customerId: entry.customerId,
    type: entry.type,
    amount: entry.amount,
    note: entry.note,
    createdAt: entry.createdAt.toISOString(),
  }
}

export async function GET(request: Request) {
  try {
    const storeId = await getRequestStoreId(request)
    const auth = await requireRole(storeId, ['Admin', 'Manager', 'Cashier'])
    if (!auth.ok) return auth.response

    const entries = await prisma.debtEntry.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    return NextResponse.json(entries.map(serializeEntry))
  } catch (error) {
    console.error('Debt entries load error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const storeId = await getRequestStoreId(request)
    const auth = await requireRole(storeId, ['Admin', 'Manager', 'Cashier'])
    if (!auth.ok) return auth.response

    const body = await request.json()
    const customerId = typeof body.customerId === 'string' ? body.customerId : ''
    const type = body.type === 'payment' ? 'payment' : body.type === 'sale' ? 'sale' : ''
    const amount = Number(body.amount)
    const note = typeof body.note === 'string' ? body.note.trim() : ''
    const saleId = typeof body.saleId === 'string' && body.saleId.trim() ? body.saleId.trim() : null

    if (!customerId || !type || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Customer, type, and amount are required' }, { status: 400 })
    }

    const customer = await prisma.debtCustomer.findFirst({ where: { id: customerId, storeId } })
    if (!customer) {
      return NextResponse.json({ error: 'Debt customer was not found' }, { status: 400 })
    }

    if (saleId) {
      const sale = await prisma.sale.findFirst({ where: { id: saleId, storeId } })
      if (!sale) {
        return NextResponse.json({ error: 'Sale was not found' }, { status: 400 })
      }
    }

    const entry = await prisma.debtEntry.create({
      data: {
        storeId,
        customerId,
        saleId,
        type,
        amount,
        note,
      },
    })

    return NextResponse.json(serializeEntry(entry), { status: 201 })
  } catch (error) {
    console.error('Debt entry save error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
