'use client';

import { useState } from 'react';
import { Search, Bell, Plus, Menu, Settings, User, LogOut, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/layout-context';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Breadcrumbs } from './breadcrumbs';
import { quickActions } from './nav-items';

export function Header() {
  const { sidebarCollapsed, toggleMobileMenu, toggleCommandPalette } = useLayout();
  const { user, logout } = useAuth();
  const [notifications] = useState(3); // Mock notification count

  return (
    <header className={cn(
      'sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border/50',
      'flex items-center gap-4 px-4 lg:px-6',
      'shadow-sm',
      // Glass morphism effect
      'before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-500/5 before:to-transparent before:pointer-events-none'
    )}>
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMobileMenu}
        className="md:hidden h-8 w-8 p-0"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Breadcrumbs */}
      <div className="hidden md:flex">
        <Breadcrumbs />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search... (⌘K)"
          className="pl-9 bg-background/50 border-border/50 focus:bg-background"
          onClick={toggleCommandPalette}
          readOnly
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Quick Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-background/50 border-border/50">
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem key={action.href} asChild>
                  <a href={action.href} className="flex items-center">
                    <Icon className="h-4 w-4 mr-2" />
                    <div className="flex flex-col">
                      <span>{action.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {action.description}
                      </span>
                    </div>
                    {action.shortcut && (
                      <kbd className="ml-auto text-xs text-muted-foreground">
                        {action.shortcut}
                      </kbd>
                    )}
                  </a>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notifications */}
      <Button
        variant="ghost"
        size="sm"
        className="relative h-8 w-8 p-0 hover:bg-purple-500/10"
      >
        <Bell className="h-4 w-4" />
        {notifications > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
          >
            {notifications}
          </Badge>
        )}
      </Button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <div className="h-7 w-7 rounded-full bg-gradient-to-r from-purple-400 to-violet-400 flex items-center justify-center text-white font-medium text-xs">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
              <Badge variant="outline" className="text-xs w-fit mt-1">
                {user?.role}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <a href="/dashboard/profile" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Profile
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/dashboard/settings" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/dashboard/appearance" className="flex items-center">
                <Palette className="h-4 w-4 mr-2" />
                Appearance
              </a>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}