import { useState, useEffect } from "react";
import EmailTemplateCard from "./EmailTemplateCard";
import NewEmailTemplateModal from "./NewEmailTemplateModal";
import { FaPlus, FaEnvelope, FaSearch } from "react-icons/fa";
import toast from "react-hot-toast";
import { API_BASE_URL } from '../config/api';

export default function EmailTemplates() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/templates`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        throw new Error("Failed to fetch templates");
      }
    } catch (err) {
      console.error("Error fetching templates:", err.message);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // âœ… Delete handler
  const handleDeleteTemplate = async (templateId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId)); // Remove from UI
        toast.success("Template deleted successfully");
      } else {
        const error = await response.json();
        toast.error(`Delete failed: ${error.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete the template.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // âœ… Edit handler
  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  // Filter templates based on search
  const filteredTemplates = templates.filter(template =>
    template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {isModalOpen && (
        <NewEmailTemplateModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          refreshTemplates={fetchTemplates}
          editingTemplate={editingTemplate}
        />
      )}

      {/* Header Section */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <FaEnvelope className="text-blue-400 text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Email Templates</h1>
              <p className="text-gray-400 text-sm">Manage your email templates for various communications</p>
            </div>
          </div>
          
          <button
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 font-medium"
            onClick={() => setIsModalOpen(true)}
          >
            <FaPlus className="text-sm" />
            New Template
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <EmailTemplateCard
              key={template.id}
              template={template}
              onDelete={(id) => setDeleteConfirm({ id, name: template.name })}
              onEdit={handleEditTemplate}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <div className="bg-gray-800/50 p-8 rounded-full mb-4">
              <FaEnvelope className="text-6xl text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg font-medium">
              {searchQuery ? "No templates found matching your search" : "No email templates found"}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {!searchQuery && "Click 'New Template' to create your first template"}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Delete Email Template</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTemplate(deleteConfirm.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


