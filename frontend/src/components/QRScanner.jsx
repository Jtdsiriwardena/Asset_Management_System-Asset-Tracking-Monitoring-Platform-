import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Loader, Scan } from 'lucide-react';
import QrScanner from 'qr-scanner'; // You'll need to install this

const QRScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasCamera, setHasCamera] = useState(true);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if browser supports camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setError('Your browser does not support camera access');
      return;
    }

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      // Check camera permission
      const permission = await navigator.permissions.query({ name: 'camera' });
      
      if (permission.state === 'denied') {
        setError('Camera access denied. Please enable camera access in your browser settings.');
        return;
      }

      setScanning(true);
      
      // Initialize QR scanner
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleScan(result),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await scannerRef.current.start();
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Failed to access camera. Please make sure you have granted camera permissions.');
      setScanning(false);
    }
  };

  const handleScan = (result) => {
    if (result) {
      // Stop scanning
      scannerRef.current?.stop();
      
      // Extract asset ID from URL
      const url = result.data;
      const assetId = extractAssetIdFromUrl(url);
      
      if (assetId) {
        onScan?.(assetId);
        
        // Navigate to asset details
        navigate(`/assets/${assetId}`);
      } else {
        setError('Invalid QR code. Please scan a valid asset QR code.');
        // Restart scanner after 2 seconds
        setTimeout(() => {
          setError(null);
          scannerRef.current?.start();
        }, 2000);
      }
    }
  };

  const extractAssetIdFromUrl = (url) => {
    try {
      // Extract ID from URL like: http://localhost:5173/assets/123
      const matches = url.match(/\/assets\/(\d+)/);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
    }
    onClose?.();
  };

  if (!hasCamera) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Camera Not Available</h3>
            <p className="text-gray-600 mb-4">{error || 'No camera detected on this device'}</p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Scan QR Code</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative">
          {/* Video container */}
          <div className="bg-black rounded-lg overflow-hidden aspect-square max-w-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Scanning overlay */}
          {scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-blue-500 rounded-lg animate-pulse"></div>
            </div>
          )}
          
          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-red-100 rounded-lg p-4 text-center">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    scannerRef.current?.start();
                  }}
                  className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          {/* Scanning indicator */}
          {scanning && !error && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full flex items-center">
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          Position the QR code within the frame to scan
        </div>
        
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;