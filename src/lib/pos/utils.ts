import type { CartItem, Product, SalePayload } from '@/lib/pos/types'

export const money = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })

export function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function escapeReceiptText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function getProductWeightKg(product: Product) {
  const match = product.name.match(/(\d+(?:\.\d+)?)\s*กก/)
  return match ? Number(match[1]) : 1
}

export function getUnitPricePerKg(product: Product) {
  const weight = getProductWeightKg(product)
  return weight > 0 ? product.salePrice / weight : product.salePrice
}

export function isToday(value: string) {
  return new Date(value).toDateString() === new Date().toDateString()
}

export function buildSalePayload(cart: CartItem[], total: number, paidAmount: number, change: number): SalePayload {
  return {
    total,
    paidAmount,
    change,
    items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity, price: item.price })),
  }
}
