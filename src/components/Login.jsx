import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jwtDecode from "jwt-decode";
import { GoogleLogin } from '@react-oauth/google';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle, FaSpinner, FaGoogle } from "react-icons/fa";
import { API_BASE_URL } from '../config/api';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);

  const navigate = useNavigate();

  // Check for account lockout on mount
  useEffect(() => {
    const lockout = localStorage.getItem("lockoutTime");
    if (lockout) {
      const lockoutExpiry = parseInt(lockout);
      if (Date.now() < lockoutExpiry) {
        setIsLocked(true);
        setLockoutTime(lockoutExpiry);
        const timeRemaining = Math.ceil((lockoutExpiry - Date.now()) / 1000 / 60);
        setMessage(`Account locked. Please try again in ${timeRemaining} minutes.`);
      } else {
        localStorage.removeItem("lockoutTime");
        localStorage.removeItem("loginAttempts");
      }
    }

    // Load saved email if remember me was checked
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Update lockout timer
  useEffect(() => {
    if (isLocked && lockoutTime) {
      const interval = setInterval(() => {
        const timeRemaining = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
        if (timeRemaining <= 0) {
          setIsLocked(false);
          setLockoutTime(null);
          setLoginAttempts(0);
          setMessage("");
          localStorage.removeItem("lockoutTime");
          localStorage.removeItem("loginAttempts");
          clearInterval(interval);
        } else {
          setMessage(`Account locked. Please try again in ${timeRemaining} minutes.`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLocked, lockoutTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (isLocked) {
      const timeRemaining = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
      setMessage(`Account locked. Please try again in ${timeRemaining} minutes.`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Reset login attempts on success
        localStorage.removeItem("loginAttempts");
        localStorage.removeItem("lockoutTime");

        // Handle remember me
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        const decodedToken = jwtDecode(data.token);
        const userData = {
          id: decodedToken.id,
          name: decodedToken.name || data.user?.name || "User",
          email: data.user?.email || decodedToken.email,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        
        // Store token with extended expiry if remember me is checked
        if (rememberMe) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("tokenExpiry", (Date.now() + 30 * 24 * 60 * 60 * 1000).toString()); // 30 days
        } else {
          localStorage.setItem("token", data.token);
        }

        scheduleLogout(decodedToken.exp * 1000);
        
        setMessage("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else if (response.status === 403 && data.requiresVerification) {
        // Email not verified - redirect to OTP verification
        setMessage(data.message);
        setTimeout(() => {
          navigate("/verify-otp", { state: { email } });
        }, 2000);
      } else {
        // Handle failed login attempt
        const attempts = loginAttempts + 1;
        setLoginAttempts(attempts);
        localStorage.setItem("loginAttempts", attempts.toString());

        if (attempts >= 5) {
          // Lock account for 15 minutes
          const lockout = Date.now() + 15 * 60 * 1000;
          setIsLocked(true);
          setLockoutTime(lockout);
          localStorage.setItem("lockoutTime", lockout.toString());
          setMessage("Too many failed attempts. Account locked for 15 minutes.");
        } else {
          setMessage(data.message || "Invalid credentials. Please try again.");
          if (attempts >= 3) {
            setMessage(`Invalid credentials. ${5 - attempts} attempts remaining before lockout.`);
          }
        }
      }
    } catch (error) {
      setMessage("Network error. Please check your connection.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleLogout = (expiryTime) => {
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;

    if (timeUntilExpiry > 0) {
      setTimeout(() => {
        logoutUser();
      }, timeUntilExpiry);
    } else {
      logoutUser();
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login", { state: { message: "Your session has expired. Please log in again." } });
  };

  // Handle Google Login Success
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      
      // Send Google token to backend for verification
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
        // Reset login attempts on success
        localStorage.removeItem("loginAttempts");
        localStorage.removeItem("lockoutTime");

        const decodedToken = jwtDecode(data.token);
        const userData = {
          id: decodedToken.id,
          name: data.user?.name || decodedToken.name || "User",
          email: data.user?.email || decodedToken.email,
          profileImage: data.user?.profileImage || "",
        };

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", data.token);

        scheduleLogout(decodedToken.exp * 1000);

        setMessage("Google login successful! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
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

  // Handle Google Login Error
  const handleGoogleError = () => {
    setMessage("Google authentication failed. Please try again.");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (Date.now() >= decodedToken.exp * 1000) {
          logoutUser();
        } else {
          scheduleLogout(decodedToken.exp * 1000);
        }
      } catch (error) {
        logoutUser();
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8">
      <div className="bg-gray-800 text-white p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 my-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block p-2.5 bg-blue-500 rounded-full mb-3">
            <FaUser className="text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Welcome Back
          </h2>
          <p className="text-gray-400 text-xs">Sign in to continue to your account</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              message.includes("successful")
                ? "bg-green-500 bg-opacity-10 border border-green-500"
                : "bg-red-500 bg-opacity-10 border border-red-500"
            }`}
          >
            {message.includes("successful") ? <FaCheckCircle className="text-sm text-green-200" /> : <FaTimesCircle className="text-sm text-red-200" />}
            <span className={`text-xs font-medium ${message.includes("successful") ? "text-green-200" : "text-red-200"}`}>{message}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <div className="relative">
              <FaUser className="absolute top-3 left-3 text-gray-400 text-sm" />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-9 p-2.5 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLocked}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="relative">
              <FaLock className="absolute top-3 left-3 text-gray-400 text-sm" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full pl-9 pr-9 p-2.5 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLocked}
              />
              <button
                type="button"
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 transition-colors text-sm"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLocked}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <label className="flex items-center cursor-pointer hover:text-gray-300 transition-colors">
              <input
                type="checkbox"
                className="mr-2 w-4 h-4 accent-blue-500 cursor-pointer"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLocked}
              />
              Remember Me
            </label>
            <a href="/forgot-password" className="hover:text-blue-400 transition-colors font-medium">
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading || isLocked}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin text-sm" />
                Signing In...
              </>
            ) : isLocked ? (
              "Account Locked"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Google Sign-In Section - Only show if configured */}
        {window.GOOGLE_CLIENT_ID && (
          <>
            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-600"></div>
              <span className="px-3 text-gray-400 text-xs">OR</span>
              <div className="flex-1 border-t border-gray-600"></div>
            </div>

            {/* Google Sign-In Button - Custom Styled */}
            <button
              onClick={() => {
                // Trigger Google login programmatically
                document.querySelector('[aria-labelledby="button-label"]')?.click();
              }}
              disabled={isLocked}
              className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 p-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 border border-gray-300 text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>

            {/* Hidden Google Login for functionality */}
            <div className="hidden">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
              />
            </div>
          </>
        )}

        {/* Sign-up Option */}
        <p className="text-center text-gray-400 mt-4 text-xs">
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Sign Up
          </a>
        </p>

        {/* Security Notice */}
        <div className="mt-4 p-2.5 bg-gray-900 bg-opacity-50 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            🔒 Your connection is secure. We protect your data with industry-standard encryption.
          </p>
        </div>
      </div>
    </div>
  );
}

