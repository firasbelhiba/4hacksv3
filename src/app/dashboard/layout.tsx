'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { LayoutProvider } from '@/contexts/layout-context';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SimpleSidebar } from '@/components/layout/simple-sidebar';
import { SimpleHeader } from '@/components/layout/simple-header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { CommandPalette } from '@/components/ui/command-palette';
import { GradientBg } from '@/components/shared/gradient-bg';
import { pageVariants } from '@/lib/page-transitions';
import { LoadingSpinner } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/layout-context';

// Main layout component that uses layout context
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useLayout();

  return (
    <div className="min-h-screen bg-background">
      <GradientBg
        variant="primary"
        intensity="light"
        className="fixed inset-0 -z-10"
      />

      {/* Sidebar */}
      <SimpleSidebar />

      {/* Mobile Navigation - Temporarily disabled */}
      {/* <MobileNav /> */}

      {/* Command Palette - Temporarily disabled to fix focus loop */}
      {/* <CommandPalette /> */}

      {/* Main Content Area */}
      <div className={cn(
        'min-h-screen transition-all duration-300 ease-in-out',
        'md:ml-0',
        sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[280px]'
      )}>
        {/* Header */}
        <SimpleHeader />

        {/* Page Content */}
        <main className="flex-1">
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="p-4 lg:p-6 space-y-6"
          >
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner className="flex justify-center py-8" />}>
                {children}
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// Wrapper that ensures layout context is available
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <ErrorBoundary>
        <DashboardLayoutContent>
          {children}
        </DashboardLayoutContent>
      </ErrorBoundary>
    </LayoutProvider>
  );
}

// Layout wrapper that provides context
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground mt-4">Loading dashboard...</p>
          </div>
        </div>
      }
    >
      <LayoutWrapper>
        {children}
      </LayoutWrapper>
    </ProtectedRoute>
  );
}