'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spinnerVariants, pulseVariants } from '@/lib/page-transitions';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  className?: string;
}

export function Loading({
  size = 'md',
  variant = 'spinner',
  text,
  className
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  if (variant === 'spinner') {
    return (
      <div className={cn('flex items-center justify-center space-x-2', className)}>
        <motion.div variants={spinnerVariants} animate="animate">
          <Loader2 className={cn(sizeClasses[size], 'text-purple-500')} />
        </motion.div>
        {text && (
          <span className="text-sm text-muted-foreground">{text}</span>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn(
              'rounded-full bg-purple-500',
              size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-2 w-2' : 'h-3 w-3'
            )}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
        {text && (
          <span className="ml-2 text-sm text-muted-foreground">{text}</span>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center justify-center space-x-2', className)}>
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className={cn(
            'rounded-full bg-gradient-to-r from-purple-500 to-violet-500',
            sizeClasses[size]
          )}
        />
        {text && (
          <span className="text-sm text-muted-foreground">{text}</span>
        )}
      </div>
    );
  }

  return null;
}

export function LoadingPage({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loading size="lg" variant="spinner" />
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

export function LoadingCard({ text }: { text?: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-8">
      <div className="text-center space-y-4">
        <Loading size="md" variant="dots" />
        {text && (
          <p className="text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    </div>
  );
}

export function LoadingSpinner({
  size = 'md',
  className
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return <Loading size={size} variant="spinner" className={className} />;
}

export function LoadingDots({
  size = 'md',
  className
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return <Loading size={size} variant="dots" className={className} />;
}