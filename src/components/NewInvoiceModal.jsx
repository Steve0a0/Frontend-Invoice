import { useState, useEffect } from "react";
import { FaTimes, FaTrash, FaPlus, FaCalendarAlt, FaUser, FaBriefcase, FaDollarSign, FaPercentage } from "react-icons/fa";
import jwtDecode from "jwt-decode";
import { usePaymentManagement } from "../context/PaymentContext";
import toast from "react-hot-toast";
import { API_BASE_URL } from '../config/api';

const itemStructureOptions = [
  { value: "hourly", label: "Hourly Rate", helper: "Charge per hour (rate x hours)" },
  { value: "fixed_price", label: "Fixed Price", helper: "Charge per unit (quantity x unit price)" },
  { value: "daily_rate", label: "Daily Rate", helper: "Charge per day (rate x days)" },
  { value: "simple", label: "Simple Amount", helper: "Single amount per line item" },
];

const calculateTaskTotal = (task, structure) => {
  if (structure === "hourly") {
    return (Number(task.hours) || 0) * (Number(task.rate) || 0);
  }
  if (structure === "fixed_price") {
    return (Number(task.quantity) || 0) * (Number(task.unitPrice) || 0);
  }
  if (structure === "daily_rate") {
    return (Number(task.days) || 0) * (Number(task.rate) || 0);
  }
  if (structure === "simple") {
    return Number(task.amount) || 0;
  }
  return 0;
};

const remapTaskForStructure = (task, structure) => {
  const normalizedTask = {
    id: task.id || Date.now(),
    description: task.description || "",
  };

  if (structure === "hourly") {
    normalizedTask.rate = Number(task.rate) || 0;
    normalizedTask.hours = Number(task.hours) || 0;
  } else if (structure === "fixed_price") {
    normalizedTask.quantity = Number(task.quantity) || 0;
    normalizedTask.unitPrice = Number(task.unitPrice) || 0;
  } else if (structure === "daily_rate") {
    normalizedTask.rate = Number(task.rate) || 0;
    normalizedTask.days = Number(task.days) || 0;
  } else if (structure === "simple") {
    const amountValue = Number(
      task.amount !== undefined ? task.amount : task.total
    );
    normalizedTask.amount = Number.isNaN(amountValue) ? 0 : amountValue;
  }

  normalizedTask.total = calculateTaskTotal(normalizedTask, structure);
  return normalizedTask;
};

