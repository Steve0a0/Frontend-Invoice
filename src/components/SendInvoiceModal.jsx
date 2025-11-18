import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaPaperPlane, FaTimes, FaFileAlt, FaPaypal, FaCcStripe, FaEnvelope, FaDollarSign } from "react-icons/fa";
import toast from "react-hot-toast";
import ChooseTemplateModal from "./chooseTemplateModal"; 
import { usePaymentManagement } from "../context/PaymentContext";
import { API_BASE_URL } from '../config/api';

function SendInvoiceModal({ invoice, onClose, isNewInvoice = false }) {
    if (!invoice) return null;

    const [searchParams, setSearchParams] = useSearchParams();

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const [recipientEmail, setRecipientEmail] = useState("");
    const [emailSubject, setEmailSubject] = useState("");
    const [customEmail, setCustomEmail] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState("Custom Email"); // Email Template
    const [selectedInvoiceTemplate, setSelectedInvoiceTemplate] = useState(null); // Invoice Template
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(searchParams.get('templateModal') === 'true');
    const [templates, setTemplates] = useState([]);
    const [paymentLink, setPaymentLink] = useState("");
    const [paypalPaymentLink, setPaypalPaymentLink] = useState("");
    const [stripePaymentLink, setStripePaymentLink] = useState("");
    const { paymentManagementEnabled } = usePaymentManagement();
    const [createdInvoiceId, setCreatedInvoiceId] = useState(invoice.id || null);
    const [isSending, setIsSending] = useState(false);
    
    // Helper functions to manage template modal URL state
    const openTemplateModal = () => {
        setIsTemplateModalOpen(true);
        setSearchParams({ templateModal: 'true' });
    };

    const closeTemplateModal = () => {
        setIsTemplateModalOpen(false);
        setSearchParams({});
    };

    // Fetch email templates
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/api/templates`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setTemplates(data);
                } else {
                    throw new Error("Failed to fetch templates");
                }
            } catch (err) {
                console.error("Error fetching templates:", err.message);
            }
        };

        fetchTemplates();
    }, []);

    // Handle email template selection
    const handleEmailTemplateChange = (e) => {
        const selected = e.target.value;
        setSelectedTemplate(selected);
    
        if (selected !== "Custom Email") {
            const template = templates.find((t) => t.name === selected);
            if (template) {
                // âœ… Don't replace placeholders here - let the backend handle it
                // Just pass the template content as-is with {{}} placeholders
                setEmailSubject(template.subject || "");
                setCustomEmail(template.content || "");

            }
        } else {
            setEmailSubject("");
            setCustomEmail("");
        }
    };
    
    const handleSendEmail = async () => {
        if (!recipientEmail || !emailSubject || !customEmail) {
            toast.error("Please fill all required fields.");
            return;
        }
        
        // Validate invoice data if this is a new invoice
        if (isNewInvoice && !invoice) {
            toast.error("Invoice data is missing. Please try again.");
            return;
        }
    
        setIsSending(true);
        try {
            const token = localStorage.getItem("token");
            let invoiceId = createdInvoiceId;


            // If this is a new invoice (not created yet), create it first with "Sent" status
            if (isNewInvoice && !createdInvoiceId) {
                
                const invoiceDataWithStatus = {
                    ...invoice,
                    status: "Sent" // Set status to "Sent" immediately since we're sending email
                };
                
                const createResponse = await fetch(`${API_BASE_URL}/api/invoices`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(invoiceDataWithStatus),
                });


                if (!createResponse.ok) {
                    const error = await createResponse.json();
                    console.error("âŒ Error creating invoice:", error);
                    toast.error(`Error creating invoice: ${error.message}`);
                    return;
                }

                const newInvoice = await createResponse.json();
                
                // Extract invoice from response (backend returns { invoice, tasks })
                invoiceId = newInvoice.invoice?.id || newInvoice.id;
                setCreatedInvoiceId(invoiceId);
                
                if (!invoiceId) {
                    console.error("âŒ No invoice ID in response:", newInvoice);
                    toast.error("Error: Invoice was created but ID is missing. Please try again.");
                    return;
                }
                
            } else {
            }

            // Check if email requires PayPal or Stripe link placeholders
            const needsPaypalLink = customEmail.includes("{{paypalPaymentLink}}");
            const needsStripeLink = customEmail.includes("{{stripePaymentLink}}");

            // Generate PayPal and Stripe links if placeholders exist
            let generatedPaypalLink = paypalPaymentLink;
            let generatedStripeLink = stripePaymentLink;
            if (needsPaypalLink && !paypalPaymentLink) {
                const paypalResponse = await fetch(`${API_BASE_URL}/api/paypal/generate-payment-link`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ invoiceId }),
                });

                const paypalData = await paypalResponse.json();
                if (paypalResponse.ok) {
                    generatedPaypalLink = paypalData.paymentLink;
                    setPaypalPaymentLink(paypalData.paymentLink);
                }
            }

            if (needsStripeLink && !stripePaymentLink) {
                const stripeResponse = await fetch(`${API_BASE_URL}/api/stripe/generate-payment-link`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ invoiceId }),
                });

                const stripeData = await stripeResponse.json();
                if (stripeResponse.ok) {
                    generatedStripeLink = stripeData.paymentLink;
                    setStripePaymentLink(stripeData.paymentLink);
                }
            }

            // Replace placeholders with actual links
            let updatedMessage = customEmail;
            if (needsPaypalLink && generatedPaypalLink) {
                updatedMessage = updatedMessage.replace("{{paypalPaymentLink}}", generatedPaypalLink);
            }
            if (needsStripeLink && generatedStripeLink) {
                updatedMessage = updatedMessage.replace("{{stripePaymentLink}}", generatedStripeLink);
            }

            // Validate required fields before sending
            if (!recipientEmail || !emailSubject || !customEmail || !invoiceId) {
                console.error("Missing required fields:", {
                    recipientEmail,
                    emailSubject,
                    customEmail,
                    invoiceId
                });
                toast.error("Please fill in all required fields (email, subject, message).");
                return;
            }

           
    
            const response = await fetch(`${API_BASE_URL}/api/send-email`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    recipientEmail,
                    subject: emailSubject,
                    message: customEmail,
                    invoiceId,
                    templateHTML: selectedInvoiceTemplate?.templateHTML || null, // âœ… Optional template
                }),
            });
    
            const result = await response.json();
    
            if (response.ok) {
                // Update invoice with status and template IDs
                if (!isNewInvoice || createdInvoiceId) {
                    await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
                        method: "PATCH",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ 
                            status: "Sent",
                            // Save template IDs for recurring invoice setup
                            emailTemplateId: selectedTemplate !== "Custom Email" ? 
                                templates.find(t => t.name === selectedTemplate)?.id : null,
                            invoiceTemplateId: selectedInvoiceTemplate?.id || null,
                            // Save client email for recurring setup
                            clientEmail: recipientEmail
                        }),
                    });
                }

                toast.success("Email sent successfully!");
                
                // Notify parent that invoice was sent - always trigger refresh
                if (typeof onClose === 'function') {
                    onClose(true); // Pass true to trigger refresh
                }
            } else {
                toast.error(`Error sending email: ${result.error}`);
                console.error(result);
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("An error occurred while sending the email.");
        } finally {
            setIsSending(false);
        }
    };
    

    // Handle invoice template selection from modal
    const handleInvoiceTemplateSelect = async (template) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/invoicetemplates/${template.id}/html`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (!response.ok) {
                throw new Error("Failed to fetch template HTML");
            }
    
            const data = await response.json();
    
    
            setSelectedInvoiceTemplate({
                id: data.id,
                title: data.title,
                templateHTML: data.templateHTML,
                pdfUrl: data.pdfUrl,
            });
        } catch (error) {
            console.error("Error fetching template HTML:", error.message);
            toast.error("Failed to load template. Please try again.");
        } finally {
            closeTemplateModal();
        }
    };
    
    // Handle viewing the invoice template as PDF preview
    const handleViewPDF = async () => {
        // Only show preview if a template is selected and has HTML
        if (!selectedInvoiceTemplate || !selectedInvoiceTemplate.templateHTML) {
            toast.error("No template selected. Please choose a template first.");
            return;
        }
        
        try {
            // Fetch user data for company info and bank details
            const token = localStorage.getItem("token");
            const userResponse = await fetch(`${API_BASE_URL}/api/user/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            if (!userResponse.ok) {
                throw new Error("Failed to fetch user data");
            }
            
            const userData = await userResponse.json();
            
            // Get currency symbol
            const getCurrencySymbol = (currency) => {
                const symbols = {
                    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
                    'AUD': 'A$', 'CAD': 'C$', 'CHF': 'Fr', 'CNY': '¥',
                    'INR': '₹', 'MXN': '$', 'BRL': 'R$', 'ZAR': 'R',
                    'NZD': 'NZ$', 'SGD': 'S$', 'HKD': 'HK$', 'SEK': 'kr',
                    'NOK': 'kr', 'DKK': 'kr', 'PLN': 'zł', 'THB': '฿',
                    'IDR': 'Rp', 'MYR': 'RM', 'PHP': '₱', 'TRY': '₺',
                    'RUB': '₽', 'KRW': '₩', 'VND': '₫', 'AED': 'د.إ',
                    'SAR': '﷼', 'EGP': 'E£', 'NGN': '₦', 'KES': 'KSh'
                };
                return symbols[currency] || currency;
            };
            
            const currencySymbol = getCurrencySymbol(invoice.currency || 'USD');
            
            // Prepare items/tasks HTML
            let itemsHTML = '';
            if (invoice.items && invoice.items.length > 0) {
                invoice.items.forEach((item, index) => {
                    const itemStructure = item.structure || 'simple';
                    let itemRow = `<tr><td>${index + 1}</td><td>${item.description || ''}</td>`;
                    
                    if (itemStructure === 'hourly') {
                        itemRow += `<td class="text-center">${item.hours || 0}</td>`;
                        itemRow += `<td class="text-right">${currencySymbol}${(item.rate || 0).toFixed(2)}</td>`;
                    } else if (itemStructure === 'fixed_price') {
                        itemRow += `<td class="text-center">1</td>`;
                        itemRow += `<td class="text-right">${currencySymbol}${(item.amount || 0).toFixed(2)}</td>`;
                    } else if (itemStructure === 'daily_rate') {
                        itemRow += `<td class="text-center">${item.days || 0}</td>`;
                        itemRow += `<td class="text-right">${currencySymbol}${(item.unitPrice || 0).toFixed(2)}</td>`;
                    } else {
                        itemRow += `<td class="text-center">${item.quantity || 0}</td>`;
                        itemRow += `<td class="text-right">${currencySymbol}${(item.unitPrice || 0).toFixed(2)}</td>`;
                    }
                    
                    itemRow += `<td class="text-right">${currencySymbol}${(item.total || 0).toFixed(2)}</td></tr>`;
                    itemsHTML += itemRow;
                });
            }
            
            // Company logo as base64
            let companyLogoBase64 = '';
            if (userData.companyLogo) {
                try {
                    const logoResponse = await fetch(`${API_BASE_URL}${userData.companyLogo}`);
                    const logoBlob = await logoResponse.blob();
                    const reader = new FileReader();
                    companyLogoBase64 = await new Promise((resolve) => {
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(logoBlob);
                    });
                } catch (error) {
                    console.error("Error loading company logo:", error);
                }
            }
            
            // Populate template with actual invoice data
            let populatedHTML = selectedInvoiceTemplate.templateHTML
                .replace(/\{\{company_name\}\}/g, userData.companyName || 'Your Company')
                .replace(/\{\{company_address\}\}/g, userData.email || 'Your Address')
                .replace(/\{\{userName\}\}/g, userData.name || 'User')
                .replace(/\{\{client_name\}\}/g, invoice.client || 'Client Name')
                .replace(/\{\{client_address\}\}/g, invoice.clientAddress || 'Client Address')
                .replace(/\{\{invoice_number\}\}/g, invoice.invoiceNumber || invoice.id || 'INV-0000')
                .replace(/\{\{invoice_date\}\}/g, invoice.date ? new Date(invoice.date).toLocaleDateString() : new Date().toLocaleDateString())
                .replace(/\{\{due_date\}\}/g, invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A')
                .replace(/\{\{currency\}\}/g, invoice.currency || 'USD')
                .replace(/\{\{currencySymbol\}\}/g, currencySymbol)
                .replace(/\{\{totalAmount\}\}/g, `${currencySymbol}${(invoice.totalAmount || 0).toFixed(2)}`)
                .replace(/\{\{work_type\}\}/g, invoice.workType || 'Services')
                .replace(/\{\{notes\}\}/g, invoice.notes || '')
                // Bank details
                .replace(/\{\{accountHolderName\}\}/g, userData.accountHolderName || '')
                .replace(/\{\{bankName\}\}/g, userData.bankName || '')
                .replace(/\{\{accountName\}\}/g, userData.accountName || '')
                .replace(/\{\{accountNumber\}\}/g, userData.accountNumber || '')
                .replace(/\{\{iban\}\}/g, userData.iban || '')
                .replace(/\{\{bic\}\}/g, userData.bic || '')
                .replace(/\{\{sortCode\}\}/g, userData.sortCode || '')
                .replace(/\{\{swiftCode\}\}/g, userData.swiftCode || '')
                .replace(/\{\{routingNumber\}\}/g, userData.routingNumber || '')
                .replace(/\{\{bankAddress\}\}/g, userData.bankAddress || '')
                .replace(/\{\{additionalInfo\}\}/g, userData.additionalInfo || '')
                .replace(/\{\{paypalPaymentLink\}\}/g, '')
                .replace(/\{\{stripePaymentLink\}\}/g, '');
            
            // Replace company logo
            if (companyLogoBase64) {
                populatedHTML = populatedHTML.replace(/\{\{#if company_logo\}\}[\s\S]*?\{\{\/if\}\}/g, 
                    `<img src="${companyLogoBase64}" alt="Company Logo" style="max-height: 80px; max-width: 200px; object-fit: contain;">`);
            } else {
                populatedHTML = populatedHTML.replace(/\{\{#if company_logo\}\}[\s\S]*?\{\{\/if\}\}/g, '');
            }
            
            // Replace items section
            const itemsPattern = /\{\{#each tasks\}\}[\s\S]*?\{\{\/each\}\}/g;
            populatedHTML = populatedHTML.replace(itemsPattern, itemsHTML);
            
            // Remove any remaining Handlebars conditionals
            populatedHTML = populatedHTML
                .replace(/\{\{#if [^}]+\}\}/g, '')
                .replace(/\{\{\/if\}\}/g, '')
                .replace(/\{\{#unless [^}]+\}\}/g, '')
                .replace(/\{\{\/unless\}\}/g, '');
            
            // Create a new window to display the populated HTML
            const previewWindow = window.open('', '_blank', 'width=800,height=600');
            if (previewWindow) {
                previewWindow.document.write(populatedHTML);
                previewWindow.document.close();
            }
        } catch (error) {
            console.error("Error generating preview:", error);
            toast.error("Failed to generate preview. Please try again.");
        }
    };
    
    
    
    
    const handleDeleteTemplate = () => {
        setSelectedInvoiceTemplate(null);
    };

    

    const generatePaymentLink = async (provider) => {
        if (!invoice) return toast.error("Invoice details are missing!");

        try {
            const token = localStorage.getItem("token");
            const url = `${API_BASE_URL}/api/${provider}/generate-payment-link`; // Dynamic endpoint

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ invoiceId: invoice.id }),
            });

            const result = await response.json();

            if (response.ok && result.paymentLink) {
                if (provider === "paypal") {
                    setPaypalPaymentLink(result.paymentLink);
                } else if (provider === "stripe") {
                    setStripePaymentLink(result.paymentLink);
                }

                // Append payment link to email body
                setCustomEmail((prevEmail) => `${prevEmail}\n\nPayment Link: ${result.paymentLink}`);
            } else {
                throw new Error(result.error || "Failed to generate payment link");
            }
        } catch (error) {
            console.error(`Error generating ${provider} payment link:`, error.message);
            toast.error(`Failed to generate ${provider} payment link. Please check your payment settings.`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeIn">
            <div className="bg-gray-800 text-white rounded-2xl shadow-2xl w-full max-w-3xl relative max-h-[95vh] overflow-hidden border border-gray-700 animate-slideUp flex flex-col">
                
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <FaPaperPlane className="text-purple-200" />
                            Send Invoice
                        </h2>
                        <div className="flex items-center gap-4 mt-1 text-purple-100 text-sm">
                            <span>Invoice #{createdInvoiceId || invoice.id || 'New'}</span>
                            <span>•</span>
                            <span>{invoice.client}</span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <div className="p-6 space-y-5">
                        {/* Email Configuration Section */}
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <FaEnvelope className="text-blue-400" />
                                Email Configuration
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Recipient Email *
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                                        placeholder="client@example.com"
                                        value={recipientEmail}
                                        onChange={(e) => setRecipientEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Email Template
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                                        value={selectedTemplate}
                                        onChange={handleEmailTemplateChange}
                                    >
                                        <option value="Custom Email">Custom Email</option>
                                        {templates.length > 0 ? (
                                            templates.map((template) => (
                                                <option key={template.id} value={template.name}>
                                                    {template.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled>Loading templates...</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Email Subject */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Subject *
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                                    placeholder="Invoice for services rendered"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                />
                            </div>

                            {/* Custom Email Content */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Message *
                                </label>
                                <textarea
                                    className="w-full px-3 py-2.5 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm resize-none"
                                    placeholder="Dear {{clientName}}, Please find attached invoice #{{invoiceId}} for {{totalAmount}}..."
                                    value={customEmail}
                                    onChange={(e) => setCustomEmail(e.target.value)}
                                    rows={4}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Use placeholders: &#123;clientName&#125;, &#123;invoiceId&#125;, &#123;totalAmount&#125;
                                </p>
                            </div>
                        </div>

                        {/* Invoice PDF Section */}
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <FaFileAlt className="text-green-400" />
                                Invoice PDF Attachment
                                <span className="text-xs text-gray-500 font-normal ml-2">(Optional)</span>
                            </h3>
                            
                            {selectedInvoiceTemplate && selectedInvoiceTemplate.templateHTML ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                                <FaFileAlt className="text-green-400 text-lg" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">
                                                    {selectedInvoiceTemplate.title}.pdf
                                                </p>
                                                <p className="text-gray-400 text-xs">Ready to send</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleViewPDF}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                                            >
                                                Preview
                                            </button>
                                            <button
                                                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-sm font-medium transition-all border border-red-600/50"
                                                onClick={handleDeleteTemplate}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <button
                                        className="w-full p-4 bg-gray-800 hover:bg-gray-750 border-2 border-dashed border-gray-600 hover:border-purple-500 rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-all duration-300"
                                        onClick={openTemplateModal}
                                    >
                                        <FaFileAlt className="text-xl" />
                                        <span className="font-medium">Choose Template & Generate PDF</span>
                                    </button>
                                    <p className="text-xs text-gray-500 text-center">
                                        You can send the email without a PDF attachment if you prefer
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        {/* Payment Options - Only show if payment management is enabled */}
                        {paymentManagementEnabled && (
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <FaDollarSign className="text-yellow-400" />
                                    Payment Options
                                </h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* PayPal Button */}
                                    <button 
                                        className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg flex items-center justify-center gap-2 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                        onClick={() => generatePaymentLink("paypal")}
                                    >
                                        <FaPaypal className="text-xl" />
                                        <span>Add PayPal Link</span>
                                    </button>

                                    {/* Stripe Button */}
                                    <button 
                                        className="p-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg flex items-center justify-center gap-2 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                        onClick={() => generatePaymentLink("stripe")}
                                    >
                                        <FaCcStripe className="text-xl" />
                                        <span>Add Stripe Link</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-900/80 px-6 py-4 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 flex-shrink-0">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 order-2 sm:order-1"
                    >
                        Cancel
                    </button>
                    
                    <button 
                        type="button"
                        onClick={handleSendEmail}
                        disabled={isSending}
                        className={`px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 order-1 sm:order-2 ${isSending ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSending ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                            </>
                        ) : (
                            <>
                                <FaPaperPlane />
                                Send Email
                            </>
                        )}
                    </button>
                </div>

                {/* Custom Scrollbar & Animations */}
                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(31, 41, 55, 0.5);
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(147, 51, 234, 0.5);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(147, 51, 234, 0.8);
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

                {/* Template Selection Modal */}
                {isTemplateModalOpen && (
                    <ChooseTemplateModal 
                        onClose={closeTemplateModal} 
                        onSelectTemplate={handleInvoiceTemplateSelect} 
                    />
                )}
            </div>
        </div>
    );
}

export default SendInvoiceModal;


