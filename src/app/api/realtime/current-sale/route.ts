import { NextResponse } from 'next/server'
import { publishRealtime, type RealtimeCartItem } from '@/lib/realtime'

export async function POST(request: Request) {
  try {
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
