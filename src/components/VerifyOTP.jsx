import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import { API_BASE_URL } from '../config/api';

export default function VerifyOTP() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  
  const inputRefs = useRef([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("").concat(Array(6 - pastedData.length).fill(""));
    setOtp(newOtp.slice(0, 6));
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        
        // Store token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setError(data.message || "Invalid verification code");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setCountdown(60); // Start 60-second countdown
        toast.success(data.message || "New verification code sent!");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.message || "Failed to resend code");
      }
    } catch (error) {
      console.error("Resend error:", error);
      setError("An error occurred while resending code");
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8">
        <div className="bg-gray-800 text-white p-6 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md text-center">
          <div className="mb-4">
            <div className="inline-block p-3 bg-green-500 rounded-full mb-3">
              <FaCheckCircle className="text-white text-3xl" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
          <p className="text-gray-400 text-sm">Redirecting you to the dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate("/signup")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors text-sm"
        >
          <FaArrowLeft /> Back to Signup
        </button>

        <div className="bg-gray-800 text-white p-6 rounded-2xl shadow-2xl border border-gray-700">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-block p-2.5 bg-blue-500 rounded-full mb-3">
              <FaEnvelope className="text-white text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Verify Your Email</h2>
            <p className="text-gray-400 text-xs">
              We've sent a 6-digit code to
              <br />
              <span className="text-white font-semibold text-sm">{email}</span>
            </p>
          </div>

          {/* OTP Input Form */}
          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-11 h-12 text-center text-xl font-bold bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-200 px-3 py-2.5 rounded-lg mb-4 text-xs">
                {error}
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg mb-4 text-sm"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-2">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resending || countdown > 0}
                className="text-blue-400 hover:text-blue-300 font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {countdown > 0
                  ? `Resend in ${countdown}s`
                  : resending
                  ? "Sending..."
                  : "Resend Code"}
              </button>
            </div>
          </form>

          {/* Note */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-xs text-center">
              The verification code will expire in 10 minutes.
              <br />
              Please check your spam folder if you don't see the email.
            </p>
          </div>
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


