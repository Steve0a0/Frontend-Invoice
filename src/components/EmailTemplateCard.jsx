import { FaRegCopy, FaTrash, FaEnvelope, FaCode, FaEdit } from "react-icons/fa";
import { useState } from "react";
import toast from "react-hot-toast";

export default function EmailTemplateCard({ template, onDelete, onEdit }) {
  const [showFullContent, setShowFullContent] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(template.content);
    toast.success("Template copied to clipboard! ✅");
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-200 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/50 px-5 py-4 border-b border-gray-700 flex justify-between items-start gap-3">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="bg-blue-500/20 p-2 rounded-lg mt-0.5 flex-shrink-0">
            <FaEnvelope className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">{template.name}</h2>
            <p className="text-gray-400 text-sm truncate">
              <span className="font-medium">Subject:</span> {template.subject}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => onEdit(template)}
            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-all duration-200"
            title="Edit Template"
          >
            <FaEdit className="text-sm" />
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-all duration-200"
            title="Delete Template"
          >
            <FaTrash className="text-sm" />
          </button>
        </div>
      </div>

      {/* Template Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FaCode className="text-gray-400 text-sm" />
            <p className="text-gray-300 text-sm font-medium">Template Content</p>
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all duration-200 text-xs"
            title="Copy to Clipboard"
          >
            <FaRegCopy />
            <span>Copy</span>
          </button>
        </div>
        
        <div className={`bg-gray-900 p-4 rounded-lg border border-gray-700 flex-1 relative ${!showFullContent ? 'max-h-32 overflow-hidden' : ''}`}>
          <pre className="text-gray-300 font-mono text-xs whitespace-pre-wrap break-words">
            {template.content}
          </pre>
          {!showFullContent && template.content?.length > 200 && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 to-transparent"></div>
          )}
        </div>

        {template.content?.length > 200 && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="mt-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            {showFullContent ? "Show Less" : "Show More"}
          </button>
        )}

        {/* Variables */}
        {template.variables && template.variables.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-xs font-medium mb-2">Available Variables:</p>
            <div className="flex gap-2 flex-wrap">
              {template.variables.map((variable) => (
                <span key={variable} className="bg-gray-700/50 text-gray-300 px-2 py-1 rounded-md text-xs border border-gray-600">
                  {variable}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

