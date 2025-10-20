'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/hooks/use-auth';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/lib/progress-bar';
import { NavigationHandler } from '@/components/ui/navigation-handler';

interface ProvidersProps {
  children: ReactNode;
}

function ProgressProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Clean up any existing progress on mount
    ProgressBar.done();

    // Only listen to basic events to avoid conflicts
    const handleBeforeUnload = () => {
      setTimeout(() => ProgressBar.start(), 200);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      ProgressBar.done();
    };
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="4hacks-theme"
      >
        <AuthProvider>
          <ProgressProvider>
            {children}
          </ProgressProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}