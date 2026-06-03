'use client'

import { Search } from 'lucide-react'
import type { Product } from '@/lib/pos/types'
import { money } from '@/lib/pos/utils'

type ProductSearchPanelProps = {
  productSearch: string
  searchedProducts: Product[]
  onProductSearchChange: (value: string) => void
  onAddProductToCart: (product: Product) => void
}

export default function ProductSearchPanel({
  productSearch,
  searchedProducts,
  onProductSearchChange,
  onAddProductToCart,
}: ProductSearchPanelProps) {
  return (
    <section className="card product-search-card">
      <div className="pos-card-heading">
        <Search size={18} />
        <span>ค้นหาสินค้าด้วยชื่อ</span>
      </div>
      <input
        className="input-field search-name-input"
        value={productSearch}
        onChange={(event) => onProductSearchChange(event.target.value)}
        placeholder='พิมพ์ เช่น "หมู", "น้ำ", "ไข่"'
      />
      {searchedProducts.length > 0 && (
        <div className="search-result-grid">
          {searchedProducts.map((product) => (
            <button key={product.id} type="button" className="quick-sale-button" onClick={() => onAddProductToCart(product)}>
              <strong>{product.name}</strong>
              <span>{money.format(product.salePrice)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
