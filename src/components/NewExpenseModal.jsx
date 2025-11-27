import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config/api";
import toast from "react-hot-toast";

const initialManualFields = {
  vendor: "",
  description: "",
  expenseDate: "",
  amount: "",
  currency: "USD",
  taxPercent: "",
  taxAmount: "",
  category: "",
  notes: "",
};

export default function NewExpenseModal({ isOpen, onClose, onSaved }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [manualFields, setManualFields] = useState(initialManualFields);
  const [expenseDraft, setExpenseDraft] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setFilePreview(null);
      setUploading(false);
      setSaving(false);
      setError("");
      setManualFields(initialManualFields);
      setExpenseDraft(null);
    }
  }, [isOpen]);

  const confidenceLabel = useMemo(() => {
    if (!expenseDraft?.confidenceScore && expenseDraft?.confidenceScore !== 0) {
      return "—";
    }
    const score = expenseDraft.confidenceScore;
    if (score >= 0.8) return "High";
    if (score >= 0.5) return "Medium";
    return "Low";
  }, [expenseDraft]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  const uploadReceipt = async () => {
    if (!selectedFile) {
      toast.error("Select a receipt first.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("receipt", selectedFile);
      Object.entries(manualFields).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      const response = await fetch(`${API_BASE_URL}/api/expenses/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const expense = await response.json();
      setExpenseDraft(expense);
      setManualFields({
        vendor: expense.vendor || "",
        description: expense.description || "",
        expenseDate: expense.expenseDate ? expense.expenseDate.slice(0, 10) : "",
        amount: expense.amount ?? "",
        currency: expense.currency || "USD",
        taxPercent: expense.taxPercent ?? "",
        taxAmount: expense.taxAmount ?? "",
        category: expense.category || "",
        notes: expense.notes || "",
      });
      toast.success("Receipt analyzed");
    } catch (err) {
      console.error(err);
      setError("Could not upload receipt. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const saveExpense = async () => {
    if (!expenseDraft) {
      toast.error("Upload a receipt first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...manualFields,
      };
      const response = await fetch(`${API_BASE_URL}/api/expenses/${expenseDraft.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Save failed");
      }
      toast.success("Expense saved");
      onSaved?.();
    } catch (err) {
      console.error(err);
      setError("Could not save expense.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-semibold text-white">New Expense</h2>
            <p className="text-sm text-gray-400">
              Upload a receipt or enter details manually to track expenses and tax deductions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm px-3 py-1 border border-gray-700 rounded-full"
          >
            Close
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6 max-h-[75vh] overflow-y-auto">
          <section className="space-y-4">
            <div className="border border-dashed border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-gray-900/60">
              {filePreview ? (
                <img src={filePreview} alt="Receipt preview" className="max-h-64 rounded-lg border border-gray-800" />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-2xl mb-3">
                    📄
                  </div>
                  <p className="text-white font-medium">Drop a receipt or choose a file</p>
                  <p className="text-sm text-gray-400">
                    Supports PNG, JPG, or PDF up to 10MB
                  </p>
                </>
              )}
              <label className="mt-4 inline-flex items-center px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer">
                {selectedFile ? "Change file" : "Select file"}
                <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={handleFileChange} />
              </label>
              <button
                onClick={uploadReceipt}
                disabled={!selectedFile || uploading}
                className="mt-3 w-full px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold"
              >
                {uploading ? "Analyzing..." : "Upload & Extract"}
              </button>
              {expenseDraft && (
                <p className="text-xs text-gray-400 mt-2">
                  Extraction confidence: <span className="text-white">{confidenceLabel}</span>
                </p>
              )}
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-2">
              <h3 className="text-white font-semibold">Notes</h3>
              <textarea
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Any context for this expense (project, client, reimbursable, etc.)"
                value={manualFields.notes}
                onChange={(e) => setManualFields((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-3">Expense Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Vendor</label>
                  <input
                    type="text"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={manualFields.vendor}
                    onChange={(e) => setManualFields((prev) => ({ ...prev, vendor: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={manualFields.expenseDate}
                    onChange={(e) => setManualFields((prev) => ({ ...prev, expenseDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={manualFields.amount}
                    onChange={(e) => setManualFields((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Currency</label>
                  <input
                    type="text"
                    maxLength={3}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={manualFields.currency}
                    onChange={(e) => setManualFields((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tax %</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={manualFields.taxPercent}
                    onChange={(e) => setManualFields((prev) => ({ ...prev, taxPercent: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={manualFields.taxAmount}
                    onChange={(e) => setManualFields((prev) => ({ ...prev, taxAmount: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <input
                    type="text"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={manualFields.category}
                    onChange={(e) => setManualFields((prev) => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <input
                    type="text"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={manualFields.description}
                    onChange={(e) => setManualFields((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {error && <div className="text-sm text-red-400">{error}</div>}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-gray-500">
                Expenses are saved to your ledger and can be matched with invoices later.
              </div>
              <button
                onClick={saveExpense}
                disabled={saving || !expenseDraft}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold"
              >
                {saving ? "Saving..." : "Save Expense"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
