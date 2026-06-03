'use client'

import { ShoppingBag } from 'lucide-react'
import type { Product } from '@/lib/pos/types'
import { money } from '@/lib/pos/utils'

type QuickSalePanelProps = {
  categories: string[]
  quickProducts: Product[]
  quickTab: string
  onQuickTabChange: (value: string) => void
  onAddProductToCart: (product: Product) => void
}

export default function QuickSalePanel({
  categories,
  quickProducts,
  quickTab,
  onQuickTabChange,
  onAddProductToCart,
}: QuickSalePanelProps) {
  return (
    <section className="card quick-sale-card">
      <div className="pos-card-heading">
        <ShoppingBag size={18} />
        <span>ขายด่วน</span>
      </div>
      <div className="quick-tabs">
        {categories.map((category) => (
          <button key={category} type="button" className={quickTab === category ? 'active' : ''} onClick={() => onQuickTabChange(category)}>
            {category}
          </button>
        ))}
      </div>
      <div className="quick-sale-grid">
        {quickProducts.map((product) => (
          <button key={product.id} type="button" className="quick-sale-button" onClick={() => onAddProductToCart(product)}>
            <strong>{product.name}</strong>
            <span>{money.format(product.salePrice)}</span>
          </button>
        ))}
        {quickProducts.length === 0 && <p className="muted-note">ยังไม่มีสินค้าในหมวดนี้</p>}
      </div>
    </section>
  )
}
