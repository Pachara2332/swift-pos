'use client'

import { useState, type KeyboardEvent, type RefObject } from 'react'
import { Camera, ImageUp, ScanLine, Search, X } from 'lucide-react'
import BarcodeScanner from '@/components/BarcodeScanner'
import type { ScanFeedback } from '@/lib/pos/types'

type ScannerPanelProps = {
  barcodeInput: string
  loading: boolean
  showCamera: boolean
  scanFeedback: ScanFeedback | null
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
  scanFeedback,
  inputRef,
  t,
  onToggleCamera,
  onBarcodeInputChange,
  onBarcodeKeyDown,
  onScan,
}: ScannerPanelProps) {
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | null>(null)

  const openScanMode = (mode: 'camera' | 'upload') => {
    if (!showCamera) onToggleCamera()
    setScanMode(mode)
  }

  const closeScanner = () => {
    setScanMode(null)
    if (showCamera) onToggleCamera()
  }

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
          <button className="btn btn-primary" onClick={showCamera ? closeScanner : onToggleCamera}>
            <Camera size={18} />
            {showCamera ? t('pos.close') : 'สแกน'}
          </button>
        </div>

        {scanFeedback && (
          <div className={`scan-feedback scan-feedback-${scanFeedback.type}`} aria-live="polite">
            <strong>{scanFeedback.title}</strong>
            <span>{scanFeedback.detail}</span>
          </div>
        )}
      </section>

      {showCamera && (
        <section className="card">
          <div className="scanner-choice-panel">
            <button type="button" className={scanMode === 'camera' ? 'btn btn-primary' : 'btn btn-quiet'} onClick={() => openScanMode('camera')}>
              <Camera size={18} />
              เปิดกล้อง
            </button>
            <button type="button" className={scanMode === 'upload' ? 'btn btn-primary' : 'btn btn-quiet'} onClick={() => openScanMode('upload')}>
              <ImageUp size={18} />
              อัปโหลดภาพ
            </button>
            <button type="button" className="btn btn-quiet scanner-close-button" onClick={closeScanner} aria-label="ปิดตัวสแกน">
              <X size={18} />
            </button>
          </div>

          {scanMode && <BarcodeScanner mode={scanMode} onScan={onScan} />}
        </section>
      )}
    </>
  )
}
