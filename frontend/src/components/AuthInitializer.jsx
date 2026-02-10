// src/components/AuthInitializer.jsx
// Validates auth on app startup before rendering any routes
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { forceLogout } from "../utils/api";

const API_URL = import.meta.env.VITE_API_URL;
const REQUIRED_TOKEN_VERSION = 2;

export default function AuthInitializer({ children }) {
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (!decoded.tokenVersion || decoded.tokenVersion < REQUIRED_TOKEN_VERSION) {
          console.warn("[AuthInitializer] Token version outdated - forcing re-login");
          forceLogout();
          return;
        }
      } catch (err) {
        console.warn("[AuthInitializer] Invalid token format - forcing logout");
        forceLogout();
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/validate`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          console.warn("[AuthInitializer] Token invalid/expired - forcing logout");
          forceLogout();
          return;
        }

        if (!res.ok) {
          console.warn("[AuthInitializer] Auth validation failed:", res.status);
        }
      } catch (err) {
        console.error("[AuthInitializer] Network error during validation:", err);
      } finally {
        setIsValidating(false);
      }
    };

    validateAuth();
  }, []);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] to-[#EEF2F7]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1E376E]/30 border-t-[#1E376E] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Validating session...</p>
        </div>
      </div>
    );
  }

  return children;
}
