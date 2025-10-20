'use client';

import { cn } from '@/lib/utils';

interface ScoreMeterProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function ScoreMeter({ score, label, size = 'md', showValue = true, className }: ScoreMeterProps) {
  const getColorClass = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const sizeClasses = {
    sm: { container: 'h-2', text: 'text-xs' },
    md: { container: 'h-3', text: 'text-sm' },
    lg: { container: 'h-4', text: 'text-base' },
  };

  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className={cn('flex justify-between items-center mb-1', sizeClasses[size].text)}>
          <span className="font-medium text-foreground">{label}</span>
          {showValue && (
            <span className="text-muted-foreground">{Math.round(clampedScore)}/100</span>
          )}
        </div>
      )}
      <div className={cn(
        'relative w-full bg-muted rounded-full overflow-hidden',
        sizeClasses[size].container
      )}>
        <div
          className={cn(
            'transition-all duration-500 ease-out rounded-full',
            getColorClass(clampedScore),
            sizeClasses[size].container
          )}
          style={{ width: `${clampedScore}%` }}
        />
        {/* Gradient overlay for better visual appeal */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent to-white/20 rounded-full"
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
}