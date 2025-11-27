import { useMemo } from "react";
import { formatCurrency } from "../utils/formatCurrency";

function statusBadge(status) {
  const base = "px-3 py-1 rounded-full text-xs font-semibold";
  switch (status) {
    case "matched":
      return `${base} bg-emerald-500/20 text-emerald-300`;
    case "confirmed":
      return `${base} bg-blue-500/20 text-blue-300`;
    default:
      return `${base} bg-yellow-500/20 text-yellow-300`;
  }
}

export default function RecentExpenses({ expenses = [], loading, onCreateExpense }) {
  const topExpenses = useMemo(() => expenses.slice(0, 5), [expenses]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Recent Expenses</h3>
          <p className="text-sm text-gray-400">
            Track receipts and tax deductions alongside your invoices.
          </p>
        </div>
        <button
          onClick={onCreateExpense}
          className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 rounded-lg text-white"
        >
          New Expense
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400 text-sm">Loading expenses...</div>
      ) : topExpenses.length === 0 ? (
        <div className="py-10 text-center text-gray-400">
          <p className="text-sm">No expenses recorded yet.</p>
          <button
            onClick={onCreateExpense}
            className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-semibold"
          >
            Upload your first receipt
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {topExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-900/60 border border-gray-800 rounded-xl p-4 gap-3"
            >
              <div>
                <p className="text-white font-medium">
                  {expense.vendor || "Unlabeled vendor"}
                </p>
                <p className="text-sm text-gray-400">
                  {expense.category || "Uncategorized"} ·{" "}
                  {expense.expenseDate
                    ? new Date(expense.expenseDate).toLocaleDateString()
                    : "Date unknown"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">
                    {formatCurrency(expense.amount || 0, expense.currency || "USD")}
                  </p>
                  {expense.taxAmount ? (
                    <p className="text-xs text-gray-400">
                      Tax: {formatCurrency(expense.taxAmount, expense.currency || "USD")}
                    </p>
                  ) : null}
                </div>
                <span className={statusBadge(expense.status)}>
                  {expense.status?.replace("_", " ") || "pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
