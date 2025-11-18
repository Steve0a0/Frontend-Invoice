import React, { useState, useEffect } from 'react';
import { FaUpload, FaImage, FaTrash, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

const CompanyLogoSettings = () => {
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.companyLogo) {
          setPreview(`${API_BASE_URL}/${data.companyLogo}`);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Please select a valid image file (JPEG, PNG, or SVG)' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }

      setLogo(file);
      setMessage({ type: '', text: '' });
      
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!logo) {
      setMessage({ type: 'error', text: 'Please select a logo first' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });
    
    const formData = new FormData();
    formData.append('companyLogo', logo);

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/company-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: 'Logo uploaded successfully! It will now appear on your invoices.' });
        setPreview(`${API_BASE_URL}/${data.companyLogo}`);
        setLogo(null);
        
        // Clear success message after 5 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Upload failed' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ companyLogo: null })
      });

      if (response.ok) {
        setPreview(null);
        setLogo(null);
        toast.success('Logo removed successfully');
        setMessage({ type: 'success', text: 'Logo removed successfully' });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      } else {
        toast.error('Failed to remove logo');
      }
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove logo');
      setMessage({ type: 'error', text: 'Failed to remove logo' });
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Company Logo</h2>
      <p className="text-gray-600 mb-6">Upload your company logo to display on invoices, emails, and PDFs.</p>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' && <FaCheckCircle className="text-green-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Logo Preview */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Current Logo</label>
        {preview ? (
          <div className="relative inline-block">
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <img 
                src={preview} 
                alt="Company Logo" 
                className="max-w-[300px] max-h-[150px] object-contain"
              />
            </div>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-3 flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
              type="button"
            >
              <FaTrash className="text-sm" /> 
              <span className="text-sm font-medium">Remove Logo</span>
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50">
            <FaImage className="text-6xl text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No logo uploaded yet</p>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {preview ? 'Replace Logo' : 'Upload Logo'}
          </label>
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
            </label>
            <button
              onClick={handleUpload}
              disabled={uploading || !logo}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg 
                hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center gap-2 whitespace-nowrap"
              type="button"
            >
              <FaUpload />
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Logo Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li><strong>Format:</strong> PNG (with transparent background), JPEG, or SVG</li>
            <li><strong>Recommended size:</strong> 300Ã—150px to 600Ã—300px</li>
            <li><strong>Max file size:</strong> 5MB</li>
            <li><strong>Display size:</strong> Logo will be displayed at max 150px width Ã— 80px height on invoices</li>
            <li><strong>Best results:</strong> Use PNG with transparent background</li>
          </ul>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 border border-gray-300 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Remove Company Logo</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to remove your company logo? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyLogoSettings;

