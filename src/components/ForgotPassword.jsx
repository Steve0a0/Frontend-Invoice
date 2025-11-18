import { useState } from "react";
import { FaEnvelope, FaSpinner, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../config/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmailSent(true);
      } else {
        setError(data.message || "An error occurred. Please try again.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back to Login */}
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors text-sm"
        >
          <FaArrowLeft />
          <span>Back to Login</span>
        </button>

        <div className="bg-gray-800 text-white p-6 rounded-2xl shadow-2xl border border-gray-700">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-block p-2.5 bg-blue-500 rounded-full mb-3">
              <FaEnvelope className="text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Forgot Password?</h1>
            <p className="text-gray-400 text-xs">
              {emailSent
                ? "Check your email for reset instructions"
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          {emailSent ? (
            /* Success State */
            <div className="text-center">
              <div className="inline-block p-3 bg-green-500 bg-opacity-10 rounded-full mb-4 border border-green-500">
                <FaCheckCircle className="text-3xl text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Email Sent!</h3>
              <p className="text-gray-400 mb-4 text-sm">{message}</p>
              <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-3 mb-4">
                <p className="text-xs text-white">
                  <strong>Didn't receive the email?</strong>
                  <br />
                  Check your spam folder or try again in a few minutes.
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105 text-sm"
              >
                Return to Login
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-200 px-3 py-2.5 rounded-lg text-xs flex items-center gap-2">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3 text-gray-400 text-sm" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full pl-9 pr-4 p-2.5 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin text-sm" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <FaEnvelope className="text-sm" />
                    Send Reset Link
                  </>
                )}
              </button>

              {/* Additional Help */}
              <div className="text-center">
                <p className="text-gray-400 text-xs">
                  Remember your password?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-2.5 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            ðŸ”’ Your connection is secure. We protect your data with industry-standard encryption.
          </p>
        </div>
      </div>
    </div>
  );
}


