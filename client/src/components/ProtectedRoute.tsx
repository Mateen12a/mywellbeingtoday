import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/ui/page-loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'provider' | 'admin' | 'super_admin' | ('user' | 'provider' | 'admin' | 'super_admin')[];
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallbackPath = '/'
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Redirect to="/auth/login" />;
  }

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(user.role)) {
      return <Redirect to={fallbackPath} />;
    }
  }

  return <>{children}</>;
}
