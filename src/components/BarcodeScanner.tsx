'use client';
import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function BarcodeScanner({ onScan }: { onScan: (decodedText: string) => void }) {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 } },
      /* verbose= */ false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        // Pause scanner after successful scan
        html5QrcodeScanner.pause(true);
        onScan(decodedText);
        // Resume after 2 seconds to avoid multiple rapid scans
        setTimeout(() => html5QrcodeScanner.resume(), 2000);
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
