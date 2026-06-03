'use client'

import type { KeyboardEvent, RefObject } from 'react'
import { Camera, ScanLine, Search } from 'lucide-react'
import BarcodeScanner from '@/components/BarcodeScanner'

type ScannerPanelProps = {
  barcodeInput: string
  loading: boolean
  showCamera: boolean
  inputRef: RefObject<HTMLInputElement | null>
  t: (key: string) => string
  onToggleCamera: () => void
  onBarcodeInputChange: (value: string) => void
  onBarcodeKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onScan: (barcode: string) => void
}

export default function ScannerPanel({
  barcodeInput,
  loading,
  showCamera,
  inputRef,
  t,
  onToggleCamera,
  onBarcodeInputChange,
  onBarcodeKeyDown,
  onScan,
}: ScannerPanelProps) {
  return (
    <>
      <section className="card">
        <div className="pos-card-heading">
          <ScanLine size={18} />
          <span>{t('pos.scanner')}</span>
        </div>

        <div className="scanner-controls">
          <div className="input-icon-field">
            <Search size={18} />
            <input
              ref={inputRef}
              type="text"
              className="input-field"
              placeholder={t('pos.placeholder')}
              value={barcodeInput}
              onChange={(event) => onBarcodeInputChange(event.target.value)}
              onKeyDown={onBarcodeKeyDown}
              disabled={loading}
              autoFocus
            />
          </div>
          <button className="btn btn-primary" onClick={onToggleCamera}>
            <Camera size={18} />
            {showCamera ? t('pos.close') : t('pos.camera')}
          </button>
        </div>
      </section>

      {showCamera && (
        <section className="card">
          <BarcodeScanner onScan={onScan} />
        </section>
      )}
    </>
  )
}
