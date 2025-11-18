import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import { API_BASE_URL } from '../config/api';

export default function EditInvoiceModal({ invoice, isOpen, onClose, onSuccess }) {
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
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const [formData, setFormData] = useState({
        client: "",
        date: "",
        workType: "",
        currency: "USD",
        notes: "",
        status: "Draft",
        customFields: {}
    });
    const [tasks, setTasks] = useState([]);
    const [itemStructure, setItemStructure] = useState("hourly");
    const [customFieldDefs, setCustomFieldDefs] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (invoice && isOpen) {
            
            // Populate form with invoice data
            setFormData({
                client: invoice.client || "",
                date: invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : "",
                workType: invoice.workType || "",
                currency: invoice.currency || "USD",
                notes: invoice.notes || "",
                status: invoice.status || "Draft",
                customFields: invoice.customFields || {}
            });
            
            // Handle tasks and migrate data structure if needed
            const invoiceStructure = invoice.itemStructure || "hourly";
            const migratedTasks = (invoice.tasks || []).map(task => {
                const baseTask = {
                    id: task.id,
                    description: task.description || "",
                    total: task.total || 0
                };

                // If the task doesn't have the correct fields for the structure, migrate from total
                if (invoiceStructure === 'hourly') {
                    let hoursValue = task.hours !== null && task.hours !== undefined ? task.hours : 0;
                    const rateValue = task.rate !== null && task.rate !== undefined ? task.rate : 0;
                    
                    // If hours is 0 but we have rate and total, calculate hours
                    if (hoursValue === 0 && rateValue > 0 && task.total > 0) {
                        hoursValue = task.total / rateValue;
                    }
                    
                    return {
                        ...baseTask,
                        hours: hoursValue,
                        rate: rateValue
                    };
                } else if (invoiceStructure === 'fixed_price') {
                    let quantityValue = task.quantity !== null && task.quantity !== undefined ? task.quantity : 0;
                    let unitPriceValue = task.unitPrice !== null && task.unitPrice !== undefined ? task.unitPrice : 0;
                    
                    // If values are missing but we have total, set defaults
                    if (quantityValue === 0 && unitPriceValue === 0 && task.total > 0) {
                        quantityValue = 1;
                        unitPriceValue = task.total;
                    }
                    
                    return {
                        ...baseTask,
                        quantity: quantityValue,
                        unitPrice: unitPriceValue
                    };
                } else if (invoiceStructure === 'daily_rate') {
                    // For daily_rate, check if 'days' exists, otherwise use 'hours' field as fallback
                    let daysValue = task.days !== null && task.days !== undefined 
                        ? task.days 
                        : (task.hours !== null && task.hours !== undefined ? task.hours : 0);
                    
                    // If days is still 0 but we have rate and total, calculate days
                    const rateValue = task.rate !== null && task.rate !== undefined ? task.rate : 0;
                    if (daysValue === 0 && rateValue > 0 && task.total > 0) {
                        daysValue = task.total / rateValue;
                    }
                    
                    return {
                        ...baseTask,
                        days: daysValue,
                        rate: rateValue
                    };
                } else if (invoiceStructure === 'simple') {
                    return {
                        ...baseTask,
                        amount: task.amount !== null && task.amount !== undefined ? task.amount : task.total
                    };
                }
                
                return baseTask;
            });
            
            setTasks(migratedTasks);
            setItemStructure(invoiceStructure);
        }
    }, [invoice, isOpen]);

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCustomFieldChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            customFields: {
                ...prev.customFields,
                [fieldName]: value,
            },
        }));
    };

    const handleTaskChange = (index, field, value) => {
        const updatedTasks = [...tasks];
        updatedTasks[index][field] = field === 'description' ? value : parseFloat(value) || 0;
        
        // Calculate total based on item structure
        if (itemStructure === 'hourly') {
            if (field === 'hours' || field === 'rate') {
                updatedTasks[index].total = (updatedTasks[index].hours || 0) * (updatedTasks[index].rate || 0);
            }
        } else if (itemStructure === 'fixed_price') {
            if (field === 'quantity' || field === 'unitPrice') {
                updatedTasks[index].total = (updatedTasks[index].quantity || 0) * (updatedTasks[index].unitPrice || 0);
            }
        } else if (itemStructure === 'daily_rate') {
            if (field === 'days' || field === 'rate') {
                updatedTasks[index].total = (updatedTasks[index].days || 0) * (updatedTasks[index].rate || 0);
            }
        } else if (itemStructure === 'simple') {
            if (field === 'amount') {
                updatedTasks[index].total = parseFloat(value) || 0;
            }
        }
        
        setTasks(updatedTasks);
    };

    const addTask = () => {
        let newTask = { description: "", total: 0 };
        
        if (itemStructure === 'hourly') {
            newTask = { ...newTask, hours: 0, rate: 0 };
        } else if (itemStructure === 'fixed_price') {
            newTask = { ...newTask, quantity: 0, unitPrice: 0 };
        } else if (itemStructure === 'daily_rate') {
            newTask = { ...newTask, days: 0, rate: 0 };
        } else if (itemStructure === 'simple') {
            newTask = { ...newTask, amount: 0 };
        }
        
        setTasks([...tasks, newTask]);
    };

    const removeTask = (index) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return tasks.reduce((sum, task) => sum + (task.total || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.client || !formData.date || !formData.workType || tasks.length === 0) {
            toast.error("Please fill in all required fields and add at least one task");
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const totalAmount = calculateTotal();

            // Map tasks based on item structure
            const mappedTasks = tasks.map(task => {
                const baseTask = {
                    description: task.description,
                    total: parseFloat(task.total) || 0
                };

                if (itemStructure === 'hourly') {
                    return {
                        ...baseTask,
                        hours: parseFloat(task.hours) || 0,
                        rate: parseFloat(task.rate) || 0
                    };
                } else if (itemStructure === 'fixed_price') {
                    return {
                        ...baseTask,
                        quantity: parseFloat(task.quantity) || 0,
                        unitPrice: parseFloat(task.unitPrice) || 0
                    };
                } else if (itemStructure === 'daily_rate') {
                    return {
                        ...baseTask,
                        days: parseFloat(task.days) || 0,
                        rate: parseFloat(task.rate) || 0
                    };
                } else if (itemStructure === 'simple') {
                    return {
                        ...baseTask,
                        amount: parseFloat(task.amount) || 0
                    };
                }
                return baseTask;
            });

            const updateData = {
                ...formData,
                tasks: mappedTasks,
                totalAmount,
                itemStructure,
                customFields: formData.customFields
            };


            const response = await fetch(`${API_BASE_URL}/api/invoices/${invoice.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                toast.success("Invoice updated successfully!");
                onSuccess();
                onClose();
            } else {
                const error = await response.json();
                console.error('Backend error response: ', error);
                toast.error(`Failed to update invoice: ${error.message || error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error updating invoice:", error);
            toast.error("An error occurred while updating the invoice");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !invoice) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-[9999] overflow-y-auto">
            <div className="bg-gray-900 text-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/50">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                            Edit Invoice
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Invoice {invoice.invoiceNumber || `#${invoice.id.slice(0, 8)}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                        title="Close"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        
                        {/* Client and Date Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Client Name *
                                </label>
                                <input
                                    type="text"
                                    name="client"
                                    value={formData.client}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Invoice Date *
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* Work Type and Currency Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Work Type *
                                </label>
                                <input
                                    type="text"
                                    name="workType"
                                    value={formData.workType}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    placeholder="e.g., Web Development"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Currency *
                                </label>
                                <select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="INR">INR (₹)</option>
                                </select>
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            >
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>

                        {/* Tasks Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-semibold text-gray-300">
                                    Tasks/Items * ({itemStructure === 'hourly' ? 'Hourly Rate' : itemStructure === 'fixed_price' ? 'Fixed Price' : itemStructure === 'daily_rate' ? 'Daily Rate' : 'Simple'})
                                </label>
                                <button
                                    type="button"
                                    onClick={addTask}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <FaPlus className="w-3 h-3" />
                                    Add Task
                                </button>
                            </div>

                            <div className="space-y-3">
                                {tasks.map((task, index) => (
                                    <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                            {/* Description - Always shown */}
                                            <div className={itemStructure === 'simple' ? 'md:col-span-7' : 'md:col-span-5'}>
                                                <input
                                                    type="text"
                                                    placeholder="Task description"
                                                    value={task.description}
                                                    onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            {/* Hourly Rate Structure */}
                                            {itemStructure === 'hourly' && (
                                                <>
                                                    <div className="md:col-span-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Rate"
                                                            value={task.rate !== undefined && task.rate !== null ? task.rate : ''}
                                                            onChange={(e) => handleTaskChange(index, 'rate', e.target.value)}
                                                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                            step="0.01"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Hours"
                                                            value={task.hours !== undefined && task.hours !== null ? task.hours : ''}
                                                            onChange={(e) => handleTaskChange(index, 'hours', e.target.value)}
                                                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                            step="0.5"
                                                            min="0"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {/* Fixed Price Structure */}
                                            {itemStructure === 'fixed_price' && (
                                                <>
                                                    <div className="md:col-span-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Quantity"
                                                            value={task.quantity !== undefined && task.quantity !== null ? task.quantity : ''}
                                                            onChange={(e) => handleTaskChange(index, 'quantity', e.target.value)}
                                                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                            step="1"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Unit Price"
                                                            value={task.unitPrice !== undefined && task.unitPrice !== null ? task.unitPrice : ''}
                                                            onChange={(e) => handleTaskChange(index, 'unitPrice', e.target.value)}
                                                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                            step="0.01"
                                                            min="0"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {/* Daily Rate Structure */}
                                            {itemStructure === 'daily_rate' && (
                                                <>
                                                    <div className="md:col-span-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Rate/Day"
                                                            value={task.rate !== undefined && task.rate !== null ? task.rate : ''}
                                                            onChange={(e) => handleTaskChange(index, 'rate', e.target.value)}
                                                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                            step="0.01"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Days"
                                                            value={task.days !== undefined && task.days !== null ? task.days : ''}
                                                            onChange={(e) => handleTaskChange(index, 'days', e.target.value)}
                                                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                            step="0.5"
                                                            min="0"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {/* Simple Structure - Just Amount */}
                                            {itemStructure === 'simple' && (
                                                <div className="md:col-span-3">
                                                    <input
                                                        type="number"
                                                        placeholder="Amount"
                                                        value={task.amount !== undefined && task.amount !== null ? task.amount : ''}
                                                        onChange={(e) => handleTaskChange(index, 'amount', e.target.value)}
                                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                </div>
                                            )}

                                            {/* Total and Delete Button */}
                                            <div className="md:col-span-2 flex items-center justify-between gap-2">
                                                <span className="text-sm font-semibold text-green-400 whitespace-nowrap">
                                                    {getCurrencySymbol(formData.currency)}{task.total?.toFixed(2) || '0.00'}
                                                </span>
                                                {tasks.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTask(index)}
                                                        className="text-red-400 hover:text-red-300 p-1"
                                                    >
                                                        <FaTrash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Custom Fields Section */}
                        {customFieldDefs.length > 0 && (
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
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
                                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500 text-sm"
                                                />
                                            )}
                                            {field.fieldType === "textarea" && (
                                                <textarea
                                                    value={formData.customFields[field.fieldName] || ""}
                                                    onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
                                                    placeholder={field.placeholder || ""}
                                                    required={field.isRequired}
                                                    rows="2"
                                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500 text-sm resize-none"
                                                />
                                            )}
                                            {field.fieldType === "number" && (
                                                <input
                                                    type="number"
                                                    value={formData.customFields[field.fieldName] || ""}
                                                    onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
                                                    placeholder={field.placeholder || ""}
                                                    required={field.isRequired}
                                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500 text-sm"
                                                />
                                            )}
                                            {field.fieldType === "date" && (
                                                <input
                                                    type="date"
                                                    value={formData.customFields[field.fieldName] || ""}
                                                    onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
                                                    required={field.isRequired}
                                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 text-white text-sm"
                                                />
                                            )}
                                            {field.fieldType === "email" && (
                                                <input
                                                    type="email"
                                                    value={formData.customFields[field.fieldName] || ""}
                                                    onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
                                                    placeholder={field.placeholder || ""}
                                                    required={field.isRequired}
                                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500 text-sm"
                                                />
                                            )}
                                            {field.fieldType === "select" && (
                                                <select
                                                    value={formData.customFields[field.fieldName] || ""}
                                                    onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
                                                    required={field.isRequired}
                                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 text-white text-sm"
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
                                                        className="rounded bg-gray-900 border-gray-700 text-yellow-500 focus:ring-2 focus:ring-yellow-500"
                                                    />
                                                    <span className="text-sm text-gray-300">{field.placeholder || "Check if applicable"}</span>
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                placeholder="Additional notes or payment terms..."
                            />
                        </div>

                        {/* Total */}
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-300">Total Amount:</span>
                                <span className="text-2xl font-bold text-yellow-400">
                                    {formData.currency} {calculateTotal().toFixed(2)}
                                </span>
                            </div>
                        </div>

                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Updating..." : "Update Invoice"}
                    </button>
                </div>

            </div>
        </div>
    );
}


