import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PageHeaderProps {
  title: string | React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  stats?: Array<{
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
  }>;
}

export function PageHeader({
  title,
  description,
  children,
  className,
  badge,
  stats
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4 pb-6', className)}>
      {/* Title Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {badge && (
              <Badge variant={badge.variant || 'default'}>
                {badge.text}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {children && (
          <div className="flex items-center space-x-2">
            {children}
          </div>
        )}
      </div>

      {/* Stats Section */}
      {stats && stats.length > 0 && (
        <>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-card border rounded-lg p-4 space-y-1"
              >
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.trend && (
                    <div className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      stat.trend === 'up' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                      stat.trend === 'down' && 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
                      stat.trend === 'neutral' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    )}>
                      {stat.trend === 'up' && '↗'}
                      {stat.trend === 'down' && '↘'}
                      {stat.trend === 'neutral' && '→'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}