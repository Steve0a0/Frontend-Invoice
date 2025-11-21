import { useState, useEffect } from "react";
import { FaPlus, FaCog, FaTrash, FaEdit, FaSave, FaTimes, FaGripVertical } from "react-icons/fa";
import toast from "react-hot-toast";
import { API_BASE_URL } from '../config/api';

export default function CustomFieldsSettings() {
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingField, setIsAddingField] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    fieldName: "",
    fieldLabel: "",
    fieldType: "text",
    placeholder: "",
    defaultValue: "",
    isRequired: false,
    showInInvoice: true,
    showInEmail: true,
    fieldOptions: [],
  });

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Text Area" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "email", label: "Email" },
    { value: "select", label: "Dropdown" },
    { value: "checkbox", label: "Checkbox" },
  ];

  useEffect(() => {
    fetchCustomFields();
  }, []);

  const fetchCustomFields = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/custom-fields`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCustomFields(data);
    } catch (error) {
      console.error("Error fetching custom fields:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // Convert fieldName to snake_case
    const fieldName = formData.fieldLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    const payload = {
      ...formData,
      fieldName,
      fieldOptions: formData.fieldType === "select" ? formData.fieldOptions : null,
    };

    try {
      const url = editingField
        ? `${API_BASE_URL}/api/custom-fields/${editingField.id}`
        : `${API_BASE_URL}/api/custom-fields`;

      const response = await fetch(url, {
        method: editingField ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchCustomFields();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save custom field");
      }
    } catch (error) {
      console.error("Error saving custom field:", error);
      toast.error("Failed to save custom field");
    }
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setFormData({
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      placeholder: field.placeholder || "",
      defaultValue: field.defaultValue || "",
      isRequired: field.isRequired,
      showInInvoice: field.showInInvoice,
      showInEmail: field.showInEmail,
      fieldOptions: field.fieldOptions || [],
    });
    setIsAddingField(true);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/custom-fields/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Custom field deleted successfully");
        fetchCustomFields();
      } else {
        toast.error("Failed to delete custom field");
      }
    } catch (error) {
      console.error("Error deleting custom field:", error);
      toast.error("Error deleting custom field");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleActive = async (field) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_BASE_URL}/api/custom-fields/${field.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !field.isActive }),
      });
      fetchCustomFields();
    } catch (error) {
      console.error("Error toggling field:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      fieldName: "",
      fieldLabel: "",
      fieldType: "text",
      placeholder: "",
      defaultValue: "",
      isRequired: false,
      showInInvoice: true,
      showInEmail: true,
      fieldOptions: [],
    });
    setIsAddingField(false);
    setEditingField(null);
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      fieldOptions: [...formData.fieldOptions, ""],
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.fieldOptions];
    newOptions[index] = value;
    setFormData({ ...formData, fieldOptions: newOptions });
  };

  const handleRemoveOption = (index) => {
    const newOptions = formData.fieldOptions.filter((_, i) => i !== index);
    setFormData({ ...formData, fieldOptions: newOptions });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-6">
      {/* Header */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <FaCog className="text-purple-400 text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Custom Fields</h1>
              <p className="text-gray-400 text-sm">Add custom fields to your invoices</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddingField(!isAddingField)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <FaPlus />
            Add Field
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAddingField && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingField ? "Edit Custom Field" : "Add New Custom Field"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Field Label *</label>
                <input
                  type="text"
                  required
                  value={formData.fieldLabel}
                  onChange={(e) => {
                    const label = e.target.value;
                    // Auto-generate placeholder from field label if user hasn't manually changed it
                    const generatedPlaceholder = label
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "_")
                      .replace(/^_|_$/g, "");
                    
                    setFormData({ 
                      ...formData, 
                      fieldLabel: label,
                      // Only auto-update placeholder if it matches the previous auto-generated value
                      // This allows users to manually override it
                      placeholder: formData.placeholder === formData.fieldLabel
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "_")
                        .replace(/^_|_$/g, "")
                        || !formData.placeholder
                        ? generatedPlaceholder
                        : formData.placeholder
                    });
                  }}
                  placeholder="e.g., PO Number, Tax ID"
                  className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is what users will see (e.g., "PO Number")
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Field Type *</label>
                <select
                  value={formData.fieldType}
                  onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-purple-500 focus:outline-none"
                >
                  {fieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Placeholder</label>
                <input
                  type="text"
                  value={formData.placeholder}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  placeholder="Auto-generated from field label"
                  className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use in templates as: <code className="text-purple-400">{`{{${formData.placeholder || "field_name"}}}`}</code>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Default Value</label>
                <input
                  type="text"
                  value={formData.defaultValue}
                  onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                  placeholder="Enter default value"
                  className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Dropdown Options */}
            {formData.fieldType === "select" && (
              <div>
                <label className="block text-sm font-medium mb-2">Dropdown Options</label>
                {formData.fieldOptions.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  + Add Option
                </button>
              </div>
            )}

            {/* Checkboxes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                  className="rounded bg-gray-900 border-gray-700"
                />
                <span className="text-sm">Required</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showInInvoice}
                  onChange={(e) => setFormData({ ...formData, showInInvoice: e.target.checked })}
                  className="rounded bg-gray-900 border-gray-700"
                />
                <span className="text-sm">Show in Invoice</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showInEmail}
                  onChange={(e) => setFormData({ ...formData, showInEmail: e.target.checked })}
                  className="rounded bg-gray-900 border-gray-700"
                />
                <span className="text-sm">Show in Email</span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
              >
                <FaSave />
                {editingField ? "Update Field" : "Create Field"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
              >
                <FaTimes />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fields List */}
      <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Your Custom Fields</h2>
        </div>
        
        {customFields.length === 0 ? (
          <div className="p-12 text-center">
            <FaCog className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No custom fields yet</p>
            <p className="text-gray-500 text-sm mt-2">Click "Add Field" to create your first custom field</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {customFields.map((field) => (
              <div
                key={field.id}
                className={`p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors ${
                  !field.isActive ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <FaGripVertical className="text-gray-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{field.fieldLabel}</h3>
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {field.fieldType}
                      </span>
                      {field.isRequired && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-gray-400">
                        Placeholder: <code className="text-purple-400">{"{{" + (field.placeholder || field.fieldName) + "}}"}</code>
                      </p>
                      <div className="flex gap-2 text-xs">
                        {field.showInInvoice && (
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                            Invoice
                          </span>
                        )}
                        {field.showInEmail && (
                          <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            Email
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.isActive}
                      onChange={() => toggleActive(field)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                  <button
                    onClick={() => handleEdit(field)}
                    className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <FaEdit className="text-blue-400" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(field.id)}
                    className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <FaTrash className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-6">
        <h3 className="font-semibold text-blue-400 mb-2">💡 How to use custom fields</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Custom fields will appear when creating/editing invoices</li>
          <li>• Use placeholders like <code className="text-purple-400">{"{{field_name}}"}</code> in your email and invoice templates</li>
          <li>• Fields are automatically included in recurring invoices</li>
          <li>• Toggle "Show in Invoice/Email" to control where fields appear</li>
        </ul>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Delete Custom Field</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this custom field? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

