'use client'

import { AlertTriangle } from 'lucide-react'
import type { Product } from '@/lib/pos/types'

type StockAlertPanelProps = {
  products: Product[]
}

export default function StockAlertPanel({ products }: StockAlertPanelProps) {
  return (
    <section className="card stock-alert-card">
      <div className="pos-card-heading">
        <AlertTriangle size={18} />
        <span>ของใกล้หมด</span>
      </div>
      {products.length === 0 ? (
        <p className="muted-note">สต็อกยังดูปกติ</p>
      ) : (
        <div className="plain-alert-list">
          {products.map((product) => (
            <span key={product.id}>{product.name} เหลือ {product.stock} ชิ้น</span>
          ))}
        </div>
      )}
    </section>
  )
}
