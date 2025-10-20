'use client';

import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from './loading';

interface AuthLoadingProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthLoading({ children, fallback }: AuthLoadingProps) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground mt-4">Initializing...</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}