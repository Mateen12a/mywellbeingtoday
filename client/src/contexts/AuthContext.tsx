import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import api from '@/lib/api';
import { invalidateAllQueries } from '@/lib/queryClient';

interface User {
  _id: string;
  email: string;
  role: 'user' | 'provider' | 'admin' | 'super_admin';
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
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; message?: string }>;
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

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
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

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await api.register(email, password, firstName, lastName);
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
    await api.logout();
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

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'super_admin':
      case 'admin':
        return '/admin/dashboard';
      case 'provider':
        return '/provider-dashboard';
      default:
        return '/dashboard';
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
    case 'super_admin':
    case 'admin':
      return '/admin/dashboard';
    case 'provider':
      return '/provider-dashboard';
    default:
      return '/dashboard';
  }
}
