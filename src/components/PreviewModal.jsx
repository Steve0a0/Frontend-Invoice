import React, { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

export default function PreviewModal({ template, isOpen, onClose }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-4xl w-full relative">
        
        {/* Close Button */}
        <button className="absolute top-4 right-4 text-gray-600 hover:text-black" onClick={onClose}>
          <FaTimes size={18} />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold mb-4">{template.title} - Preview</h2>

        {/* Render HTML Template */}
        <div className="border border-gray-300 p-4 rounded-md overflow-auto bg-gray-100" style={{ maxHeight: "70vh" }}>
          <div dangerouslySetInnerHTML={{ __html: template.templateHTML }} />
        </div>
      </div>
    </div>
  );
}

