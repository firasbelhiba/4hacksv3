'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/layout-context';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface BreadcrumbsProps {
  className?: string;
  showHome?: boolean;
}

export function Breadcrumbs({ className, showHome = true }: BreadcrumbsProps) {
  const { breadcrumbs } = useLayout();

  if (!breadcrumbs.length && !showHome) {
    return null;
  }

  const items = showHome
    ? [{ title: 'Dashboard', href: '/dashboard' }, ...breadcrumbs]
    : breadcrumbs;

  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}

          {index === 0 && showHome && (
            <Home className="h-4 w-4 mr-1 text-muted-foreground" />
          )}

          {item.href && index < items.length - 1 ? (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.title}
            </Link>
          ) : (
            <span className={cn(
              index === items.length - 1
                ? 'text-foreground font-medium'
                : 'text-muted-foreground'
            )}>
              {item.title}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}