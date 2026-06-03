'use client'

import { PauseCircle } from 'lucide-react'
import type { HeldBill } from '@/lib/pos/types'
import { money } from '@/lib/pos/utils'

type HeldBillsPanelProps = {
  heldBills: HeldBill[]
  onRestoreHeldBill: (bill: HeldBill) => void
  onRemoveHeldBill: (id: string) => void
}

export default function HeldBillsPanel({ heldBills, onRestoreHeldBill, onRemoveHeldBill }: HeldBillsPanelProps) {
  return (
    <section className="card held-bills-card">
      <div className="pos-card-heading">
        <PauseCircle size={18} />
        <span>บิลที่พักไว้</span>
      </div>
      {heldBills.length === 0 ? (
        <p className="muted-note">ไม่มีบิลพัก</p>
      ) : (
        <div className="compact-list">
          {heldBills.map((bill) => (
            <div key={bill.id} className="compact-row">
              <div>
                <strong>{bill.label}</strong>
                <span>{bill.items.length} รายการ | {money.format(bill.total)}</span>
              </div>
              <div>
                <button type="button" onClick={() => onRestoreHeldBill(bill)}>ดึงกลับ</button>
                <button type="button" onClick={() => onRemoveHeldBill(bill.id)}>ลบ</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
