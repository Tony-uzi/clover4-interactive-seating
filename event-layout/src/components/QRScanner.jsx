import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FiX, FiCamera } from 'react-icons/fi';

export default function QRScanner({ isOpen, onClose, onScan, onError }) {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode = null;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode('qr-reader');
        
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' }, // Use back camera on mobile
          config,
          (decodedText) => {
            // Success callback
            onScan(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // Error callback (can be ignored for continuous scanning)
            // console.log('QR scan error:', errorMessage);
          }
        );

        setIsScanning(true);
        setHasPermission(true);
      } catch (err) {
        console.error('Unable to start QR scanner:', err);
        setHasPermission(false);
        if (onError) {
          onError(err.message || 'Unable to access camera');
        }
      }
    };

    const stopScanner = async () => {
      if (html5QrCode && isScanning) {
        try {
          await html5QrCode.stop();
          setIsScanning(false);
        } catch (err) {
          console.error('Error stopping scanner:', err);
        }
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen, onScan, onError]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
          <div className="flex items-center gap-2">
            <FiCamera className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Scan QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded-full transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner container */}
        <div className="p-4">
          <div 
            id="qr-reader" 
            className="w-full rounded-lg overflow-hidden"
          />
          
          {hasPermission === false && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                Camera access denied. Please allow camera access to scan QR codes.
              </p>
            </div>
          )}

          {isScanning && (
            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                Position the QR code within the frame
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 text-blue-600">
                <div className="animate-pulse">📷</div>
                <span className="text-sm font-medium">Scanning...</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
