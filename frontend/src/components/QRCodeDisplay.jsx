import React, { useState } from 'react';
import { Download, Printer, RefreshCw, Maximize2, X } from 'lucide-react';
import { assetAPI } from '../api/assets';

const QRCodeDisplay = ({ asset, size = 200, showActions = true }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [qrUrl, setQrUrl] = useState(asset?.qr_code_url);

  const handleDownload = async () => {
    try {
      const response = await assetAPI.downloadQR(asset.id);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'image/png' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${asset.asset_code}_qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download QR code');
    }
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerate QR code? This will replace the existing one.')) return;
    
    setLoading(true);
    try {
      const response = await assetAPI.regenerateQR(asset.id);
      setQrUrl(response.data.qr_code_url);
      alert('QR code regenerated successfully');
    } catch (err) {
      alert('Failed to regenerate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${asset.asset_code}</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .container { text-align: center; }
            img { max-width: 300px; height: auto; }
            .code { font-family: monospace; font-size: 14px; margin-top: 10px; }
            .name { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${qrUrl}" alt="QR Code" />
            <div class="code">${asset.asset_code}</div>
            <div class="name">${asset.name}</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  if (!qrUrl) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
        No QR code available
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-center mb-4">
          <img
            src={qrUrl}
            alt={`QR Code for ${asset.name}`}
            style={{ width: size, height: size }}
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowModal(true)}
          />
        </div>
        
        {showActions && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Download QR Code"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={handlePrint}
              className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
              title="Print QR Code"
            >
              <Printer className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowModal(true)}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
              title="View Large"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            
            {asset.is_admin && (
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="p-2 text-orange-600 hover:bg-orange-50 rounded-full transition-colors disabled:opacity-50"
                title="Regenerate QR Code"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        )}
        
        <div className="mt-3 text-center">
          <p className="text-xs font-mono text-gray-600">{asset.asset_code}</p>
          {asset.qr_scan_count > 0 && (
            <p className="text-xs text-gray-500">
              Scanned {asset.qr_scan_count} time{asset.qr_scan_count !== 1 ? 's' : ''}
              {asset.last_scanned && ` • Last: ${new Date(asset.last_scanned).toLocaleDateString()}`}
            </p>
          )}
        </div>
      </div>

      {/* Modal for large view */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">QR Code - {asset.asset_code}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex justify-center">
              <img
                src={qrUrl}
                alt={`QR Code for ${asset.name}`}
                className="max-w-full h-auto"
                style={{ maxHeight: '70vh' }}
              />
            </div>
            
            <div className="mt-4 text-center">
              <p className="font-bold">{asset.name}</p>
              <p className="text-sm text-gray-600">Scan to view asset details</p>
            </div>
            
            <div className="mt-4 flex justify-center space-x-3">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QRCodeDisplay;