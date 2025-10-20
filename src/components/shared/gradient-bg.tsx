'use client';

import { cn } from '@/lib/utils';

interface GradientBgProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'mesh' | 'animated';
  intensity?: 'light' | 'medium' | 'strong';
  overlay?: boolean;
}

const gradientVariants = {
  primary: 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900',
  secondary: 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900',
  mesh: 'bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20',
  animated: 'bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600'
};

const intensityClasses = {
  light: 'opacity-60',
  medium: 'opacity-80',
  strong: 'opacity-100'
};

export function GradientBg({
  children,
  className,
  variant = 'primary',
  intensity = 'medium',
  overlay = false
}: GradientBgProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Main Gradient Background */}
      <div className={cn(
        'absolute inset-0',
        gradientVariants[variant],
        intensityClasses[intensity],
        variant === 'animated' && 'animate-gradient-x bg-[length:400%_400%]'
      )} />

      {/* Mesh Pattern Overlay */}
      {variant === 'mesh' && (
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      )}

      {/* Optional Dark Overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-black/20" />
      )}

      {/* Floating Orbs for Enhanced Effect */}
      {variant === 'primary' && (
        <>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </>
      )}

      {/* Content */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}

// Utility component for gradient text
interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'rainbow';
}

const textGradients = {
  primary: 'bg-gradient-to-r from-purple-400 to-violet-400',
  secondary: 'bg-gradient-to-r from-blue-400 to-cyan-400',
  rainbow: 'bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400'
};

export function GradientText({
  children,
  className,
  variant = 'primary'
}: GradientTextProps) {
  return (
    <span className={cn(
      textGradients[variant],
      'bg-clip-text text-transparent font-semibold',
      className
    )}>
      {children}
    </span>
  );
}