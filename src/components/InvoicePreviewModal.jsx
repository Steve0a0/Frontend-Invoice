import { useEffect, useState } from "react";
import { FaTimes, FaDownload, FaPrint, FaFileInvoiceDollar, FaExpand, FaCompress } from "react-icons/fa";
import { API_BASE_URL } from '../config/api';

export default function InvoicePreviewModal({ invoice, isOpen, onClose }) {
    const [previewHtml, setPreviewHtml] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoom, setZoom] = useState(100);

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

    useEffect(() => {
        if (isOpen && invoice) {
            fetchInvoicePreview();
        }
    }, [isOpen, invoice]);

    const fetchInvoicePreview = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/invoices/${invoice.id}/preview`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            
            if (response.ok) {
                const html = await response.text();
                setPreviewHtml(html);
            } else {
                const errorText = await response.text();
                console.error('Preview error response: ', errorText);
                setError(`Failed to load invoice preview: ${response.status}`);
            }
        } catch (error) {
            console.error("Error fetching invoice preview: ", error);
            setError(`An error occurred while loading the preview: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
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
                alert("Failed to download invoice");
            }
        } catch (error) {
            console.error("Error downloading invoice:", error);
            alert("An error occurred while downloading the invoice");
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <style>{`
                .invoice-preview-content {
                    color: #000 !important;
                }
                .invoice-preview-content * {
                    box-sizing: border-box;
                }
                
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    .invoice-preview-wrapper {
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                }

                /* Smooth zoom transitions */
                .invoice-preview-wrapper {
                    transition: transform 0.2s ease-in-out;
                }
            `}</style>
            
            {/* Full Screen Modal with Modern Design */}
            <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/30 z-[9999] flex flex-col">
                
                {/* Modern Top Bar with Gradient */}
                <div className="no-print bg-gradient-to-r from-gray-900 to-gray-800 border-b border-purple-500/20 px-6 py-4 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                        {/* Back Button */}
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all font-medium group"
                        >
                            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Back</span>
                        </button>
                        
                        <div className="h-8 w-px bg-gray-700"></div>
                        
                        {/* Invoice Info */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                                <FaFileInvoiceDollar className="text-white w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Invoice {invoice?.invoiceNumber || `#${invoice?.id?.slice(0, 8)}`}
                                    <span className="px-2 py-0.5  text-green-400 text-xs rounded-full ">
                                        {invoice?.status || 'Draft'}
                                    </span>
                                </h3>
                                <p className="text-sm text-gray-400">Client: {invoice?.client}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Zoom Controls */}
                        {/* {!isLoading && !error && previewHtml && (
                            <div className="flex items-center gap-2 mr-2 bg-gray-800 rounded-lg px-3 py-1.5 border border-gray-700">
                                <button
                                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                                    className="text-gray-400 hover:text-white transition-colors p-1"
                                    title="Zoom out"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                </button>
                                <span className="text-sm text-gray-300 font-medium min-w-[50px] text-center">
                                    {zoom}%
                                </span>
                                <button
                                    onClick={() => setZoom(Math.min(150, zoom + 10))}
                                    className="text-gray-400 hover:text-white transition-colors p-1"
                                    title="Zoom in"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                                <div className="h-5 w-px bg-gray-700 mx-1"></div>
                                <button
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="text-gray-400 hover:text-white transition-colors p-1"
                                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                                >
                                    {isFullscreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
                                </button>
                            </div>
                        )} */}

                        {/* Print Button */}
                       <div className="flex items-center gap-4">
  <button
    onClick={() => window.print()}
    disabled={isLoading || error}
    className="flex items-center gap-2 px-4 py-2.5 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <FaPrint className="w-4 h-4" />
    <span className="hidden sm:inline">Print</span>
  </button>

  <button
    onClick={handleDownload}
    disabled={isLoading || error}
    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r text-white rounded-lg transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <FaDownload className="w-4 h-4" />
    <span>Download PDF</span>
  </button>
</div>


                    </div>
                </div>

                {/* Preview Area with Modern Background */}
                <div className={`flex-1 overflow-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 custom-scrollbar ${
                    isFullscreen ? 'p-0' : 'px-6'
                }`}>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <FaFileInvoiceDollar className="text-purple-500 w-8 h-8 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-gray-300 text-lg mt-6 font-medium">Loading invoice preview...</p>
                            <p className="text-gray-500 text-sm mt-2">Please wait while we render your invoice</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="bg-red-500/10 p-6 rounded-2xl mb-4 border border-red-500/30">
                                <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-red-400 text-lg font-semibold mb-2">Failed to Load Preview</p>
                            <p className="text-gray-400 text-sm mb-6 max-w-md text-center">{error}</p>
                            <button
                                onClick={fetchInvoicePreview}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all font-semibold flex items-center gap-2 shadow-lg hover:shadow-purple-500/50"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Retry
                            </button>
                        </div>
                    ) : previewHtml ? (
                        <div className="flex items-start justify-center min-h-full pt-16 pb-12">
                            <div 
                                className={`invoice-preview-wrapper bg-white shadow-2xl ${
                                    isFullscreen ? 'w-full h-full' : 'rounded-lg'
                                }`}
                                style={{ 
                                    width: isFullscreen ? '100%' : '210mm',
                                    minHeight: isFullscreen ? '100%' : '297mm',
                                    transform: `scale(${zoom / 100})`,
                                    transformOrigin: 'top center',
                                    marginBottom: zoom > 100 ? `${(zoom - 100) * 3}px` : '0'
                                }}
                            >
                                <div
                                    className="invoice-preview-content"
                                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}


