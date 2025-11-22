import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { FaDollarSign, FaClock, FaFileInvoice, FaChartLine, FaPlus } from "react-icons/fa";
import { TrendingUp, TrendingDown } from "lucide-react";
import NewInvoiceModal from "./NewInvoiceModal";
import { useNavigate } from "react-router-dom";
import RecentInvoices from "./RecentInvoices";
import RecentActivity from "./RecentActivity";
import RecurringEmailsCard from "./RecurringEmailsCard";
import { usePaymentManagement } from "../context/PaymentContext";
import { API_BASE_URL } from '../config/api';
import toast from 'react-hot-toast';
import { BANK_REGION_CONFIG, detectBankRegion } from '../constants/bankRegions';

export default function InvoicesDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [user, setUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(searchParams.get('newInvoice') === 'true');
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [dropdownIndex, setDropdownIndex] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);
    const { paymentManagementEnabled } = usePaymentManagement();
    const [setupData, setSetupData] = useState({
        loading: true,
        emailMissing: false,
        bankMissing: false,
        emailSettings: {},
        bankDetails: {},
    });
    const [setupModalOpen, setSetupModalOpen] = useState(false);
    const [setupSnoozed, setSetupSnoozed] = useState(false);

    const evaluateBankDetails = useCallback((details = {}) => {
        if (!details) return true;
        const hasGeneral = Boolean((details.bankName && details.accountName) || details.accountHolderName);
        const hasEU = Boolean(details.iban && details.bic);
        const hasUK = Boolean(details.sortCode && details.accountNumber);
        const hasUS = Boolean(details.routingNumber && details.accountNumber);
        return !(hasGeneral && (hasEU || hasUK || hasUS));
    }, []);

    const refreshSetupStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const [emailRes, profileRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/email-settings`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE_URL}/api/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            const emailSettings = emailRes.ok ? await emailRes.json() : {};
            const profile = profileRes.ok ? await profileRes.json() : {};
            const emailMissing = !emailSettings?.email || !emailSettings?.appPassword;
            const bankMissing = evaluateBankDetails(profile);

            setSetupData({
                loading: false,
                emailMissing,
                bankMissing,
                emailSettings,
                bankDetails: profile,
            });
        } catch (error) {
            console.error("Failed to load setup status:", error);
            setSetupData((prev) => ({ ...prev, loading: false }));
        }
    }, [evaluateBankDetails]);

    // Helper functions to manage new invoice modal URL state
    const openNewInvoiceModal = () => {
        setIsModalOpen(true);
        setSearchParams({ newInvoice: 'true' });
    };

    const closeNewInvoiceModal = () => {
        setIsModalOpen(false);
        setSearchParams({});
    };

    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
  
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser({ name: "User" });
      }
    }, [navigate]);

    useEffect(() => {
        refreshSetupStatus();
    }, [refreshSetupStatus]);

    useEffect(() => {
        if (!setupData.loading) {
            const needsAttention = setupData.emailMissing || setupData.bankMissing;
            setSetupModalOpen(needsAttention && !setupSnoozed);
        }
    }, [setupData.loading, setupData.emailMissing, setupData.bankMissing, setupSnoozed]);

    useEffect(() => {
        if (!setupData.emailMissing && !setupData.bankMissing) {
            setSetupSnoozed(false);
        }
    }, [setupData.emailMissing, setupData.bankMissing]);

    useEffect(() => {
        const handler = () => openNewInvoiceModal();
        window.addEventListener("open-new-invoice-modal", handler);
        return () => window.removeEventListener("open-new-invoice-modal", handler);
    }, []);
  
    // ✅ Fetch Invoices from Backend
    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/api/invoices`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    setInvoices(data);
                } else {
                    console.error("Failed to fetch invoices");
                }
            } catch (error) {
                console.error("Error fetching invoices:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvoices();
    }, [refreshKey]);

    // ✅ Memoized invoice stats for performance
    const invoiceStats = useMemo(() => {
        // Filter to only include original invoices (not auto-generated recurring invoices)
        const originalInvoices = invoices.filter(inv => !inv.parentInvoiceId);
        
        const total = originalInvoices.length || 0;
        const paid = originalInvoices
            .filter((invoice) => invoice.status?.toLowerCase() === "paid")
            .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0) || 0;
        const pending = originalInvoices
            .filter((invoice) => invoice.status?.toLowerCase() === "pending")
            .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0) || 0;
        const totalRevenue = originalInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0) || 0;

        return { total, paid, pending, totalRevenue };
    }, [invoices]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-900 min-h-screen text-white">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Welcome back, {user?.name || "User"}!
                        </h1>
                        <p className="text-gray-400 text-sm sm:text-base">
                            Here's what's happening with your invoices today
                        </p>
                    </div>
                    <button
                        onClick={openNewInvoiceModal}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                        <FaPlus className="text-lg" />
                        <span>New Invoice</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {isLoading ? (
                <div className={`grid grid-cols-1 ${paymentManagementEnabled ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-1 lg:grid-cols-1 max-w-md'} gap-4 sm:gap-6 mb-8`}>
                    {Array.from({ length: paymentManagementEnabled ? 4 : 1 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : (
                <div className={`grid grid-cols-1 ${paymentManagementEnabled ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-1 lg:grid-cols-1 max-w-md'} gap-4 sm:gap-6 mb-8`}>
                    <DashboardCard
                        title="Total Invoices"
                        amount={invoiceStats.total}
                        icon={<FaFileInvoice className="text-blue-400 text-4xl sm:text-5xl" />}
                        bgGradient="from-blue-500/10 to-blue-600/10"
                        borderColor="border-blue-500/30"
                        hoverBorderColor="hover:border-blue-500/60"
                    />
                    {paymentManagementEnabled && (
                        <>
                            <DashboardCard
                                title="Total Revenue"
                                amount={`$${invoiceStats.totalRevenue.toFixed(2)}`}
                                percentage="18.7% vs last month"
                                percentageColor="text-green-400"
                                trendIcon={<TrendingUp size={16} />}
                                icon={<FaChartLine className="text-purple-400 text-4xl sm:text-5xl" />}
                                bgGradient="from-purple-500/10 to-purple-600/10"
                                borderColor="border-purple-500/30"
                                hoverBorderColor="hover:border-purple-500/60"
                            />
                            <DashboardCard
                                title="Total Paid"
                                amount={`$${invoiceStats.paid.toFixed(2)}`}
                                percentage="5.2% vs last month"
                                percentageColor="text-green-400"
                                trendIcon={<TrendingUp size={16} />}
                                icon={<FaDollarSign className="text-green-400 text-4xl sm:text-5xl" />}
                                bgGradient="from-green-500/10 to-green-600/10"
                                borderColor="border-green-500/30"
                                hoverBorderColor="hover:border-green-500/60"
                            />
                            <DashboardCard
                                title="Total Pending"
                                amount={`$${invoiceStats.pending.toFixed(2)}`}
                                percentage="2% vs last month"
                                percentageColor="text-yellow-400"
                                trendIcon={<TrendingDown size={16} />}
                                icon={<FaClock className="text-yellow-400 text-4xl sm:text-5xl" />}
                                bgGradient="from-yellow-500/10 to-yellow-600/10"
                                borderColor="border-yellow-500/30"
                                hoverBorderColor="hover:border-yellow-500/60"
                            />
                        </>
                    )}
                </div>
            )}

            {/* Dashboard Content - No Tabs, Clean Layout */}
            {/* Recent Invoices - Full Width */}
            <div className="mb-6">
                <RecentInvoices 
                    invoices={invoices} 
                    currentPage={currentPage} 
                    setCurrentPage={setCurrentPage}
                    totalPages={Math.ceil(invoices.length / 5)} 
                    dropdownIndex={dropdownIndex} 
                    setDropdownIndex={setDropdownIndex}
                    paymentManagementEnabled={paymentManagementEnabled}
                    setRefreshKey={setRefreshKey}
                />
            </div>

            {/* Two Column Layout - Recent Activity & Recurring Emails */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <RecentActivity paymentManagementEnabled={paymentManagementEnabled} refreshKey={refreshKey} />
                <RecurringEmailsCard refreshKey={refreshKey} />
            </div>
  
            {/*  Mobile Floating Action Button (Hidden on Desktop) */}
            <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                <button
                    onClick={openNewInvoiceModal}
                    className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                    <FaPlus className="text-2xl" />
                </button>
            </div>
  
            {/*  New Invoice Modal */}
            <NewInvoiceModal isOpen={isModalOpen} onClose={closeNewInvoiceModal} setRefreshKey={setRefreshKey}/>

            <SetupAssistantModal
                isOpen={setupModalOpen}
                emailMissing={setupData.emailMissing}
                bankMissing={setupData.bankMissing}
                emailDefaults={setupData.emailSettings}
                bankDefaults={setupData.bankDetails}
                onDismiss={() => setSetupSnoozed(true)}
                onEmailSaved={refreshSetupStatus}
                onBankSaved={refreshSetupStatus}
            />
        </div>
    );
}

const SetupAssistantModal = ({
    isOpen,
    emailMissing,
    bankMissing,
    emailDefaults = {},
    bankDefaults = {},
    onDismiss,
    onEmailSaved,
    onBankSaved
}) => {
    const [emailForm, setEmailForm] = useState({
        email: emailDefaults.email || "",
        appPassword: emailDefaults.appPassword || ""
    });
    const [emailSaving, setEmailSaving] = useState(false);
    const [bankForm, setBankForm] = useState({
        bankName: bankDefaults.bankName || "",
        accountName: bankDefaults.accountName || "",
        accountHolderName: bankDefaults.accountHolderName || "",
        accountNumber: bankDefaults.accountNumber || "",
        iban: bankDefaults.iban || "",
        bic: bankDefaults.bic || "",
        sortCode: bankDefaults.sortCode || "",
        swiftCode: bankDefaults.swiftCode || "",
        routingNumber: bankDefaults.routingNumber || "",
        bankAddress: bankDefaults.bankAddress || "",
    });
    const [bankRegion, setBankRegion] = useState(detectBankRegion(bankDefaults));
    const [bankSaving, setBankSaving] = useState(false);

    useEffect(() => {
        setEmailForm({
            email: emailDefaults.email || "",
            appPassword: emailDefaults.appPassword || ""
        });
    }, [emailDefaults]);

    useEffect(() => {
        setBankForm({
            bankName: bankDefaults.bankName || "",
            accountName: bankDefaults.accountName || "",
            accountHolderName: bankDefaults.accountHolderName || "",
            accountNumber: bankDefaults.accountNumber || "",
            iban: bankDefaults.iban || "",
            bic: bankDefaults.bic || "",
            sortCode: bankDefaults.sortCode || "",
            swiftCode: bankDefaults.swiftCode || "",
            routingNumber: bankDefaults.routingNumber || "",
            bankAddress: bankDefaults.bankAddress || "",
        });
        setBankRegion(detectBankRegion(bankDefaults));
    }, [bankDefaults]);

    if (!isOpen || (!emailMissing && !bankMissing)) {
        return null;
    }

    const regionConfig = BANK_REGION_CONFIG[bankRegion] || BANK_REGION_CONFIG.eu;
    const emailFormValid = emailForm.email && emailForm.appPassword;
    const bankRegionValid = regionConfig.fields.every((field) => bankForm[field.name]);
    const bankGeneralValid = bankForm.bankName && bankForm.accountName;
    const bankFormValid = bankGeneralValid && bankRegionValid;

    const handleEmailSave = async (e) => {
        e.preventDefault();
        if (!emailFormValid) return;
        setEmailSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/email-settings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(emailForm),
            });

            if (response.ok) {
                toast.success("Email settings saved");
                onEmailSaved?.();
            } else {
                const data = await response.json().catch(() => null);
                toast.error(data?.error || "Failed to save email settings");
            }
        } catch (error) {
            toast.error("Failed to save email settings");
            console.error(error);
        } finally {
            setEmailSaving(false);
        }
    };

    const handleBankSave = async (e) => {
        e.preventDefault();
        if (!bankFormValid) return;
        setBankSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(bankForm),
            });

            if (response.ok) {
                toast.success("Bank details saved");
                onBankSaved?.();
            } else {
                const data = await response.json().catch(() => null);
                toast.error(data?.message || "Failed to save bank details");
            }
        } catch (error) {
            toast.error("Failed to save bank details");
            console.error(error);
        } finally {
            setBankSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
            <div className="w-full max-w-3xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-start justify-between p-6 border-b border-gray-800">
                    <div>
                        <p className="text-sm uppercase text-blue-400 font-semibold tracking-wider">Finish setup</p>
                        <h2 className="text-2xl font-bold text-white mt-1">You're almost ready to send invoices</h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Add the required details below to enable email delivery and professional payment info.
                        </p>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-gray-400 hover:text-white text-sm border border-gray-700 rounded-full px-3 py-1"
                    >
                        Remind me later
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {emailMissing && (
                        <form onSubmit={handleEmailSave} className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Email Delivery Settings</h3>
                                    <p className="text-sm text-gray-400">Provide the email address and app password used to send invoices.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={emailForm.email}
                                        onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                                        placeholder="you@business.com"
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">App Password</label>
                                    <input
                                        type="password"
                                        value={emailForm.appPassword}
                                        onChange={(e) => setEmailForm({ ...emailForm, appPassword: e.target.value })}
                                        placeholder="App specific password"
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={!emailFormValid || emailSaving}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold disabled:opacity-50"
                                >
                                    {emailSaving ? "Saving..." : "Save Email Settings"}
                                </button>
                            </div>
                        </form>
                    )}

                    {bankMissing && (
                        <form onSubmit={handleBankSave} className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Bank Details</h3>
                                    <p className="text-sm text-gray-400">Share payment details that will appear on your invoices.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Region</label>
                                    <select
                                        value={bankRegion}
                                        onChange={(e) => setBankRegion(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {Object.values(BANK_REGION_CONFIG).map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="bg-gray-900/60 border border-dashed border-gray-700 rounded-lg p-4 text-sm text-gray-400">
                                    {regionConfig.description}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {regionConfig.fields.map((field) => (
                                    <div key={field.name}>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            {field.label}
                                        </label>
                                        <input
                                            type="text"
                                            name={field.name}
                                            value={bankForm[field.name] || ""}
                                            onChange={(e) => setBankForm({ ...bankForm, [field.name]: e.target.value })}
                                            placeholder={field.placeholder}
                                            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        name="bankName"
                                        value={bankForm.bankName}
                                        onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                                        placeholder="Bank name"
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Account Name</label>
                                    <input
                                        type="text"
                                        name="accountName"
                                        value={bankForm.accountName}
                                        onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                                        placeholder="Business account name"
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Bank Address</label>
                                    <textarea
                                        name="bankAddress"
                                        value={bankForm.bankAddress}
                                        onChange={(e) => setBankForm({ ...bankForm, bankAddress: e.target.value })}
                                        placeholder="Street, city, country"
                                        rows={3}
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={!bankFormValid || bankSaving}
                                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold disabled:opacity-50"
                                >
                                    {bankSaving ? "Saving..." : "Save Bank Details"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

// Reusable Dashboard Card Component (Memoized for performance)
const DashboardCard = memo(({ title, amount, percentage, percentageColor, trendIcon, icon, bgGradient, borderColor, hoverBorderColor }) => {
    return (
        <div className={`relative p-5 sm:p-6 bg-gradient-to-br ${bgGradient} bg-gray-800 rounded-xl shadow-lg border ${borderColor} ${hoverBorderColor} hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden`}>
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Subtle pulse animation on hover */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="relative flex justify-between items-start">
                <div className="flex-1 space-y-2">
                    <h3 className="text-gray-400 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                        {title}
                    </h3>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white break-all">
                        {amount}
                    </p>
                    {percentage && (
                        <div className="flex items-center space-x-1 pt-1">
                            {trendIcon && <span className={percentageColor}>{trendIcon}</span>}
                            <p className={`${percentageColor} text-xs sm:text-sm font-semibold`}>
                                {percentage}
                            </p>
                        </div>
                    )}
                </div>
                <div className="ml-3 sm:ml-4 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                    {icon}
                </div>
            </div>

            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${bgGradient.replace('/10', '')} opacity-50 group-hover:opacity-100 transition-opacity duration-300`}></div>
        </div>
    );
});

DashboardCard.displayName = 'DashboardCard';

// Skeleton Loading Card
const SkeletonCard = memo(() => {
    return (
        <div className="relative p-5 sm:p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700 animate-pulse">
            <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                    <div className="h-3 bg-gray-700 rounded w-24"></div>
                    <div className="h-8 bg-gray-700 rounded w-32"></div>
                    <div className="h-3 bg-gray-700 rounded w-28"></div>
                </div>
                <div className="ml-4 w-12 h-12 bg-gray-700 rounded-full"></div>
            </div>
        </div>
    );
});

SkeletonCard.displayName = 'SkeletonCard';

