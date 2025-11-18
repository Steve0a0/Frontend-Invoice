import { useState, useEffect, useRef } from "react";
import { FaTimes, FaEnvelope, FaTag, FaFileAlt, FaImage, FaAngleDown } from "react-icons/fa";
import { API_BASE_URL } from '../config/api';

export default function NewEmailTemplateModal({ isOpen, onClose, refreshTemplates, editingTemplate }) {
  const [templateData, setTemplateData] = useState({
    name: "",
    subject: "",
    content: "",
    imageUrl: "",
  });

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // Fetch custom fields
  useEffect(() => {
    const fetchCustomFields = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/custom-fields/active`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const fields = await response.json();
          setCustomFields(fields);
        }
      } catch (error) {
        console.error("Error fetching custom fields:", error);
      }
    };
    
    if (isOpen) {
      fetchCustomFields();
    }
  }, [isOpen]);

  // All available placeholders with descriptions
  const basePlaceholders = [
    { value: "{{client_name}}", description: "Client's name", category: "Client" },
    { value: "{{clientName}}", description: "Client's name (alt)", category: "Client" },
    { value: "{{client_address}}", description: "Client's address", category: "Client" },
    { value: "{{company_name}}", description: "Your company name", category: "Company" },
    { value: "{{company_address}}", description: "Your company address", category: "Company" },
    { value: "{{userName}}", description: "Your name", category: "Company" },
    { value: "{{invoice_number}}", description: "Invoice number/ID", category: "Invoice" },
    { value: "{{invoiceId}}", description: "Invoice ID (alt)", category: "Invoice" },
    { value: "{{invoice_date}}", description: "Invoice issue date", category: "Invoice" },
    { value: "{{date}}", description: "Invoice date (alt)", category: "Invoice" },
    { value: "{{due_date}}", description: "Payment due date", category: "Invoice" },
    { value: "{{total_amount}}", description: "Total with currency", category: "Invoice" },
    { value: "{{totalAmount}}", description: "Total amount (alt)", category: "Invoice" },
    { value: "{{currency}}", description: "Currency code (USD, EUR)", category: "Invoice" },
    { value: "{{currencySymbol}}", description: "Currency symbol ($, €, £)", category: "Invoice" },
    { value: "{{work_type}}", description: "Type of work", category: "Invoice" },
    { value: "{{workType}}", description: "Work type (alt)", category: "Invoice" },
    { value: "{{notes}}", description: "Invoice notes", category: "Invoice" },
    { value: "{{paypalPaymentLink}}", description: "PayPal payment link", category: "Payment" },
    { value: "{{stripePaymentLink}}", description: "Stripe payment link", category: "Payment" },
    { value: "{{account_holder_name}}", description: "Bank account holder", category: "Bank" },
    { value: "{{accountHolderName}}", description: "Account holder (alt)", category: "Bank" },
    { value: "{{bank_name}}", description: "Bank name", category: "Bank" },
    { value: "{{bankName}}", description: "Bank name (alt)", category: "Bank" },
    { value: "{{iban}}", description: "IBAN number", category: "Bank" },
    { value: "{{bic}}", description: "BIC/SWIFT code", category: "Bank" },
    { value: "{{sort_code}}", description: "Sort code", category: "Bank" },
    { value: "{{sortCode}}", description: "Sort code (alt)", category: "Bank" },
    { value: "{{account_number}}", description: "Account number", category: "Bank" },
    { value: "{{accountNumber}}", description: "Account number (alt)", category: "Bank" },
    { value: "{{additional_info}}", description: "Additional bank info", category: "Bank" },
    { value: "{{additionalInfo}}", description: "Additional info (alt)", category: "Bank" },
  ];

  // Combine base placeholders with custom fields
  const customFieldPlaceholders = customFields.map(field => ({
    value: `{{${field.placeholder || field.fieldName}}}`,
    description: field.fieldLabel || field.fieldName,
    category: "Custom Fields"
  }));

  const placeholders = [...basePlaceholders, ...customFieldPlaceholders];

  // Populate form when editing
  useEffect(() => {
    if (editingTemplate) {
      setTemplateData({
        name: editingTemplate.name || "",
        subject: editingTemplate.subject || "",
        content: editingTemplate.content || "",
        imageUrl: editingTemplate.imageUrl || "",
      });
    } else {
      setTemplateData({
        name: "",
        subject: "",
        content: "",
        imageUrl: "",
      });
    }
  }, [editingTemplate]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter placeholders based on search
  const filteredPlaceholders = placeholders.filter(p => 
    p.value.toLowerCase().includes(placeholderSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(placeholderSearch.toLowerCase())
  );

  // Group placeholders by category
  const groupedPlaceholders = filteredPlaceholders.reduce((acc, placeholder) => {
    if (!acc[placeholder.category]) {
      acc[placeholder.category] = [];
    }
    acc[placeholder.category].push(placeholder);
    return acc;
  }, {});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTemplateData({ ...templateData, [name]: value });
  };

  // Handle textarea input for placeholder autocomplete
  const handleContentChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setTemplateData({ ...templateData, content: value });
    setCursorPosition(cursorPos);

    // Check if user typed "{{"
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastTwoBraces = textBeforeCursor.lastIndexOf("{{");
    
    if (lastTwoBraces !== -1) {
      const textAfterBraces = textBeforeCursor.substring(lastTwoBraces + 2);
      
      // Check if there's a closing "}}" between the opening and cursor
      if (!textAfterBraces.includes("}}")) {
        setPlaceholderSearch(textAfterBraces);
        setShowPlaceholderDropdown(true);
        setSelectedPlaceholderIndex(0);
        
        // Calculate dropdown position
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          const textBeforePosition = value.substring(0, lastTwoBraces);
          const lines = textBeforePosition.split('\n');
          const currentLine = lines.length;
          const lineHeight = 20; // Approximate line height
          
          const top = currentLine * lineHeight + 40; // Offset from textarea top
          const left = 10;
          
          setDropdownPosition({ top, left });
        }
      } else {
        setShowPlaceholderDropdown(false);
      }
    } else {
      setShowPlaceholderDropdown(false);
    }
  };

  // Handle keyboard navigation in dropdown
  const handleContentKeyDown = (e) => {
    if (!showPlaceholderDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedPlaceholderIndex(prev => 
        prev < filteredPlaceholders.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedPlaceholderIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && showPlaceholderDropdown) {
      e.preventDefault();
      insertPlaceholder(filteredPlaceholders[selectedPlaceholderIndex]);
    } else if (e.key === 'Escape') {
      setShowPlaceholderDropdown(false);
    }
  };

  // Insert selected placeholder
  const insertPlaceholder = (placeholder) => {
    if (!placeholder || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const value = templateData.content;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastTwoBraces = textBeforeCursor.lastIndexOf("{{");
    
    const before = value.substring(0, lastTwoBraces);
    const after = value.substring(cursorPosition);
    
    const newValue = before + placeholder.value + after;
    const newCursorPosition = before.length + placeholder.value.length;
    
    setTemplateData({ ...templateData, content: newValue });
    setShowPlaceholderDropdown(false);
    setPlaceholderSearch("");
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          textareaRef.current && !textareaRef.current.contains(event.target)) {
        setShowPlaceholderDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTemplateData({ ...templateData, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
  
    try {
      const token = localStorage.getItem("token");
      const url = editingTemplate 
        ? `${API_BASE_URL}/api/templates/${editingTemplate.id}`
        : `${API_BASE_URL}/api/templates`;
      
      const method = editingTemplate ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(templateData),
      });
  
      if (response.ok) {
        if (typeof refreshTemplates === "function") {
          refreshTemplates();
        }
        setTemplateData({ name: "", subject: "", content: "", imageUrl: "" });
        onClose(); 
      } else {
        throw new Error("Failed to save template");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to save template. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-fadeIn">
      <div className="bg-gray-800 text-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-700 animate-slideUp flex flex-col max-h-[95vh]">
        
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 flex justify-between items-center rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FaEnvelope className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingTemplate ? "Edit Email Template" : "Create Email Template"}
              </h2>
              <p className="text-blue-100 text-xs">
                {editingTemplate ? "Update your email template" : "Design a new email template"}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-2 rounded-lg text-xs">
                {error}
              </div>
            )}

            {/* Template Name */}
            <div>
              <label className="flex items-center space-x-2 text-xs font-medium text-gray-300 mb-1">
                <FaTag className="text-blue-400 text-xs" />
                <span>Template Name *</span>
              </label>
              <input
                type="text"
                name="name"
                value={templateData.name}
                onChange={handleInputChange}
                placeholder="e.g., Welcome Email"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            {/* Email Subject */}
            <div>
              <label className="flex items-center space-x-2 text-xs font-medium text-gray-300 mb-1">
                <FaEnvelope className="text-blue-400 text-xs" />
                <span>Email Subject *</span>
              </label>
              <input
                type="text"
                name="subject"
                value={templateData.subject}
                onChange={handleInputChange}
                placeholder="e.g., Your Invoice is Ready"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            {/* Email Content */}
            <div className="relative">
              <label className="flex items-center space-x-2 text-xs font-medium text-gray-300 mb-1">
                <FaFileAlt className="text-blue-400 text-xs" />
                <span>Email Content *</span>
                <span className="text-gray-500 text-xs ml-auto">Type {"{{ for placeholders"}</span>
              </label>
              <textarea
                ref={textareaRef}
                name="content"
                value={templateData.content}
                onChange={handleContentChange}
                onKeyDown={handleContentKeyDown}
                placeholder="Write your email content... Type {{ to see available placeholders"
                className="w-full h-[400px] px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm font-mono"
                required
              ></textarea>

              {/* Autocomplete Dropdown */}
              {showPlaceholderDropdown && filteredPlaceholders.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl max-h-96 overflow-y-auto"
                  style={{ 
                    top: `${dropdownPosition.top}px`, 
                    left: `${dropdownPosition.left}px`,
                    minWidth: '350px'
                  }}
                >
                  <div className="p-2 border-b border-gray-700 bg-gray-900/50">
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <FaAngleDown className="text-blue-400" />
                      <span>Select placeholder - Use â†‘â†“ arrows, Enter to insert, Esc to close</span>
                    </p>
                  </div>
                  
                  {Object.keys(groupedPlaceholders).map(category => (
                    <div key={category} className="border-b border-gray-700 last:border-b-0">
                      <div className="px-3 py-1 bg-gray-900/30 text-xs font-semibold text-blue-400 sticky top-0">
                        {category}
                      </div>
                      {groupedPlaceholders[category].map((placeholder, idx) => {
                        const globalIndex = filteredPlaceholders.indexOf(placeholder);
                        return (
                          <div
                            key={placeholder.value}
                            className={`px-3 py-2 cursor-pointer flex items-start justify-between gap-2 hover:bg-blue-600/20 transition-colors ${
                              globalIndex === selectedPlaceholderIndex ? 'bg-blue-600/30 border-l-2 border-blue-500' : ''
                            }`}
                            onClick={() => insertPlaceholder(placeholder)}
                            onMouseEnter={() => setSelectedPlaceholderIndex(globalIndex)}
                          >
                            <div className="flex-1 min-w-0">
                              <code className="text-green-400 text-xs font-mono block truncate">
                                {placeholder.value}
                              </code>
                              <p className="text-gray-400 text-xs mt-0.5">{placeholder.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-2 p-3 bg-gray-900/50 border border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                <p className="text-xs font-semibold text-blue-400 mb-2">ðŸ’¡ Available Placeholders:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{client_name}}"}</code> - Client name</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{client_email}}"}</code> - Client email</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{clientName}}"}</code> - Client name (alt)</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{company_name}}"}</code> - Your company name</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{company_address}}"}</code> - Your email/address</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{invoice_number}}"}</code> - Invoice ID</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{invoiceId}}"}</code> - Invoice ID (alt)</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{invoice_date}}"}</code> - Invoice date</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{date}}"}</code> - Invoice date (alt)</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{due_date}}"}</code> - Due date</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{total_amount}}"}</code> - Total with $</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{totalAmount}}"}</code> - Total with currency</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{currency}}"}</code> - Currency code</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{currencySymbol}}"}</code> - Currency symbol</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{work_type}}"}</code> - Work type</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{workType}}"}</code> - Work type (alt)</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{notes}}"}</code> - Invoice notes</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{userName}}"}</code> - Your name</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{paypalPaymentLink}}"}</code> - PayPal link</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{stripePaymentLink}}"}</code> - Stripe link</div>
                  
                  <div className="col-span-2 mt-2 pt-2 border-t border-gray-700">
                    <span className="text-yellow-400 font-semibold">Bank Details:</span>
                  </div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{account_holder_name}}"}</code> - Account holder</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{bank_name}}"}</code> - Bank name</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{iban}}"}</code> - IBAN</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{bic}}"}</code> - BIC/SWIFT</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{account_number}}"}</code> - Account number</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{sort_code}}"}</code> - Sort code</div>
                  <div><code className="bg-gray-800 px-1 rounded text-green-400">{"{{additional_info}}"}</code> - Additional info</div>
                </div>
              </div>
            </div>

            {/* Template Image - Compact */}
            <div>
              <label className="flex items-center space-x-2 text-xs font-medium text-gray-300 mb-1">
                <FaImage className="text-blue-400 text-xs" />
                <span>Image (Optional)</span>
              </label>
              <input 
                type="file" 
                onChange={handleImageChange}
                accept="image/*"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-400 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
              />
              {templateData.imageUrl && (
                <img 
                  src={templateData.imageUrl} 
                  alt="Preview" 
                  className="mt-2 w-32 h-20 object-cover rounded-lg border border-gray-700"
                />
              )}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-900/80 px-4 py-3 border-t border-gray-700 flex justify-end space-x-3 rounded-b-2xl flex-shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 text-sm"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? "Saving..." : editingTemplate ? "Update Template" : "Save Template"}
          </button>
        </div>

        {/* Custom Scrollbar Styles */}
        <style jsx>{`
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


