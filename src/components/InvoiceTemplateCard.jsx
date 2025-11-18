import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FaCopy, FaEye, FaCode, FaTrash, FaFileInvoice } from "react-icons/fa";
import PreviewModal from "./PreviewModal";
import HtmlTemplateModal from "./HtmlTemplateModal";
import toast from "react-hot-toast";
import { API_BASE_URL } from '../config/api';

export default function InvoiceTemplateCard({ template, onUpdate }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(
    searchParams.get('editTemplate') === template.id
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const token = localStorage.getItem("token");

  // Helper functions to manage HTML modal URL state
  const openHtmlModal = () => {
    setIsHtmlModalOpen(true);
    setSearchParams({ editTemplate: template.id });
  };

  const closeHtmlModal = () => {
    setIsHtmlModalOpen(false);
    setSearchParams({});
  };

  // Check URL on mount and whenever searchParams change
  useEffect(() => {
    const editTemplateId = searchParams.get('editTemplate');
    if (editTemplateId === template.id) {
      setIsHtmlModalOpen(true);
    } else {
      setIsHtmlModalOpen(false);
    }
  }, [searchParams, template.id]);

  // Function to save edited HTML
  const handleSaveTemplate = async (id, updatedHtml) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoicetemplates/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ templateHTML: updatedHtml }),
      });

      if (!response.ok) {
        throw new Error("Failed to update template.");
      }

      onUpdate();
      toast.success("Template updated successfully!");
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template.");
    }
  };

  // Function to duplicate a template
  const handleDuplicate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoicetemplates`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${template.title} (Copy)`,
          description: template.description,
          category: template.category,
          currency: template.currency,
          templateHTML: template.templateHTML,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate template.");
      }

      onUpdate();
      toast.success("Template duplicated successfully!");
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast.error("Failed to duplicate template.");
    }
  };

  // Function to delete a template
  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoicetemplates/${template.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete template.");
      }

      onUpdate();
      toast.success("Template deleted successfully!");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template.");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <PreviewModal
        template={template}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      <HtmlTemplateModal
        template={template}
        isOpen={isHtmlModalOpen}
        onClose={closeHtmlModal}
        onSave={handleSaveTemplate}
      />

      {/* Invoice Card */}
      <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-200 flex flex-col group">
        {/* Header */}
        <div className="bg-gray-900/50 px-5 py-4 border-b border-gray-700">
          <div className="flex items-start space-x-3 mb-3">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <FaFileInvoice className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-white truncate">{template.title}</h2>
              <p className="text-gray-400 text-sm line-clamp-2">{template.description}</p>
            </div>
          </div>

          {/* Template Details */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1 bg-gray-800 px-2 py-1 rounded-md">
              <span className="text-gray-400">Category:</span>
              <span className="text-gray-300 font-medium">{template.category}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 grid grid-cols-2 gap-2">
          <button
            className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium"
            onClick={handleDuplicate}
          >
            <FaCopy className="text-sm" />
            <span>Duplicate</span>
          </button>

          <button
            className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium"
            onClick={openHtmlModal}
          >
            <FaCode className="text-sm" />
            <span>HTML</span>
          </button>

          <button
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium"
            onClick={() => setIsPreviewOpen(true)}
          >
            <FaEye className="text-sm" />
            <span>Preview</span>
          </button>

          <button
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <FaTrash className="text-sm" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Delete Template</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete "{template.title}"? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


