import { useState, useEffect } from "react";
import { FaEnvelope, FaCheckCircle, FaClock, FaCalendarAlt, FaStop, FaPlay, FaEye, FaChevronDown, FaChevronRight, FaSearch, FaTimes, FaTrash, FaExclamationTriangle, FaTrashAlt } from "react-icons/fa";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { API_BASE_URL } from '../config/api';

// Custom modal for deleting all child invoices
const DeleteAllConfirmationModal = ({ isOpen, onClose, onConfirm, deleteData }) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-700/50 transform transition-all">
        
        {/* Header with Icon */}
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 px-5 py-5">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white hover:bg-gray-700 p-1.5 rounded-lg transition-all duration-200"
            aria-label="Close"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex items-center gap-3">
            {/* Icon with pulse animation */}
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
              <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-2.5 rounded-full shadow-lg shadow-red-500/50">
                <FaTrashAlt className="text-white text-lg" />
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-white">Delete All Invoices?</h2>
              <p className="text-gray-400 text-xs mt-0.5">This action cannot be undone</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4 bg-gray-900">
          
          {/* Delete Details */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-lg p-3 mb-3 border border-gray-700/50">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Client</span>
                <span className="text-white font-semibold">{deleteData?.clientName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Invoices to Delete</span>
                <span className="text-red-400 font-bold">
                  {deleteData?.invoices?.length} invoice{deleteData?.invoices?.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Recurring Template</span>
                <span className="text-green-400">Will be kept</span>
              </div>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-l-3 border-red-500 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <FaExclamationTriangle className="text-red-400 text-sm mt-0.5 flex-shrink-0" />
              <div className="text-xs leading-relaxed">
                <p className="text-red-200 font-semibold mb-1">
                  All {deleteData?.invoices?.length} auto-generated invoices will be permanently deleted.
                </p>
                <p className="text-red-300/80">
                  The recurring template will remain active and continue generating new invoices.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 border border-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm rounded-lg font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-500/30 flex items-center justify-center gap-1.5"
            >
              <FaTrashAlt className="w-3.5 h-3.5" />
              Delete All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function RecurringEmailsCard({ refreshKey }) {
  const [recurringTemplates, setRecurringTemplates] = useState([]);
  const [autoGeneratedInvoices, setAutoGeneratedInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateHistory, setTemplateHistory] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleteAllData, setDeleteAllData] = useState(null);

  useEffect(() => {
    fetchRecurringData();
    fetchEmailTemplates();
  }, [refreshKey]); // Re-fetch when refreshKey changes (user interaction)

  const fetchEmailTemplates = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const templates = await response.json();
        setEmailTemplates(templates);
      }
    } catch (error) {
      console.error("Error fetching email templates:", error);
    }
  };

  const fetchRecurringData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch recurring templates with cache-busting
      const templatesResponse = await fetch(`${API_BASE_URL}/api/invoices/recurring?_=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${token}`
        },
      });

      if (templatesResponse.ok) {
        const templates = await templatesResponse.json();
        setRecurringTemplates(templates);
      } else {
        console.error('[RecurringEmailsCard] Failed to fetch templates: ', templatesResponse.status);
        setRecurringTemplates([]);
      }

      // Fetch all invoices and filter for auto-generated ones
      const allInvoicesResponse = await fetch(`${API_BASE_URL}/api/invoices?_=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${token}`
        },
      });

      if (allInvoicesResponse.ok) {
        const allInvoices = await allInvoicesResponse.json();
        // Filter for auto-generated invoices (those with parentInvoiceId)
        const autoGenerated = allInvoices.filter(inv => inv.parentInvoiceId !== null);
        setAutoGeneratedInvoices(autoGenerated);
      } else {
        console.error('[RecurringEmailsCard] Failed to fetch invoices: ', allInvoicesResponse.status);
        setAutoGeneratedInvoices([]);
      }
    } catch (error) {
      console.error("Error fetching recurring data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplateHistory = async (templateId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/invoices?parentInvoiceId=${templateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplateHistory(data);
        setShowTemplateModal(true);
      }
    } catch (error) {
      console.error("Error fetching template history:", error);
    }
  };

  const handleStopRecurring = async (invoiceId) => {
    if (!confirm("Are you sure you want to stop this recurring invoice?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/stop-recurring`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchRecurringData();
      }
    } catch (error) {
      console.error("Error stopping recurring invoice:", error);
    }
  };

  const handleDeleteRecurringEmail = async (invoiceId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setIsDeleteModalOpen(false);
        setInvoiceToDelete(null);
        fetchRecurringData(); // Refresh the list
      } else {
        alert("Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting recurring email:", error);
      alert("Error deleting invoice");
    }
  };

  const confirmDeleteInvoice = (invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteAllData(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteAllChildren = async () => {
    if (!deleteAllData) return;

    try {
      const token = localStorage.getItem("token");
      
      // Delete all child invoices in parallel
      const deletePromises = deleteAllData.invoices.map(invoice =>
        fetch(`${API_BASE_URL}/api/invoices/${invoice.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const results = await Promise.all(deletePromises);
      
      const successCount = results.filter(r => r.ok).length;

      if (successCount > 0) {
        setIsDeleteModalOpen(false);
        setDeleteAllData(null);
        fetchRecurringData(); // Refresh the list
      } else {
        alert("Failed to delete invoices");
      }
    } catch (error) {
      console.error("Error deleting all recurring emails:", error);
      alert("Error deleting invoices");
    }
  };

  const confirmDeleteAllChildren = (parentId, clientName, e) => {
    e.stopPropagation(); // Prevent group toggle when clicking delete button
    
    const invoicesToDelete = groupedInvoices[parentId];
    
    setDeleteAllData({
      parentId,
      clientName,
      invoices: invoicesToDelete
    });
    setInvoiceToDelete(null);
    setIsDeleteModalOpen(true);
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      "every-20-seconds": "Every 20 Seconds (Test)",
      "every-minute": "Every Minute (Test)",
      daily: "Daily",
      weekly: "Weekly",
      "bi-weekly": "Bi-Weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly",
    };
    return labels[frequency] || frequency;
  };

  const getParentTemplateName = (parentId) => {
    const template = recurringTemplates.find(t => t.id === parentId);
    if (template) return template.client;
    
    // Fallback: get client name from any invoice in this group
    const invoiceInGroup = autoGeneratedInvoices.find(inv => inv.parentInvoiceId === parentId);
    return invoiceInGroup ? invoiceInGroup.client : "Unknown";
  };

  // Group auto-generated invoices by parent template
  const groupedInvoices = autoGeneratedInvoices.reduce((groups, invoice) => {
    const parentId = invoice.parentInvoiceId;
    if (!groups[parentId]) {
      groups[parentId] = [];
    }
    groups[parentId].push(invoice);
    return groups;
  }, {});


  // Sort each group by date (most recent first)
  Object.keys(groupedInvoices).forEach(parentId => {
    groupedInvoices[parentId].sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  // Filter groups by search query
  const filteredGroupKeys = Object.keys(groupedInvoices).filter(parentId => {
    const clientName = getParentTemplateName(parentId).toLowerCase();
    return clientName.includes(searchQuery.toLowerCase());
  });

  const toggleGroup = (parentId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };

  const formatNextDate = (date) => {
    if (!date) return "Not scheduled";
    const nextDate = new Date(date);
    const now = new Date();
    const diffMs = nextDate - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) return "Overdue";
    if (diffMins < 1) return "In less than a minute";
    if (diffMins < 60) return `In ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
    if (diffHours < 24) return `In ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    return `In ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  };

  const handleViewTemplate = (e, parentId) => {
    e.stopPropagation(); // Prevent toggle collapse
    const template = recurringTemplates.find(t => t.id === parentId);
    if (template) {
      setViewingTemplate(template);
    }
  };

  const getCurrencySymbol = (currency) => {
    const symbols = { USD: "$", EUR: "€", GBP: "£" };
    return symbols[currency] || "$";
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border border-gray-700 hover:border-gray-600 transition-all duration-300 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FaEnvelope className="text-purple-400 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Recurring Emails Sent</h2>
              <p className="text-gray-400 text-xs">Auto-generated invoices from recurring schedules</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-400">{autoGeneratedInvoices.length}</p>
            <p className="text-gray-400 text-xs">Sent</p>
          </div>
        </div>

        {/* Search Bar */}
        {autoGeneratedInvoices.length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
          </div>
        )}

        {/* Auto-Generated Invoice List - Grouped by Template */}
        {autoGeneratedInvoices.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FaClock className="text-4xl mx-auto mb-3 opacity-50" />
            <p className="text-sm">No recurring emails sent yet</p>
            <p className="text-xs mt-1">Start recurring on an invoice to see auto-generated emails here</p>
          </div>
        ) : filteredGroupKeys.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FaSearch className="text-4xl mx-auto mb-3 opacity-50" />
            <p className="text-sm">No results found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            {filteredGroupKeys.map((parentId) => {
              const template = recurringTemplates.find(t => t.id === parentId);
              const invoicesInGroup = groupedInvoices[parentId];
              const clientName = template ? template.client : (invoicesInGroup[0]?.client || "Unknown");
              const isExpanded = expandedGroups[parentId];
              
              
              return (
                <div key={parentId} className="bg-gray-700/30 rounded-lg border border-gray-600 overflow-hidden">
                  {/* Group Header - Clickable */}
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700/50 transition-all duration-200"
                    onClick={() => toggleGroup(parentId)}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      {/* Expand/Collapse Icon */}
                      {isExpanded ? (
                        <FaChevronDown className="text-gray-400 text-sm" />
                      ) : (
                        <FaChevronRight className="text-gray-400 text-sm" />
                      )}
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <h3 className="font-bold text-white text-sm">
                        {clientName}
                      </h3>
                      {template && (
                        <span className="text-xs text-gray-400">
                          ({getFrequencyLabel(template.recurringFrequency)})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-semibold">
                        {invoicesInGroup.length} email{invoicesInGroup.length > 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={(e) => confirmDeleteAllChildren(parentId, clientName, e)}
                        className="p-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-all duration-200"
                        title={`Delete all ${invoicesInGroup.length} invoices`}
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>

                  {/* Invoices in this group - Collapsible */}
                  {isExpanded && (
                    <div className="border-t border-gray-600 p-3 space-y-2">
                      {invoicesInGroup.map((invoice, index) => (
                        <div
                          key={invoice.id}
                          className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-3 hover:bg-gray-700/50 transition-all duration-200"
                        >
                          {/* Invoice Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400">
                                #{invoicesInGroup.length - index}
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-400">{invoice.workType}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <FaCalendarAlt className="text-blue-400 text-xs" />
                              <span className="text-xs text-gray-400">{new Date(invoice.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                invoice.status?.toLowerCase() === 'sent' ? 'bg-green-500/20 text-green-400' :
                                invoice.status?.toLowerCase() === 'paid' ? 'bg-blue-500/20 text-blue-400' :
                                invoice.status?.toLowerCase() === 'draft' ? 'bg-gray-500/20 text-gray-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {invoice.status || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {invoice.isFirstRecurringInvoice && (
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                                  First
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDeleteInvoice(invoice);
                                }}
                                className="p-1.5 hover:bg-red-500/20 rounded transition-colors duration-200 group"
                                title="Delete this auto-generated invoice"
                              >
                                <FaTrash className="text-gray-400 group-hover:text-red-400 text-xs" />
                              </button>
                            </div>
                          </div>
                        </div>
                    ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Template Details Modal */}
      {viewingTemplate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-[9999]">
          <div className="bg-gray-900 text-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Recurring Template Details
                </h2>
                <p className="text-sm text-gray-400 mt-1">Template being sent automatically</p>
              </div>
              <button
                onClick={() => setViewingTemplate(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="text-xl text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Email Template Info - MOST IMPORTANT */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/30">
                <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center">
                  <FaEnvelope className="mr-2" />
                  Email Being Sent
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Email Template</p>
                    <p className="text-white font-medium">
                      {(() => {
                        const emailTemplate = emailTemplates.find(t => t.id === viewingTemplate.emailTemplateId);
                        return emailTemplate?.name || 'Default Template';
                      })()}
                    </p>
                  </div>
                  {viewingTemplate.emailSubject && (
                    <div>
                      <p className="text-xs text-gray-400">Subject Line</p>
                      <p className="text-white font-medium bg-gray-800/50 p-2 rounded border border-gray-700">
                        {viewingTemplate.emailSubject}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-400">Sent To</p>
                    <p className="text-white font-medium">{viewingTemplate.email || viewingTemplate.clientEmail || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Recurring Schedule Info */}
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center">
                  <FaClock className="mr-2" />
                  Recurring Schedule
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Frequency</p>
                    <p className="text-white font-medium">{getFrequencyLabel(viewingTemplate.recurringFrequency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <p className={`font-semibold flex items-center gap-1 ${viewingTemplate.isRecurring ? 'text-green-400' : 'text-red-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${viewingTemplate.isRecurring ? 'bg-green-400' : 'bg-red-400'}`}></span>
                      {viewingTemplate.isRecurring ? 'Active' : 'Stopped'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Next Scheduled</p>
                    <p className="text-white font-medium">
                      {viewingTemplate.nextRecurringDate 
                        ? new Date(viewingTemplate.nextRecurringDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : 'Not scheduled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Emails Sent</p>
                    <p className="text-white font-medium">
                      {viewingTemplate.recurringCount || 0} times
                    </p>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Client Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Client Name</p>
                    <p className="text-white font-medium">{viewingTemplate.client}</p>
                  </div>
                  {(viewingTemplate.email || viewingTemplate.clientEmail) && (
                    <div>
                      <p className="text-xs text-gray-500">Email Address</p>
                      <p className="text-white font-medium">{viewingTemplate.email || viewingTemplate.clientEmail}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Details */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Invoice Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Work Type</p>
                    <p className="text-white font-medium">{viewingTemplate.workType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Currency</p>
                    <p className="text-white font-medium">{viewingTemplate.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="text-green-400 font-bold text-lg">
                      {getCurrencySymbol(viewingTemplate.currency)}{viewingTemplate.totalAmount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Invoice Number</p>
                    <p className="text-white font-medium">{viewingTemplate.invoiceNumber || `#${viewingTemplate.id.slice(0, 8)}`}</p>
                  </div>
                </div>
              </div>

              {/* Tasks/Line Items */}
              {viewingTemplate.tasks && viewingTemplate.tasks.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Tasks & Line Items</h3>
                  <div className="space-y-2">
                    {viewingTemplate.tasks.map((task, idx) => (
                      <div key={idx} className="bg-gray-700/50 rounded p-3 border border-gray-600">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-white font-medium text-sm">{task.description}</p>
                          <p className="text-green-400 font-semibold">
                            {getCurrencySymbol(viewingTemplate.currency)}{task.total?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-400">
                          <span>Rate: {getCurrencySymbol(viewingTemplate.currency)}{task.rate || 0}</span>
                          <span>•</span>
                          <span>Hours: {task.hours || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Fields */}
              {viewingTemplate.customFields && Object.keys(viewingTemplate.customFields).length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Custom Fields</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(viewingTemplate.customFields).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-white font-medium">{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewingTemplate.notes && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Additional Notes</h3>
                  <p className="text-white text-sm whitespace-pre-wrap">{viewingTemplate.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="sticky bottom-0 bg-gray-800 p-4 border-t border-gray-700 flex justify-between items-center gap-3">
              <div className="text-xs text-gray-400">
                Template ID: {viewingTemplate.id}
              </div>
              <div className="flex gap-3">
                {viewingTemplate.isRecurring ? (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to stop this recurring email?")) {
                        handleStopRecurring(viewingTemplate.id);
                        setViewingTemplate(null);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <FaStop />
                    Stop Recurring
                  </button>
                ) : (
                  <button
                    onClick={() => handleRestartRecurring(viewingTemplate.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <FaPlay />
                    Restart Recurring
                  </button>
                )}
                <button
                  onClick={() => setViewingTemplate(null)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteAllData ? (
        // Custom modal for deleting all children
        <DeleteAllConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteAllData(null);
          }}
          onConfirm={handleDeleteAllChildren}
          deleteData={deleteAllData}
        />
      ) : (
        // Standard delete modal for single invoice
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setInvoiceToDelete(null);
          }}
          onConfirm={() => invoiceToDelete && handleDeleteRecurringEmail(invoiceToDelete.id)}
          invoiceData={invoiceToDelete}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.7);
        }
      `}</style>
    </>
  );
}

