import { memo, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MoreVertical, Mail, Download, AlertTriangle, Search, Edit, Trash2, Eye, Copy, RotateCw, StopCircle, X, Calendar, Clock, Infinity, Send, FileText, Zap } from "lucide-react";
import toast from "react-hot-toast";
import SendInvoiceModal from "./SendInvoiceModal"; 
import DropdownPortal from "./DropdownPortal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import StopRecurringModal from "./StopRecurringModal";
import InvoicePreviewModal from "./InvoicePreviewModal";
import EditInvoiceModal from "./EditInvoiceModal";
import { API_BASE_URL } from '../config/api';



const RecentInvoices = memo(({ invoices = [], currentPage, setCurrentPage, paymentManagementEnabled = true, setRefreshKey }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [dropdownIndex, setDropdownIndex] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    const [isStopRecurringModalOpen, setIsStopRecurringModalOpen] = useState(false);
    const [invoiceToStopRecurring, setInvoiceToStopRecurring] = useState(null);
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [invoiceTemplates, setInvoiceTemplates] = useState([]);
    const [recurringConfig, setRecurringConfig] = useState({
        frequency: 'monthly',
        clientEmail: '',
        maxRecurrences: '',
        autoSendEmail: true,
        emailTemplateId: '',
        invoiceTemplateId: ''
    });

    // Get currency symbol based on currency code
    const getCurrencySymbol = (currency) => {
        const symbols = { USD: "$", EUR: "€", GBP: "£" };
        return symbols[currency] || "$";
    };

    // Helper functions to manage modal URL state
    const openSendInvoiceModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
        setSearchParams({ sendInvoice: invoice.id });
    };

    const closeSendInvoiceModal = () => {
        setIsModalOpen(false);
        setSelectedInvoice(null);
        setSearchParams({});
    };

    const openEditInvoiceModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsEditModalOpen(true);
        setSearchParams({ editInvoice: invoice.id });
    };

    const closeEditInvoiceModal = () => {
        setIsEditModalOpen(false);
        setSelectedInvoice(null);
        setSearchParams({});
    };

    const openPreviewModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsPreviewModalOpen(true);
        setSearchParams({ previewInvoice: invoice.id });
    };

    const closePreviewModal = () => {
        setIsPreviewModalOpen(false);
        setSelectedInvoice(null);
        setSearchParams({});
    };

    // Sync modal state with URL on mount and URL changes
    useEffect(() => {
        const sendInvoiceId = searchParams.get('sendInvoice');
        const editInvoiceId = searchParams.get('editInvoice');
        const previewInvoiceId = searchParams.get('previewInvoice');

        if (sendInvoiceId) {
            const invoice = invoices.find(inv => inv.id === sendInvoiceId);
            if (invoice) {
                setSelectedInvoice(invoice);
                setIsModalOpen(true);
            }
        } else if (editInvoiceId) {
            const invoice = invoices.find(inv => inv.id === editInvoiceId);
            if (invoice) {
                setSelectedInvoice(invoice);
                setIsEditModalOpen(true);
            }
        } else if (previewInvoiceId) {
            const invoice = invoices.find(inv => inv.id === previewInvoiceId);
            if (invoice) {
                setSelectedInvoice(invoice);
                setIsPreviewModalOpen(true);
            }
        }
    }, [searchParams, invoices]);

    
    const dropdownRefs = useRef([]);
    const itemsPerPage = 5;
    const filteredInvoices = invoices
  .filter((inv) => !inv.parentInvoiceId) // Only show original invoices (templates), hide ALL auto-generated ones
  .filter((inv) =>
    statusFilter === "All" || inv.status?.toLowerCase() === statusFilter.toLowerCase()
  )
  .filter((inv) => {
    const search = searchQuery.toLowerCase();
    return (
      inv.client?.toLowerCase().includes(search) ||
      inv.invoiceNumber?.toString().toLowerCase().includes(search) ||
      inv.totalAmount?.toString().toLowerCase().includes(search) ||
      new Date(inv.date).toLocaleDateString().toLowerCase().includes(search)
    );
  })
  .sort((a, b) => {
    // Primary sort: Recurring invoices first
    if (a.isRecurring && !b.isRecurring) return -1;
    if (!a.isRecurring && b.isRecurring) return 1;
    
    // Secondary sort: Most recent date first
    return new Date(b.date) - new Date(a.date);
  });


  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const displayedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside all dropdown buttons
            const isClickInsideButton = dropdownRefs.current.some(
                ref => ref && ref.contains(event.target)
            );
            
            // If dropdown is open and click is not inside any button, close it
            if (dropdownIndex !== null && !isClickInsideButton) {
                // Small delay to allow dropdown portal items to be clicked
                const isClickInsideDropdown = event.target.closest('.dropdown-portal-content');
                if (!isClickInsideDropdown) {
                    setDropdownIndex(null);
                }
            }
        };
        
        if (dropdownIndex !== null) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [dropdownIndex]);

    useEffect(() => {
        dropdownRefs.current = [];
    }, [invoices]);

    // Fetch email templates
    useEffect(() => {
        const fetchEmailTemplates = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/api/templates`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setEmailTemplates(data);
                }
            } catch (error) {
                console.error("Error fetching email templates:", error);
            }
        };
        fetchEmailTemplates();
    }, []);

    // Fetch invoice templates
    useEffect(() => {
        const fetchInvoiceTemplates = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/api/invoicetemplates`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setInvoiceTemplates(data);
                }
            } catch (error) {
                console.error("Error fetching invoice templates:", error);
            }
        };
        fetchInvoiceTemplates();
    }, []);
    
    const handleDropdownClick = (e, index) => {
        e.stopPropagation();
        if (dropdownIndex === index) {
            setDropdownIndex(null);
        } else {
            setDropdownIndex(index);
        }
    };

    const handleSendEmailClick = (invoice) => {
        openSendInvoiceModal(invoice);
        setDropdownIndex(null);
    };

    const handleDeleteInvoice = async (invoice) => {
        try {
            const token = localStorage.getItem("token");
            
            const response = await fetch(`${API_BASE_URL}/api/invoices/${invoice.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });


            if (response.ok) {
                
                // Close the delete modal
                setIsDeleteModalOpen(false);
                setInvoiceToDelete(null);
                
                // Trigger refresh using the refresh key mechanism
                if (setRefreshKey) {
                    setRefreshKey(prev => {
                        const newKey = prev + 1;
                        return newKey;
                    });
                } else {
                    // Fallback to page reload if setRefreshKey is not available
                    window.location.reload();
                }
            } else {
                const contentType = response.headers.get("content-type");
                let errorMessage = 'Unknown error';
                
                if (contentType && contentType.includes("application/json")) {
                    const error = await response.json();
                    errorMessage = error.message || 'Unknown error';
                } else {
                    const errorText = await response.text();
                    console.error('Non-JSON response:', errorText);
                    errorMessage = 'Server returned an invalid response';
                }
                
                toast.error(`Failed to delete invoice: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast.error("An error occurred while deleting the invoice. Check console for details.");
        }
    };

    const confirmDeleteInvoice = (invoice) => {
        setInvoiceToDelete(invoice);
        setIsDeleteModalOpen(true);
    };

    const handleMenuItemClick = (action, invoice) => {
        // Close dropdown when any menu item is clicked
        setDropdownIndex(null);
        
        // Handle specific actions
        switch(action) {
            case 'sendEmail':
                handleSendEmailClick(invoice);
                break;
            case 'preview':
                openPreviewModal(invoice);
                break;
            case 'download':
                handleDownloadInvoice(invoice);
                break;
            case 'edit':
                openEditInvoiceModal(invoice);
                break;
            case 'duplicate':
                handleDuplicateInvoice(invoice);
                break;
            case 'startRecurring':
                handleStartRecurring(invoice);
                break;
            case 'markOverdue':
                handleMarkOverdue(invoice);
                break;
            case 'stopRecurring':
                handleStopRecurring(invoice);
                break;
            case 'delete':
                confirmDeleteInvoice(invoice);
                break;
            default:
                break;
        }
    };

    const handleStopRecurring = async (invoice) => {
        setInvoiceToStopRecurring(invoice);
        setIsStopRecurringModalOpen(true);
    };

    const confirmStopRecurring = async () => {
        if (!invoiceToStopRecurring) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceToStopRecurring.id}/stop-recurring`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                toast.success(`âœ“ Recurring invoices stopped for ${invoiceToStopRecurring.client}`);
                setIsStopRecurringModalOpen(false);
                setInvoiceToStopRecurring(null);
                if (setRefreshKey) {
                    setRefreshKey(prev => prev + 1);
                }
            } else {
                const error = await response.json();
                toast.error(`Failed to stop recurring: ${error.message}`);
            }
        } catch (error) {
            console.error("Error stopping recurring invoice:", error);
            toast.error("An error occurred while stopping the recurring invoice");
        }
    };

    const handleStartRecurring = (invoice) => {
        
        setSelectedInvoice(invoice);
        
        // Get current time in HH:MM format (default to 9:00 AM if not set)
        const currentTime = invoice.recurringTime || '09:00';
        
        setRecurringConfig({
            frequency: invoice.recurringFrequency || 'monthly',
            clientEmail: invoice.clientEmail || '',
            maxRecurrences: invoice.maxRecurrences || '',
            autoSendEmail: invoice.autoSendEmail !== undefined ? invoice.autoSendEmail : true,
            emailTemplateId: invoice.emailTemplateId || '',
            invoiceTemplateId: invoice.invoiceTemplateId || '',
            dayOfMonth: invoice.dayOfMonth || new Date().getDate(), // Default to current day
            dayOfWeek: invoice.dayOfWeek !== null ? invoice.dayOfWeek : new Date().getDay(), // Default to current day of week
            monthOfYear: invoice.monthOfYear || (new Date().getMonth() + 1), // Default to current month
            quarterMonth: invoice.quarterMonth || 1, // Default to first month of quarter
            recurringTime: currentTime // Time to send (HH:MM format)
        });
        setIsRecurringModalOpen(true);
    };

    const submitRecurringConfig = async () => {
        if (!recurringConfig.clientEmail) {
            toast.error("Please enter a client email for recurring invoices");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const today = new Date();
            const nextDate = new Date(today);
            
            // Calculate next recurring date based on frequency
            switch (recurringConfig.frequency) {
                case 'every-20-seconds':
                    nextDate.setSeconds(nextDate.getSeconds() + 20);
                    break;
                case 'every-minute':
                    nextDate.setMinutes(nextDate.getMinutes() + 1);
                    break;
                case 'monthly-test':
                    nextDate.setMinutes(nextDate.getMinutes() + 2);
                    break;
                case 'daily':
                    nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case 'weekly':
                    nextDate.setDate(nextDate.getDate() + 7);
                    break;
                case 'monthly':
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    // If dayOfMonth is specified, set to that day
                    if (recurringConfig.dayOfMonth) {
                        const dayOfMonth = parseInt(recurringConfig.dayOfMonth);
                        // Get the last day of the target month
                        const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
                        // Use the specified day, or last day if month doesn't have that many days
                        nextDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
                    }
                    break;
                default:
                    nextDate.setMonth(nextDate.getMonth() + 1);
            }

            // Apply the recurringTime if specified (for non-test frequencies)
            if (recurringConfig.recurringTime && !['every-20-seconds', 'every-minute', 'monthly-test'].includes(recurringConfig.frequency)) {
                const [hours, minutes] = recurringConfig.recurringTime.split(': ').map(Number);
                nextDate.setHours(hours, minutes, 0, 0);
            }

            const response = await fetch(`${API_BASE_URL}/api/invoices/${selectedInvoice.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    isRecurring: true,
                    recurringFrequency: recurringConfig.frequency,
                    clientEmail: recurringConfig.clientEmail,
                    autoSendEmail: recurringConfig.autoSendEmail,
                    maxRecurrences: recurringConfig.maxRecurrences ? parseInt(recurringConfig.maxRecurrences) : null,
                    recurringStartDate: today,
                    nextRecurringDate: nextDate,
                    recurringEndDate: null, // Explicitly set to null to clear any old value
                    recurringCount: 0,
                    emailTemplateId: recurringConfig.emailTemplateId || null,
                    invoiceTemplateId: recurringConfig.invoiceTemplateId || null,
                    dayOfMonth: (recurringConfig.frequency === 'monthly' || recurringConfig.frequency === 'monthly-test') && recurringConfig.dayOfMonth 
                        ? parseInt(recurringConfig.dayOfMonth) 
                        : null,
                    dayOfWeek: recurringConfig.frequency === 'weekly' && recurringConfig.dayOfWeek !== null
                        ? parseInt(recurringConfig.dayOfWeek)
                        : null,
                    monthOfYear: recurringConfig.frequency === 'yearly' && recurringConfig.monthOfYear
                        ? parseInt(recurringConfig.monthOfYear)
                        : null,
                    quarterMonth: recurringConfig.frequency === 'quarterly' && recurringConfig.quarterMonth
                        ? parseInt(recurringConfig.quarterMonth)
                        : null,
                    recurringTime: recurringConfig.recurringTime || null,
                    status: "Sent" // Update status to Sent when recurring is enabled
                }),
            });

            if (response.ok) {
                toast.success(`Recurring invoices started for ${selectedInvoice.client}!`);
                setIsRecurringModalOpen(false);
                if (setRefreshKey) {
                    setRefreshKey(prev => prev + 1);
                }
            } else {
                toast.error("Failed to start recurring invoice");
            }
        } catch (error) {
            console.error("Error starting recurring invoice:", error);
            toast.error("An error occurred while starting the recurring invoice");
        }
    };

    const handleMarkOverdue = async (invoice) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/invoices/${invoice.id}`, {
                method: "PATCH",
                headers: {      
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: "Overdue" }),
            });

            if (response.ok) {
                toast.success("Invoice marked as overdue");
                if (setRefreshKey) {
                    setRefreshKey(prev => prev + 1);
                }
            } else {
                toast.error("Failed to update invoice status");
            }
        } catch (error) {
            console.error("Error updating invoice:", error);
            toast.error("An error occurred while updating the invoice");
        }
    };

    const handleDuplicateInvoice = async (invoice) => {
        try {
            const token = localStorage.getItem("token");
            
            // First, try to get tasks from the invoice object we already have
            let invoiceTasks = invoice.tasks;
            
            // If tasks aren't in the invoice object, fetch the full invoice details
            if (!invoiceTasks || invoiceTasks.length === 0) {
                const response = await fetch(`${API_BASE_URL}/api/invoices`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const allInvoices = await response.json();
                    const fullInvoice = allInvoices.find(inv => inv.id === invoice.id);
                    if (fullInvoice && fullInvoice.tasks) {
                        invoiceTasks = fullInvoice.tasks;
                    }
                }
            }
            
            // If still no tasks, calculate from total amount as a single task
            if (!invoiceTasks || invoiceTasks.length === 0) {
                // Create a single task from the invoice total
                invoiceTasks = [{
                    description: invoice.workType || "Service",
                    hours: 1,
                    rate: invoice.totalAmount || 0,
                    total: invoice.totalAmount || 0
                }];
            }
            
            // Prepare tasks - ensure they have the correct structure
            const duplicateTasks = invoiceTasks.map(task => ({
                description: task.description || "Service",
                hours: parseFloat(task.hours) || 1,
                rate: parseFloat(task.rate) || 0,
                total: parseFloat(task.total || (task.hours * task.rate)) || 0
            }));
            
            // Create duplicate with modifications
            const duplicateData = {
                client: invoice.client,
                workType: invoice.workType,
                date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
                totalAmount: parseFloat(invoice.totalAmount),
                currency: invoice.currency || "USD",
                status: "Draft", // Always start as draft
                tasks: duplicateTasks, // Properly formatted tasks
                notes: invoice.notes || "",
                clientEmail: invoice.clientEmail || "",
                // Don't copy recurring settings - user can set them up separately
                isRecurring: false,
                recurringFrequency: null,
                nextRecurringDate: null,
                recurringEndDate: null,
                recurringCount: 0,
                maxRecurrences: null,
                autoSendEmail: false,
                parentInvoiceId: null,
                isFirstRecurringInvoice: false,
                emailTemplateId: null,
            };
            
            
            // Create new invoice
            const createResponse = await fetch(`${API_BASE_URL}/api/invoices`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(duplicateData),
            });
            
            if (createResponse.ok) {
                const result = await createResponse.json();
                const message = "Invoice duplicated successfully! New invoice #" + (result.invoice?.id || 'created');
                toast.success(message);
                if (setRefreshKey) {
                    setRefreshKey(prev => prev + 1); // Refresh the list
                }
            } else {
                const error = await createResponse.json();
                toast.error(`Failed to duplicate invoice: ${error.message || 'Unknown error'}`);
                console.error("Duplicate error:", error);
            }
        } catch (error) {
            console.error("Error duplicating invoice:", error);
            toast.error("An error occurred while duplicating the invoice");
        }
    };

    const handleDownloadInvoice = async (invoice) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/invoices/${invoice.id}/download`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Invoice-${invoice.invoiceNumber || invoice.id.slice(0, 8)}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                toast.error("Failed to download invoice");
            }
        } catch (error) {
            console.error("Error downloading invoice:", error);
            toast.error("An error occurred while downloading the invoice");
        }
    };

    return (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-xl border border-gray-700 flex flex-col relative overflow-visible">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Recent Invoices</h3>
                <p className="text-gray-400 text-sm">Manage and track your invoice status</p>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 mb-4">
                {/* ðŸ” Search Bar */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search invoices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                </div>

                {/* ðŸ“‚ Status Dropdown */}
                <div className="w-full md:w-48">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                        <option value="All">All Status</option>
                        {paymentManagementEnabled ? (
                            <>
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                            </>
                        ) : (
                            <>
                                <option value="Sent">Sent</option>
                                <option value="Draft">Draft</option>
                            </>
                        )}
                    </select>
                </div>
            </div>

            {displayedInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-gray-400 py-12">
                    <Search className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No invoices found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                </div>
            ) : (
                <>
                    <div className="relative overflow-x-auto rounded-lg border border-gray-700 flex-grow">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-gray-900/50 text-gray-400 border-b border-gray-700">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 font-semibold">Client</th>
                                    <th className="px-4 sm:px-6 py-3 font-semibold">Invoice #</th>
                                    <th className="px-4 sm:px-6 py-3 font-semibold">Amount</th>
                                    <th className="px-4 sm:px-6 py-3 font-semibold">Status</th>
                                    <th className="px-4 sm:px-6 py-3 font-semibold">Invoice Date</th>
                                    <th className="px-4 sm:px-6 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedInvoices.map((invoice, index) => (
                                    <tr key={invoice.id || index} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors duration-150">
                                        <th className="px-4 sm:px-6 py-4 font-medium text-white whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span>{invoice.client}</span>
                                                {invoice.isRecurring && (
                                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/50 rounded text-xs font-semibold">
                                                        Recurring
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                        <td className="px-4 sm:px-6 py-4 text-gray-300">{invoice.invoiceNumber || `#${invoice.id.slice(0, 8)}`}</td> 
                                        <td className="px-4 sm:px-6 py-4 text-white font-semibold">{getCurrencySymbol(invoice.currency || "USD")}{invoice.totalAmount?.toFixed(2) || "N/A"}</td> 
                                        <td className="px-4 sm:px-6 py-4">
                                            {paymentManagementEnabled ? (
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full text-white inline-flex items-center
                                                    ${invoice.status?.toLowerCase() === "paid" ? "bg-green-500/20 text-green-400 border border-green-500/50" 
                                                    : invoice.status?.toLowerCase() === "pending" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50" 
                                                    : invoice.status?.toLowerCase() === "overdue" ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                                    : invoice.status?.toLowerCase() === "draft" ? "bg-gray-500/20 text-gray-400 border border-gray-500/50"
                                                    : "bg-blue-500/20 text-blue-400 border border-blue-500/50"}`}>
                                                    {invoice.status}
                                                </span>
                                            ) : (
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full text-white inline-flex items-center
                                                    ${invoice.status?.toLowerCase() === "draft" ? "bg-gray-500/20 text-gray-400 border border-gray-500/50" 
                                                    : "bg-blue-500/20 text-blue-400 border border-blue-500/50"}`}>
                                                    {invoice.status?.toLowerCase() === "draft" ? "Draft" : "Sent"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-gray-300">{invoice.date ? new Date(invoice.date).toLocaleDateString() : "N/A"}</td> 
                                        <td className="px-4 sm:px-6 py-4 relative">
                                            <button
                                                className="p-2.5 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg text-gray-300 hover:from-blue-600 hover:to-blue-700 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110 border border-gray-600 hover:border-blue-500"
                                                onClick={(e) => handleDropdownClick(e, index)}
                                                ref={(el) => (dropdownRefs.current[index] = el)}
                                                title="More actions"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>

                                            <DropdownPortal
                                                isOpen={dropdownIndex === index}
                                                targetRef={{ current: dropdownRefs.current[index] }}
                                            >
                                                <ul className="text-sm py-1">
                                                    {/* Send Email */}
                                                    <li
                                                        className="px-4 py-2.5 hover:bg-blue-600 flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition-colors duration-150"
                                                        onClick={() => handleMenuItemClick('sendEmail', invoice)}
                                                    >
                                                        <Mail className="text-blue-400 w-4 h-4" />
                                                        <span className="font-medium">Send Email</span>
                                                    </li>
                                                    
                                                    {/* Preview Invoice - Only show if PDF template was sent */}
                                                    {invoice.status?.toLowerCase() === 'sent' && invoice.pdfTemplateSent && (
                                                        <li 
                                                            className="px-4 py-2.5 hover:bg-purple-600 flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition-colors duration-150"
                                                            onClick={() => handleMenuItemClick('preview', invoice)}
                                                        >
                                                            <Eye className="text-purple-400 w-4 h-4" />
                                                            <span className="font-medium">Preview Invoice</span>
                                                        </li>
                                                    )}
                                                    
                                                    {/* Download Invoice - Only show if PDF template was sent */}
                                                    {invoice.status?.toLowerCase() === 'sent' && invoice.pdfTemplateSent && (
                                                        <li 
                                                            className="px-4 py-2.5 hover:bg-green-600 flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition-colors duration-150"
                                                            onClick={() => handleMenuItemClick('download', invoice)}
                                                        >
                                                            <Download className="text-green-400 w-4 h-4" />
                                                            <span className="font-medium">Download PDF</span>
                                                        </li>
                                                    )}
                                                    
                                                    <div className="h-px bg-gray-700 my-1"></div>
                                                    
                                                    {/* Edit Invoice */}
                                                    <li 
                                                        className="px-4 py-2.5 hover:bg-yellow-600 flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition-colors duration-150"
                                                        onClick={() => handleMenuItemClick('edit', invoice)}
                                                    >
                                                        <Edit className="text-yellow-400 w-4 h-4" />
                                                        <span className="font-medium">Edit Invoice</span>
                                                    </li>
                                                    
                                                    {/* Duplicate Invoice */}
                                                    <li 
                                                        className="px-4 py-2.5 hover:bg-cyan-600 flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition-colors duration-150"
                                                        onClick={() => handleMenuItemClick('duplicate', invoice)}
                                                    >
                                                        <Copy className="text-cyan-400 w-4 h-4" />
                                                        <span className="font-medium">Duplicate</span>
                                                    </li>
                                                    
                                                    {/* Start Recurring - Only show for non-recurring invoices */}
                                                    {!invoice.isRecurring && !invoice.parentInvoiceId && (
                                                        <li 
                                                            className="px-4 py-2.5 hover:bg-purple-600 flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition-colors duration-150"
                                                            onClick={() => handleMenuItemClick('startRecurring', invoice)}
                                                        >
                                                            <RotateCw className="text-purple-400 w-4 h-4" />
                                                            <span className="font-medium">Start Recurring</span>
                                                        </li>
                                                    )}
                                                    
                                                    {/* Mark as Overdue - Only show if payment management is enabled */}
                                                    {paymentManagementEnabled && (
                                                        <li 
                                                            className="px-4 py-2.5 hover:bg-orange-600 flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition-colors duration-150"
                                                            onClick={() => handleMenuItemClick('markOverdue', invoice)}
                                                        >
                                                            <AlertTriangle className="text-orange-400 w-4 h-4" />
                                                            <span className="font-medium">Mark as Overdue</span>
                                                        </li>
                                                    )}

                                                    {/* Stop Recurring - Only show for recurring invoices */}
                                                    {invoice.isRecurring && (
                                                        <li 
                                                            className="px-4 py-2.5 hover:bg-red-600 flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition-colors duration-150"
                                                            onClick={() => handleMenuItemClick('stopRecurring', invoice)}
                                                        >
                                                            <StopCircle className="text-red-400 w-4 h-4" />
                                                            <span className="font-medium">Stop Recurring</span>
                                                        </li>
                                                    )}
                                                    
                                                    <div className="h-px bg-gray-700 my-1"></div>
                                                    
                                                    {/* Delete Invoice */}
                                                    <li 
                                                        className="px-4 py-2.5 hover:bg-red-600 flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition-colors duration-150"
                                                        onClick={() => handleMenuItemClick('delete', invoice)}
                                                    >
                                                        <Trash2 className="text-red-400 w-4 h-4" />
                                                        <span className="font-medium">Delete Invoice</span>
                                                    </li>
                                                </ul>
                                            </DropdownPortal>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                                className="w-full sm:w-auto px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                            >
                                Previous
                            </button>
                            <p className="text-gray-400 font-medium">Page {currentPage} of {totalPages}</p>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                                className="w-full sm:w-auto px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {isModalOpen && (
                <SendInvoiceModal 
                    invoice={selectedInvoice} 
                    onClose={(shouldRefresh) => {
                        closeSendInvoiceModal();
                        if (shouldRefresh && setRefreshKey) {
                            setRefreshKey(prev => prev + 1);
                        }
                    }} 
                />
            )}
            
            <InvoicePreviewModal
                invoice={selectedInvoice}
                isOpen={isPreviewModalOpen}
                onClose={closePreviewModal}
            />
            
            <EditInvoiceModal
                invoice={selectedInvoice}
                isOpen={isEditModalOpen}
                onClose={closeEditInvoiceModal}
                onSuccess={() => {
                    if (setRefreshKey) {
                        setRefreshKey(prev => prev + 1);
                    }
                }}
            />
            
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setInvoiceToDelete(null);
                }}
                onConfirm={() => handleDeleteInvoice(invoiceToDelete)}
                invoiceData={invoiceToDelete}
            />

            {/* Stop Recurring Confirmation Modal */}
            <StopRecurringModal
                isOpen={isStopRecurringModalOpen}
                onClose={() => {
                    setIsStopRecurringModalOpen(false);
                    setInvoiceToStopRecurring(null);
                }}
                onConfirm={confirmStopRecurring}
                invoiceData={invoiceToStopRecurring}
            />

            {/* Recurring Configuration Modal */}
            {isRecurringModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-slideUp">
                        {/* Header with Gradient */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-5 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                        <RotateCw className="w-6 h-6" />
                                        Start Recurring Invoices
                                    </h2>
                                    <p className="text-purple-100 text-sm">Configure automation for <span className="font-semibold">{selectedInvoice?.client}</span></p>
                                </div>
                                <button
                                    onClick={() => setIsRecurringModalOpen(false)}
                                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <div className="p-6 space-y-5">
                            {/* Debug Info */}
                            
                            {/* Schedule Configuration Section */}
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-purple-400" />
                                    Schedule Configuration
                                </h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Frequency */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                            <RotateCw className="w-4 h-4 text-purple-400" />
                                            Frequency *
                                        </label>
                                        <select
                                            value={recurringConfig.frequency}
                                            onChange={(e) => setRecurringConfig({...recurringConfig, frequency: e.target.value})}
                                            className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                                        >
                                            <option value="every-20-seconds">⚡ Every 20 Seconds (Test)</option>
                                            <option value="every-minute">⚡ Every Minute (Test)</option>
                                            <option value="monthly-test">🧪 Monthly Test (2 min intervals)</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>

                                    {/* Max Recurrences */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                            <Infinity className="w-4 h-4 text-purple-400" />
                                            Max Occurrences
                                        </label>
                                        <input
                                            type="number"
                                            value={recurringConfig.maxRecurrences}
                                            onChange={(e) => setRecurringConfig({...recurringConfig, maxRecurrences: e.target.value})}
                                            placeholder="∞ Unlimited"
                                            className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm placeholder-gray-500"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                {/* Time Picker (for all non-test frequencies) */}
                                {!['every-20-seconds', 'every-minute', 'monthly-test'].includes(recurringConfig.frequency) && (
                                    <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/30">
                                        <label className="flex items-center gap-2 text-sm font-medium text-indigo-200 mb-2">
                                            <Clock className="w-4 h-4" />
                                            Send Time
                                        </label>
                                        <input
                                            type="time"
                                            value={recurringConfig.recurringTime}
                                            onChange={(e) => setRecurringConfig({...recurringConfig, recurringTime: e.target.value})}
                                            className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-indigo-500/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                        />
                                        <p className="text-xs text-indigo-300 mt-2 flex items-start gap-1">
                                            <span>💡</span>
                                            <span>Recurring invoices will be sent at this time (in your local timezone)</span>
                                        </p>
                                    </div>
                                )}

                                {/* Day of Month (only for monthly) */}
                                {(recurringConfig.frequency === 'monthly' || recurringConfig.frequency === 'monthly-test') && (
                                    <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                        <label className="block text-sm font-medium text-purple-200 mb-2">
                                            Day of Month
                                        </label>
                                        <select
                                            value={recurringConfig.dayOfMonth}
                                            onChange={(e) => setRecurringConfig({...recurringConfig, dayOfMonth: e.target.value})}
                                            className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-purple-500/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                                        >
                                            {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                                                <option key={day} value={day}>
                                                    {day === 1 ? '1st' : day === 2 ? '2nd' : day === 3 ? '3rd' : day === 21 ? '21st' : day === 22 ? '22nd' : day === 23 ? '23rd' : day === 31 ? '31st' : `${day}th`} of each month
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-purple-300 mt-2 flex items-start gap-1">
                                            <span></span>
                                            <span>For months with fewer days (e.g., February), invoice will be sent on the last day</span>
                                        </p>
                                    </div>
                                )}

                                {/* Day of Week (only for weekly) */}
                                {recurringConfig.frequency === 'weekly' && (
                                    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                        <label className="block text-sm font-medium text-blue-200 mb-2">
                                            ðŸ“ Day of Week
                                        </label>
                                        <select
                                            value={recurringConfig.dayOfWeek}
                                            onChange={(e) => setRecurringConfig({...recurringConfig, dayOfWeek: e.target.value})}
                                            className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-blue-500/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                        >
                                            <option value="0">Sunday</option>
                                            <option value="1">Monday</option>
                                            <option value="2">Tuesday</option>
                                            <option value="3">Wednesday</option>
                                            <option value="4">Thursday</option>
                                            <option value="5">Friday</option>
                                            <option value="6">Saturday</option>
                                        </select>
                                        <p className="text-xs text-blue-300 mt-2 flex items-start gap-1">
                                            <span>ðŸ’¡</span>
                                            <span>Invoice will be sent on this day every week</span>
                                        </p>
                                    </div>
                                )}

                                {/* Quarterly Options */}
                                {recurringConfig.frequency === 'quarterly' && (
                                    <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                                        <label className="block text-sm font-medium text-green-200 mb-2">
                                            ðŸ“ Quarter Schedule
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-green-300 mb-1">Month of Quarter</label>
                                                <select
                                                    value={recurringConfig.quarterMonth}
                                                    onChange={(e) => setRecurringConfig({...recurringConfig, quarterMonth: e.target.value})}
                                                    className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-green-500/50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                                                >
                                                    <option value="1">1st month of quarter</option>
                                                    <option value="2">2nd month of quarter</option>
                                                    <option value="3">3rd month of quarter</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-green-300 mb-1">Day of Month</label>
                                                <select
                                                    value={recurringConfig.dayOfMonth}
                                                    onChange={(e) => setRecurringConfig({...recurringConfig, dayOfMonth: e.target.value})}
                                                    className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-green-500/50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                                                >
                                                    {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                                                        <option key={day} value={day}>
                                                            {day === 1 ? '1st' : day === 2 ? '2nd' : day === 3 ? '3rd' : day === 21 ? '21st' : day === 22 ? '22nd' : day === 23 ? '23rd' : day === 31 ? '31st' : `${day}th`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <p className="text-xs text-green-300 mt-2 flex items-start gap-1">
                                            <span>ðŸ’¡</span>
                                            <span>Example: "1st month, 15th day" = Jan 15, Apr 15, Jul 15, Oct 15</span>
                                        </p>
                                    </div>
                                )}

                                {/* Yearly Options */}
                                {recurringConfig.frequency === 'yearly' && (
                                    <div className="mt-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                                        <label className="block text-sm font-medium text-orange-200 mb-2">
                                            ðŸ“ Yearly Schedule
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-orange-300 mb-1">Month</label>
                                                <select
                                                    value={recurringConfig.monthOfYear}
                                                    onChange={(e) => setRecurringConfig({...recurringConfig, monthOfYear: e.target.value})}
                                                    className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-orange-500/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                                                >
                                                    <option value="1">January</option>
                                                    <option value="2">February</option>
                                                    <option value="3">March</option>
                                                    <option value="4">April</option>
                                                    <option value="5">May</option>
                                                    <option value="6">June</option>
                                                    <option value="7">July</option>
                                                    <option value="8">August</option>
                                                    <option value="9">September</option>
                                                    <option value="10">October</option>
                                                    <option value="11">November</option>
                                                    <option value="12">December</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-orange-300 mb-1">Day</label>
                                                <select
                                                    value={recurringConfig.dayOfMonth}
                                                    onChange={(e) => setRecurringConfig({...recurringConfig, dayOfMonth: e.target.value})}
                                                    className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-orange-500/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                                                >
                                                    {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                                                        <option key={day} value={day}>
                                                            {day === 1 ? '1st' : day === 2 ? '2nd' : day === 3 ? '3rd' : day === 21 ? '21st' : day === 22 ? '22nd' : day === 23 ? '23rd' : day === 31 ? '31st' : `${day}th`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <p className="text-xs text-orange-300 mt-2 flex items-start gap-1">
                                            <span>ðŸ’¡</span>
                                            <span>Invoice will be sent on this date every year</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Email Settings Section */}
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-blue-400" />
                                    Email Settings
                                </h3>
                                
                                {/* Client Email */}
                                <div className="mb-4">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                        <Send className="w-4 h-4 text-blue-400" />
                                        Recipient Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={recurringConfig.clientEmail}
                                        onChange={(e) => setRecurringConfig({...recurringConfig, clientEmail: e.target.value})}
                                        placeholder="client@example.com"
                                        className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Email Template Selection */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                            <Mail className="w-4 h-4 text-purple-400" />
                                            Email Template
                                        </label>
                                        <select
                                            value={recurringConfig.emailTemplateId}
                                            onChange={(e) => setRecurringConfig({...recurringConfig, emailTemplateId: e.target.value})}
                                            className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                                        >
                                            <option value="">ðŸ“§ Default Message</option>
                                            {emailTemplates.map(template => (
                                                <option key={template.id} value={template.id}>
                                                    {template.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Invoice Template Selection */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                            <FileText className="w-4 h-4 text-purple-400" />
                                            PDF Template
                                        </label>
                                        <select
                                            value={recurringConfig.invoiceTemplateId}
                                            onChange={(e) => setRecurringConfig({...recurringConfig, invoiceTemplateId: e.target.value})}
                                            className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                                        >
                                            <option value="">No PDF</option>
                                            {invoiceTemplates.map(template => (
                                                <option key={template.id} value={template.id}>
                                                    {template.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Auto Send Email Toggle */}
                                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30 flex items-center justify-between">
                                    <div>
                                        <label className="block text-sm font-semibold text-blue-200">Auto-Send Email</label>
                                        <p className="text-xs text-blue-300 mt-0.5">Automatically email invoice to client when generated</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={recurringConfig.autoSendEmail}
                                            onChange={(e) => setRecurringConfig({...recurringConfig, autoSendEmail: e.target.checked})}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-blue-500"></div>
                                    </label>
                                </div>
                            </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-900 border-t border-gray-700 p-5 flex justify-end space-x-3 flex-shrink-0">
                            <button
                                onClick={() => setIsRecurringModalOpen(false)}
                                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRecurringConfig}
                                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-purple-500/50 flex items-center gap-2"
                            >
                                <RotateCw className="w-4 h-4" />
                                Start Recurring
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default RecentInvoices;



