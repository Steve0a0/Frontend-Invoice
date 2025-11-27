import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { API_BASE_URL } from "../config/api";

const formatBankField = (value) => {
  if (value === null || value === undefined) return "Not provided";
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : "Not provided";
};

const BankDetailCard = ({ label, value, allowWrap = false }) => (
  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 shadow-inner shadow-black/20">
    <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
    <p className={`text-white font-semibold mt-2 text-sm ${allowWrap ? "break-words whitespace-pre-line" : "truncate"}`}>
      {value}
    </p>
  </div>
);

const BankDetailsConfirmationModal = ({
  isOpen,
  onConfirm,
  onCancel,
  confirmText = "Looks Good",
  infoMessage = "Manual sends will always show this reminder.",
}) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || profile || loading) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Missing auth token");
        const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to load profile");
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load bank details:", err);
        setError("Unable to load bank information. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, profile, loading]);

  if (!isOpen) return null;

  const summary = {
    bankName: profile ? formatBankField(profile.bankName) : "Loading...",
    accountName: profile ? formatBankField(profile.accountName) : "Loading...",
    accountIdentifier: profile
      ? formatBankField(profile.iban || profile.accountNumber || profile.routingNumber)
      : "Loading...",
    bankAddress: profile ? formatBankField(profile.bankAddress) : "Loading...",
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-700/80 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.45)] p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
            <Search size={26} className="text-purple-200" aria-label="Search" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-purple-300/80">
              Before You Proceed
            </p>
            <h3 className="text-2xl font-bold text-white mt-1">Please Confirm Your Bank Details</h3>
            <p className="text-sm text-gray-400 mt-2">
              Your client will see these details on the invoice. Take a moment to verify everything looks correct.
            </p>
          </div>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/40 rounded-2xl px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BankDetailCard label="Bank Name" value={summary.bankName} />
              <BankDetailCard label="Account Name" value={summary.accountName} />
              <BankDetailCard label="Account Number / IBAN" value={summary.accountIdentifier} allowWrap />
              <BankDetailCard label="Branch / Address" value={summary.bankAddress} allowWrap />
            </div>

            <div className="bg-gray-900/60 border border-gray-700 rounded-2xl px-5 py-4 flex items-center gap-3">
              <div className="text-purple-300">
                <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-.25-11h.5a.75.75 0 0 1 .74.65l.01.1v5.25a.75.75 0 0 1-1.5.1l-.01-.1v-3.8l-.3.07a.75.75 0 0 1-.84-.36l-.04-.09-.06-.16a1.5 1.5 0 0 1 1.3-2.26Zm.25-2.25a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
                </svg>
              </div>
              <div className="text-sm text-gray-300">
                {infoMessage}
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-gray-200 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || Boolean(error)}
            className={`px-6 py-2.5 rounded-xl font-semibold shadow-lg transition-transform hover:-translate-y-0.5 ${
              loading || error
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 via-purple-600 to-blue-500 text-white hover:shadow-purple-700/40"
            }`}
          >
            {loading ? "Loading..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankDetailsConfirmationModal;
