import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publishRealtime } from '@/lib/realtime'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { barcode, name, brand, imageUrl, category, costPrice, salePrice, stock, lowStockAlert } = body

    if (!barcode || !name) {
      return NextResponse.json({ error: 'Barcode and name are required' }, { status: 400 })
    }

    const existing = await prisma.product.findUnique({ where: { barcode } })
    const product = await prisma.product.upsert({
      where: { barcode },
      update: {
        name,
        brand,
        imageUrl,
        category,
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice) || 0,
        stock: Number(stock) || 0,
        lowStockAlert: Number(lowStockAlert) || 5,
      },
      create: {
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

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { updatedAt: 'desc' }
    })
    return NextResponse.json(products)
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
