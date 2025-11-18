import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmailTemplates from "./EmailTemplates";
import InvoiceTemplates from "./InvoiceTemplates";
import BankDetailsSettings from "./BankDetailsSettings";
import CustomFieldsSettings from "./CustomFieldsSettings";
import InvoiceSettings from "./InvoiceSettings";
import { Eye, EyeOff, Mail, CreditCard, DollarSign, Key, Lock, Shield, ArrowLeft, Home, Plug, FileText, ClipboardList, Building2, Settings } from "lucide-react"; 
import { usePaymentManagement } from "../context/PaymentContext";
import { API_BASE_URL } from '../config/api';

export default function SettingsPage({ initialTab = "email", hideTabs = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const { paymentManagementEnabled } = usePaymentManagement();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/email-settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const settings = await response.json();
          setEmail(settings.email || "");
          setAppPassword(settings.appPassword || "");
          setPaypalClientId(settings.paypalClientId || "");
          setPaypalSecret(settings.paypalSecret || "");
          setStripeSecretKey(settings.stripeSecretKey || "");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const tabs = [
    { id: "email", label: "Integration", icon: Plug },
    { id: "templates", label: "Email Templates", icon: Mail },
    { id: "invoicetemplates", label: "Invoice Templates", icon: FileText },
    { id: "invoicesettings", label: "Invoice Settings", icon: ClipboardList },
    { id: "bank", label: "Bank Details", icon: Building2 },
    { id: "customfields", label: "Custom Fields", icon: Settings },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header with Glassmorphism */}
        <div className="mb-8 relative">
          {/* Decorative Background Gradient */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          
          <div className="relative">
            
            <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-75 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl">
                      <Shield className="text-white" size={32} />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-2">
                      Settings
                    </h1>
                    <p className="text-gray-400">Manage your account preferences and configurations</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm hover:from-gray-700/80 hover:to-gray-600/80 text-white rounded-xl border border-gray-600/50 transition-all duration-200 hover:border-gray-500/50 hover:shadow-lg hover:shadow-gray-700/20 group"
                >
                  <Home size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        {!hideTabs && (
          <div className="mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-2">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105
                      ${
                        activeTab === tab.id
                          ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                          : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <tab.icon size={24} className="shrink-0" />
                      <span className="text-xs font-semibold tracking-wide">{tab.label}</span>
                    </div>
                    {activeTab === tab.id && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-500/20 animate-pulse"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content with Fade Animation */}
        <div className="animate-fadeIn">
          {activeTab === "email" && (
            <EmailSettings
              email={email}
              setEmail={setEmail}
              appPassword={appPassword}
              setAppPassword={setAppPassword}
              paypalClientId={paypalClientId}
              setPaypalClientId={setPaypalClientId}
              paypalSecret={paypalSecret}
              setPaypalSecret={setPaypalSecret}
              webhookUrl={webhookUrl}
              setWebhookUrl={setWebhookUrl}
              stripeSecretKey={stripeSecretKey}
              setStripeSecretKey={setStripeSecretKey}
              paymentManagementEnabled={paymentManagementEnabled}
            />
          )}
          {activeTab === "templates" && <EmailTemplates />}
          {activeTab === "invoicetemplates" && <InvoiceTemplates />}
          {activeTab === "invoicesettings" && <InvoiceSettings />}
          {activeTab === "bank" && <BankDetailsSettings />}
          {activeTab === "customfields" && <CustomFieldsSettings />}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .bg-gray-750 {
          background-color: #2d3748;
        }
      `}</style>
    </div>
  );
}

function EmailSettings({
  email,
  setEmail,
  appPassword,
  setAppPassword,
  paypalClientId,
  setPaypalClientId,
  paypalSecret,
  setPaypalSecret,
  webhookUrl,
  setWebhookUrl,
  stripeSecretKey,
  setStripeSecretKey,
  paymentManagementEnabled
}) {
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  const handleSaveEmail = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/email-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, appPassword }),
      });
      if (response.ok) {
        setSaveStatus({ type: 'success', message: 'Email settings saved successfully!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error) {
      console.error("Error saving email settings:", error);
      setSaveStatus({ type: 'error', message: 'Failed to save email settings' });
    }
  };

  const handleSavePaypal = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/email-settings/paypal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paypalClientId, paypalSecret, webhookUrl }),
      });
      if (response.ok) {
        setSaveStatus({ type: 'success', message: 'PayPal settings saved successfully!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error) {
      console.error("Error saving PayPal settings:", error);
      setSaveStatus({ type: 'error', message: 'Failed to save PayPal settings' });
    }
  };

  const handleSaveStripe = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/email-settings/stripe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stripeSecretKey }),
      });
      if (response.ok) {
        setSaveStatus({ type: 'success', message: 'Stripe settings saved successfully!' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
      }
    } catch (error) {
      console.error("Error saving Stripe settings:", error);
      setSaveStatus({ type: 'error', message: 'Failed to save Stripe settings' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500/20 p-3 rounded-lg">
            <Shield className="text-blue-400" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Integration Settings</h2>
            <p className="text-gray-400 text-sm">Configure your email and payment gateway settings securely</p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {saveStatus.message && (
        <div className={`p-4 rounded-lg border ${
          saveStatus.type === 'success' 
            ? 'bg-green-500/10 border-green-500/50 text-green-400' 
            : 'bg-red-500/10 border-red-500/50 text-red-400'
        } animate-fadeIn`}>
          {saveStatus.message}
        </div>
      )}

      {/* Email Configuration */}
      <SettingsCard 
        title="Email Configuration" 
        description="Configure SMTP settings for sending invoices via email"
        icon={<Mail className="text-blue-400" size={24} />}
        iconBg="bg-blue-500/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsInput 
            label="Email Address" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-email@example.com"
            icon={<Mail size={18} />}
          />
          <SettingsInput 
            label="App Password" 
            type="password" 
            value={appPassword} 
            onChange={(e) => setAppPassword(e.target.value)}
            placeholder="Enter app-specific password"
            icon={<Key size={18} />}
          />
        </div>
        <SaveButton text="Save Email Settings" onClick={handleSaveEmail} color="blue" />
      </SettingsCard>

      {/* PayPal Integration - Only show if payment management is enabled */}
      {paymentManagementEnabled && (
        <SettingsCard 
          title="PayPal Integration" 
          description="Connect your PayPal account to receive payments"
          icon={<DollarSign className="text-yellow-400" size={24} />}
          iconBg="bg-yellow-500/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsInput 
              label="Client ID" 
              value={paypalClientId} 
              onChange={(e) => setPaypalClientId(e.target.value)}
              placeholder="PayPal Client ID"
              icon={<Key size={18} />}
            />
            <SettingsInput 
              label="Secret Key" 
              type="password" 
              value={paypalSecret} 
              onChange={(e) => setPaypalSecret(e.target.value)}
              placeholder="PayPal Secret Key"
              icon={<Lock size={18} />}
            />
          </div>
          <SaveButton text="Save PayPal Settings" onClick={handleSavePaypal} color="yellow" />
        </SettingsCard>
      )}

      {/* Stripe Integration - Only show if payment management is enabled */}
      {paymentManagementEnabled && (
        <SettingsCard 
          title="Stripe Integration" 
          description="Connect Stripe for seamless payment processing"
          icon={<CreditCard className="text-purple-400" size={24} />}
          iconBg="bg-purple-500/20"
        >
          <SettingsInput 
            label="Secret Key" 
            type="password" 
            value={stripeSecretKey} 
            onChange={(e) => setStripeSecretKey(e.target.value)}
            placeholder="sk_test_..."
            icon={<Lock size={18} />}
          />
          <SaveButton text="Save Stripe Settings" onClick={handleSaveStripe} color="purple" />
        </SettingsCard>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

function SettingsCard({ title, description, icon, iconBg, children }) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-200">
      <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className={`${iconBg} p-2 rounded-lg`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );
}

function SettingsInput({ label, type = "text", value, onChange, placeholder, icon }) {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === "password";
  
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">{label}</label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {icon}
            </div>
          )}
          <input
            type={isPasswordField && !showPassword ? "password" : "text"}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-10 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
          />
          {isPasswordField && (
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
      </div>
    );
  }

function SaveButton({ text, onClick, color = 'blue' }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500',
    yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 focus:ring-yellow-500',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:ring-purple-500',
  };

  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 bg-gradient-to-r ${colorClasses[color]} text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800`}
    >
      {text}
    </button>
  );
}


