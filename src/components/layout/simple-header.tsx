'use client';

import { useAuth } from '@/hooks/use-auth';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { LogOut, User, Sun, Moon } from 'lucide-react';
import { Logo } from '@/components/shared/logo';

export function SimpleHeader() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Logo size="sm" />
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{user.name}</span>
            </div>
          )}

          {/* Simple Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center space-x-2"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}