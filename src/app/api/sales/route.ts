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

function toFiniteNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function normalizeSaleItems(items: unknown) {
  if (!Array.isArray(items) || items.length === 0) return null

  const normalized = items.map((item) => {
    const candidate = item as Partial<SaleRequestItem>
    const productId = typeof candidate.productId === 'string' ? candidate.productId.trim() : ''
    const quantity = toFiniteNumber(candidate.quantity)
    const price = toFiniteNumber(candidate.price)

    if (!productId || quantity === null || price === null || !Number.isInteger(quantity) || quantity <= 0 || price < 0) {
      return null
    }

    return { productId, quantity, price }
  })

  if (normalized.some((item) => item === null)) return null
  return normalized as SaleRequestItem[]
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { total, paidAmount, change, items, paymentType, customerId } = body as {
      total: unknown
      paidAmount: unknown
      change: unknown
      paymentType?: string
      customerId?: string
      items?: unknown
    }
    const storeId = await getRequestStoreId(request)
    const auth = await requireRole(storeId, ['Admin', 'Manager', 'Cashier'])
    if (!auth.ok) return auth.response

    const normalizedTotal = toFiniteNumber(total)
    const normalizedPaidAmount = toFiniteNumber(paidAmount)
    const normalizedChange = toFiniteNumber(change)
    const normalizedItems = normalizeSaleItems(items)
    const normalizedPaymentType = paymentType === 'credit' ? 'credit' : 'cash'
    const normalizedCustomerId = typeof customerId === 'string' && customerId.trim() ? customerId.trim() : null

    if (normalizedTotal === null || normalizedTotal < 0 || normalizedPaidAmount === null || normalizedPaidAmount < 0 || normalizedChange === null) {
      return NextResponse.json({ error: 'Sale totals are invalid' }, { status: 400 })
    }

    if (!normalizedItems) {
      return NextResponse.json({ error: 'Sale must have valid items' }, { status: 400 })
    }

    const products = await prisma.product.findMany({
      where: { id: { in: normalizedItems.map((item) => item.productId) }, storeId },
      select: { id: true },
    })
    const productIds = new Set(products.map((product) => product.id))
    const missingProductIds = Array.from(new Set(normalizedItems.map((item) => item.productId))).filter((id) => !productIds.has(id))

    if (missingProductIds.length > 0) {
      return NextResponse.json({
        error: 'Sale contains products that are not available in this store',
        missingProductIds,
      }, { status: 409 })
    }

    if (normalizedCustomerId) {
      const customer = await prisma.debtCustomer.findFirst({ where: { id: normalizedCustomerId, storeId } })
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
          total: normalizedTotal,
          paidAmount: normalizedPaidAmount,
          change: normalizedChange,
          paymentType: normalizedPaymentType,
          customerId: normalizedCustomerId,
          items: {
            create: normalizedItems.map((item) => ({
              storeId,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      })

      // 2. Decrement stock for each product
      for (const item of normalizedItems) {
        await tx.product.updateMany({
          where: { id: item.productId, storeId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      }

      const debtEntry = normalizedPaymentType === 'credit' && normalizedCustomerId
        ? await tx.debtEntry.create({
          data: {
            storeId,
            customerId: normalizedCustomerId,
            saleId: sale.id,
            type: 'sale',
            amount: normalizedTotal,
            note: `ขายเชื่อ ${normalizedItems.length} รายการ`,
          },
        })
        : null

      return { sale, debtEntry }
    })

    publishRealtime({
      type: 'sale.completed',
      saleId: result.sale.id,
      productIds: normalizedItems.map((item) => item.productId),
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
