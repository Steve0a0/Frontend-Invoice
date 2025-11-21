import { useState, useEffect } from "react";
import InvoiceTemplateCard from "./InvoiceTemplateCard";
import NewTemplateModal from "./NewTemplateModal";
import { FaPlus, FaFileInvoice, FaSearch, FaSpinner, FaImage, FaUpload, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import { API_BASE_URL } from '../config/api';

export default function InvoiceTemplates() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showLogoDeleteConfirm, setShowLogoDeleteConfirm] = useState(false);

  // Function to fetch invoice templates
  const fetchTemplates = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/invoicetemplates`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError("Error loading templates");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const user = await response.json();
        if (user.companyLogo) {
          setLogoPreview(`${API_BASE_URL}/${user.companyLogo}`);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchUserProfile();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Please select a valid image file (JPEG, PNG, or SVG)' });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }

      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logo) {
      setMessage({ type: 'error', text: 'Please select a logo first' });
      return;
    }

    setUploadingLogo(true);
    setMessage({ type: '', text: '' });
    
    const formData = new FormData();
    formData.append('companyLogo', logo);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/user/company-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
        setLogoPreview(`${API_BASE_URL}/${data.companyLogo}`);
        setLogo(null);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Upload failed' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ companyLogo: null })
      });

      if (response.ok) {
        setLogoPreview(null);
        setLogo(null);
        toast.success('Logo removed successfully');
        setMessage({ type: 'success', text: 'Logo removed successfully' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        toast.error('Failed to remove logo');
      }
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove logo');
      setMessage({ type: 'error', text: 'Failed to remove logo' });
    } finally {
      setShowLogoDeleteConfirm(false);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "All" || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ["All", ...new Set(templates.map(t => t.category).filter(Boolean))];

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* Modal */}
      <NewTemplateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchTemplates}
      />

      {/* Message */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Company Logo Section */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-purple-500/20 p-2 rounded-lg">
            <FaImage className="text-purple-400 text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Company Logo</h2>
            <p className="text-gray-400 text-sm">Upload your company logo to display on invoices and emails</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Logo Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Current Logo</label>
            {logoPreview ? (
              <div className="relative">
                <div className="border-2 border-gray-600 rounded-lg p-4 bg-gray-900">
                  <img 
                    src={logoPreview} 
                    alt="Company Logo" 
                    className="max-w-full max-h-32 object-contain mx-auto"
                  />
                </div>
                <button 
                  onClick={() => setShowLogoDeleteConfirm(true)}
                  type="button"
                  className="mt-2 flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm"
                >
                  <FaTrash /> Remove Logo
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-900">
                <FaImage className="text-4xl text-gray-600 mb-2" />
                <p className="text-gray-500 text-sm">No logo uploaded</p>
              </div>
            )}
          </div>

          {/* Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Upload New Logo</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/svg+xml"
              onChange={handleLogoChange}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-500/20 file:text-purple-400
                hover:file:bg-purple-500/30
                cursor-pointer mb-3"
            />
            <button
              onClick={handleLogoUpload}
              disabled={uploadingLogo || !logo}
              type="button"
              className="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg 
                hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center justify-center gap-2"
            >
              <FaUpload />
              {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
            </button>
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <p>• Formats: PNG, JPEG, SVG</p>
              <p>• Max size: 5MB</p>
              <p>• Recommended: 300Ã—150px</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <FaFileInvoice className="text-purple-400 text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Invoice Templates</h1>
              <p className="text-gray-400 text-sm">Manage and customize your invoice templates</p>
            </div>
          </div>

          <button
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 font-medium"
            onClick={() => setIsModalOpen(true)}
          >
            <FaPlus className="text-sm" />
            New Template
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <FaSpinner className="text-6xl text-purple-400 animate-spin mb-4" />
          <p className="text-gray-400 text-lg">Loading templates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <InvoiceTemplateCard key={template.id} template={template} onUpdate={fetchTemplates} />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <div className="bg-gray-800/50 p-8 rounded-full mb-4">
                <FaFileInvoice className="text-6xl text-gray-600" />
              </div>
              <p className="text-gray-400 text-lg font-medium">
                {searchQuery || filterCategory !== "All" ? "No templates found matching your criteria" : "No templates available"}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {!searchQuery && filterCategory === "All" && "Click 'New Template' to create your first template"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Logo Delete Confirmation Modal */}
      {showLogoDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Remove Company Logo</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to remove your company logo? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoRemove}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


