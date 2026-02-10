// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (searchParams.get("session") === "expired") {
      setSessionExpired(true);
    }
  }, [searchParams]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.error("Failed to parse login response:", text);
        throw new Error("Invalid response from server");
      }

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("user", JSON.stringify(data.user));

        try {
          const versionRes = await fetch(`${API_URL}/api/auth/session-version`);
          const text = await versionRes.text();
          const versionData = text ? JSON.parse(text) : {};
          localStorage.setItem("sessionVersion", versionData.version);
        } catch (err) {
          console.error("Failed to fetch session version:", err);
        }

        if (data.user.role === "taskOwner") navigate("/dashboard/to");
        else if (data.user.role === "solutionProvider") navigate("/dashboard/sp");
        else if (data.user.role === "admin") navigate("/dashboard/admin");
        else navigate("/");
      } else {
        if (data.msg === "Invalid credentials") {
          setLoginError("invalid_credentials");
        } else {
          setLoginError(data.msg || "Login failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] to-[#EEF2F7] px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md space-y-6 relative"
        style={{
          animation: "fadeIn 0.3s ease-out forwards",
          "@keyframes fadeIn": {
            from: { opacity: 0, transform: "translateY(8px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        <h2 className="text-3xl font-bold text-[#1E376E] mb-6 text-center">Welcome Back</h2>

        {sessionExpired && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Your session has expired. Please log in again.</span>
          </div>
        )}

        {loginError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              {loginError === "invalid_credentials" ? (
                <span>
                  The email or password you entered is incorrect. Please try again or{" "}
                  <Link to="/signup" className="font-semibold underline hover:text-red-800">
                    Sign Up
                  </Link>
                  .
                </span>
              ) : (
                <span>{loginError}</span>
              )}
            </div>
          </div>
        )}

        <div>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9] transition"
            required
          />
        </div>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg shadow-sm pr-10 focus:ring-2 focus:ring-[#357FE9] transition"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#357FE9] to-[#1E376E] text-white py-3 rounded-xl font-semibold shadow hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <div className="text-right">
          <Link to="/forgot-password" title="Forgot Password" className="text-[#357FE9] text-sm font-medium hover:underline">
            Forgot password?
          </Link>
        </div>

        <p className="mt-4 text-gray-600 text-center">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-[#E96435] font-semibold hover:underline">
            Sign up
          </Link>
        </p>

        <Link
          to="/"
          className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 justify-center"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Landing Page
        </Link>
      </form>
    </div>
  );
}
