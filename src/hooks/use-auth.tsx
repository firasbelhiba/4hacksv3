'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'JUDGE' | 'PARTICIPANT';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');

        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean }> => {
    try {
      console.log('🔐 Starting login process...');
      const result = await apiClient.auth.login({ email, password });

      console.log('✅ Login successful');

      // Store token and user in localStorage
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));

      // Also store token in cookie for middleware
      document.cookie = `auth_token=${result.token}; path=/; max-age=604800`; // 7 days

      setUser(result.user);

      toast.success('Welcome back!');

      // Navigate to dashboard with hard redirect
      window.location.href = '/dashboard';

      return { success: true };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const message = error.response?.data?.message || 'Invalid email or password';
      toast.error(message);
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      // Clear cookie
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      setUser(null);

      toast.success('Logged out successfully');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout');
    }
  };

  const hasRole = (allowedRoles: UserRole[]) => {
    if (!user?.role) return false;
    return allowedRoles.includes(user.role);
  };

  const isSuperAdmin = () => {
    return hasRole(['SUPER_ADMIN']);
  };

  const isAdmin = () => {
    return hasRole(['ADMIN', 'SUPER_ADMIN']);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
    isSuperAdmin,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hooks for specific roles
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}

export function useRequireRole(allowedRoles: UserRole[]) {
  const { hasRole, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (!hasRole(allowedRoles)) {
        router.push('/auth/unauthorized');
      }
    }
  }, [isAuthenticated, isLoading, hasRole, allowedRoles, router]);

  return { hasRole: hasRole(allowedRoles), isLoading };
}

export function useRequireSuperAdmin() {
  return useRequireRole(['SUPER_ADMIN']);
}

export function useRequireAdmin() {
  return useRequireRole(['ADMIN', 'SUPER_ADMIN']);
}