import { NextResponse } from 'next/server'
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
    const { total, paidAmount, change, items } = body as { total: number; paidAmount: number; change: number; items?: SaleRequestItem[] }
    const storeId = await getRequestStoreId(request)

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Sale must have items' }, { status: 400 })
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

      return sale
    })

    publishRealtime({
      type: 'sale.completed',
      saleId: result.id,
      productIds: items.map((item) => item.productId),
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error recording sale:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
