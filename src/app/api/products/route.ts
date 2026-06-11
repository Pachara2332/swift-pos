import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { publishRealtime } from '@/lib/realtime'
import { getRequestStoreId } from '@/lib/store-scope'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { barcode, name, brand, imageUrl, category, costPrice, salePrice, stock, lowStockAlert } = body
    const storeId = await getRequestStoreId(request)
    const auth = await requireRole(storeId, ['Admin'])
    if (!auth.ok) return auth.response

    if (!barcode || !name) {
      return NextResponse.json({ error: 'Barcode and name are required' }, { status: 400 })
    }

    const existing = await prisma.product.findFirst({ where: { storeId, barcode } })
    const product = existing
      ? await prisma.product.update({
        where: { id: existing.id },
        data: {
          name,
          brand,
          imageUrl,
          category,
          costPrice: Number(costPrice) || 0,
          salePrice: Number(salePrice) || 0,
          stock: Number(stock) || 0,
          lowStockAlert: Number(lowStockAlert) || 5,
        },
      })
      : await prisma.product.create({
        data: {
          storeId,
          barcode,
          name,
          brand,
          imageUrl,
          category,
          costPrice: Number(costPrice) || 0,
          salePrice: Number(salePrice) || 0,
          stock: Number(stock) || 0,
          lowStockAlert: Number(lowStockAlert) || 5,
        },
      })

    publishRealtime({
      type: 'product.changed',
      action: existing ? 'updated' : 'created',
      product,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error saving product:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const storeId = await getRequestStoreId(request)
    const auth = await requireRole(storeId, ['Admin', 'Manager', 'Cashier'])
    if (!auth.ok) return auth.response

    const products = await prisma.product.findMany({
      where: { storeId },
      orderBy: { updatedAt: 'desc' }
    })
    return NextResponse.json(products)
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
