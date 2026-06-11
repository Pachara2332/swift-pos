import { subscribeRealtime } from '@/lib/realtime'
import { requireRole } from '@/lib/auth'
import { getRequestStoreId } from '@/lib/store-scope'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const storeId = await getRequestStoreId(request)
  const auth = await requireRole(storeId, ['Admin', 'Manager', 'Cashier'])
  if (!auth.ok) return auth.response

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const unsubscribe = subscribeRealtime(controller)
      const keepAlive = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(`event: ping\ndata: {"ok":true}\n\n`))
      }, 25000)

      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive)
        unsubscribe()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
