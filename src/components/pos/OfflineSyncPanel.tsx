'use client'

import { RotateCw, WifiOff } from 'lucide-react'
import type { OfflineSale } from '@/lib/pos/types'

type OfflineSyncPanelProps = {
  offlineSales: OfflineSale[]
  loading: boolean
  onSyncOfflineSales: () => void
}

export default function OfflineSyncPanel({ offlineSales, loading, onSyncOfflineSales }: OfflineSyncPanelProps) {
  return (
    <section className="card offline-card">
      <div className="pos-card-heading">
        <WifiOff size={18} />
        <span>บิลรอ Sync</span>
      </div>
      <div className="offline-row">
        <span>{offlineSales.length} บิล</span>
        <button className="btn btn-quiet" type="button" onClick={onSyncOfflineSales} disabled={offlineSales.length === 0 || loading}>
          <RotateCw size={16} />
          Sync
        </button>
      </div>
    </section>
  )
}
