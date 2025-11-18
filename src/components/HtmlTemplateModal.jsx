import { useState, useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import { API_BASE_URL } from '../config/api';

export default function HtmlTemplateModal({ template, isOpen, onClose, onSave }) {
  const [htmlContent, setHtmlContent] = useState(template?.templateHTML || "");
  
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
    { value: "{{company_logo}}", description: "Your company logo (displays if uploaded)", category: "Company" },
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
    { value: "{{currencySymbol}}", description: "Currency symbol ($)", category: "Invoice" },
    { value: "{{work_type}}", description: "Type of work", category: "Invoice" },
    { value: "{{workType}}", description: "Work type (alt)", category: "Invoice" },
    { value: "{{notes}}", description: "Invoice notes", category: "Invoice" },
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
    { value: "{{swift_code}}", description: "SWIFT code", category: "Bank" },
    { value: "{{swiftCode}}", description: "SWIFT code (alt)", category: "Bank" },
    { value: "{{routing_number}}", description: "Routing number", category: "Bank" },
    { value: "{{routingNumber}}", description: "Routing number (alt)", category: "Bank" },
    { value: "{{bank_address}}", description: "Bank address", category: "Bank" },
    { value: "{{bankAddress}}", description: "Bank address (alt)", category: "Bank" },
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

  // Handle textarea input for placeholder autocomplete
  const handleContentChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setHtmlContent(value);
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
        
        // Calculate dropdown position at cursor
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
      } else {
        setShowPlaceholderDropdown(false);
      }
    } else {
      setShowPlaceholderDropdown(false);
    }
  };

  // Handle keyboard navigation in placeholder dropdown
  const handleKeyDown = (e) => {
    if (!showPlaceholderDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedPlaceholderIndex(prev => 
        prev < filteredPlaceholders.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedPlaceholderIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter' && filteredPlaceholders.length > 0) {
      e.preventDefault();
      insertPlaceholder(filteredPlaceholders[selectedPlaceholderIndex]);
    } else if (e.key === 'Escape') {
      setShowPlaceholderDropdown(false);
    }
  };

  // Insert selected placeholder
  const insertPlaceholder = (placeholder) => {
    const textBeforeCursor = htmlContent.substring(0, cursorPosition);
    const textAfterCursor = htmlContent.substring(cursorPosition);
    
    // Find the last {{ before cursor
    const lastBraces = textBeforeCursor.lastIndexOf("{{");
    
    if (lastBraces !== -1) {
      const newText = 
        htmlContent.substring(0, lastBraces) + 
        placeholder.value + " " +
        textAfterCursor;
      
      setHtmlContent(newText);
      setShowPlaceholderDropdown(false);
      setPlaceholderSearch("");
      setSelectedPlaceholderIndex(0);
      
      // Set focus back to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastBraces + placeholder.value.length + 1;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          textareaRef.current && !textareaRef.current.contains(event.target)) {
        setShowPlaceholderDropdown(false);
      }
    };

    if (showPlaceholderDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPlaceholderDropdown]);

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

  // Update state when modal opens with the template HTML
  if (!isOpen || !template) return null;

  const handleSave = () => {
    onSave(template.id, htmlContent); // Call the save function with new HTML
    onClose(); // Close modal after saving
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 text-white rounded-2xl shadow-2xl max-w-5xl w-full relative border border-purple-500/20 overflow-hidden">
        
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 border-b border-purple-500/30">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                {template.title}
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                Edit HTML template with dynamic placeholders
              </p>
            </div>
            <button 
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200" 
              onClick={onClose}
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Hint Text */}
          <div className="mb-3 flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-300">
                Type <kbd className="px-2 py-0.5 bg-purple-600/30 border border-purple-500/50 rounded text-purple-300 font-mono text-xs">&#123;&#123;</kbd> to insert placeholders
              </p>
            </div>
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Auto-complete enabled
            </span>
          </div>

          {/* HTML Code Editor with Placeholder Dropdown */}
          <div className="relative">
            <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              HTML Template Code
            </label>
            <div className="relative group">
              <textarea
                ref={textareaRef}
                value={htmlContent}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                className="w-full h-96 p-4 bg-gray-800 border border-gray-600 rounded-lg text-sm font-mono text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all resize-none shadow-inner"
                placeholder="Write your HTML template... Type &#123;&#123; to see available placeholders"
              ></textarea>
              <div className="absolute bottom-3 right-3 text-xs text-gray-500 pointer-events-none">
                {htmlContent.length} characters
              </div>
            </div>

          {/* Placeholder Dropdown */}
          {showPlaceholderDropdown && filteredPlaceholders.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute bg-gray-800 border-2 border-purple-500 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-50 w-[420px]"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`
              }}
            >
              <div className="sticky top-0 p-3 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/90 to-blue-900/90 backdrop-blur">
                <p className="text-xs text-purple-200 font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Available Placeholders 
                  <span className="ml-auto bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs">
                    {filteredPlaceholders.length}
                  </span>
                </p>
              </div>
              <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                {Object.keys(groupedPlaceholders).map(category => (
                  <div key={category} className="mb-3 last:mb-0">
                    <div className="text-xs font-semibold text-purple-400 mb-1 px-2 py-1 bg-gray-900/50 rounded sticky top-0">
                      {category}
                    </div>
                    {groupedPlaceholders[category].map((placeholder, idx) => {
                      const globalIndex = filteredPlaceholders.indexOf(placeholder);
                      return (
                        <div
                          key={idx}
                          onClick={() => insertPlaceholder(placeholder)}
                          className={`px-3 py-2.5 cursor-pointer rounded-lg transition-all duration-150 ${
                            globalIndex === selectedPlaceholderIndex
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                              : 'hover:bg-gray-700/70 text-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <code className={`text-sm font-mono font-semibold ${
                              globalIndex === selectedPlaceholderIndex ? 'text-green-200' : 'text-green-400'
                            }`}>
                              {placeholder.value}
                            </code>
                            <span className="text-xs text-gray-400 leading-relaxed">
                              {placeholder.description}
                            </span>
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

        </div>

        {/* Footer Buttons */}
        <div className="bg-gray-900/50 px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button 
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2" 
            onClick={onClose}
          >
            <FaTimes size={14} />
            Cancel
          </button>
          <button 
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/50 flex items-center gap-2" 
            onClick={handleSave}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}


