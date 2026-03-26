import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assetAPI } from '../api/assets';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Download, 
  Calendar,
  DollarSign,
  Tag,
  Barcode,
  FileText,
  Image as ImageIcon,
  Printer,
  RefreshCw,
  QrCode,
  Eye
} from 'lucide-react';

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const fetchAsset = async () => {
    setLoading(true);
    try {
      const response = await assetAPI.getAsset(id);
      setAsset(response.data);
    } catch (err) {
      setError('Failed to fetch asset details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await assetAPI.deleteAsset(id);
      navigate('/assets');
    } catch (err) {
      alert('Failed to delete asset');
    }
  };

  const handleRestore = async () => {
    try {
      await assetAPI.restoreAsset(id);
      fetchAsset();
    } catch (err) {
      alert('Failed to restore asset');
    }
  };

  // ========== QR CODE FUNCTIONS ==========
  
  const handleRegenerateQR = async () => {
    if (!window.confirm('Are you sure you want to regenerate the QR code? The old QR code will stop working.')) {
      return;
    }
    
    setRegenerating(true);
    try {
      const response = await assetAPI.regenerateQR(id);
      setAsset(response.data);
      alert('QR code regenerated successfully');
    } catch (err) {
      alert('Failed to regenerate QR code');
      console.error(err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await assetAPI.downloadQR(id);
      
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
      console.error(err);
    }
  };

  const handlePrintQR = () => {
    if (!asset.qr_code_url) return;
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${asset.asset_code}</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial, sans-serif; }
            .container { text-align: center; }
            img { max-width: 300px; height: auto; }
            .code { font-family: monospace; font-size: 16px; margin-top: 15px; font-weight: bold; }
            .name { font-size: 14px; color: #666; margin-top: 5px; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${asset.qr_code_url}" alt="QR Code" />
            <div class="code">${asset.asset_code}</div>
            <div class="name">${asset.name}</div>
          </div>
          <script>
            window.onload = function() { 
              setTimeout(function() { window.print(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // ========== HELPER FUNCTIONS ==========

  const getStatusBadgeClass = (status) => {
    const classes = {
      'AVAILABLE': 'bg-green-100 text-green-800',
      'ASSIGNED': 'bg-blue-100 text-blue-800',
      'UNDER_REPAIR': 'bg-yellow-100 text-yellow-800',
      'DAMAGED': 'bg-red-100 text-red-800',
      'RETIRED': 'bg-gray-100 text-gray-800',
      'RETURN_REQUESTED': 'bg-purple-100 text-purple-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-red-600">{error || 'Asset not found'}</p>
          <button
            onClick={() => navigate('/assets')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Assets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
                <p className="text-sm text-gray-500">Asset Code: {asset.asset_code}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {!asset.is_active && isAdmin && (
                <button
                  onClick={handleRestore}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restore
                </button>
              )}
              
              <Link
                to={`/assets/${id}/edit`}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
              
              {isAdmin && asset.is_active && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Status</h2>
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusBadgeClass(asset.status)}`}>
                  {asset.status.replace('_', ' ')}
                </span>
              </div>
              
              {!asset.is_active && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">
                    This asset has been deleted and is not active.
                  </p>
                </div>
              )}
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Asset Details</h2>
              
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Category
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{asset.category_name}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Barcode className="w-4 h-4 mr-2" />
                    Serial Number
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{asset.serial_number}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Purchase Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(asset.purchase_date)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Purchase Cost
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatCurrency(asset.purchase_cost)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Warranty Expiry
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(asset.warranty_expiry)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Vendor</dt>
                  <dd className="mt-1 text-sm text-gray-900">{asset.vendor || 'Not specified'}</dd>
                </div>
              </dl>
              
              {asset.description && (
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{asset.description}</dd>
                </div>
              )}
            </div>

            {/* Metadata Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">System Information</h2>
              
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Created By</dt>
                  <dd className="text-sm text-gray-900">{asset.created_by_name || 'System'}</dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="text-sm text-gray-900">{formatDateTime(asset.created_at)}</dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">{formatDateTime(asset.updated_at)}</dd>
                </div>
                
                {asset.last_scanned && (
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Last QR Scan</dt>
                    <dd className="text-sm text-gray-900">{formatDateTime(asset.last_scanned)}</dd>
                  </div>
                )}
                
                {asset.qr_scan_count > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Total QR Scans</dt>
                    <dd className="text-sm text-gray-900">{asset.qr_scan_count}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Asset Image
              </h2>
              
              {asset.image_url ? (
                <div>
                  <img
                    src={asset.image_url}
                    alt={asset.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <a
                    href={asset.image_url}
                    download
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download Image
                  </a>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                  No image uploaded
                </div>
              )}
            </div>

            {/* Invoice Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Invoice
              </h2>
              
              {asset.invoice_url ? (
                <div>
                  <a
                    href={asset.invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <FileText className="w-8 h-8 text-red-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Invoice.pdf</p>
                      <p className="text-xs text-gray-500">Click to view</p>
                    </div>
                  </a>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                  No invoice uploaded
                </div>
              )}
            </div>

            {/* QR Code Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <QrCode className="w-5 h-5 mr-2" />
                QR Code
              </h2>
              
              {asset.qr_code_url ? (
                <div>
                  <div className="flex justify-center mb-3">
                    <img
                      src={asset.qr_code_url}
                      alt={`QR Code for ${asset.name}`}
                      className="w-32 h-32 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setShowQRModal(true)}
                    />
                  </div>
                  
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={handleDownloadQR}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Download QR Code"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={handlePrintQR}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      title="Print QR Code"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => setShowQRModal(true)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                      title="View Large"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {isAdmin && (
                      <button
                        onClick={handleRegenerateQR}
                        disabled={regenerating}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-full transition-colors disabled:opacity-50"
                        title="Regenerate QR Code"
                      >
                        <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-3 text-center">
                    <p className="text-xs font-mono text-gray-600">{asset.asset_code}</p>
                    {asset.qr_scan_count > 0 && (
                      <p className="text-xs text-gray-500">
                        Scanned {asset.qr_scan_count} time{asset.qr_scan_count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">QR code will be generated automatically</p>
                  {isAdmin && (
                    <button
                      onClick={handleRegenerateQR}
                      disabled={regenerating}
                      className="mt-3 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {regenerating ? 'Generating...' : 'Generate QR Code'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this asset? This action can be undone later.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && asset.qr_code_url && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">QR Code - {asset.asset_code}</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex justify-center">
              <img
                src={asset.qr_code_url}
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
                onClick={handleDownloadQR}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              <button
                onClick={handlePrintQR}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDetail;