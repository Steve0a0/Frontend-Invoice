import { useEffect } from "react";
import { FaExclamationTriangle, FaTimes, FaStopCircle } from "react-icons/fa";

const StopRecurringModal = ({ isOpen, onClose, onConfirm, invoiceData }) => {
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
                            <div className="absolute inset-0 bg-orange-500 rounded-full opacity-20 animate-ping"></div>
                            <div className="relative bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-full shadow-lg shadow-orange-500/50">
                                <FaStopCircle className="text-white text-lg" />
                            </div>
                        </div>
                        
                        <div>
                            <h2 className="text-lg font-bold text-white">Stop Recurring?</h2>
                            <p className="text-gray-400 text-xs mt-0.5">This will stop all future invoices</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-5 py-4 bg-gray-900">
                    
                    {/* Invoice Details */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-lg p-3 mb-3 border border-gray-700/50">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Client</span>
                                <span className="text-white font-semibold">{invoiceData?.client}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Frequency</span>
                                <span className="text-purple-400 font-bold capitalize">
                                    {invoiceData?.recurringFrequency?.replace(/-/g, ' ')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Invoices Sent</span>
                                <span className="text-white font-semibold">
                                    {invoiceData?.recurringCount || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Warning Box */}
                    <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-l-3 border-orange-500 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                            <FaExclamationTriangle className="text-orange-400 text-sm mt-0.5 flex-shrink-0" />
                            <p className="text-orange-200 text-xs leading-relaxed">
                                No more invoices will be automatically generated or sent to this client.
                            </p>
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
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 text-white text-sm rounded-lg font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-1.5"
                        >
                            <FaStopCircle className="w-3.5 h-3.5" />
                            Stop Recurring
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StopRecurringModal;
