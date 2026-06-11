import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { publishRealtime, type RealtimeCartItem } from '@/lib/realtime'
import { getRequestStoreId } from '@/lib/store-scope'

export async function POST(request: Request) {
  try {
    const storeId = await getRequestStoreId(request)
    const auth = await requireRole(storeId, ['Admin', 'Manager', 'Cashier'])
    if (!auth.ok) return auth.response

    const { sessionId, items, itemCount, total } = await request.json()

    if (typeof sessionId !== 'string' || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Current sale payload is invalid' }, { status: 400 })
    }

    publishRealtime({
      type: 'current-sale.updated',
      sessionId,
      items: items as RealtimeCartItem[],
      itemCount: Number(itemCount) || 0,
      total: Number(total) || 0,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Current sale realtime error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
