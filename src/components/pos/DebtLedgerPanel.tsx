'use client'

import { ClipboardList, Plus, Users } from 'lucide-react'
import type { CartItem, DebtCustomer } from '@/lib/pos/types'
import { money } from '@/lib/pos/utils'

type DebtLedgerPanelProps = {
  cart: CartItem[]
  customers: DebtCustomer[]
  selectedCustomerId: string
  selectedCustomerBalance: number
  totalDebt: number
  customerBalances: Map<string, number>
  newCustomerName: string
  debtPaymentAmount: string
  loading: boolean
  onSelectedCustomerChange: (value: string) => void
  onNewCustomerNameChange: (value: string) => void
  onAddCustomer: () => void
  onDebtPaymentAmountChange: (value: string) => void
  onRecordDebtPayment: () => void
  onCreditSale: () => void
}

export default function DebtLedgerPanel({
  cart,
  customers,
  selectedCustomerId,
  selectedCustomerBalance,
  totalDebt,
  customerBalances,
  newCustomerName,
  debtPaymentAmount,
  loading,
  onSelectedCustomerChange,
  onNewCustomerNameChange,
  onAddCustomer,
  onDebtPaymentAmountChange,
  onRecordDebtPayment,
  onCreditSale,
}: DebtLedgerPanelProps) {
  return (
    <section className="card debt-card">
      <div className="pos-card-heading">
        <Users size={18} />
        <span>สมุดลูกหนี้</span>
      </div>
      <div className="debt-summary">
        <strong>ค้างทั้งหมด {money.format(totalDebt)}</strong>
        <span>{customers.length} ลูกค้า</span>
      </div>
      <div className="debt-form-grid">
        <select className="input-field" value={selectedCustomerId} onChange={(event) => onSelectedCustomerChange(event.target.value)}>
          <option value="">เลือกลูกค้า</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name} | ค้าง {money.format(customerBalances.get(customer.id) ?? 0)}</option>
          ))}
        </select>
        <div className="inline-form">
          <input className="input-field" value={newCustomerName} onChange={(event) => onNewCustomerNameChange(event.target.value)} placeholder="ชื่อลูกค้าใหม่" />
          <button className="btn btn-quiet" type="button" onClick={onAddCustomer}>
            <Plus size={16} />
          </button>
        </div>
      </div>
      {selectedCustomerId && (
        <div className="debt-pay-row">
          <div className="change-box">
            <span>ค้างของคนนี้</span>
            <strong>{money.format(selectedCustomerBalance)}</strong>
          </div>
          <input className="input-field" type="number" min="0" value={debtPaymentAmount} onChange={(event) => onDebtPaymentAmountChange(event.target.value)} placeholder="ยอดที่จ่าย" />
          <button className="btn btn-quiet" type="button" onClick={onRecordDebtPayment}>รับจ่าย</button>
        </div>
      )}
      <button className="btn btn-primary checkout-button" disabled={cart.length === 0 || !selectedCustomerId || loading} onClick={onCreditSale}>
        <ClipboardList size={18} />
        บันทึกขายเชื่อ
      </button>
    </section>
  )
}
