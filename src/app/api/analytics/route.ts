import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRequestStoreId } from '@/lib/store-scope'

type SaleWithItems = {
  id: string
  total: number
  createdAt: Date
  items: {
    quantity: number
    price: number
    product: {
      id: string
      name: string
      stock: number
      lowStockAlert: number
    }
  }[]
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Analytics request timed out')), timeoutMs)
    }),
  ])
}

export async function GET(request: Request) {
  try {
    const storeId = await getRequestStoreId(request)
    const auth = await requireRole(storeId, ['Admin', 'Manager'])
    if (!auth.ok) return auth.response

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const trendStart = new Date(now)
    trendStart.setDate(trendStart.getDate() - 13)
    trendStart.setHours(0, 0, 0, 0)

    const [sales, products] = await withTimeout(
      Promise.all([
        prisma.sale.findMany({
          where: { storeId, createdAt: { gte: trendStart } },
          orderBy: { createdAt: 'asc' },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    stock: true,
                    lowStockAlert: true,
                  },
                },
              },
            },
          },
        }),
        prisma.product.findMany({
          where: { storeId },
          orderBy: { stock: 'asc' },
          select: {
            id: true,
            name: true,
            stock: true,
            lowStockAlert: true,
            salePrice: true,
          },
        }),
      ]),
      8000
    )

    const typedSales = sales as SaleWithItems[]
    const todaySales = typedSales.filter((sale) => sale.createdAt >= todayStart)
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
    const todayTransactions = todaySales.length

    const productTotals = new Map<string, { name: string; quantity: number; revenue: number }>()
    const hourlyTotals = Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0, sales: 0 }))

    for (const sale of todaySales) {
      const hourBucket = hourlyTotals[sale.createdAt.getHours()]
      hourBucket.revenue += sale.total
      hourBucket.sales += 1

      for (const item of sale.items) {
        const current = productTotals.get(item.product.id) ?? {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
        }

        current.quantity += item.quantity
        current.revenue += item.quantity * item.price
        productTotals.set(item.product.id, current)
      }
    }

    const trendTotals = new Map<string, number>()
    for (let i = 13; i >= 0; i -= 1) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().slice(0, 10)
      trendTotals.set(key, 0)
    }

    for (const sale of typedSales) {
      const key = sale.createdAt.toISOString().slice(0, 10)
      if (trendTotals.has(key)) {
        trendTotals.set(key, (trendTotals.get(key) ?? 0) + sale.total)
      }
    }

    return NextResponse.json({
      todayRevenue,
      todayTransactions,
      averageTicket: todayTransactions > 0 ? todayRevenue / todayTransactions : 0,
      topProducts: Array.from(productTotals.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5),
      lowStockProducts: products
        .filter((product) => product.stock <= product.lowStockAlert)
        .slice(0, 8),
      salesByHour: hourlyTotals.filter((bucket) => bucket.revenue > 0 || bucket.sales > 0),
      revenueTrend: Array.from(trendTotals.entries()).map(([date, revenue]) => ({ date, revenue })),
    })
  } catch (error) {
    console.error('Error loading analytics:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    const status = message.includes('timed out') ? 504 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
