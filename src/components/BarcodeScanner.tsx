'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Camera, CameraOff, ImageUp, RefreshCw, ShieldCheck } from 'lucide-react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

type BarcodeScannerProps = {
  mode: 'camera' | 'upload'
  onScan: (decodedText: string) => void
}

const CAMERA_SESSION_KEY = 'swift-pos-camera-authorized'
const SCAN_RESUME_DELAY_MS = 600
const DUPLICATE_SCAN_WINDOW_MS = 1500
const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
]

export default function BarcodeScanner({ mode, onScan }: BarcodeScannerProps) {
  const generatedId = useId().replace(/:/g, '')
  const readerId = `barcode-reader-${generatedId}`
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScanRef = useRef<{ barcode: string; scannedAt: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'checking' | 'granted' | 'denied'>(() => {
    if (typeof window === 'undefined') return 'idle'
    return window.sessionStorage.getItem(CAMERA_SESSION_KEY) === 'granted' ? 'granted' : 'idle'
  })
  const [cameraError, setCameraError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)

  const rememberScan = useCallback((decodedText: string) => {
    const barcode = decodedText.trim()
    const now = Date.now()
    const lastScan = lastScanRef.current

    if (!barcode) return false
    if (lastScan && lastScan.barcode === barcode && now - lastScan.scannedAt < DUPLICATE_SCAN_WINDOW_MS) return false

    lastScanRef.current = { barcode, scannedAt: now }
    onScan(barcode)
    return true
  }, [onScan])

  const requestCameraPermission = useCallback(async () => {
    setPermissionStatus('checking')
    setCameraError('')

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('browser')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      stream.getTracks().forEach((track) => track.stop())
      window.sessionStorage.setItem(CAMERA_SESSION_KEY, 'granted')
      setPermissionStatus('granted')
    } catch (error) {
      const name = error instanceof Error ? error.name : ''
      window.sessionStorage.removeItem(CAMERA_SESSION_KEY)
      setPermissionStatus('denied')
      setCameraError(name === 'NotFoundError' || name === 'DevicesNotFoundError' ? 'not_found' : 'denied')
    }
  }, [])

  useEffect(() => {
    if (mode !== 'camera' || permissionStatus !== 'granted') return

    const scanner = new Html5Qrcode(readerId, {
      formatsToSupport: BARCODE_FORMATS,
      verbose: false,
    })
    scannerRef.current = scanner
    let cancelled = false

    scanner.start(
      { facingMode: 'environment' },
      { fps: 15, qrbox: { width: 280, height: 170 } },
      (decodedText) => {
        if (!rememberScan(decodedText)) return

        scanner.pause(true)
        window.setTimeout(() => {
          try {
            if (!cancelled) scanner.resume()
          } catch {
            // The camera may already be stopped while the timer is pending.
          }
        }, SCAN_RESUME_DELAY_MS)
      },
      () => undefined
    ).catch((error) => {
      console.error('Camera scanner failed:', error)
      window.sessionStorage.removeItem(CAMERA_SESSION_KEY)
      setPermissionStatus('denied')
      setCameraError('denied')
    })

    return () => {
      cancelled = true
      scannerRef.current = null
      if (scanner.isScanning) {
        scanner.stop().finally(() => scanner.clear())
      } else {
        scanner.clear()
      }
    }
  }, [mode, permissionStatus, readerId, rememberScan])

  const handleUpload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setUploadError('')

    const scanner = new Html5Qrcode(readerId, {
      formatsToSupport: BARCODE_FORMATS,
      verbose: false,
    })

    try {
      const result = await scanner.scanFile(file, true)
      rememberScan(result)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('Barcode image scan failed:', error)
      setUploadError('ไม่พบบาร์โค้ดในภาพนี้')
    } finally {
      scanner.clear()
      setUploading(false)
    }
  }

  if (mode === 'upload') {
    return (
      <div className="barcode-scan-surface">
        <div id={readerId} className="barcode-reader" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="barcode-file-input"
          onChange={(event) => handleUpload(event.target.files?.[0])}
        />
        <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <RefreshCw className="animate-spin" size={18} /> : <ImageUp size={18} />}
          {uploading ? 'กำลังอ่านภาพ' : 'เลือกภาพบาร์โค้ด'}
        </button>
        {uploadError && <p className="scan-helper-text scan-helper-error">{uploadError}</p>}
      </div>
    )
  }

  if (permissionStatus === 'idle') {
    return (
      <div className="barcode-scan-surface">
        <ShieldCheck size={30} />
        <strong>อนุญาตกล้องสำหรับ session นี้</strong>
        <p className="scan-helper-text">เครื่องนี้จะจำสิทธิ์ไว้จนกว่าจะปิดแท็บหรือจบ session</p>
        <button type="button" className="btn btn-primary" onClick={requestCameraPermission}>
          <Camera size={18} />
          อนุญาตและเปิดกล้อง
        </button>
      </div>
    )
  }

  if (permissionStatus === 'checking') {
    return (
      <div className="barcode-scan-surface">
        <RefreshCw className="animate-spin" size={24} />
        <strong>กำลังตรวจสอบสิทธิ์กล้อง</strong>
      </div>
    )
  }

  if (permissionStatus === 'denied') {
    return (
      <div className="barcode-scan-surface barcode-scan-error">
        <CameraOff size={30} />
        <strong>{cameraError === 'not_found' ? 'ไม่พบกล้องบนเครื่องนี้' : 'ยังไม่ได้อนุญาตกล้อง'}</strong>
        <p className="scan-helper-text">
          {cameraError === 'not_found' ? 'ลองต่อกล้องหรือใช้อัปโหลดภาพบาร์โค้ดแทน' : 'เปิดสิทธิ์กล้องในเบราว์เซอร์ แล้วลองอีกครั้ง'}
        </p>
        <button type="button" className="btn btn-primary" onClick={requestCameraPermission}>
          <Camera size={18} />
          ขอสิทธิ์อีกครั้ง
        </button>
      </div>
    )
  }

  return (
    <div className="barcode-scan-surface">
      <div id={readerId} className="barcode-reader" />
    </div>
  )
}
