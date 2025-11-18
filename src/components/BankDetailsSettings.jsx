import { useState, useEffect } from "react";
import { FaUniversity, FaSave, FaGlobe } from "react-icons/fa";
import { API_BASE_URL } from '../config/api';

export default function BankDetailsSettings() {
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    bic: "",
    sortCode: "",
    swiftCode: "",
    routingNumber: "",
    bankAddress: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const user = await response.json();
        setBankDetails({
          bankName: user.bankName || "",
          accountName: user.accountName || "",
          accountNumber: user.accountNumber || "",
          iban: user.iban || "",
          bic: user.bic || "",
          sortCode: user.sortCode || "",
          swiftCode: user.swiftCode || "",
          routingNumber: user.routingNumber || "",
          bankAddress: user.bankAddress || "",
        });
      }
    } catch (error) {
      console.error("Error fetching bank details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setBankDetails({
      ...bankDetails,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bankDetails),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Bank details saved successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: "Failed to save bank details" });
      }
    } catch (error) {
      console.error("Error saving bank details:", error);
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <FaUniversity className="text-green-400 text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Bank Details</h1>
              <p className="text-gray-400 text-sm">
                Manage your bank details for invoices
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-500/10 border border-green-500/30 text-green-400"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* International Banking Section */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <FaGlobe className="text-blue-400" />
              <h2 className="text-xl font-semibold text-white">International Banking (SEPA/EU)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  IBAN
                </label>
                <input
                  type="text"
                  name="iban"
                  value={bankDetails.iban}
                  onChange={handleChange}
                  placeholder="IE29 AIBK 9311 5212 3456 78"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  BIC/SWIFT Code
                </label>
                <input
                  type="text"
                  name="bic"
                  value={bankDetails.bic}
                  onChange={handleChange}
                  placeholder="AIBKIE2D"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* UK Banking Section */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">UK Banking</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sort Code
                </label>
                <input
                  type="text"
                  name="sortCode"
                  value={bankDetails.sortCode}
                  onChange={handleChange}
                  placeholder="12-34-56"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={bankDetails.accountNumber}
                  onChange={handleChange}
                  placeholder="12345678"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* US Banking Section */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">US Banking</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Routing Number
                </label>
                <input
                  type="text"
                  name="routingNumber"
                  value={bankDetails.routingNumber}
                  onChange={handleChange}
                  placeholder="021000021"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SWIFT Code
                </label>
                <input
                  type="text"
                  name="swiftCode"
                  value={bankDetails.swiftCode}
                  onChange={handleChange}
                  placeholder="CHASUS33"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* General Bank Details */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">General Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={bankDetails.bankName}
                  onChange={handleChange}
                  placeholder="AIB (Allied Irish Banks)"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  name="accountName"
                  value={bankDetails.accountName}
                  onChange={handleChange}
                  placeholder="Your Business Name"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bank Address (Optional)
                </label>
                <textarea
                  name="bankAddress"
                  value={bankDetails.bankAddress}
                  onChange={handleChange}
                  placeholder="Bank street address, city, country"
                  rows="3"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Available Placeholders */}
          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
            <p className="text-sm font-semibold text-blue-400 mb-2">
              💡 These details will be available in email and invoice templates:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-400">
              <code className="bg-gray-800 px-2 py-1 rounded">{"{{bank_name}}"}</code>
              <code className="bg-gray-800 px-2 py-1 rounded">{"{{account_name}}"}</code>
              <code className="bg-gray-800 px-2 py-1 rounded">{"{{iban}}"}</code>
              <code className="bg-gray-800 px-2 py-1 rounded">{"{{bic}}"}</code>
              <code className="bg-gray-800 px-2 py-1 rounded">{"{{sort_code}}"}</code>
              <code className="bg-gray-800 px-2 py-1 rounded">{"{{swift_code}}"}</code>
              <code className="bg-gray-800 px-2 py-1 rounded">{"{{routing_number}}"}</code>
              <code className="bg-gray-800 px-2 py-1 rounded">{"{{bank_address}}"}</code>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave />
              {saving ? "Saving..." : "Save Bank Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

