import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onClose }) {
  const containerRef = useRef(null);
  const qrRef = useRef(null);

  useEffect(() => {
    const id = 'qr-scanner';
    const element = containerRef.current;
    if (!element) return;

    qrRef.current = new Html5Qrcode(id);

    const config = { fps: 10, qrbox: 250 };
    qrRef.current.start({ facingMode: { exact: 'environment' } }, config,
      (decodedText) => {
        onScan(decodedText);
      },
      (errorMessage) => {
        // ignore decode errors
      }
    ).catch(() => {
      // fallback to default camera if environment not available
      qrRef.current.start({ facingMode: 'user' }, config,
        (decodedText) => onScan(decodedText),
        () => {});
    });

    return () => {
      qrRef.current && qrRef.current.stop().catch(() => {});
      qrRef.current && qrRef.current.clear().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold">Scan QR Code</h4>
          <button onClick={onClose} className="text-sm text-slate-600">Close</button>
        </div>
        <div id="qr-scanner" ref={containerRef} style={{ width: '100%' }} />
        <div className="text-xs text-slate-500 mt-2">Point camera at the QR code. Scanning works best on mobile.</div>
      </div>
    </div>
  );
}
