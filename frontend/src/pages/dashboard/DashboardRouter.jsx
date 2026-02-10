// src/pages/dashboard/DashboardRouter.jsx
import { Navigate, useLocation } from "react-router-dom";

/**
 * Secure dashboard route guard.
 * Redirects users to their correct dashboard based on role,
 * and prevents access to other dashboards.
 */
export default function DashboardRouter() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();

  if (!token || !role) return <Navigate to="/login" replace />;

  const normalizedRole = role.toLowerCase();
  const path = location.pathname.toLowerCase();

  if (normalizedRole === "taskowner") {
    if (!path.includes("/dashboard/to")) {
      return <Navigate to="/dashboard/to" replace />;
    }
  } else if (normalizedRole === "solutionprovider") {
    if (!path.includes("/dashboard/sp")) {
      return <Navigate to="/dashboard/sp" replace />;
    }
  } else if (normalizedRole === "admin") {
    if (!path.includes("/dashboard/admin")) {
      return <Navigate to="/dashboard/admin" replace />;
    }
  } else {
    return <Navigate to="/login" replace />;
  }

  return null; // Allow access if role matches the current route
}
