'use client'

import type { KeyboardEvent, RefObject } from 'react'
import { Type } from 'lucide-react'
import DebtLedgerPanel from '@/components/pos/DebtLedgerPanel'
import ProductSearchPanel from '@/components/pos/ProductSearchPanel'
import QuickProductPanel from '@/components/pos/QuickProductPanel'
import QuickSalePanel from '@/components/pos/QuickSalePanel'
import ScannerPanel from '@/components/pos/ScannerPanel'
import WeightSalePanel from '@/components/pos/WeightSalePanel'
import type { CartItem, DebtCustomer, PosTool, Product } from '@/lib/pos/types'

type PosMainColumnProps = {
  activeTool: PosTool
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
  cart: CartItem[]
  customers: DebtCustomer[]
  selectedCustomerId: string
  selectedCustomerBalance: number
  totalDebt: number
  customerBalances: Map<string, number>
  newCustomerName: string
  debtPaymentAmount: string
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
  onSelectedCustomerChange: (value: string) => void
  onNewCustomerNameChange: (value: string) => void
  onAddCustomer: () => void
  onDebtPaymentAmountChange: (value: string) => void
  onRecordDebtPayment: () => void
  onCreditSale: () => void
}

const toolTitles: Record<PosTool, { titleKey: string; subtitleKey: string }> = {
  sale: {
    titleKey: 'pos.mode.saleTitle',
    subtitleKey: 'pos.mode.saleSubtitle',
  },
  weight: {
    titleKey: 'pos.mode.weightTitle',
    subtitleKey: 'pos.mode.weightSubtitle',
  },
  'quick-product': {
    titleKey: 'pos.mode.quickProductTitle',
    subtitleKey: 'pos.mode.quickProductSubtitle',
  },
  debt: {
    titleKey: 'pos.mode.debtTitle',
    subtitleKey: 'pos.mode.debtSubtitle',
  },
}

export default function PosMainColumn({
  activeTool,
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
  cart,
  customers,
  selectedCustomerId,
  selectedCustomerBalance,
  totalDebt,
  customerBalances,
  newCustomerName,
  debtPaymentAmount,
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
  onSelectedCustomerChange,
  onNewCustomerNameChange,
  onAddCustomer,
  onDebtPaymentAmountChange,
  onRecordDebtPayment,
  onCreditSale,
}: PosMainColumnProps) {
  const mode = toolTitles[activeTool]

  return (
    <div className="pos-scanner-column">
      <div className="pos-heading-row">
        <div>
          <h2 className="pos-page-title">{t(mode.titleKey)}</h2>
          <p className="muted-note">{t(mode.subtitleKey)}</p>
        </div>
        <button type="button" className={seniorMode ? 'btn btn-primary' : 'btn btn-quiet'} onClick={onToggleSeniorMode}>
          <Type size={18} />
          ตัวใหญ่
        </button>
      </div>

      {activeTool === 'weight' && (
        <WeightSalePanel
          weightedProductId={weightedProductId}
          weightKg={weightKg}
          weightedProducts={weightedProducts}
          onWeightedProductChange={onWeightedProductChange}
          onWeightKgChange={onWeightKgChange}
          onAddWeightedItem={onAddWeightedItem}
        />
      )}
      {activeTool === 'quick-product' && (
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
      )}
      {activeTool === 'debt' ? (
        <DebtLedgerPanel
          cart={cart}
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          selectedCustomerBalance={selectedCustomerBalance}
          totalDebt={totalDebt}
          customerBalances={customerBalances}
          newCustomerName={newCustomerName}
          debtPaymentAmount={debtPaymentAmount}
          loading={loading}
          onSelectedCustomerChange={onSelectedCustomerChange}
          onNewCustomerNameChange={onNewCustomerNameChange}
          onAddCustomer={onAddCustomer}
          onDebtPaymentAmountChange={onDebtPaymentAmountChange}
          onRecordDebtPayment={onRecordDebtPayment}
          onCreditSale={onCreditSale}
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
