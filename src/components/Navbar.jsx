import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaUserCircle, FaBars, FaTimes, FaFileInvoiceDollar, FaCog } from "react-icons/fa";
import { MdDashboard, MdEmail } from "react-icons/md";
import { HiTemplate } from "react-icons/hi";
import { usePaymentManagement } from "../context/PaymentContext";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { paymentManagementEnabled, togglePaymentManagement } = usePaymentManagement();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Get user info from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Check if current path matches
  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [];

  return (
    <nav className="bg-gray-900 border-b border-gray-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Company Name */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="bg-gray-800 p-2 rounded-lg shadow-md group-hover:bg-gray-700 transition-all duration-200">
              <FaFileInvoiceDollar className="h-6 w-6 text-blue-500" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight hidden sm:block">
              InvoiceGen
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {navLinks.length > 0 && (
            <div className="hidden md:flex items-center space-x-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isActive(link.path)
                        ? "bg-blue-600/20 border border-blue-500 text-white shadow-lg"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white border border-transparent"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-semibold">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Side - Profile Only */}
          <div className="flex items-center space-x-4">
            {/* Dedicated Settings button */}
            

            <Link
              to="/dashboard/settings"
              className="flex items-center space-x-2 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-full transition-all duration-200 border border-gray-600/40 text-sm font-medium"
            >
              <FaCog className="w-4 h-4 text-blue-400" />
              {/* <span>Settings</span> */}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 px-3 py-2 rounded-full text-sm text-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <FaUserCircle className="w-7 h-7 text-gray-400" />
                {user && (
                  <span className="hidden sm:block text-white font-medium">
                    {user.name || user.email?.split("@")[0]}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden animate-fadeIn">
                  {user && (
                    <div className="px-4 py-3 bg-gray-900 border-b border-gray-700">
                      <p className="text-sm font-semibold text-white">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {user.email}
                      </p>
                    </div>
                  )}
                  <ul className="py-1">
                    {/* Payment Management Toggle */}
                    <li className="px-4 py-2.5 ">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Payment Mode</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePaymentManagement();
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                            paymentManagementEnabled ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                              paymentManagementEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {paymentManagementEnabled ? 'PayPal & Stripe enabled' : 'Email-only mode'}
                      </p>
                    </li>
                    
                    <li className="border-t border-gray-700">
                      <button
                        className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors duration-150"
                        onClick={handleLogout}
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-400 p-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <FaTimes className="w-6 h-6" />
              ) : (
                <FaBars className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 animate-slideDown">
            <div className="space-y-2 px-2">
              {navLinks.length > 0 &&
                navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${
                        isActive(link.path)
                          ? "bg-blue-600/20 text-white border border-blue-500"
                          : "bg-gray-800 text-gray-300 border border-gray-700"
                      }`}
                    >
                      <Icon className="w-5 h-5 text-blue-400" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              
              <Link
                to="/dashboard/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gray-800 text-gray-200 border border-gray-700"
              >
                <FaCog className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </nav>
  );
}
