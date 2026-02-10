import { Navigate } from "react-router-dom";

export default function RoleGuard({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const role = storedUser.role || localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = role.toLowerCase();
  const allowed = allowedRoles.map(r => r.toLowerCase());

  if (!allowed.includes(normalizedRole)) {
    if (normalizedRole.includes("task") || normalizedRole === "taskowner") {
      return <Navigate to="/dashboard/to" replace />;
    }
    if (normalizedRole.includes("solution") || normalizedRole === "solutionprovider") {
      return <Navigate to="/dashboard/sp" replace />;
    }
    if (normalizedRole.includes("admin") || normalizedRole === "admin") {
      return <Navigate to="/dashboard/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}
