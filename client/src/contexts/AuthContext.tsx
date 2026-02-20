import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import api from '@/lib/api';
import { invalidateAllQueries } from '@/lib/queryClient';

interface User {
  _id: string;
  email: string;
  role: 'user' | 'provider' | 'manager' | 'admin';
  profile: {
    firstName: string;
    lastName: string;
    displayName: string;
    avatarUrl?: string;
  };
  verification: {
    emailVerified: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string; requiresVerification?: boolean; email?: string; isLoginVerification?: boolean }>;
  register: (email: string, password: string, firstName: string, lastName: string, occupation?: string, occupationOther?: string, organisation?: string) => Promise<{ success: boolean; message?: string; requiresVerification?: boolean; email?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      // Check app version - force logout if version changed
      try {
        const versionResponse = await fetch('/api/version');
        if (versionResponse.ok) {
          const versionData = await versionResponse.json();
          const storedVersion = localStorage.getItem('appVersion');
          
          if (storedVersion && storedVersion !== versionData.version) {
            // Version changed - clear all cached data and force re-login
            console.log('[Session] App version changed, clearing session');
            api.clearTokens();
            invalidateAllQueries();
            localStorage.setItem('appVersion', versionData.version);
            setIsLoading(false);
            return;
          }
          
          localStorage.setItem('appVersion', versionData.version);
        }
      } catch {
        // Version check failed - continue with normal auth flow
      }

      if (api.isAuthenticated()) {
        try {
          const response = await api.getProfile();
          if (response.success && response.data?.user) {
            setUser(response.data.user);
            api.setUser(response.data.user);
          } else {
            api.clearTokens();
          }
        } catch {
          api.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await api.login(email, password, rememberMe);
      if (response.success && response.data?.requiresVerification) {
        return { success: true, requiresVerification: true, email: response.data.email, isLoginVerification: response.data.isLoginVerification };
      }
      if (response.success && response.data?.user) {
        const user = response.data.user;
        setUser(user);
        api.setUser(user);
        invalidateAllQueries();
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, occupation?: string, occupationOther?: string, organisation?: string) => {
    try {
      const response = await api.register(email, password, firstName, lastName, occupation, occupationOther, organisation);
      if (response.success && response.data?.requiresVerification) {
        return { success: true, requiresVerification: true, email: response.data.email };
      }
      if (response.success && response.data?.user) {
        const user = response.data.user;
        setUser(user);
        api.setUser(user);
        invalidateAllQueries();
        return { success: true };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore errors - local tokens already cleared
    }
    setUser(null);
    invalidateAllQueries();
    setLocation('/');
  };

  const refreshUser = async () => {
    try {
      const response = await api.getProfile();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        api.setUser(response.data.user);
      }
    } catch {
      // Silent fail
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getDashboardPath(role: string) {
  switch (role) {
    case 'admin':
    case 'manager':
      return '/admin/dashboard';
    case 'provider':
      return '/provider-dashboard';
    default:
      return '/dashboard';
  }
}
