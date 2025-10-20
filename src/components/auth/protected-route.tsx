'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Loader2, Shield, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'JUDGE' | 'PARTICIPANT';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  fallback?: ReactNode;
  showUnauthorized?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles = ['ADMIN', 'SUPER_ADMIN'],
  requireAuth = true,
  fallback,
  showUnauthorized = true
}: ProtectedRouteProps) {
  const { user, isLoading, hasRole } = useAuth();

  // Enhanced debug logging
  console.log('🛡️ ProtectedRoute Debug:', {
    isLoading,
    hasUser: !!user,
    user: user ? { id: user.id, email: user.email, role: user.role } : null,
    requireAuth,
    allowedRoles,
    timestamp: new Date().toISOString()
  });

  // Show loading state only briefly
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Authenticating...</p>
          </div>
        </div>
      )
    );
  }

  // Check authentication - let middleware handle redirects
  if (requireAuth && !user) {
    return null;
  }

  // Check role authorization
  if (allowedRoles && !hasRole(allowedRoles)) {
    if (!showUnauthorized) {
      return null;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this resource.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Required role:</strong> {allowedRoles.join(' or ')}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Your role:</strong> {user?.role || 'None'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild className="flex-1">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button variant="default" asChild className="flex-1">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function SuperAdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles'>) {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN']} {...props}>
      {children}
    </ProtectedRoute>
  );
}

// Layout wrapper that includes authentication check
interface AuthLayoutProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  showSidebar?: boolean;
}

export function AuthLayout({
  children,
  allowedRoles = ['ADMIN', 'SUPER_ADMIN'],
  showSidebar = true
}: AuthLayoutProps) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-background">
        {showSidebar ? (
          <div className="flex">
            {/* Sidebar will be added later */}
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        ) : (
          <main className="p-6">
            {children}
          </main>
        )}
      </div>
    </ProtectedRoute>
  );
}