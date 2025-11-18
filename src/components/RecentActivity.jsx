import { useEffect, useState } from "react";
import { FaCheckCircle, FaFileInvoice, FaEnvelope, FaExclamationCircle, FaRedo, FaEdit, FaTrash, FaDownload, FaStopCircle, FaCopy, FaPaperPlane, FaCog, FaUniversity, FaUser, FaFileExport, FaTasks, FaEye, FaCreditCard, FaLink } from "react-icons/fa";
import { API_BASE_URL } from '../config/api';

export default function RecentActivity({ paymentManagementEnabled = true, refreshKey = 0 }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/api/recent-activities`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (!response.ok) {
                    throw new Error("Failed to fetch activities");
                }
                const data = await response.json();
                setActivities(data);
            } catch (error) {
                console.error("Error fetching activities:", error);
                setActivities([]);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [refreshKey]);

    // Filter out payment-related activities when payment management is disabled
    const filteredActivities = paymentManagementEnabled 
        ? activities 
        : activities.filter(activity => 
            activity.type !== "payment" && activity.type !== "failed_payment"
          );

    const getActivityIcon = (type) => {
        switch(type) {
            case "payment":
            case "payment_received":
                return <FaCheckCircle />;
            case "invoice_created":
                return <FaFileInvoice />;
            case "invoice_deleted":
                return <FaTrash />;
            case "invoice_duplicated":
                return <FaCopy />;
            case "invoice_downloaded":
                return <FaDownload />;
            case "invoice_previewed":
                return <FaEye />;
            case "invoice_updated":
                return <FaEdit />;
            case "email_sent":
                return <FaEnvelope />;
            case "email_failed":
                return <FaExclamationCircle />;
            case "email_template_created":
            case "email_template_updated":
            case "email_template_deleted":
                return <FaEnvelope />;
            case "recurring_created":
            case "recurring_started":
                return <FaRedo />;
            case "recurring_stopped":
                return <FaStopCircle />;
            case "recurring_auto_generated":
                return <FaRedo />;
            case "recurring_email_sent":
                return <FaPaperPlane />;
            case "recurring_failed":
                return <FaExclamationCircle />;
            case "payment_failed":
            case "failed_payment":
                return <FaExclamationCircle />;
            case "payment_link_generated":
                return <FaLink />;
            case "settings_updated":
            case "email_settings_updated":
                return <FaCog />;
            case "bank_details_updated":
                return <FaUniversity />;
            case "profile_updated":
                return <FaUser />;
            case "bulk_action_completed":
                return <FaTasks />;
            case "export_completed":
                return <FaFileExport />;
            default:
                return <FaFileInvoice />;
        }
    };

    const getActivityColor = (type) => {
        switch(type) {
            case "payment":
            case "payment_received":
                return "bg-green-500/20 text-green-400";
            case "invoice_created":
                return "bg-blue-500/20 text-blue-400";
            case "invoice_deleted":
                return "bg-red-500/20 text-red-400";
            case "invoice_duplicated":
                return "bg-purple-500/20 text-purple-400";
            case "invoice_downloaded":
                return "bg-indigo-500/20 text-indigo-400";
            case "invoice_previewed":
                return "bg-sky-500/20 text-sky-400";
            case "invoice_updated":
                return "bg-yellow-500/20 text-yellow-400";
            case "email_sent":
                return "bg-purple-500/20 text-purple-400";
            case "email_failed":
                return "bg-red-500/20 text-red-400";
            case "email_template_created":
                return "bg-blue-500/20 text-blue-400";
            case "email_template_updated":
                return "bg-yellow-500/20 text-yellow-400";
            case "email_template_deleted":
                return "bg-red-500/20 text-red-400";
            case "recurring_created":
            case "recurring_started":
                return "bg-cyan-500/20 text-cyan-400";
            case "recurring_stopped":
                return "bg-orange-500/20 text-orange-400";
            case "recurring_auto_generated":
                return "bg-teal-500/20 text-teal-400";
            case "recurring_email_sent":
                return "bg-violet-500/20 text-violet-400";
            case "recurring_failed":
                return "bg-red-500/20 text-red-400";
            case "payment_failed":
            case "failed_payment":
                return "bg-red-500/20 text-red-400";
            case "payment_link_generated":
                return "bg-emerald-500/20 text-emerald-400";
            case "settings_updated":
            case "email_settings_updated":
                return "bg-slate-500/20 text-slate-400";
            case "bank_details_updated":
                return "bg-amber-500/20 text-amber-400";
            case "profile_updated":
                return "bg-pink-500/20 text-pink-400";
            case "bulk_action_completed":
                return "bg-lime-500/20 text-lime-400";
            case "export_completed":
                return "bg-fuchsia-500/20 text-fuchsia-400";
            default:
                return "bg-gray-500/20 text-gray-400";
        }
    };

    const getRelativeTime = (date) => {
        const now = new Date();
        const activityDate = new Date(date);
        const diffMs = now - activityDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return activityDate.toLocaleDateString();
    };

    return (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-xl border border-gray-700 flex flex-col">
            {/* Header */}
            <div className="mb-4 flex-shrink-0">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Recent Activity</h3>
                <p className="text-gray-400 text-sm">Track the latest updates</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8 flex-grow">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8 flex-grow">
                    <div className="bg-gray-700/30 p-6 rounded-full mb-4">
                        <FaFileInvoice className="text-4xl text-gray-500" />
                    </div>
                    <p className="text-gray-400 font-medium mb-2">No recent activity</p>
                    <p className="text-gray-500 text-sm">Activity will appear here as you create and manage invoices</p>
                </div>
            ) : (
                <ul className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                    {filteredActivities.map((activity, index) => (
                        <li key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-700/30 transition-all duration-200 group">
                            <div className={`text-xl mt-1 p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                                {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                                <p className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors">
                                    {activity.text}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                    {getRelativeTime(activity.date)}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(55, 65, 81, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(75, 85, 99, 0.8);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(107, 114, 128, 1);
                }
            `}</style>
        </div>
    );
}


