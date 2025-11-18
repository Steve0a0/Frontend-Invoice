import { Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar";
import InvoicesDashboard from "../components/InvoicesDashboard";
import SettingsPage from "../components/SettingsPage";
import Footer from "../components/Footer";

export default function Dashboard() {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        {/* ✅ Navbar at the Top */}
        <Navbar />
  
        {/* ✅ Main Content */}
        <main className="flex-grow w-full">
          <Routes>
            <Route path="/" element={<InvoicesDashboard />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
  
        {/* ✅ Footer sticks to bottom if content is short */}
        <Footer />
      </div>
    );
  }
  

