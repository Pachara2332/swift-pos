import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { publishRealtime } from '@/lib/realtime'
import { getRequestStoreId } from '@/lib/store-scope'

type SaleRequestItem = {
  productId: string
  quantity: number
  price: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { total, paidAmount, change, items, paymentType, customerId } = body as {
      total: number
      paidAmount: number
      change: number
      paymentType?: string
      customerId?: string
      items?: SaleRequestItem[]
    }
    const storeId = await getRequestStoreId(request)
    const auth = await requireRole(storeId, ['Admin', 'Manager', 'Cashier'])
    if (!auth.ok) return auth.response

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Sale must have items' }, { status: 400 })
    }

    if (customerId) {
      const customer = await prisma.debtCustomer.findFirst({ where: { id: customerId, storeId } })
      if (!customer) {
        return NextResponse.json({ error: 'Debt customer was not found' }, { status: 400 })
      }
    }

    // Use a transaction to ensure both the sale is created and stock is decremented
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Sale
      const sale = await tx.sale.create({
        data: {
          storeId,
          total: Number(total),
          paidAmount: Number(paidAmount),
          change: Number(change),
          paymentType: paymentType === 'credit' ? 'credit' : 'cash',
          customerId: customerId || null,
          items: {
            create: items.map((item) => ({
              storeId,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      })

      // 2. Decrement stock for each product
      for (const item of items) {
        await tx.product.updateMany({
          where: { id: item.productId, storeId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      }

      const debtEntry = paymentType === 'credit' && customerId
        ? await tx.debtEntry.create({
          data: {
            storeId,
            customerId,
            saleId: sale.id,
            type: 'sale',
            amount: Number(total),
            note: `ขายเชื่อ ${items.length} รายการ`,
          },
        })
        : null

      return { sale, debtEntry }
    })

    publishRealtime({
      type: 'sale.completed',
      saleId: result.sale.id,
      productIds: items.map((item) => item.productId),
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      id: result.sale.id,
      createdAt: result.sale.createdAt.toISOString(),
      debtEntry: result.debtEntry ? {
        id: result.debtEntry.id,
        customerId: result.debtEntry.customerId,
        type: result.debtEntry.type,
        amount: result.debtEntry.amount,
        note: result.debtEntry.note,
        createdAt: result.debtEntry.createdAt.toISOString(),
      } : null,
    }, { status: 201 })
  } catch (error) {
    console.error('Error recording sale:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
