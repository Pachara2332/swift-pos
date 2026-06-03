export type RealtimeProduct = {
  id: string
  barcode: string
  name: string
  brand?: string | null
  stock: number
  salePrice: number
  costPrice?: number
  lowStockAlert: number
}

export type RealtimeCartItem = {
  productId: string
  barcode: string
  name: string
  price: number
  quantity: number
}

export type RealtimeEvent =
  | {
      type: 'product.changed'
      action: 'created' | 'updated'
      product: RealtimeProduct
      createdAt: string
    }
  | {
      type: 'sale.completed'
      saleId: string
      productIds: string[]
      createdAt: string
    }
  | {
      type: 'current-sale.updated'
      sessionId: string
      items: RealtimeCartItem[]
      itemCount: number
      total: number
      createdAt: string
    }

type RealtimeController = ReadableStreamDefaultController<Uint8Array>

const encoder = new TextEncoder()
const globalForRealtime = globalThis as unknown as {
  swiftPosRealtimeClients?: Set<RealtimeController>
  swiftPosRealtimeHistory?: RealtimeEvent[]
}

function getClients() {
  globalForRealtime.swiftPosRealtimeClients ??= new Set<RealtimeController>()
  return globalForRealtime.swiftPosRealtimeClients
}

function getHistory() {
  globalForRealtime.swiftPosRealtimeHistory ??= []
  return globalForRealtime.swiftPosRealtimeHistory
}

function encodeEvent(event: RealtimeEvent) {
  return encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
}

export function subscribeRealtime(controller: RealtimeController) {
  const clients = getClients()
  clients.add(controller)

  controller.enqueue(encoder.encode(`event: connected\ndata: {"ok":true}\n\n`))
  for (const event of getHistory().slice(-5)) {
    controller.enqueue(encodeEvent(event))
  }

  return () => {
    clients.delete(controller)
  }
}

export function publishRealtime(event: RealtimeEvent) {
  const history = getHistory()
  history.push(event)
  if (history.length > 25) {
    history.splice(0, history.length - 25)
  }

  const payload = encodeEvent(event)
  for (const client of getClients()) {
    try {
      client.enqueue(payload)
    } catch {
      getClients().delete(client)
    }
  }
}
