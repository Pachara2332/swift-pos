'use client'

import { Plus, Scale } from 'lucide-react'
import type { Product } from '@/lib/pos/types'
import { getUnitPricePerKg, money } from '@/lib/pos/utils'

type WeightSalePanelProps = {
  weightedProductId: string
  weightKg: string
  weightedProducts: Product[]
  onWeightedProductChange: (value: string) => void
  onWeightKgChange: (value: string) => void
  onAddWeightedItem: () => void
}

export default function WeightSalePanel({
  weightedProductId,
  weightKg,
  weightedProducts,
  onWeightedProductChange,
  onWeightKgChange,
  onAddWeightedItem,
}: WeightSalePanelProps) {
  return (
    <section className="card weight-sale-card">
      <div className="pos-card-heading">
        <Scale size={18} />
        <span>ชั่งกิโล</span>
      </div>
      <div className="weight-sale-grid">
        <select className="input-field" value={weightedProductId} onChange={(event) => onWeightedProductChange(event.target.value)}>
          <option value="">เลือกของสด</option>
          {weightedProducts.map((product) => (
            <option key={product.id} value={product.id}>{product.name} | {money.format(getUnitPricePerKg(product))}/กก.</option>
          ))}
        </select>
        <input className="input-field" type="number" min="0.01" step="0.01" value={weightKg} onChange={(event) => onWeightKgChange(event.target.value)} placeholder="กก." />
        <button type="button" className="btn btn-primary" onClick={onAddWeightedItem}>
          <Plus size={18} />
          เพิ่ม
        </button>
      </div>
    </section>
  )
}
