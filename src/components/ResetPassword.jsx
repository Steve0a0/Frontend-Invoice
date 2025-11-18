import { useState } from "react";
import { FaLock, FaSpinner, FaCheckCircle, FaEye, FaEyeSlash, FaExclamationTriangle } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from '../config/api';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    const validationErrors = [];
    
    if (pwd.length < 8) {
      validationErrors.push("At least 8 characters long");
    }
    if (!/[a-z]/.test(pwd)) {
      validationErrors.push("One lowercase letter");
    }
    if (!/[A-Z]/.test(pwd)) {
      validationErrors.push("One uppercase letter");
    }
    if (!/[0-9]/.test(pwd)) {
      validationErrors.push("One number");
    }
    if (!/[^a-zA-Z0-9]/.test(pwd)) {
      validationErrors.push("One special character");
    }
    
    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setMessage("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrors(["Passwords do not match"]);
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setErrors(passwordErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors([data.message || "An error occurred. Please try again."]);
        }
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setErrors(["Network error. Please check your connection and try again."]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 text-white p-6 rounded-2xl shadow-2xl border border-gray-700">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`inline-block p-2.5 ${success ? 'bg-green-500' : 'bg-blue-500'} rounded-full mb-3`}>
              {success ? (
                <FaCheckCircle className="text-2xl text-white" />
              ) : (
                <FaLock className="text-2xl text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {success ? "Password Reset!" : "Reset Password"}
            </h1>
            <p className="text-gray-400 text-xs">
              {success
                ? "Your password has been successfully reset"
                : "Enter your new password below"}
            </p>
          </div>

          {success ? (
            /* Success State */
            <div className="text-center">
              <p className="text-gray-400 mb-4 text-sm">{message}</p>
              <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-300">
                  Redirecting to login page...
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105 text-sm"
              >
                Go to Login Now
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Messages */}
              {errors.length > 0 && (
                <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-200 px-3 py-2.5 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-sm" />
                    <div>
                      <p className="font-semibold text-xs mb-1">Password Requirements:</p>
                      <ul className="text-xs space-y-0.5">
                        {errors.map((error, index) => (
                          <li key={index}>â€¢ {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* New Password Input */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-3 text-gray-400 text-sm" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full pl-9 pr-10 p-2.5 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-200 transition-colors text-sm"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-3 text-gray-400 text-sm" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full pl-9 pr-10 p-2.5 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-200 transition-colors text-sm"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-3">
                <p className="text-xs text-blue-300 font-semibold mb-1.5">Password must contain:</p>
                <ul className="text-xs text-gray-300 space-y-0.5">
                  <li className={password.length >= 8 ? "text-green-400" : ""}>
                    â€¢ At least 8 characters
                  </li>
                  <li className={/[a-z]/.test(password) ? "text-green-400" : ""}>
                    â€¢ One lowercase letter
                  </li>
                  <li className={/[A-Z]/.test(password) ? "text-green-400" : ""}>
                    â€¢ One uppercase letter
                  </li>
                  <li className={/[0-9]/.test(password) ? "text-green-400" : ""}>
                    â€¢ One number
                  </li>
                  <li className={/[^a-zA-Z0-9]/.test(password) ? "text-green-400" : ""}>
                    â€¢ One special character
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin text-sm" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <FaLock className="text-sm" />
                    Reset Password
                  </>
                )}
              </button>

              {/* Back to Login */}
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


