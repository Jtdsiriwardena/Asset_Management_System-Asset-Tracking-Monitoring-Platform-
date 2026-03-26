import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assetAPI } from '../api/assets';
import { Upload, X, Save, ArrowLeft, AlertCircle } from 'lucide-react';

const AssetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    serial_number: '',
    category: '',
    description: '',
    status: 'AVAILABLE',
    purchase_date: '',
    purchase_cost: '',
    warranty_expiry: '',
    vendor: '',
    image: null,
    invoice: null,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [existingInvoice, setExistingInvoice] = useState(null);
  const [fetchingCategories, setFetchingCategories] = useState(true);

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchAsset();
    }
  }, [id]);

  const fetchCategories = async () => {
    setFetchingCategories(true);
    try {
      const response = await assetAPI.getCategories();
      console.log('Categories response:', response.data); // For debugging

      // Handle different response structures
      let categoriesData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.data.results) {
          categoriesData = response.data.results;
        } else if (typeof response.data === 'object') {
          // If it's a single object, convert to array
          categoriesData = [response.data];
        }
      }

      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to fetch categories', err);
      setError('Failed to load categories. Please refresh the page.');
    } finally {
      setFetchingCategories(false);
    }
  };

  const fetchAsset = async () => {
    setLoading(true);
    try {
      const response = await assetAPI.getAsset(id);
      const asset = response.data;

      setFormData({
        name: asset.name || '',
        serial_number: asset.serial_number || '',
        category: asset.category || '',
        description: asset.description || '',
        status: asset.status || 'AVAILABLE',
        purchase_date: asset.purchase_date || '',
        purchase_cost: asset.purchase_cost || '',
        warranty_expiry: asset.warranty_expiry || '',
        vendor: asset.vendor || '',
        image: null,
        invoice: null,
      });

      setExistingImage(asset.image_url);
      setExistingInvoice(asset.invoice_url);

      if (asset.image_url) {
        setImagePreview(asset.image_url);
      }
    } catch (err) {
      setError('Failed to fetch asset details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    if (name === 'image') {
      // Validate image type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (name === 'invoice') {
      // Validate PDF
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
      }

      setFormData(prev => ({ ...prev, invoice: file }));
      setInvoiceFile(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    document.getElementById('image-upload').value = '';
  };

  const removeInvoice = () => {
    setFormData(prev => ({ ...prev, invoice: null }));
    setInvoiceFile(null);
    document.getElementById('invoice-upload').value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Basic validation
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.serial_number.trim()) {
        throw new Error('Serial number is required');
      }
      if (!formData.category) {
        throw new Error('Category is required');
      }

      // Prepare data for submission
      const submitData = {
        name: formData.name.trim(),
        serial_number: formData.serial_number.trim(),
        category: formData.category,
        description: formData.description.trim() || '',
        status: formData.status,
        purchase_date: formData.purchase_date || null,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        warranty_expiry: formData.warranty_expiry || null,
        vendor: formData.vendor.trim() || '',
        image: formData.image,
        invoice: formData.invoice,
      };

      let response;
      if (isEditMode) {
        response = await assetAPI.updateAsset(id, submitData);
      } else {
        response = await assetAPI.createAsset(submitData);
      }

      navigate(`/assets/${response.data.id}`);
    } catch (err) {
      console.error('Form submission error:', err);

      // Handle validation errors from backend
      if (err.response?.data) {
        const backendErrors = err.response.data;
        const errorMessages = [];

        // Format backend errors for display
        Object.keys(backendErrors).forEach(key => {
          if (Array.isArray(backendErrors[key])) {
            errorMessages.push(`${key}: ${backendErrors[key].join(', ')}`);
          } else if (typeof backendErrors[key] === 'string') {
            errorMessages.push(`${key}: ${backendErrors[key]}`);
          }
        });

        setError(errorMessages.join('\n') || 'Failed to save asset. Please check your input.');
      } else {
        setError(err.message || 'Failed to save asset');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Asset' : 'Add New Asset'}
            </h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  {fetchingCategories ? (
                    <div className="w-full border border-gray-300 rounded-md p-2 bg-gray-50">
                      <div className="animate-pulse flex space-x-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ) : (
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Category</option>
                      {Array.isArray(categories) && categories.length > 0 ? (
                        categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No categories available</option>
                      )}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="UNDER_REPAIR">Under Repair</option>
                    <option value="DAMAGED">Damaged</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Purchase Information */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Purchase Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Cost ($)
                  </label>
                  <input
                    type="number"
                    name="purchase_cost"
                    value={formData.purchase_cost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty Expiry
                  </label>
                  <input
                    type="date"
                    name="warranty_expiry"
                    value={formData.warranty_expiry}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* File Uploads */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Documents & Images</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Image
                  </label>

                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="image-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Upload an image</span>
                            <input
                              id="image-upload"
                              name="image"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Invoice Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice PDF
                  </label>

                  {existingInvoice || invoiceFile ? (
                    <div className="relative p-4 bg-gray-50 rounded-lg border border-gray-300">
                      <div className="flex items-center">
                        <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                        </svg>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {invoiceFile ? invoiceFile.name : 'Invoice.pdf'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {invoiceFile ? `${(invoiceFile.size / 1024).toFixed(2)} KB` : 'Uploaded'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={removeInvoice}
                          className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {existingInvoice && !invoiceFile && (
                        <a
                          href={existingInvoice}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 block"
                        >
                          View current invoice
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="invoice-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Upload a PDF</span>
                            <input
                              id="invoice-upload"
                              name="invoice"
                              type="file"
                              accept=".pdf"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || fetchingCategories}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Asset'}
              </button>
            </div>
          </form>
        </div>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-yellow-50 rounded text-xs">
            <p>Categories loaded: {Array.isArray(categories) ? categories.length : 'Not an array'}</p>
            <p>Categories type: {typeof categories}</p>
            <pre>{JSON.stringify(categories, null, 2).substring(0, 200)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetForm;