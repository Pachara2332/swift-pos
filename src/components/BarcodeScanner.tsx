'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const SCAN_RESUME_DELAY_MS = 500;
const DUPLICATE_SCAN_WINDOW_MS = 1500;

export default function BarcodeScanner({ onScan }: { onScan: (decodedText: string) => void }) {
  const { t } = useI18n();
  const scannerRef = useRef<HTMLDivElement>(null);
  const lastScanRef = useRef<{ barcode: string; scannedAt: number } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const requestPermission = async () => {
    setPermissionStatus('checking');
    setErrorMsg('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support camera API');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      // Stop stream immediately to release the camera before html5-qrcode opens it
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
    } catch (err) {
      console.error('Camera permission request failed:', err);
      setPermissionStatus('denied');
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMsg('denied');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMsg('not_found');
        } else {
          setErrorMsg(err.message || 'unknown');
        }
      } else {
        setErrorMsg('unknown');
      }
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    if (permissionStatus !== 'granted' || !scannerRef.current) return;

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 15, qrbox: { width: 280, height: 170 } },
      /* verbose= */ false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        const barcode = decodedText.trim();
        const now = Date.now();
        const lastScan = lastScanRef.current;

        if (
          lastScan &&
          lastScan.barcode === barcode &&
          now - lastScan.scannedAt < DUPLICATE_SCAN_WINDOW_MS
        ) {
          return;
        }

        lastScanRef.current = { barcode, scannedAt: now };
        html5QrcodeScanner.pause(true);
        onScan(barcode);

        window.setTimeout(() => {
          try {
            html5QrcodeScanner.resume();
          } catch {
            // Scanner may already be cleared while the resume timer is pending.
          }
        }, SCAN_RESUME_DELAY_MS);
      },
      () => {
        // Ignore normal scan errors (e.g. no barcode in frame)
      }
    );

    return () => {
      html5QrcodeScanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [permissionStatus, onScan]);

  if (permissionStatus === 'checking') {
    return (
      <div style={{
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
        <p style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 600 }}>กำลังตรวจสอบสิทธิ์การใช้งานกล้อง...</p>
      </div>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <div style={{
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        background: 'rgba(184, 70, 47, 0.04)',
        borderRadius: 'var(--radius)',
        border: '1px solid rgba(184, 70, 47, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <div style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: 'rgba(184, 70, 47, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--danger)'
        }}>
          <CameraOff size={24} />
        </div>
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
            {errorMsg === 'not_found' ? 'ไม่พบอุปกรณ์กล้องถ่ายรูป' : 'ต้องการสิทธิ์ใช้งานกล้องถ่ายรูป'}
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            {errorMsg === 'not_found' 
              ? 'ไม่พบกล้องถ่ายรูปบนอุปกรณ์ชิ้นนี้ กรุณาตรวจสอบการเชื่อมต่อกล้องหรือใช้เครื่องสแกนบาร์โค้ดปกติ' 
              : 'บราวเซอร์ถูกปฏิเสธการเข้าถึงกล้อง กรุณากด "อนุญาตสิทธิ์กล้อง" หรือไปที่ตั้งค่าของเบราว์เซอร์เพื่อเปิดสิทธิ์การใช้งานกล้องของเว็บไซต์นี้'}
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={requestPermission}
          style={{ width: '100%', maxWidth: '200px' }}
        >
          <Camera size={16} />
          ขอสิทธิ์ใช้งานอีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <div id="reader" ref={scannerRef} style={{ width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden' }}></div>
    </div>
  );
}
