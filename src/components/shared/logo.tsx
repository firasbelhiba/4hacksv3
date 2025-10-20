import { Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
}

const sizeClasses = {
  sm: {
    icon: 'h-5 w-5',
    text: 'text-lg',
    container: 'p-1.5'
  },
  md: {
    icon: 'h-6 w-6',
    text: 'text-xl',
    container: 'p-2'
  },
  lg: {
    icon: 'h-8 w-8',
    text: 'text-3xl',
    container: 'p-3'
  }
};

export function Logo({
  className,
  showText = true,
  size = 'md',
  variant = 'default'
}: LogoProps) {
  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      {/* Logo Icon */}
      <div className={cn(
        'bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center',
        sizes.container,
        variant === 'minimal' && 'bg-none bg-transparent border border-purple-500/30'
      )}>
        <Terminal className={cn(sizes.icon, 'text-white')} />
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={cn(
            'font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent',
            sizes.text
          )}>
            4hacks
          </h1>
          {size !== 'sm' && (
            <p className="text-xs text-muted-foreground -mt-1">
              Hackathon Platform
            </p>
          )}
        </div>
      )}
    </div>
  );
}