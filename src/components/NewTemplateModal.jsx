import { useState, useEffect, useRef } from "react";
import { FaTimes, FaFileInvoice, FaTag, FaFileAlt, FaCode, FaList } from "react-icons/fa";
import toast from "react-hot-toast";
import { API_BASE_URL } from '../config/api';

export default function NewTemplateModal({ isOpen, onClose, onSuccess }) {
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Standard");
  const [currency, setCurrency] = useState("USD");
  const [templateHTML, setTemplateHTML] = useState(`<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; }
  .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .invoice-items th, .invoice-items td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
  .totals { margin-top: 20px; text-align: right; }
</style>
</head>
<body>
  <div class="invoice-header">
    <h2>{{company_name}}</h2>
    <p>{{company_address}}</p>
  </div>
</body>
</html>`);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Placeholder autocomplete states
  const [showPlaceholderDropdown, setShowPlaceholderDropdown] = useState(false);
  const [placeholderSearch, setPlaceholderSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedPlaceholderIndex, setSelectedPlaceholderIndex] = useState(0);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Custom fields state
  const [customFields, setCustomFields] = useState([]);

  // Fetch custom fields when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchCustomFields = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
          const response = await fetch(`${API_BASE_URL}/api/custom-fields/active`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setCustomFields(data);
          }
        } catch (error) {
          console.error("Failed to fetch custom fields:", error);
        }
      };

      fetchCustomFields();
    }
  }, [isOpen]);

  // Base placeholders
  const basePlaceholders = [
    { value: "{{client_name}}", description: "Client's name", category: "Client" },
    { value: "{{client_email}}", description: "Client's email", category: "Client" },
    { value: "{{client_address}}", description: "Client's address", category: "Client" },
    { value: "{{client_phone}}", description: "Client's phone", category: "Client" },
    { value: "{{company_name}}", description: "Your company name", category: "Company" },
    { value: "{{company_logo}}", description: "Your company logo (displays if uploaded)", category: "Company" },
    { value: "{{company_email}}", description: "Your company email", category: "Company" },
    { value: "{{company_address}}", description: "Your company address", category: "Company" },
    { value: "{{company_phone}}", description: "Your company phone", category: "Company" },
    { value: "{{invoice_number}}", description: "Invoice number", category: "Invoice" },
    { value: "{{invoice_date}}", description: "Invoice date", category: "Invoice" },
    { value: "{{due_date}}", description: "Payment due date", category: "Invoice" },
    { value: "{{items_table}}", description: "Invoice items table", category: "Invoice" },
    { value: "{{subtotal}}", description: "Subtotal amount", category: "Payment" },
    { value: "{{tax}}", description: "Tax amount", category: "Payment" },
    { value: "{{total}}", description: "Total amount", category: "Payment" },
    { value: "{{currency}}", description: "Currency code", category: "Payment" },
    { value: "{{account_holder_name}}", description: "Account holder name", category: "Bank" },
    { value: "{{accountHolderName}}", description: "Account holder (alt)", category: "Bank" },
    { value: "{{bank_name}}", description: "Bank name", category: "Bank" },
    { value: "{{bankName}}", description: "Bank name (alt)", category: "Bank" },
    { value: "{{iban}}", description: "IBAN number", category: "Bank" },
    { value: "{{bic}}", description: "BIC/SWIFT code", category: "Bank" },
    { value: "{{sort_code}}", description: "Sort code", category: "Bank" },
    { value: "{{sortCode}}", description: "Sort code (alt)", category: "Bank" },
    { value: "{{account_number}}", description: "Account number", category: "Bank" },
    { value: "{{accountNumber}}", description: "Account number (alt)", category: "Bank" },
    { value: "{{swift_code}}", description: "SWIFT code", category: "Bank" },
    { value: "{{swiftCode}}", description: "SWIFT code (alt)", category: "Bank" },
    { value: "{{routing_number}}", description: "Routing number", category: "Bank" },
    { value: "{{routingNumber}}", description: "Routing number (alt)", category: "Bank" },
    { value: "{{bank_address}}", description: "Bank address", category: "Bank" },
    { value: "{{bankAddress}}", description: "Bank address (alt)", category: "Bank" },
    { value: "{{additional_info}}", description: "Additional bank info", category: "Bank" },
    { value: "{{additionalInfo}}", description: "Additional info (alt)", category: "Bank" },
  ];

  // Create custom field placeholders
  const customFieldPlaceholders = customFields.map(field => ({
    value: `{{${field.placeholder || field.fieldName}}}`,
    description: field.fieldLabel,
    category: "Custom Fields"
  }));

  // Combine all placeholders
  const placeholders = [...basePlaceholders, ...customFieldPlaceholders];

  // Filter and group placeholders
  const filteredPlaceholders = placeholders.filter(p =>
    p.value.toLowerCase().includes(placeholderSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(placeholderSearch.toLowerCase())
  );

  const groupedPlaceholders = filteredPlaceholders.reduce((acc, placeholder) => {
    if (!acc[placeholder.category]) {
      acc[placeholder.category] = [];
    }
    acc[placeholder.category].push(placeholder);
    return acc;
  }, {});

  // Handle placeholder autocomplete
  const handleContentChange = (e) => {
    const value = e.target.value;
    setTemplateHTML(value);

    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);

    // Check if user typed {{
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastTwoBraces = textBeforeCursor.lastIndexOf("{{");

    if (lastTwoBraces !== -1) {
      const searchTerm = textBeforeCursor.substring(lastTwoBraces + 2);
      const hasClosingBraces = searchTerm.includes("}}");

      if (!hasClosingBraces) {
        setPlaceholderSearch(searchTerm);
        setShowPlaceholderDropdown(true);
        setSelectedPlaceholderIndex(0);

        // Calculate dropdown position at cursor
        const textarea = e.target;
        const textBeforeBraces = value.substring(0, lastTwoBraces);
        const lines = textBeforeBraces.split('\n');
        const currentLine = lines.length - 1;
        const currentColumn = lines[lines.length - 1].length;
        
        // Approximate positioning based on line height and character width
        const lineHeight = 20; // approximate line height in pixels
        const charWidth = 8.4; // approximate character width for monospace
        
        setDropdownPosition({
          top: (currentLine + 1) * lineHeight + 40, // +40 for padding/label
          left: Math.min(currentColumn * charWidth + 12, 400) // cap at 400px to keep visible
        });
        return;
      }
    }

    setShowPlaceholderDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (!showPlaceholderDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedPlaceholderIndex((prev) =>
        prev < filteredPlaceholders.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedPlaceholderIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && showPlaceholderDropdown) {
      e.preventDefault();
      insertPlaceholder(filteredPlaceholders[selectedPlaceholderIndex]);
    } else if (e.key === "Escape") {
      setShowPlaceholderDropdown(false);
    }
  };

  const insertPlaceholder = (placeholder) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const value = templateHTML;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastTwoBraces = textBeforeCursor.lastIndexOf("{{");

    const beforePlaceholder = value.substring(0, lastTwoBraces);
    const afterPlaceholder = value.substring(cursorPos);

    const newValue = beforePlaceholder + placeholder.value + afterPlaceholder;
    setTemplateHTML(newValue);
    setShowPlaceholderDropdown(false);

    // Set cursor position after the inserted placeholder
    setTimeout(() => {
      const newCursorPos = lastTwoBraces + placeholder.value.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target)
      ) {
        setShowPlaceholderDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in!");
      setLoading(false);
      return;
    }

    const templateData = {
      title,
      description,
      category,
      currency,
      templateHTML,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/invoicetemplates`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error("Failed to save template.");
      }

      toast.success("Template created successfully!");
      
      setTitle("");
      setDescription("");
      setCategory("Standard");
      setCurrency("USD");
      setTemplateHTML("");

      // Refresh the template list
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      setError("Failed to save template. Please try again.");
      console.error("Error saving template:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-fadeIn">
      <div className="bg-gray-800 text-white rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-700 animate-slideUp flex flex-col max-h-[95vh]">
        
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-2 flex justify-between items-center rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <FaFileInvoice className="text-white text-sm" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create Invoice Template</h2>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-all duration-200"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Content - No Scroll */}
        <div className="flex-1 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-3 space-y-2 h-full flex flex-col">
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-1.5 rounded-lg text-xs">
                {error}
              </div>
            )}

            {/* Template Name - Full Width */}
            <div>
              <label className="flex items-center space-x-1 text-xs font-medium text-gray-300 mb-1">
                <FaTag className="text-purple-400 text-xs" />
                <span>Template Name *</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Professional Invoice"
                className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                required
              />
            </div>

            {/* Description & Category Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-300 mb-1">
                  <FaFileAlt className="text-purple-400 text-xs" />
                  <span>Description</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description"
                  className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-300 mb-1">
                  <FaList className="text-purple-400 text-xs" />
                  <span>Category *</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option>Standard</option>
                  <option>Professional</option>
                  <option>Minimal</option>
                  <option>Creative</option>
                </select>
              </div>
            </div>

            {/* HTML Template - Flexible Height */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center space-x-2 text-xs font-medium text-gray-300">
                  <FaCode className="text-purple-400 text-xs" />
                  <span>HTML Template *</span>
                </label>
                <span className="text-xs text-gray-400">
                  Type &#123;&#123; for placeholders â€¢ {templateHTML.length} chars
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={templateHTML}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                placeholder="<div>Your invoice HTML...</div>"
                style={{ minHeight: '300px' }}
                className="w-full flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono resize-none text-sm overflow-y-auto"
                required
              ></textarea>

              {/* Placeholder Dropdown */}
              {showPlaceholderDropdown && filteredPlaceholders.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 w-96 max-h-64 overflow-y-auto bg-gray-800 border border-purple-500 rounded-lg shadow-2xl"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`
                  }}
                >
                  <div className="p-2 border-b border-gray-700 bg-gray-900">
                    <p className="text-xs text-purple-400 font-semibold">Available Placeholders</p>
                  </div>
                  <div className="p-2">
                    {Object.entries(groupedPlaceholders).map(([category, items]) => (
                      <div key={category} className="mb-3 last:mb-0">
                        <div className="text-xs font-semibold text-gray-400 mb-1 px-2">{category}</div>
                        {items.map((placeholder, index) => {
                          const globalIndex = filteredPlaceholders.indexOf(placeholder);
                          return (
                            <div
                              key={placeholder.value}
                              onClick={() => insertPlaceholder(placeholder)}
                              className={`px-3 py-2 cursor-pointer rounded-md transition-colors ${
                                globalIndex === selectedPlaceholderIndex
                                  ? 'bg-purple-600 text-white'
                                  : 'hover:bg-gray-700 text-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <code className="text-sm font-mono text-green-400">{placeholder.value}</code>
                                <span className="text-xs text-gray-400 ml-2">{placeholder.description}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-900/80 px-4 py-2 border-t border-gray-700 flex justify-end space-x-3 rounded-b-2xl flex-shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Cancel
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? "Creating..." : "Create Template"}
          </button>
        </div>

        {/* Custom Scrollbar Styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(31, 41, 55, 0.5);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(75, 85, 99, 0.8);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(107, 114, 128, 1);
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }

          .animate-slideUp {
            animation: slideUp 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}


