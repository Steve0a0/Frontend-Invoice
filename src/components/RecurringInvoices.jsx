import { useState, useEffect } from "react";
import { FaRedo, FaCalendarAlt, FaEnvelope, FaToggleOn, FaToggleOff, FaEdit, FaTrash, FaClock, FaCheckCircle, FaStop, FaEye } from "react-icons/fa";
import toast from "react-hot-toast";
import { API_BASE_URL } from '../config/api';

export default function RecurringInvoices() {
  const [recurringInvoices, setRecurringInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecurringInvoices();
  }, []);

  const fetchRecurringInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/invoices/recurring`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecurringInvoices(data);
      } else {
        // Silently handle error - just show empty state
        setRecurringInvoices([]);
      }
    } catch (err) {
      // Silently handle error - just show empty state
      setRecurringInvoices([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecurring = async (invoiceId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/recurring`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isRecurring: !currentStatus,
        }),
      });

      if (response.ok) {
        fetchRecurringInvoices();
      } else {
        toast.error("Failed to update recurring status");
      }
    } catch (err) {
      console.error("Error updating recurring invoice:", err);
      toast.error("Error updating recurring invoice");
    }
  };

  const toggleAutoSend = async (invoiceId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/recurring`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          autoSendEmail: !currentStatus,
        }),
      });

      if (response.ok) {
        fetchRecurringInvoices();
      } else {
        toast.error("Failed to update auto-send status");
      }
    } catch (err) {
      console.error("Error updating auto-send:", err);
      toast.error("Error updating auto-send status");
    }
  };

  const stopRecurring = async (invoiceId, clientName) => {
    const confirmStop = confirm(
      `Stop recurring invoices for ${clientName}?\n\nThis will:\nâœ— Stop sending automated emails\nâœ— Remove from recurring list\nâœ“ Keep all previously sent invoices\n\nYou can restart it later if needed.`
    );

    if (!confirmStop) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/stop-recurring`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success(`âœ“ Recurring emails stopped for ${clientName}`);
        fetchRecurringInvoices();
      } else {
        toast.error("Failed to stop recurring invoice");
      }
    } catch (err) {
      console.error("Error stopping recurring invoice:", err);
      toast.error("Error stopping recurring invoice");
    }
  };

  const viewHistory = async (invoiceId, clientName) => {
    // This will open the history modal (we can integrate with RecurringEmailsCard later)
    toast(`View history for ${clientName} - Feature coming soon!`);
  };

  const getFrequencyBadge = (frequency) => {
    const colors = {
      daily: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      weekly: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "bi-weekly": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      monthly: "bg-green-500/20 text-green-400 border-green-500/30",
      quarterly: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      yearly: "bg-red-500/20 text-red-400 border-red-500/30",
    };

    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${colors[frequency] || colors.monthly}`}>
        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysUntilNext = (nextDate) => {
    if (!nextDate) return null;
    const now = new Date();
    const next = new Date(nextDate);
    const diff = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading recurring invoices...</p>
        </div>
      </div>
    );
  }

  if (recurringInvoices.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
        <FaRedo className="text-4xl text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Recurring Invoices</h3>
        <p className="text-gray-400 text-sm">
          Create an invoice and enable "Recurring" to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaRedo className="text-blue-500" />
            Recurring Invoices
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage your automated recurring invoices
          </p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-lg">
          <span className="text-blue-400 font-semibold">{recurringInvoices.length}</span>
          <span className="text-gray-400 text-sm ml-2">Active</span>
        </div>
      </div>

      {/* How It Works Info Card */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <FaRedo className="text-blue-400 text-lg" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              How Recurring Invoices Work
            </h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">âœ“</span>
                <span>Each recurring invoice is tied to <strong className="text-white">one specific client</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">âœ“</span>
                <span>Auto-generates new invoices at your chosen frequency (daily, weekly, monthly, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">âœ“</span>
                <span>Automatically sends PDF invoices to the client's email when enabled</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">âœ“</span>
                <span>Click <strong className="text-red-400">"STOP RECURRING"</strong> to permanently stop automation for that client</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {recurringInvoices.map((invoice) => {
          const daysUntil = getDaysUntilNext(invoice.nextRecurringDate);
          const isUpcoming = daysUntil !== null && daysUntil <= 7;

          return (
            <div
              key={invoice.id}
              className={`bg-gray-800 border rounded-lg p-4 transition-all duration-200 hover:shadow-lg ${
                isUpcoming ? "border-yellow-500/50 shadow-yellow-500/10" : "border-gray-700"
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{invoice.client}</h3>
                  <p className="text-gray-400 text-sm">{invoice.workType}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">
                    {invoice.currency} {invoice.totalAmount.toFixed(2)}
                  </p>
                  {getFrequencyBadge(invoice.recurringFrequency)}
                </div>
              </div>

              {/* Progress */}
              <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-gray-300">
                    {invoice.recurringCount} / {invoice.maxRecurrences || "âˆž"}
                  </span>
                </div>
                {invoice.maxRecurrences && (
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((invoice.recurringCount / invoice.maxRecurrences) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Dates Info */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-900/50 rounded-lg p-2">
                  <p className="text-xs text-gray-400 mb-1">Next Invoice</p>
                  <p className="text-sm font-semibold text-white flex items-center gap-1">
                    <FaCalendarAlt className="text-blue-400 text-xs" />
                    {formatDate(invoice.nextRecurringDate)}
                  </p>
                  {daysUntil !== null && (
                    <p className={`text-xs mt-1 ${daysUntil <= 7 ? "text-yellow-400" : "text-gray-500"}`}>
                      {daysUntil > 0 ? `in ${daysUntil} days` : daysUntil === 0 ? "Today!" : "Overdue"}
                    </p>
                  )}
                </div>

                <div className="bg-gray-900/50 rounded-lg p-2">
                  <p className="text-xs text-gray-400 mb-1">
                    {invoice.recurringEndDate ? "Ends On" : "Duration"}
                  </p>
                  <p className="text-sm font-semibold text-white flex items-center gap-1">
                    <FaClock className="text-green-400 text-xs" />
                    {invoice.recurringEndDate ? formatDate(invoice.recurringEndDate) : "Ongoing"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-3 border-t border-gray-700">
                {/* Top Row: Auto-send toggle and Active toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAutoSend(invoice.id, invoice.autoSendEmail)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                        invoice.autoSendEmail
                          ? "bg-green-600/20 text-green-400 border border-green-600/30"
                          : "bg-gray-700 text-gray-400 border border-gray-600"
                      }`}
                      title={invoice.autoSendEmail ? "Auto-send enabled" : "Auto-send disabled"}
                    >
                      <FaEnvelope />
                      {invoice.autoSendEmail ? "Auto" : "Manual"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRecurring(invoice.id, invoice.isRecurring)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                        invoice.isRecurring
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }`}
                    >
                      {invoice.isRecurring ? (
                        <>
                          <FaToggleOn />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <FaToggleOff />
                          <span>Paused</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Row: View History and STOP buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => viewHistory(invoice.id, invoice.client)}
                    className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-blue-500/30 hover:border-blue-500/50"
                  >
                    <FaEye />
                    <span>View History</span>
                  </button>
                  <button
                    onClick={() => stopRecurring(invoice.id, invoice.client)}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-500/50 hover:scale-105"
                  >
                    <FaStop />
                    <span>STOP RECURRING</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


