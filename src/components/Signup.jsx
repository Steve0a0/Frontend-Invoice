import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import jwtDecode from "jwt-decode";
import { API_BASE_URL } from '../config/api';
import { FaUser, FaEnvelope, FaLock, FaBuilding, FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle, FaSpinner, FaGoogle } from "react-icons/fa";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "", color: "" });
  const [validationErrors, setValidationErrors] = useState({});

  const navigate = useNavigate();

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (!password) return { score: 0, text: "", color: "" };

    // Length
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Complexity
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // Determine strength
    if (score <= 2) return { score, text: "Weak", color: "text-red-400" };
    if (score <= 4) return { score, text: "Medium", color: "text-yellow-400" };
    return { score, text: "Strong", color: "text-green-400" };
  };

  // Real-time validation
  const validateField = (name, value) => {
    const errors = { ...validationErrors };

    switch (name) {
      case "username":
        if (value.length < 2) {
          errors.username = "Username must be at least 2 characters";
        } else {
          delete errors.username;
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.email = "Please enter a valid email address";
        } else {
          delete errors.email;
        }
        break;
      case "password":
        if (value.length < 8) {
          errors.password = "Password must be at least 8 characters";
        } else if (!/[a-z]/.test(value)) {
          errors.password = "Password must contain a lowercase letter";
        } else if (!/[A-Z]/.test(value)) {
          errors.password = "Password must contain an uppercase letter";
        } else if (!/[0-9]/.test(value)) {
          errors.password = "Password must contain a number";
        } else if (!/[^a-zA-Z0-9]/.test(value)) {
          errors.password = "Password must contain a special character";
        } else {
          delete errors.password;
        }
        break;
      case "confirmPassword":
        if (value !== formData.password) {
          errors.confirmPassword = "Passwords do not match";
        } else {
          delete errors.confirmPassword;
        }
        break;
      case "companyName":
        if (value.length < 2) {
          errors.companyName = "Company name must be at least 2 characters";
        } else {
          delete errors.companyName;
        }
        break;
      default:
        break;
    }

    setValidationErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);

    // Update password strength
    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validate all fields
    Object.keys(formData).forEach((key) => validateField(key, formData[key]));

    // Check if there are validation errors
    if (Object.keys(validationErrors).length > 0) {
      setMessage("Please fix all errors before submitting");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.username,
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Check if OTP verification is required
        if (data.requiresVerification) {
          setMessage(data.message);
          // Redirect to OTP verification page
          setTimeout(() => {
            navigate("/verify-otp", { state: { email: formData.email } });
          }, 1500);
        } else {
          // Legacy flow (shouldn't happen with new implementation)
          setMessage("Account created successfully! Redirecting to login...");
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      } else {
        setMessage(data.message || "Something went wrong");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Signup
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      
      // Send Google token to backend
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        setMessage("Google signup successful! Redirecting to dashboard...");
        
        const decodedToken = jwtDecode(data.token);
        const userData = {
          id: decodedToken.id,
          name: data.user?.name || decodedToken.name || "User",
          email: data.user?.email || decodedToken.email,
          profileImage: data.user?.profileImage || "",
        };

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", data.token);

        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setMessage(data.message || "Google authentication failed");
      }
    } catch (error) {
      setMessage("Google authentication error. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setMessage("Google authentication failed. Please try again.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-4">
      <div className="bg-gray-800 text-white p-5 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 my-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-block p-2 bg-blue-500 rounded-full mb-2">
            <FaUser className="text-xl" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            Create Account
          </h2>
          <p className="text-gray-400 text-xs">Join us and start managing your invoices</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-3 p-2 rounded-lg flex items-center gap-2 ${
              message.includes("successfully")
                ? "bg-green-500 bg-opacity-10 border border-green-500"
                : "bg-red-500 bg-opacity-10 border border-red-500"
            }`}
          >
            {message.includes("successfully") ? <FaCheckCircle className="text-xs text-green-200" /> : <FaTimesCircle className="text-xs text-red-200" />}
            <span className={`text-xs font-medium ${message.includes("successfully") ? "text-green-200" : "text-red-200"}`}>{message}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* Name and Company - Row 1 */}
          <div className="grid grid-cols-2 gap-3">
            {/* Username Input */}
            <div>
              <div className="relative">
                <FaUser className="absolute top-2.5 left-3 text-gray-400 text-sm" />
                <input
                  type="text"
                  name="username"
                  placeholder="Full Name"
                  className={`w-full pl-9 p-2.5 bg-gray-700 bg-opacity-50 border ${
                    validationErrors.username ? "border-red-500" : "border-gray-600"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm`}
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              {validationErrors.username && (
                <p className="text-red-400 text-xs mt-1 ml-1">{validationErrors.username}</p>
              )}
            </div>

            {/* Company Name Input */}
            <div>
              <div className="relative">
                <FaBuilding className="absolute top-2.5 left-3 text-gray-400 text-sm" />
                <input
                  type="text"
                  name="companyName"
                  placeholder="Company Name"
                  className={`w-full pl-9 p-2.5 bg-gray-700 bg-opacity-50 border ${
                    validationErrors.companyName ? "border-red-500" : "border-gray-600"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm`}
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>
              {validationErrors.companyName && (
                <p className="text-red-400 text-xs mt-1 ml-1">{validationErrors.companyName}</p>
              )}
            </div>
          </div>

          {/* Email Input - Full Width */}
          <div>
            <div className="relative">
              <FaEnvelope className="absolute top-2.5 left-3 text-gray-400 text-sm" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                className={`w-full pl-9 p-2.5 bg-gray-700 bg-opacity-50 border ${
                  validationErrors.email ? "border-red-500" : "border-gray-600"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm`}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            {validationErrors.email && (
              <p className="text-red-400 text-xs mt-1 ml-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <div className="relative">
              <FaLock className="absolute top-2 left-2.5 text-gray-400 text-xs" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className={`w-full pl-8 pr-8 p-2 bg-gray-700 bg-opacity-50 border ${
                  validationErrors.password ? "border-red-500" : "border-gray-600"
                } rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 text-xs`}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="absolute top-2 right-2.5 text-gray-400 hover:text-gray-200 transition-colors text-xs"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-gray-400">Strength:</span>
                  <span className={`text-xs font-semibold ${passwordStrength.color}`}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.score <= 2
                        ? "bg-red-500"
                        : passwordStrength.score <= 4
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {validationErrors.password && (
              <p className="text-red-400 text-xs mt-0.5 ml-1">{validationErrors.password}</p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <div className="relative">
              <FaLock className="absolute top-2 left-2.5 text-gray-400 text-xs" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                className={`w-full pl-8 pr-8 p-2 bg-gray-700 bg-opacity-50 border ${
                  validationErrors.confirmPassword ? "border-red-500" : "border-gray-600"
                } rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 text-xs`}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="absolute top-2 right-2.5 text-gray-400 hover:text-gray-200 transition-colors text-xs"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-red-400 text-xs mt-0.5 ml-1">{validationErrors.confirmPassword}</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-2 text-xs">
            <p className="text-gray-400 mb-1 font-semibold text-xs">Password must have:</p>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-gray-500 text-xs">
              <li className={formData.password.length >= 8 ? "text-green-400" : ""}>
                • 8+ chars
              </li>
              <li className={/[0-9]/.test(formData.password) ? "text-green-400" : ""}>
                • Number
              </li>
              <li className={/[a-z]/.test(formData.password) ? "text-green-400" : ""}>
                • Lowercase
              </li>
              <li className={/[^a-zA-Z0-9]/.test(formData.password) ? "text-green-400" : ""}>
                • Special
              </li>
              <li className={/[A-Z]/.test(formData.password) ? "text-green-400" : ""}>
                • Uppercase
              </li>
            </ul>
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            disabled={isLoading || Object.keys(validationErrors).length > 0}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin text-sm" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-3">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="px-2 text-gray-400 text-xs">OR</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>

        {/* Google Sign-Up Button - Custom Styled */}
        {window.GOOGLE_CLIENT_ID && (
          <button
            onClick={() => {
              // Trigger Google login programmatically
              document.querySelector('[aria-labelledby="button-label"]')?.click();
            }}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 p-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 border border-gray-300 group text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Sign up with Google</span>
          </button>
        )}

        {/* Hidden Google Login for functionality */}
        {window.GOOGLE_CLIENT_ID && (
          <div className="hidden">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
            />
          </div>
        )}

        {/* Already have an account? */}
        <p className="text-center text-gray-400 mt-3 text-xs">
          Already have an account?{" "}
          <a href="/" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}

