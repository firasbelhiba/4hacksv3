'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/layout-context';
import { useAuth } from '@/hooks/use-auth';
import { navigationItems, isActiveRoute } from './nav-items';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function SimpleSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout();
  const { user, logout, session, isLoading } = useAuth();

  // Removed console.log to prevent infinite re-render loop

  const sidebarVariants: Variants = {
    expanded: {
      width: '280px',
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as any }
    },
    collapsed: {
      width: '72px',
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as any }
    }
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-background/80 backdrop-blur-xl border-r border-border/50',
        'flex flex-col',
        'shadow-2xl shadow-purple-500/10',
        // Glass morphism effect
        'before:absolute before:inset-0 before:bg-gradient-to-b before:from-purple-500/5 before:to-transparent before:pointer-events-none',
        // Hide on mobile
        'hidden md:flex'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        {!sidebarCollapsed ? (
          <Logo size="md" />
        ) : (
          <div className="flex justify-center w-full">
            <Logo size="sm" showText={false} />
          </div>
        )}

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-8 w-8 p-0 hover:bg-purple-500/10"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(pathname, item.href);

          return (
            <button
              key={item.href}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔴 NAVIGATION BUTTON CLICKED!');
                console.log('🔴 Target href:', item.href);
                console.log('🔴 Current pathname:', pathname);
                console.log('🔴 Router object:', router);
                console.log('🔴 User session:', { hasUser: !!user, userEmail: user?.email });

                try {
                  console.log('🔴 Attempting router.push...');
                  router.push(item.href);
                  console.log('🔴 Router.push called successfully');
                } catch (error) {
                  console.error('🔴 Router.push error:', error);
                }
              }}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200',
                'hover:bg-purple-500/10 hover:text-purple-400',
                'group relative w-full text-left',
                isActive
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 flex-shrink-0',
                isActive ? 'text-purple-400' : 'text-muted-foreground group-hover:text-purple-400'
              )} />

              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 font-medium">
                    {item.title}
                  </span>
                  {item.badge && (
                    <Badge
                      variant={isActive ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}

              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        {!sidebarCollapsed && user && (
          <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-sm font-medium text-purple-400">
                  {user.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            'w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-500/10',
            sidebarCollapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="h-4 w-4" />
          {!sidebarCollapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </motion.aside>
  );
}