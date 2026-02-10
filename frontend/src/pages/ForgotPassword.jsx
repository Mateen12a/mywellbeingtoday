// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);

  const startResendTimer = () => {
    setResendDisabled(true);
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestCode = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setShowSignUpPrompt(false);

    try {
      console.log("Requesting code for:", email);
      const res = await fetch(`${API_URL || ""}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.error("Parse error:", parseErr, "Raw text:", text);
        throw new Error(`Server returned non-JSON: ${text.substring(0, 50)}`);
      }

      if (res.ok) {
        setMessage(data.msg);
        setStep(2);
        startResendTimer();
      } else {
        if (res.status === 404 || data.msg?.toLowerCase().includes("does not exist")) {
          setShowSignUpPrompt(true);
        } else {
          setError(data.msg || "Failed to send code");
        }
      }
    } catch (err) {
      console.error("Forgot password fetch error:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      console.log("Resending code for:", email);
      const res = await fetch(`${API_URL || ""}/api/auth/resend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.error("Parse error:", parseErr, "Raw text:", text);
        throw new Error(`Server returned non-JSON: ${text.substring(0, 50)}`);
      }

      if (res.ok) {
        setMessage(data.msg);
        startResendTimer();
      } else {
        setError(data.msg || "Failed to resend code");
      }
    } catch (err) {
      console.error("Resend code fetch error:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_URL || ""}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.error("Parse error:", parseErr, "Raw text:", text);
        throw new Error(`Server returned non-JSON: ${text.substring(0, 50)}`);
      }

      if (res.ok) {
        setMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.msg || "Failed to reset password");
      }
    } catch (err) {
      console.error("Reset password fetch error:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] to-[#EEF2F7] px-4">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md space-y-6">
        <h2 className="text-3xl font-bold text-[#1E376E] mb-2 text-center">
          {step === 1 ? "Forgot Password" : "Reset Password"}
        </h2>
        <p className="text-gray-500 text-center mb-6">
          {step === 1 
            ? "Enter your email address and we'll send you a verification code." 
            : "Enter the verification code sent to your email and your new password."}
        </p>

        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2">
            <CheckCircle size={18} />
            <p className="text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {showSignUpPrompt && (
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-200">
            <p className="text-sm">
              We couldn't find an account with that email. Please{" "}
              <Link to="/signup" className="font-semibold underline hover:text-blue-900">
                Sign Up
              </Link>{" "}
              to create a new account.
            </p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="relative flex items-center">
              <Mail className="absolute left-3 text-gray-400 pointer-events-none" size={20} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-[#357FE9] transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#357FE9] to-[#1E376E] text-white py-3 rounded-xl font-semibold shadow hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="relative flex items-center">
              <CheckCircle className="absolute left-3 text-gray-400 pointer-events-none" size={20} />
              <input
                type="text"
                placeholder="Verification Code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-[#357FE9] transition"
                required
              />
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 text-gray-400 pointer-events-none" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border p-3 pl-10 pr-10 rounded-lg focus:ring-2 focus:ring-[#357FE9] transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 text-gray-400 pointer-events-none" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border p-3 pl-10 pr-10 rounded-lg focus:ring-2 focus:ring-[#357FE9] transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#357FE9] to-[#1E376E] text-white py-3 rounded-xl font-semibold shadow hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading || resendDisabled}
                className="text-sm text-[#357FE9] hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {resendDisabled ? `Resend code in ${resendTimer}s` : "Didn't receive a code? Resend"}
              </button>
            </div>
          </form>
        )}

        <div className="pt-4 border-t border-gray-100">
          <Link
            to="/login"
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 justify-center"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
