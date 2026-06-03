'use client'

import { PackagePlus, Save } from 'lucide-react'

type QuickProductPanelProps = {
  loading: boolean
  categories: string[]
  quickProductName: string
  quickProductPrice: string
  quickProductCategory: string
  onQuickProductNameChange: (value: string) => void
  onQuickProductPriceChange: (value: string) => void
  onQuickProductCategoryChange: (value: string) => void
  onSaveQuickProduct: () => void
}

export default function QuickProductPanel({
  loading,
  categories,
  quickProductName,
  quickProductPrice,
  quickProductCategory,
  onQuickProductNameChange,
  onQuickProductPriceChange,
  onQuickProductCategoryChange,
  onSaveQuickProduct,
}: QuickProductPanelProps) {
  return (
    <section className="card quick-product-card">
      <div className="pos-card-heading">
        <PackagePlus size={18} />
        <span>เพิ่มสินค้าเร็ว</span>
      </div>
      <div className="quick-product-grid">
        <input className="input-field" value={quickProductName} onChange={(event) => onQuickProductNameChange(event.target.value)} placeholder="ชื่อสินค้า" />
        <input className="input-field" type="number" min="0" value={quickProductPrice} onChange={(event) => onQuickProductPriceChange(event.target.value)} placeholder="ราคา" />
        <select className="input-field" value={quickProductCategory} onChange={(event) => onQuickProductCategoryChange(event.target.value)}>
          {categories.filter((category) => category !== 'ขายดี').map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <button type="button" className="btn btn-primary" onClick={onSaveQuickProduct} disabled={loading}>
          <Save size={18} />
          บันทึก
        </button>
      </div>
    </section>
  )
}
