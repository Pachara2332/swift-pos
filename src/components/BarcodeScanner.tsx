'use client';
import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const SCAN_RESUME_DELAY_MS = 500;
const DUPLICATE_SCAN_WINDOW_MS = 1500;

export default function BarcodeScanner({ onScan }: { onScan: (decodedText: string) => void }) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const lastScanRef = useRef<{ barcode: string; scannedAt: number } | null>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

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
  }, [onScan]);

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <div id="reader" ref={scannerRef} style={{ width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden' }}></div>
    </div>
  );
}
