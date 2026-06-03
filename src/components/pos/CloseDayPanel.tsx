'use client'

import { ReceiptText } from 'lucide-react'
import { money } from '@/lib/pos/utils'

type CloseDayPanelProps = {
  todayRevenue: number
  todayCash: number
  todaySalesCount: number
  topTodayProduct?: [string, number]
}

export default function CloseDayPanel({ todayRevenue, todayCash, todaySalesCount, topTodayProduct }: CloseDayPanelProps) {
  return (
    <section className="card close-day-card">
      <div className="pos-card-heading">
        <ReceiptText size={18} />
        <span>ปิดร้านวันนี้</span>
      </div>
      <div className="close-day-grid">
        <div><span>ยอดขายวันนี้</span><strong>{money.format(todayRevenue)}</strong></div>
        <div><span>เงินสดควรมี</span><strong>{money.format(todayCash)}</strong></div>
        <div><span>จำนวนบิล</span><strong>{todaySalesCount}</strong></div>
        <div><span>ขายดี</span><strong>{topTodayProduct ? `${topTodayProduct[0]} x${topTodayProduct[1]}` : '-'}</strong></div>
      </div>
    </section>
  )
}
