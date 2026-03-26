import React, { useState, useEffect } from 'react';
import { assetAPI } from '../api/assets';
import { QrCode, ScanLine, Clock, TrendingUp } from 'lucide-react';


const QRStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await assetAPI.getScanStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch QR stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
   
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <QrCode className="w-5 h-5 mr-2 text-blue-600" />
        QR Code Analytics
      </h3>
      
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ScanLine className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm text-gray-600">Total Scans</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {stats.total_scans?.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <QrCode className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm text-gray-600">Scanned Assets</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {stats.scanned_assets}
          </p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-sm text-gray-600">Never Scanned</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-2">
            {stats.never_scanned}
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
            <span className="text-sm text-gray-600">Scan Rate</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {stats.total_scans && stats.scanned_assets
              ? ((stats.total_scans / stats.scanned_assets) || 0).toFixed(1)
              : '0'} avg
          </p>
        </div>
      </div>
      
      {stats.most_scanned?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Most Scanned Assets</h4>
          <div className="space-y-2">
            {stats.most_scanned.map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">{asset.name}</p>
                  <p className="text-xs text-gray-500">{asset.asset_code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">{asset.qr_scan_count} scans</p>
                  {asset.last_scanned && (
                    <p className="text-xs text-gray-500">
                      {new Date(asset.last_scanned).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRStats;