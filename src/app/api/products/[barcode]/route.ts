import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequestStoreId } from '@/lib/store-scope'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode } = await params
    const url = new URL(request.url)
    const shouldLookupExternal = url.searchParams.get('external') === '1'
    const storeId = await getRequestStoreId(request)
    
    // 1. Search in local database
    const localProduct = await prisma.product.findUnique({
      where: { storeId_barcode: { storeId, barcode } },
    })

    if (localProduct) {
      return NextResponse.json({ source: 'local', product: localProduct })
    }

    if (!shouldLookupExternal) {
      return NextResponse.json({ source: 'none', product: null }, { status: 404 })
    }

    // 2. If explicitly requested, fetch from Open Food Facts API with a short timeout.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 1800)
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      signal: controller.signal,
    })
    clearTimeout(timer)
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
