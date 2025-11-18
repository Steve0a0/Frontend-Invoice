import { useState, useEffect } from "react";
import { FaReceipt, FaClock, FaBoxOpen, FaCalendarAlt, FaDollarSign, FaCheck } from "react-icons/fa";
import { API_BASE_URL } from '../config/api';

export default function InvoiceSettings() {
  const [itemStructure, setItemStructure] = useState("hourly");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setItemStructure(userData.itemStructure || "hourly");
      }
    } catch (error) {
      console.error("Failed to fetch user settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemStructure }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Invoice settings saved successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: "Failed to save settings. Please try again." });
      }
    } catch (error) {
      console.error("Save settings error:", error);
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const structures = [
    {
      value: "hourly",
      icon: FaClock,
      title: "Hourly Rate",
      description: "Charge by the hour",
      fields: "Description â€¢ Rate ($/hr) â€¢ Hours â€¢ Total",
      example: "Web Development â€¢ $75/hr â€¢ 10 hrs â€¢ $750"
    },
    {
      value: "fixed_price",
      icon: FaBoxOpen,
      title: "Fixed Price",
      description: "Charge per item/unit",
      fields: "Description â€¢ Quantity â€¢ Unit Price â€¢ Total",
      example: "Website Design â€¢ 1 â€¢ $2,500 â€¢ $2,500"
    },
    {
      value: "daily_rate",
      icon: FaCalendarAlt,
      title: "Daily Rate",
      description: "Charge by the day",
      fields: "Description â€¢ Rate ($/day) â€¢ Days â€¢ Total",
      example: "Consulting â€¢ $500/day â€¢ 5 days â€¢ $2,500"
    },
    {
      value: "simple",
      icon: FaDollarSign,
      title: "Simple Amount",
      description: "Just description and amount",
      fields: "Description â€¢ Amount",
      example: "Project Milestone â€¢ $5,000"
    }
  ];

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-600 rounded-lg">
          <FaReceipt className="text-white text-xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Invoice Item Structure</h2>
          <p className="text-sm text-gray-400">Choose how you want to structure your invoice items</p>
        </div>
      </div>

      {message.text && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-900/30 border border-green-500 text-green-400"
              : "bg-red-900/30 border border-red-500 text-red-400"
          }`}
        >
          {message.type === "success" && <FaCheck />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {structures.map((structure) => {
          const Icon = structure.icon;
          const isSelected = itemStructure === structure.value;

          return (
            <div
              key={structure.value}
              onClick={() => setItemStructure(structure.value)}
              className={`cursor-pointer p-5 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? "border-purple-500 bg-purple-900/20 shadow-lg shadow-purple-500/20"
                  : "border-gray-600 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-900"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    isSelected ? "bg-purple-600" : "bg-gray-700"
                  }`}
                >
                  <Icon className="text-white text-2xl" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-white">{structure.title}</h3>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                        <FaCheck className="text-white text-xs" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{structure.description}</p>
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-purple-400 bg-gray-800/50 px-2 py-1 rounded">
                      {structure.fields}
                    </div>
                    <div className="text-xs text-gray-500 italic">
                      Example: {structure.example}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            minHeight: '44px'
          }}
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

