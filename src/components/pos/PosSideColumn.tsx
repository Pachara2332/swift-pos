'use client'

import CartPanel from '@/components/pos/CartPanel'
import CloseDayPanel from '@/components/pos/CloseDayPanel'
import DebtLedgerPanel from '@/components/pos/DebtLedgerPanel'
import HeldBillsPanel from '@/components/pos/HeldBillsPanel'
import OfflineSyncPanel from '@/components/pos/OfflineSyncPanel'
import type { CartItem, CurrentSaleEvent, DebtCustomer, HeldBill, LastReceipt, LiveStatus, OfflineSale } from '@/lib/pos/types'

type PosSideColumnProps = {
  cart: CartItem[]
  itemCount: number
  total: number
  paidAmount: number
  changeAmount: number
  liveStatus: LiveStatus
  remoteSale: CurrentSaleEvent | null
  receivedAmount: string
  lastReceipt: LastReceipt | null
  heldBills: HeldBill[]
  customers: DebtCustomer[]
  selectedCustomerId: string
  selectedCustomerBalance: number
  totalDebt: number
  customerBalances: Map<string, number>
  newCustomerName: string
  debtPaymentAmount: string
  todayRevenue: number
  todayCash: number
  todaySalesCount: number
  topTodayProduct?: [string, number]
  offlineSales: OfflineSale[]
  loading: boolean
  t: (key: string) => string
  onUpdateQuantity: (id: string, delta: number) => void
  onRemoveCartItem: (id: string) => void
  onHoldCurrentBill: () => void
  onClearCart: () => void
  onReceivedAmountChange: (value: string) => void
  onPrintReceipt: () => void
  onDismissReceipt: () => void
  onCheckout: () => void
  onRestoreHeldBill: (bill: HeldBill) => void
  onRemoveHeldBill: (id: string) => void
  onSelectedCustomerChange: (value: string) => void
  onNewCustomerNameChange: (value: string) => void
  onAddCustomer: () => void
  onDebtPaymentAmountChange: (value: string) => void
  onRecordDebtPayment: () => void
  onCreditSale: () => void
  onSyncOfflineSales: () => void
}

export default function PosSideColumn({
  cart,
  itemCount,
  total,
  paidAmount,
  changeAmount,
  liveStatus,
  remoteSale,
  receivedAmount,
  lastReceipt,
  heldBills,
  customers,
  selectedCustomerId,
  selectedCustomerBalance,
  totalDebt,
  customerBalances,
  newCustomerName,
  debtPaymentAmount,
  todayRevenue,
  todayCash,
  todaySalesCount,
  topTodayProduct,
  offlineSales,
  loading,
  t,
  onUpdateQuantity,
  onRemoveCartItem,
  onHoldCurrentBill,
  onClearCart,
  onReceivedAmountChange,
  onPrintReceipt,
  onDismissReceipt,
  onCheckout,
  onRestoreHeldBill,
  onRemoveHeldBill,
  onSelectedCustomerChange,
  onNewCustomerNameChange,
  onAddCustomer,
  onDebtPaymentAmountChange,
  onRecordDebtPayment,
  onCreditSale,
  onSyncOfflineSales,
}: PosSideColumnProps) {
  return (
    <div className="pos-side-column">
      <CartPanel
        cart={cart}
        itemCount={itemCount}
        total={total}
        paidAmount={paidAmount}
        changeAmount={changeAmount}
        liveStatus={liveStatus}
        remoteSale={remoteSale}
        receivedAmount={receivedAmount}
        lastReceipt={lastReceipt}
        loading={loading}
        t={t}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveCartItem={onRemoveCartItem}
        onHoldCurrentBill={onHoldCurrentBill}
        onClearCart={onClearCart}
        onReceivedAmountChange={onReceivedAmountChange}
        onPrintReceipt={onPrintReceipt}
        onDismissReceipt={onDismissReceipt}
        onCheckout={onCheckout}
      />
      <HeldBillsPanel heldBills={heldBills} onRestoreHeldBill={onRestoreHeldBill} onRemoveHeldBill={onRemoveHeldBill} />
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
      <CloseDayPanel todayRevenue={todayRevenue} todayCash={todayCash} todaySalesCount={todaySalesCount} topTodayProduct={topTodayProduct} />
      <OfflineSyncPanel offlineSales={offlineSales} loading={loading} onSyncOfflineSales={onSyncOfflineSales} />
    </div>
  )
}
