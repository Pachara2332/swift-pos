import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode } = await params
    
    // 1. Search in local database
    const localProduct = await prisma.product.findUnique({
      where: { barcode },
    })

    if (localProduct) {
      return NextResponse.json({ source: 'local', product: localProduct })
    }

    // 2. If not found, fetch from Open Food Facts API
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await response.json()

    if (data.status === 1 && data.product) {
      // Map Open Food Facts data to our schema shape
      const externalProduct = {
        barcode: barcode,
        name: data.product.product_name || 'Unknown Product',
        brand: data.product.brands || '',
        imageUrl: data.product.image_url || '',
        category: data.product.categories?.split(',')[0] || '',
        // Defaults for fields the owner needs to fill
        costPrice: 0,
        salePrice: 0,
        stock: 0,
        lowStockAlert: 5,
      }
      return NextResponse.json({ source: 'external', product: externalProduct })
    }

    // 3. Not found anywhere
    return NextResponse.json({ source: 'none', product: null }, { status: 404 })

  } catch (error) {
    console.error('Error fetching product by barcode:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
