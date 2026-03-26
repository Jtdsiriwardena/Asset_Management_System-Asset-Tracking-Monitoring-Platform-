import React, { useState } from 'react';
import { assetAPI } from '../api/assets';
import { Download, Printer, RefreshCw, Check, X, AlertCircle } from 'lucide-react';

const QRBatchOperations = ({ selectedAssets, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);

  const handleDownloadSelected = async () => {
    setLoading(true);
    try {
      const response = await assetAPI.downloadMultipleQR({
        asset_ids: selectedAssets
      }, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'qr_codes.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    setLoading(true);
    try {
      const response = await assetAPI.generateQRSheet({
        asset_ids: selectedAssets
      }, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'qr_sheet.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSelected = async () => {
    if (!window.confirm(`Regenerate QR codes for ${selectedAssets.length} assets? This cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    setProgress({ current: 0, total: selectedAssets.length });
    
    try {
      const response = await assetAPI.bulkRegenerateQR({
        asset_ids: selectedAssets
      });
      
      setResults(response.data);
      onComplete?.();
    } catch (err) {
      alert('Failed to regenerate QR codes');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-3" />
          <p className="text-gray-600">
            {progress 
              ? `Processing ${progress.current}/${progress.total}...`
              : 'Processing...'
            }
          </p>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Batch Operation Results</h3>
        
        <div className="space-y-3">
          {results.regenerated?.length > 0 && (
            <div className="bg-green-50 p-3 rounded-lg flex items-start">
              <Check className="w-5 h-5 text-green-600 mr-2 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Successfully Regenerated</p>
                <p className="text-sm text-green-600">
                  {results.regenerated.length} assets
                </p>
              </div>
            </div>
          )}
          
          {results.failed?.length > 0 && (
            <div className="bg-red-50 p-3 rounded-lg flex items-start">
              <X className="w-5 h-5 text-red-600 mr-2 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Failed</p>
                <p className="text-sm text-red-600">
                  {results.failed.length} assets failed
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setResults(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">QR Code Batch Operations</h3>
      <p className="text-sm text-gray-600 mb-4">
        {selectedAssets.length} asset(s) selected
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={handleDownloadSelected}
          disabled={loading}
          className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <Download className="w-5 h-5 mr-2 text-blue-600" />
          <span>Download as ZIP</span>
        </button>
        
        <button
          onClick={handleGeneratePDF}
          disabled={loading}
          className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <Printer className="w-5 h-5 mr-2 text-green-600" />
          <span>Generate PDF Sheet</span>
        </button>
        
        <button
          onClick={handleRegenerateSelected}
          disabled={loading}
          className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className="w-5 h-5 mr-2 text-orange-600" />
          <span>Regenerate All</span>
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-start">
        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-700">
          Regenerating QR codes will create new codes. Old QR codes will no longer work.
        </p>
      </div>
    </div>
  );
};

export default QRBatchOperations;