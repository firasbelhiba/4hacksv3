'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import ProgressBar from '@/lib/progress-bar';

export function NavigationHandler() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Clean up progress bar on mount
    ProgressBar.done();
  }, []);

  useEffect(() => {
    if (isLoading || hasRedirected.current) return;

    // Handle authenticated user redirects
    if (isAuthenticated) {
      // Redirect from auth pages to dashboard
      if (pathname.startsWith('/auth/')) {
        hasRedirected.current = true;
        router.replace('/dashboard');
        return;
      }

      // Redirect from root to dashboard
      if (pathname === '/') {
        hasRedirected.current = true;
        router.replace('/dashboard');
        return;
      }
    } else {
      // Handle unauthenticated user redirects
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
        hasRedirected.current = true;
        const loginUrl = `/auth/login?callbackUrl=${encodeURIComponent(pathname)}`;
        router.replace(loginUrl);
        return;
      }

      // Redirect from root to login
      if (pathname === '/') {
        hasRedirected.current = true;
        router.replace('/auth/login');
        return;
      }
    }

    // Reset redirect flag when pathname changes
    hasRedirected.current = false;
  }, [isAuthenticated, isLoading, pathname, router]);

  return null;
}