export default function NewInvoiceModal({ isOpen, onClose, setRefreshKey, initialDocumentType = "invoice" }) {
  const [formData, setFormData] = useState({
    client: "",
    clientEmail: "",
    date: "",
    workType: "",
    currency: "USD",
    tasks: [remapTaskForStructure({ id: 1, description: "" }, "hourly")],
    notes: "",
    customFields: {},
    documentType: initialDocumentType,
    validUntil: "",
  });

  const [userId, setUserId] = useState(null);
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const [itemStructure, setItemStructure] = useState("hourly"); // Default to hourly
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const { paymentManagementEnabled } = usePaymentManagement();
  const workTypes = ["Consulting", "Development", "Design"];
  const currencies = ["USD", "EUR", "GBP"];
  const documentType = formData.documentType || "invoice";
  const isQuote = documentType === "quote";
  const documentLabel = isQuote ? "Quote" : "Invoice";
  const primaryButtonGradient = isQuote
    ? "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
    : "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700";

  const applyItemStructure = (structure) => {
    setItemStructure(structure);
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => remapTaskForStructure(task, structure)),
    }));
  };

  const handleItemStructureSelect = (structure) => {
    applyItemStructure(structure);
  };

  const handleDocumentTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      documentType: type,
      validUntil: type === "quote" ? prev.validUntil : "",
    }));
  };

  const selectedStructureMeta = itemStructureOptions.find(
    (option) => option.value === itemStructure
  );

  // Get currency symbol based on selected currency
  const getCurrencySymbol = (currency) => {
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£"
    };
    return symbols[currency] || "$";
  };

  // Prevent body scroll when modal is open
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

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        documentType: initialDocumentType,
        validUntil: initialDocumentType === "quote" ? prev.validUntil : "",
      }));
    }
  }, [isOpen, initialDocumentType]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUserId(decodedUser.id);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  // Fetch custom field definitions
  useEffect(() => {
    const fetchCustomFields = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/custom-fields/active`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const fields = await response.json();
          setCustomFieldDefs(fields.filter(f => f.showInInvoice));
        }
      } catch (error) {
        console.error("Error fetching custom fields:", error);
      }
    };

    if (isOpen) {
      fetchCustomFields();
    }
  }, [isOpen]);

  // Fetch user's item structure preference
  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          const preferredStructure = userData.itemStructure || "hourly";
          applyItemStructure(preferredStructure);
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
      }
    };

    if (isOpen) {
      fetchUserSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVatToggle = () => {
    setVatEnabled((prev) => {
      const next = !prev;
      if (!next) {
        setVatRate("");
        setVatNumber("");
      }
      return next;
    });
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setFormData({
      ...formData,
      customFields: {
        ...formData.customFields,
        [fieldName]: value,
      },
    });
  };

  const handleTaskChange = (index, field, value) => {
    const updatedTasks = [...formData.tasks];
    updatedTasks[index][field] = value;
    
    updatedTasks[index].total = calculateTaskTotal(updatedTasks[index], itemStructure);
    
    setFormData({ ...formData, tasks: updatedTasks });
  };

  const addTask = () => {
    const newTask = remapTaskForStructure({ id: Date.now(), description: "" }, itemStructure);
    setFormData({
      ...formData,
      tasks: [...formData.tasks, newTask],
    });
  };

  const deleteTask = (id) => {
    if (formData.tasks.length > 1) {
      setFormData({
        ...formData,
        tasks: formData.tasks.filter((task) => task.id !== id),
      });
    }
  };

  const subtotalAmount = formData.tasks.reduce(
    (sum, task) => sum + (Number(task.total) || 0),
    0
  );
  const parsedVatRate = Number(vatRate) || 0;
  const vatAmount = vatEnabled && parsedVatRate > 0
    ? (subtotalAmount * parsedVatRate) / 100
    : 0;
  const totalWithVat = subtotalAmount + vatAmount;

  // Validate invoice data
  const validateInvoiceData = () => {
    if (!formData.client || !formData.date || !formData.workType || formData.tasks.length === 0) {
        toast.error("Please fill in all required fields.");
        return false;
    }
    if (isQuote && !formData.validUntil) {
        toast.error("Please select a valid until date for the quote.");
        return false;
    }
    if (vatEnabled && parsedVatRate <= 0) {
        toast.error("Please enter a valid VAT percentage.");
        return false;
    }
    return true;
  };

  // Prepare invoice data object
  const prepareInvoiceData = () => {
    const customFieldsWithVat = { ...formData.customFields };
    if (vatEnabled && parsedVatRate > 0) {
        customFieldsWithVat._systemVat = {
            enabled: true,
            rate: parsedVatRate,
            number: vatNumber || "",
            amount: Number(vatAmount.toFixed(2)),
            subtotal: Number(subtotalAmount.toFixed(2)),
        };
    } else if (customFieldsWithVat._systemVat) {
        delete customFieldsWithVat._systemVat;
    }

    const invoiceData = {
        userId: userId || "unknown-user",
        client: formData.client,
        clientEmail: formData.clientEmail,
        date: formData.date,
        workType: formData.workType,
        currency: formData.currency,
        tasks: formData.tasks.map(task => {
            const taskData = {
                description: task.description,
                total: Number(task.total),
            };
            
            // Add structure-specific fields
            if (itemStructure === 'hourly') {
                taskData.rate = Number(task.rate) || 0;
                taskData.hours = Number(task.hours) || 0;
            } else if (itemStructure === 'fixed_price') {
                taskData.quantity = Number(task.quantity) || 0;
                taskData.unitPrice = Number(task.unitPrice) || 0;
            } else if (itemStructure === 'daily_rate') {
                taskData.rate = Number(task.rate) || 0;
                taskData.days = Number(task.days) || 0;
            } else if (itemStructure === 'simple') {
                taskData.amount = Number(task.amount) || 0;
            }
            
            return taskData;
        }),
        notes: formData.notes,
        totalAmount: Number(totalWithVat.toFixed(2)),
        status: "Draft",
        documentType,
        validUntil: isQuote ? formData.validUntil : null,
        customFields: customFieldsWithVat,
        itemStructure: itemStructure, // Include item structure in invoice
    };

    return invoiceData;
  };

  // Create invoice in database
  const createInvoice = async (invoiceData) => {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/invoices`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(invoiceData),
        });

        if (response.ok) {
            const newInvoice = await response.json();
            setRefreshKey(prev => prev + 1);
            return newInvoice;
        } else {
            const errorMessage = await response.json();
            toast.error(`Error: ${errorMessage.message}`);
            return null;
        }
    } catch (error) {
        console.error("Error creating invoice:", error);
        toast.error("An error occurred. Please try again.");
        return null;
    }
  };

  // Handle Save as Draft
  const handleSaveAsDraft = async (e) => {
    e.preventDefault();
    
    if (!validateInvoiceData()) return;
    
    const invoiceData = prepareInvoiceData();
    const invoice = await createInvoice(invoiceData);
    
    if (invoice) {
        toast.success(documentLabel === "Quote" ? "Quote Created!" : "Invoice Created!");
        onClose();
    }
  };

  

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-gray-800 text-white rounded-2xl shadow-2xl w-full max-w-5xl relative max-h-[95vh] overflow-hidden border border-gray-700 animate-slideUp flex flex-col">
          
          {/* Compact Header */}
          <div className={`bg-gradient-to-r ${isQuote ? "from-purple-600 to-purple-700" : "from-blue-600 to-blue-700"} px-6 py-3 flex flex-col gap-2 flex-shrink-0`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Create New {documentLabel}</h2>
                <p className="text-white/90 text-xs mt-0.5">
                  {isQuote ? "Share pricing details for approval." : "Fill in the details below to bill your client."}
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {["invoice", "quote"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleDocumentTypeChange(type)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 border ${
                    documentType === type
                      ? "bg-white/25 text-white border-white/60"
                      : "bg-white/10 text-white/70 border-white/30 hover:bg-white/20"
                  }`}
                >
                  {type === "invoice" ? "Invoice" : "Quote"}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Content - only if tasks overflow */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <form className="p-4 space-y-3">
            
            {/* Client & Work Details - Compact */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Client Name *
                </label>
                <input 
                  type="text" 
                  name="client" 
                  value={formData.client} 
                  onChange={handleInputChange} 
                  placeholder="Enter client name" 
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-500 text-sm"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Client Email
                </label>
                <input 
                  type="email" 
                  name="clientEmail" 
                  value={formData.clientEmail} 
                  onChange={handleInputChange} 
                  placeholder="client@example.com" 
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Work Type *
                </label>
                <select 
                  name="workType" 
                  value={formData.workType} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white text-sm"
                  required
                >
                  <option value="">Select type</option>
                  {workTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  {documentLabel} Date *
                </label>
                <input 
                  type="date" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white text-sm"
                  required 
                />
              </div>

              {isQuote && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Valid Until *
                  </label>
                  <input 
                    type="date" 
                    name="validUntil" 
                    value={formData.validUntil} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white text-sm"
                    required 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Currency
                </label>
                <select 
                  name="currency" 
                  value={formData.currency} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white text-sm"
                >
                  {currencies.map((cur) => <option key={cur} value={cur}>{cur}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Item Structure
                </label>
                <select
                  value={itemStructure}
                  onChange={(e) => handleItemStructureSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white text-sm"
                >
                  {itemStructureOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {selectedStructureMeta && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    {selectedStructureMeta.helper}
                  </p>
                )}
              </div>
            </div>

            {/* Tasks Section - Compact */}
            <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-white flex items-center">
                  <FaBriefcase className="mr-2 text-blue-400 text-xs" />
                  Tasks & Line Items
                </h3>
                <button 
                  onClick={addTask} 
                  type="button" 
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-all duration-200 flex items-center space-x-1"
                >
                  <FaPlus className="text-xs" /> 
                  <span>Add Task</span>
                </button>
              </div>

              {/* Task Header */}
              <div className="grid grid-cols-12 gap-2 mb-2 px-2">
                <div className="col-span-5 text-xs font-medium text-gray-400">Description</div>
                {itemStructure === 'hourly' && (
                  <>
                    <div className="col-span-2 text-xs font-medium text-gray-400 text-center">Rate ({getCurrencySymbol(formData.currency)}/hr)</div>
                    <div className="col-span-2 text-xs font-medium text-gray-400 text-center">Hours</div>
                  </>
                )}
                {itemStructure === 'fixed_price' && (
                  <>
                    <div className="col-span-2 text-xs font-medium text-gray-400 text-center">Quantity</div>
                    <div className="col-span-2 text-xs font-medium text-gray-400 text-center">Unit Price ({getCurrencySymbol(formData.currency)})</div>
                  </>
                )}
                {itemStructure === 'daily_rate' && (
                  <>
                    <div className="col-span-2 text-xs font-medium text-gray-400 text-center">Rate ({getCurrencySymbol(formData.currency)}/day)</div>
                    <div className="col-span-2 text-xs font-medium text-gray-400 text-center">Days</div>
                  </>
                )}
                {itemStructure === 'simple' && (
                  <div className="col-span-4 text-xs font-medium text-gray-400 text-center">Amount ({getCurrencySymbol(formData.currency)})</div>
                )}
                <div className="col-span-2 text-xs font-medium text-gray-400 text-center">Total</div>
                {formData.tasks.length > 1 && <div className="col-span-1"></div>}
              </div>

              {/* Task List */}
              <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                {formData.tasks.map((task, index) => (
                  <div key={task.id} className="bg-gray-800/50 p-2 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <input 
                          type="text" 
                          value={task.description} 
                          onChange={(e) => handleTaskChange(index, "description", e.target.value)} 
                          placeholder="Task description"  
                          className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-gray-500 text-xs"
                        />
                      </div>

                      {/* Hourly Rate Structure */}
                      {itemStructure === 'hourly' && (
                        <>
                          <div className="col-span-2">
                            <input 
                              type="text" 
                              placeholder="0" 
                              value={task.rate === 0 ? "" : task.rate} 
                              onChange={(e) => handleTaskChange(index, "rate", e.target.value.replace(/[^\d.]/g, ""))} 
                              className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-center text-xs" 
                            />
                          </div>
                          <div className="col-span-2">
                            <input 
                              type="text" 
                              placeholder="0" 
                              value={task.hours === 0 ? "" : task.hours} 
                              onChange={(e) => handleTaskChange(index, "hours", e.target.value.replace(/[^\d.]/g, ""))} 
                              className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-center text-xs" 
                            />
                          </div>
                        </>
                      )}

                      {/* Fixed Price Structure */}
                      {itemStructure === 'fixed_price' && (
                        <>
                          <div className="col-span-2">
                            <input 
                              type="text" 
                              placeholder="0" 
                              value={task.quantity === 0 ? "" : task.quantity} 
                              onChange={(e) => handleTaskChange(index, "quantity", e.target.value.replace(/[^\d.]/g, ""))} 
                              className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-center text-xs" 
                            />
                          </div>
                          <div className="col-span-2">
                            <input 
                              type="text" 
                              placeholder="0" 
                              value={task.unitPrice === 0 ? "" : task.unitPrice} 
                              onChange={(e) => handleTaskChange(index, "unitPrice", e.target.value.replace(/[^\d.]/g, ""))} 
                              className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-center text-xs" 
                            />
                          </div>
                        </>
                      )}

                      {/* Daily Rate Structure */}
                      {itemStructure === 'daily_rate' && (
                        <>
                          <div className="col-span-2">
                            <input 
                              type="text" 
                              placeholder="0" 
                              value={task.rate === 0 ? "" : task.rate} 
                              onChange={(e) => handleTaskChange(index, "rate", e.target.value.replace(/[^\d.]/g, ""))} 
                              className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-center text-xs" 
                            />
                          </div>
                          <div className="col-span-2">
                            <input 
                              type="text" 
                              placeholder="0" 
                              value={task.days === 0 ? "" : task.days} 
                              onChange={(e) => handleTaskChange(index, "days", e.target.value.replace(/[^\d.]/g, ""))} 
                              className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-center text-xs" 
                            />
                          </div>
                        </>
                      )}

                      {/* Simple Amount Structure */}
                      {itemStructure === 'simple' && (
                        <div className="col-span-4">
                          <input 
                            type="text" 
                            placeholder="0" 
                            value={task.amount === 0 ? "" : task.amount} 
                            onChange={(e) => handleTaskChange(index, "amount", e.target.value.replace(/[^\d.]/g, ""))} 
                            className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-center text-xs" 
                          />
                        </div>
                      )}

                      <div className="col-span-2">
                        <div className="px-2 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-white font-semibold text-center text-xs">
                          {getCurrencySymbol(formData.currency)}{task.total.toFixed(2)}
                        </div>
                      </div>

                      {formData.tasks.length > 1 && (
                        <div className="col-span-1 flex justify-center">
                          <button 
                            onClick={() => deleteTask(task.id)} 
                            type="button" 
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-all duration-200"
                            title="Delete task"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Fields Section */}
            {customFieldDefs.length > 0 && (
              <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                  <span className="mr-2">⚙️</span>
                  Custom Fields
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customFieldDefs.map((field) => (
                    <div key={field.id}>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        {field.fieldLabel} {field.isRequired && <span className="text-red-400">*</span>}
                      </label>
                      {field.fieldType === "text" && (
                        <input
                          type="text"
                          value={formData.customFields[field.fieldName] || ""}
                          onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
                          placeholder={field.placeholder || ""}
                          required={field.isRequired}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 text-xs"
                        />
                      )}
                      {field.fieldType === "textarea" && (
                        <textarea
                          value={formData.customFields[field.fieldName] || ""}
                          onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
                          placeholder={field.placeholder || ""}
                          required={field.isRequired}
                          rows="2"
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 text-xs resize-none"
                        />
                      )}
                      {field.fieldType === "number" && (
                        <input
                          type="number"
                          value={formData.customFields[field.fieldName] || ""}
                          onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
                          placeholder={field.placeholder || ""}
                          required={field.isRequired}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 text-xs"
                        />
                      )}
                      {field.fieldType === "date" && (
                        <input
                          type="date"
                          value={formData.customFields[field.fieldName] || ""}
                          onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
                          required={field.isRequired}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs"
                        />
                      )}
                      {field.fieldType === "email" && (
                        <input
                          type="email"
                          value={formData.customFields[field.fieldName] || ""}
                          onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
                          placeholder={field.placeholder || ""}
                          required={field.isRequired}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 text-xs"
                        />
                      )}
                      {field.fieldType === "select" && (
                        <select
                          value={formData.customFields[field.fieldName] || ""}
                          onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
                          required={field.isRequired}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs"
                        >
                          <option value="">Select...</option>
                          {field.fieldOptions && field.fieldOptions.map((option, idx) => (
                            <option key={idx} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      {field.fieldType === "checkbox" && (
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.customFields[field.fieldName] === true || formData.customFields[field.fieldName] === "true"}
                            onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.checked)}
                            className="rounded bg-gray-900 border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-300">{field.placeholder || "Check if applicable"}</span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-gray-900/70 border border-gray-700 rounded-xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 text-blue-300 p-2 rounded-lg">
                    <FaPercentage className="text-base" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">VAT & Tax Details</p>
                    <p className="text-[11px] text-gray-400">Toggle to include VAT breakdown on this invoice.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-gray-400">
                  {/* <span>{vatEnabled ? "Enabled" : "Disabled"}</span> */}
                  <button
                    type="button"
                    onClick={handleVatToggle}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
                      vatEnabled ? "bg-blue-500" : "bg-gray-600"
                    }`}
                    title="Toggle VAT"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        vatEnabled ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
              {vatEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 transition-all duration-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      VAT Number
                    </label>
                    <input
                      type="text"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      placeholder="Registration number"
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 text-sm"
                    />
                  </div>
                   <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      VAT Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vatRate}
                        onChange={(e) => setVatRate(e.target.value)}
                        placeholder="e.g. 20"
                        className="w-full pl-10 pr-3 py-2 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 text-sm"
                      />
                      <span className="absolute inset-y-0 left-0 flex items-center justify-center w-9 text-gray-500 text-xs border-r border-gray-700">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes - Compact */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea 
                name="notes" 
                value={formData.notes} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-500 resize-none text-xs" 
                rows="2" 
                placeholder={paymentManagementEnabled ? "Add notes or payment terms..." : "Add notes..."}
              ></textarea>
            </div>

            {/* Total Amount - Compact */}
            <div className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 p-3 rounded-xl border-2 border-blue-500/30">
              <div className="flex justify-between items-start">
                <div className="flex flex-col space-y-1 text-sm">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <span>Subtotal</span>
                    <span className="font-semibold">
                      {formData.currency} {subtotalAmount.toFixed(2)}
                    </span>
                  </div>
                  {vatEnabled && (
                    <div className="flex items-center space-x-2 text-gray-400 text-xs">
                      <span>VAT ({parsedVatRate || 0}%)</span>
                      <span className="font-semibold text-gray-200">
                        {formData.currency} {vatAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <FaDollarSign className="text-lg text-blue-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-blue-200">Total</p>
                    <p className="text-2xl font-bold text-white">
                      {formData.currency} {totalWithVat.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-900/80 px-4 py-3 border-t border-gray-700 flex justify-between items-center gap-3 flex-shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 text-sm"
          >
            Cancel
          </button>
          
          <button 
            type="button" 
            onClick={handleSaveAsDraft}
            className={`px-6 py-2 bg-gradient-to-r ${primaryButtonGradient} text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 text-sm`}
          >
            Create {documentLabel}
          </button>
        </div>

        {/* Custom Scrollbar Styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
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
    </>
  );
}
