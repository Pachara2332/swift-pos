'use client'

import { X } from 'lucide-react'
import type { NotificationState } from '@/lib/pos/types'

type PosToastProps = {
  notification: NotificationState | null
  onClose: () => void
}

export default function PosToast({ notification, onClose }: PosToastProps) {
  if (!notification) return null

  return (
    <div className={`toast toast-${notification.type}`}>
      {notification.message}
      <button onClick={onClose} aria-label="ปิดแจ้งเตือน">
        <X size={14} />
      </button>
    </div>
  )
}
