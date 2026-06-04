export type Product = {
  id: string
  barcode: string
  name: string
  salePrice: number
  category?: string | null
  stock: number
  lowStockAlert?: number
}

export type CartItem = {
  id: string
  productId: string
  barcode: string
  name: string
  price: number
  quantity: number
}

export type ReceiptItem = {
  name: string
  quantity: number
  price: number
}

export type LastReceipt = {
  id: string
  items: ReceiptItem[]
  total: number
  paidAmount: number
  change: number
  createdAt: string
  paymentType: 'cash' | 'credit' | 'offline'
}

export type HeldBill = {
  id: string
  label: string
  items: CartItem[]
  total: number
  createdAt: string
}

export type DebtCustomer = {
  id: string
  name: string
  phone?: string
  createdAt: string
}

export type DebtEntry = {
  id: string
  customerId: string
  type: 'sale' | 'payment'
  amount: number
  note: string
  createdAt: string
}

export type SalePayload = {
  total: number
  paidAmount: number
  change: number
  items: {
    productId: string
    quantity: number
    price: number
  }[]
}

export type OfflineSale = {
  id: string
  payload: SalePayload
  receipt: LastReceipt
  createdAt: string
}

export type ProductChangedEvent = {
  type: 'product.changed'
  product: {
    id: string
    barcode: string
    name: string
    salePrice: number
  }
}

export type CurrentSaleEvent = {
  type: 'current-sale.updated'
  sessionId: string
  items: {
    productId: string
    barcode: string
    name: string
    price: number
    quantity: number
  }[]
  itemCount: number
  total: number
  createdAt: string
}

export type NotificationState = {
  type: 'success' | 'info' | 'error'
  message: string
}

export type LiveStatus = 'connecting' | 'live' | 'offline'

export type PosTool = 'sale' | 'weight' | 'quick-product' | 'debt'
