import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/ui/page-loader";

type Role = 'user' | 'provider' | 'support' | 'manager' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role | Role[];
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
    if (!allowedRoles.includes(user.role as Role)) {
      return <Redirect to={fallbackPath} />;
    }
  }

  return <>{children}</>;
}
