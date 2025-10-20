import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'gradient' | 'dots';
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

export function LoadingSpinner({
  size = 'md',
  className,
  variant = 'default',
  text
}: LoadingSpinnerProps) {
  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center space-x-1', className)}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-full bg-purple-500 animate-pulse',
                size === 'sm' && 'h-1 w-1',
                size === 'md' && 'h-2 w-2',
                size === 'lg' && 'h-3 w-3',
                size === 'xl' && 'h-4 w-4'
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
        {text && (
          <span className="text-sm text-muted-foreground ml-2">{text}</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      <Loader2
        className={cn(
          sizeClasses[size],
          'animate-spin',
          variant === 'gradient'
            ? 'text-transparent bg-gradient-to-r from-purple-500 to-violet-500 bg-clip-text'
            : 'text-purple-500'
        )}
      />
      {text && (
        <span className="text-sm text-muted-foreground ml-2">{text}</span>
      )}
    </div>
  );
}

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  text = 'Loading...',
  className
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-2">
            <LoadingSpinner size="lg" variant="gradient" />
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Page loading component
export function PageLoading({ text = 'Loading page...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="xl" variant="gradient" />
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}