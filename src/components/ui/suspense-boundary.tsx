'use client';

import { Suspense } from 'react';
import { LoadingCard, LoadingSpinner } from './loading';
import { SkeletonCard, SkeletonStats, SkeletonActivity, SkeletonQuickActions } from './skeleton';

interface SuspenseBoundaryProps {
  children: React.ReactNode;
  fallback?: 'card' | 'spinner' | 'stats' | 'activity' | 'actions' | React.ReactNode;
  className?: string;
}

export function SuspenseBoundary({
  children,
  fallback = 'spinner',
  className
}: SuspenseBoundaryProps) {
  const getFallbackComponent = () => {
    if (typeof fallback === 'string') {
      switch (fallback) {
        case 'card':
          return <SkeletonCard />;
        case 'stats':
          return <SkeletonStats />;
        case 'activity':
          return <SkeletonActivity />;
        case 'actions':
          return <SkeletonQuickActions />;
        case 'spinner':
        default:
          return <LoadingSpinner className={className} />;
      }
    }
    return fallback;
  };

  return (
    <Suspense fallback={getFallbackComponent()}>
      {children}
    </Suspense>
  );
}

export function AsyncComponent({
  children,
  loading = false,
  fallback,
  className
}: {
  children: React.ReactNode;
  loading?: boolean;
  fallback?: 'card' | 'spinner' | 'stats' | 'activity' | 'actions' | React.ReactNode;
  className?: string;
}) {
  const getFallbackComponent = () => {
    if (typeof fallback === 'string') {
      switch (fallback) {
        case 'card':
          return <SkeletonCard />;
        case 'stats':
          return <SkeletonStats />;
        case 'activity':
          return <SkeletonActivity />;
        case 'actions':
          return <SkeletonQuickActions />;
        case 'spinner':
        default:
          return <LoadingSpinner className={className} />;
      }
    }
    return fallback || <LoadingSpinner className={className} />;
  };

  if (loading) {
    return <>{getFallbackComponent()}</>;
  }

  return <>{children}</>;
}