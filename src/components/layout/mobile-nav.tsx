'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/layout-context';
import { useAuth } from '@/hooks/use-auth';
import { navigationItems, isActiveRoute } from './nav-items';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function MobileNav() {
  const pathname = usePathname();
  const { mobileMenuOpen, setMobileMenuOpen } = useLayout();
  const { user, logout } = useAuth();

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="left" className="w-80 p-0 bg-background/95 backdrop-blur-xl">
        <SheetHeader className="px-6 py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-violet-400 flex items-center justify-center text-white font-medium">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <Badge variant="outline" className="text-xs mt-1">
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = isActiveRoute(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
                  'hover:bg-purple-500/10 hover:text-purple-300',
                  'border border-transparent',
                  isActive && [
                    'bg-gradient-to-r from-purple-500/20 to-violet-500/20',
                    'text-purple-300 border-purple-500/30',
                    'shadow-lg shadow-purple-500/25'
                  ]
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 transition-colors',
                  isActive ? 'text-purple-300' : 'text-muted-foreground'
                )} />

                <div className="flex items-center justify-between flex-1">
                  <span className={cn(
                    'font-medium transition-colors',
                    isActive ? 'text-white' : 'text-foreground'
                  )}>
                    {item.title}
                  </span>

                  {item.badge && (
                    <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {item.badge}
                    </Badge>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border/50 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            asChild
          >
            <Link href="/dashboard/settings" onClick={handleLinkClick}>
              Settings
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              logout();
              setMobileMenuOpen(false);
            }}
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}