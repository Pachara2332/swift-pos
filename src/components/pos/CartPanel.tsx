'use client'

import { Banknote, CreditCard, Minus, PauseCircle, Plus, Printer, Radio, ShoppingBag, Trash2, X } from 'lucide-react'
import type { CartItem, CurrentSaleEvent, LastReceipt, LiveStatus } from '@/lib/pos/types'
import { money } from '@/lib/pos/utils'

type CartPanelProps = {
  cart: CartItem[]
  itemCount: number
  total: number
  paidAmount: number
  changeAmount: number
  liveStatus: LiveStatus
  remoteSale: CurrentSaleEvent | null
  receivedAmount: string
  lastReceipt: LastReceipt | null
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
}

export default function CartPanel({
  cart,
  itemCount,
  total,
  paidAmount,
  changeAmount,
  liveStatus,
  remoteSale,
  receivedAmount,
  lastReceipt,
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
}: CartPanelProps) {
  return (
    <section className="card pos-cart">
      <div className="cart-header">
        <h2>
          <ShoppingBag size={18} />
          {t('pos.currentSale')}
        </h2>
        <div className="cart-header-actions">
          <span className={`live-pill live-pill-${liveStatus}`}>
            <Radio size={13} />
            {liveStatus === 'live' ? t('pos.liveSale') : liveStatus === 'connecting' ? t('pos.connecting') : t('pos.offline')}
          </span>
          {itemCount > 0 && <span className="item-count-pill">{itemCount} {t('pos.items')}</span>}
        </div>
      </div>

      {remoteSale && remoteSale.itemCount > 0 && (
        <div className="live-sale-preview">
          <div>
            <strong>{t('pos.remoteSale')}</strong>
            <span>{remoteSale.itemCount} items | {money.format(remoteSale.total)}</span>
          </div>
          <p>{remoteSale.items.slice(0, 2).map((item) => `${item.name} x${item.quantity}`).join(', ')}</p>
        </div>
      )}

      <div className="cart-lines">
        {cart.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={48} />
            <p>{t('pos.noItems')}</p>
            <span>{t('pos.noItemsHint')}</span>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="cart-line">
              <div>
                <h4>{item.name}</h4>
                <p>{money.format(item.price)}</p>
              </div>
              <div className="cart-line-actions">
                <button onClick={() => onUpdateQuantity(item.id, -1)} aria-label="ลดจำนวน">
                  <Minus size={12} />
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => onUpdateQuantity(item.id, 1)} aria-label="เพิ่มจำนวน">
                  <Plus size={12} />
                </button>
                <strong>{money.format(item.price * item.quantity)}</strong>
                <button className="danger-icon" onClick={() => onRemoveCartItem(item.id)} aria-label="ลบรายการ">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-footer">
        <div className="pos-total-row">
          <span>{t('pos.total')}</span>
          <span>{money.format(total)}</span>
        </div>
        <div className="bill-actions">
          <button type="button" className="btn btn-quiet" onClick={onHoldCurrentBill} disabled={cart.length === 0}>
            <PauseCircle size={18} />
            พักบิล
          </button>
          <button type="button" className="btn btn-quiet" onClick={onClearCart} disabled={cart.length === 0}>
            <X size={18} />
            ล้าง
          </button>
        </div>

        <div className="cash-panel">
          <div className="pos-card-heading">
            <Banknote size={18} />
            <span>รับเงินสด</span>
          </div>
          <div className="cash-quick-grid">
            {[20, 50, 100, 500, 1000].map((amount) => (
              <button key={amount} type="button" className="cash-button" onClick={() => onReceivedAmountChange(String(amount))}>
                ฿{amount}
              </button>
            ))}
            <button type="button" className="cash-button cash-button-exact" onClick={() => onReceivedAmountChange(total.toFixed(2))}>
              พอดี
            </button>
          </div>
          <div className="cash-input-row">
            <input className="input-field" type="number" min="0" step="0.01" value={receivedAmount} onChange={(event) => onReceivedAmountChange(event.target.value)} placeholder="เงินที่รับมา" />
            <div className={paidAmount > 0 && paidAmount < total ? 'change-box change-box-warning' : 'change-box'}>
              <span>เงินทอน</span>
              <strong>{money.format(changeAmount)}</strong>
            </div>
          </div>
        </div>

        {lastReceipt && (
          <div className="receipt-actions">
            <button className="btn btn-quiet" onClick={onPrintReceipt}>
              <Printer size={18} />
              พิมพ์บิลล่าสุด
            </button>
            <button className="btn btn-quiet" onClick={onDismissReceipt}>
              ไม่พิมพ์
            </button>
          </div>
        )}
        <button className="btn btn-primary checkout-button" disabled={cart.length === 0 || loading} onClick={onCheckout}>
          <CreditCard size={18} />
          {t('pos.checkout')}
        </button>
      </div>
    </section>
  )
}
