'use client'

import type { KeyboardEvent, RefObject } from 'react'
import { Type } from 'lucide-react'
import ProductSearchPanel from '@/components/pos/ProductSearchPanel'
import QuickProductPanel from '@/components/pos/QuickProductPanel'
import QuickSalePanel from '@/components/pos/QuickSalePanel'
import ScannerPanel from '@/components/pos/ScannerPanel'
import StockAlertPanel from '@/components/pos/StockAlertPanel'
import WeightSalePanel from '@/components/pos/WeightSalePanel'
import type { Product } from '@/lib/pos/types'

type PosMainColumnProps = {
  seniorMode: boolean
  loading: boolean
  showCamera: boolean
  barcodeInput: string
  productSearch: string
  quickTab: string
  weightedProductId: string
  weightKg: string
  quickProductName: string
  quickProductPrice: string
  quickProductCategory: string
  categories: string[]
  quickProducts: Product[]
  searchedProducts: Product[]
  weightedProducts: Product[]
  lowStockProducts: Product[]
  inputRef: RefObject<HTMLInputElement | null>
  t: (key: string) => string
  onToggleSeniorMode: () => void
  onToggleCamera: () => void
  onBarcodeInputChange: (value: string) => void
  onBarcodeKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onProductSearchChange: (value: string) => void
  onQuickTabChange: (value: string) => void
  onAddProductToCart: (product: Product) => void
  onScan: (barcode: string) => void
  onWeightedProductChange: (value: string) => void
  onWeightKgChange: (value: string) => void
  onAddWeightedItem: () => void
  onQuickProductNameChange: (value: string) => void
  onQuickProductPriceChange: (value: string) => void
  onQuickProductCategoryChange: (value: string) => void
  onSaveQuickProduct: () => void
}

export default function PosMainColumn({
  seniorMode,
  loading,
  showCamera,
  barcodeInput,
  productSearch,
  quickTab,
  weightedProductId,
  weightKg,
  quickProductName,
  quickProductPrice,
  quickProductCategory,
  categories,
  quickProducts,
  searchedProducts,
  weightedProducts,
  lowStockProducts,
  inputRef,
  t,
  onToggleSeniorMode,
  onToggleCamera,
  onBarcodeInputChange,
  onBarcodeKeyDown,
  onProductSearchChange,
  onQuickTabChange,
  onAddProductToCart,
  onScan,
  onWeightedProductChange,
  onWeightKgChange,
  onAddWeightedItem,
  onQuickProductNameChange,
  onQuickProductPriceChange,
  onQuickProductCategoryChange,
  onSaveQuickProduct,
}: PosMainColumnProps) {
  return (
    <div className="pos-scanner-column">
      <div className="pos-heading-row">
        <div>
          <h2 className="pos-page-title">{t('pos.title')}</h2>
          <p className="muted-note">{t('pos.subtitle')}</p>
        </div>
        <button type="button" className={seniorMode ? 'btn btn-primary' : 'btn btn-quiet'} onClick={onToggleSeniorMode}>
          <Type size={18} />
          ตัวใหญ่
        </button>
      </div>

      <StockAlertPanel products={lowStockProducts} />
      <ScannerPanel
        barcodeInput={barcodeInput}
        loading={loading}
        showCamera={showCamera}
        inputRef={inputRef}
        t={t}
        onToggleCamera={onToggleCamera}
        onBarcodeInputChange={onBarcodeInputChange}
        onBarcodeKeyDown={onBarcodeKeyDown}
        onScan={onScan}
      />
      <ProductSearchPanel
        productSearch={productSearch}
        searchedProducts={searchedProducts}
        onProductSearchChange={onProductSearchChange}
        onAddProductToCart={onAddProductToCart}
      />
      <QuickSalePanel
        categories={categories}
        quickProducts={quickProducts}
        quickTab={quickTab}
        onQuickTabChange={onQuickTabChange}
        onAddProductToCart={onAddProductToCart}
      />
      <WeightSalePanel
        weightedProductId={weightedProductId}
        weightKg={weightKg}
        weightedProducts={weightedProducts}
        onWeightedProductChange={onWeightedProductChange}
        onWeightKgChange={onWeightKgChange}
        onAddWeightedItem={onAddWeightedItem}
      />
      <QuickProductPanel
        loading={loading}
        categories={categories}
        quickProductName={quickProductName}
        quickProductPrice={quickProductPrice}
        quickProductCategory={quickProductCategory}
        onQuickProductNameChange={onQuickProductNameChange}
        onQuickProductPriceChange={onQuickProductPriceChange}
        onQuickProductCategoryChange={onQuickProductCategoryChange}
        onSaveQuickProduct={onSaveQuickProduct}
      />
    </div>
  )
}
