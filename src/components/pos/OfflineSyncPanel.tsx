'use client'

import { LoaderCircle, RotateCw, WifiOff } from 'lucide-react'
import { useState } from 'react'
import type { LiveStatus, OfflineSale } from '@/lib/pos/types'

type OfflineSyncPanelProps = {
  offlineSales: OfflineSale[]
  liveStatus: LiveStatus
  loading: boolean
  onSyncOfflineSales: () => Promise<void> | void
}

export default function OfflineSyncPanel({ offlineSales, liveStatus, loading, onSyncOfflineSales }: OfflineSyncPanelProps) {
  const [checking, setChecking] = useState(false)
  const syncing = checking || (loading && offlineSales.length > 0)
  const statusText = checking
    ? 'กำลังเช็คบิลรอ Sync...'
    : offlineSales.length === 0
    ? 'ไม่มีบิลค้าง'
    : liveStatus === 'live'
      ? 'ออนไลน์แล้ว ระบบจะ Sync ให้อัตโนมัติ'
      : 'เก็บไว้ในเครื่อง รอกลับมาออนไลน์'

  const handleSync = async () => {
    if (checking) return
    setChecking(true)
    try {
      await Promise.all([
        Promise.resolve(onSyncOfflineSales()),
        new Promise((resolve) => window.setTimeout(resolve, 350)),
      ])
    } finally {
      setChecking(false)
    }
  }

  return (
    <section className="card offline-card">
      <div className="pos-card-heading">
        <WifiOff size={18} />
        <span>บิลรอ Sync</span>
      </div>
      <div className="offline-row">
        <span>{offlineSales.length} บิล · {statusText}</span>
        <button className="btn btn-quiet" type="button" onClick={handleSync} disabled={syncing || (loading && offlineSales.length > 0)}>
          {syncing ? <LoaderCircle className="spin-icon" size={16} /> : <RotateCw size={16} />}
          {syncing ? (offlineSales.length > 0 ? 'กำลัง Sync' : 'กำลังเช็ค') : 'Sync'}
        </button>
      </div>
    </section>
  )
}
