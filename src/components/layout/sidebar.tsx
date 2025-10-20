'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/layout-context';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-media-query';
import { navigationItems, isActiveRoute } from './nav-items';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useLayout();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const sidebarVariants = {
    expanded: {
      width: '280px',
      transition: { duration: 0.3 }
    },
    collapsed: {
      width: '72px',
      transition: { duration: 0.3 }
    }
  };

  const contentVariants = {
    expanded: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.2, delay: 0.1 }
    },
    collapsed: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <TooltipProvider>
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
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
              >
                <Logo size="md" />
              </motion.div>
            )}
          </AnimatePresence>

          {sidebarCollapsed && (
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
            const isActive = isActiveRoute(pathname, item.href);
            const Icon = item.icon;

            const navItem = (
              <button
                key={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Navigation clicked:', item.href);
                  router.push(item.href);
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'hover:bg-purple-500/10 hover:text-purple-300',
                  'group relative w-full text-left',
                  isActive && [
                    'bg-gradient-to-r from-purple-500/20 to-violet-500/20',
                    'text-purple-300 shadow-lg shadow-purple-500/25',
                    'border border-purple-500/30'
                  ],
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-violet-400 rounded-r-full"
                    initial={false}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  />
                )}

                {/* Icon */}
                <Icon className={cn(
                  'h-5 w-5 transition-colors',
                  isActive ? 'text-purple-300' : 'text-muted-foreground group-hover:text-purple-300'
                )} />

                {/* Text and Badge */}
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      variants={contentVariants}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      className="flex items-center justify-between flex-1"
                    >
                      <span className={cn(
                        'font-medium transition-colors',
                        isActive ? 'text-white' : 'text-muted-foreground group-hover:text-white'
                      )}>
                        {item.title}
                      </span>

                      {item.badge && (
                        <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                          {item.badge}
                        </Badge>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );

            // Wrap with tooltip when collapsed
            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {navItem}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.title}
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navItem;
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border/50">
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-lg',
            'bg-card/50 border border-border/50',
            sidebarCollapsed && 'justify-center'
          )}>
            {/* User Avatar */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 to-violet-400 flex items-center justify-center text-white font-medium text-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>

            {/* User Info */}
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  variants={contentVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {user?.role}
                    </Badge>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Logout Button */}
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Logout
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400 flex-shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}