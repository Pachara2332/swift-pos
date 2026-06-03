import { NextResponse } from 'next/server'
import { publishRealtime, type RealtimeEvent } from '@/lib/realtime'

export async function POST(request: Request) {
  try {
    const token = process.env.REALTIME_WEBHOOK_TOKEN
    if (token && request.headers.get('authorization') !== `Bearer ${token}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = (await request.json()) as Partial<RealtimeEvent>
    if (
      event.type !== 'product.changed' &&
      event.type !== 'sale.completed' &&
      event.type !== 'current-sale.updated'
    ) {
      return NextResponse.json({ error: 'Unsupported realtime event' }, { status: 400 })
    }

    publishRealtime(event as RealtimeEvent)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Realtime webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
