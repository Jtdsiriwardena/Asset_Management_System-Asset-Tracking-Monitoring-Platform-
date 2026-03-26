import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { assetAPI } from '../api/assets';
import QRStats from '../components/QRStats';
import QRBatchOperations from '../components/QRBatchOperations';
import { QrCode, RefreshCw, CheckSquare } from 'lucide-react';

const QRManagement = () => {
  const [assets, setAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await assetAPI.getAssets({ page_size: 100 });

      let assetsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          assetsData = response.data;
        } else if (response.data.results) {
          assetsData = response.data.results;
        }
      }

      setAssets(assetsData);
    } catch (err) {
      console.error('Failed to fetch assets', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(assets.map((a) => a.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectAsset = (assetId) => {
    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets.filter((id) => id !== assetId));
      setSelectAll(false);
    } else {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <QrCode className="w-6 h-6 mr-2 text-blue-600" />
              QR Code Management
            </h1>

            <button
              onClick={fetchAssets}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* QR Stats */}
        <div className="mb-6">
          <QRStats />
        </div>

        {/* Batch Operations */}
        {selectedAssets.length > 0 && (
          <div className="mb-6">
            <QRBatchOperations
              selectedAssets={selectedAssets}
              onComplete={fetchAssets}
            />
          </div>
        )}

        {/* Asset Selection List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Select Assets for QR Operations
            </h2>

            <button
              onClick={handleSelectAll}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <CheckSquare className="w-4 h-4 mr-1" />
              {selectAll ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : assets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No assets found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-4 flex items-center hover:bg-gray-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedAssets.includes(asset.id)}
                    onChange={() => handleSelectAsset(asset.id)}
                    className="mr-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {asset.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {asset.asset_code} • {asset.category_name}
                    </p>
                  </div>

                  <div className="text-sm font-medium">
                    {asset.qr_code_url ? (
                      <span className="text-green-600">
                        QR Ready
                      </span>
                    ) : (
                      <span className="text-yellow-600">
                        No QR
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRManagement;
