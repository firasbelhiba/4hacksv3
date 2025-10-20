'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Clock, Hash } from 'lucide-react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from 'cmdk';
import { useLayout } from '@/contexts/layout-context';
import { navigationItems, quickActions } from '@/components/layout/nav-items';
import { Badge } from '@/components/ui/badge';

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  group: string;
  keywords?: string[];
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useLayout();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [recentItems, setRecentItems] = useState<string[]>([]);

  // Build search items from navigation and quick actions
  const searchItems: SearchItem[] = [
    ...navigationItems.map(item => ({
      id: item.href,
      title: item.title,
      description: item.description,
      href: item.href,
      icon: item.icon,
      badge: item.badge,
      group: 'Navigation',
      keywords: [item.title.toLowerCase()]
    })),
    ...quickActions.map(action => ({
      id: action.href,
      title: action.title,
      description: action.description,
      href: action.href,
      icon: action.icon,
      group: 'Quick Actions',
      keywords: [action.title.toLowerCase(), 'create', 'new']
    })),
    // Mock data for other sections
    {
      id: 'settings-general',
      title: 'General Settings',
      description: 'Platform configuration and preferences',
      href: '/dashboard/settings/general',
      group: 'Settings',
      keywords: ['settings', 'config', 'preferences']
    },
    {
      id: 'settings-users',
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      href: '/dashboard/settings/users',
      group: 'Settings',
      keywords: ['users', 'accounts', 'permissions']
    },
    {
      id: 'help-docs',
      title: 'Documentation',
      description: 'View platform documentation',
      href: '/dashboard/help/docs',
      group: 'Help',
      keywords: ['help', 'docs', 'documentation', 'guide']
    },
    {
      id: 'help-support',
      title: 'Contact Support',
      description: 'Get help from our support team',
      href: '/dashboard/help/support',
      group: 'Help',
      keywords: ['help', 'support', 'contact', 'assistance']
    }
  ];

  // Load recent items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('commandPalette.recent');
    if (saved) {
      try {
        setRecentItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent items:', e);
      }
    }
  }, []);

  // Save recent items to localStorage
  const addToRecent = (href: string) => {
    const updated = [href, ...recentItems.filter(item => item !== href)].slice(0, 5);
    setRecentItems(updated);
    localStorage.setItem('commandPalette.recent', JSON.stringify(updated));
  };

  // Handle item selection
  const handleSelect = (href: string) => {
    addToRecent(href);
    setCommandPaletteOpen(false);
    router.push(href);
    setSearch('');
  };

  // Filter items based on search
  const filteredItems = searchItems.filter(item => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.keywords?.some(keyword => keyword.includes(searchLower))
    );
  });

  // Group filtered items
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  // Get recent items data
  const recentItemsData = recentItems
    .map(href => searchItems.find(item => item.href === href))
    .filter(Boolean) as SearchItem[];

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <div className="bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl">
        <CommandInput
          placeholder="Search for pages, actions, or help..."
          value={search}
          onValueChange={setSearch}
          className="border-0 border-b border-border/50 focus:ring-0"
        />

        <CommandList className="max-h-[400px] overflow-y-auto">
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No results found for "{search}"
          </CommandEmpty>

          {/* Recent Items */}
          {!search && recentItemsData.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recentItemsData.map((item) => {
                  const Icon = item.icon || Hash;
                  return (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleSelect(item.href)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-purple-500/10"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Icon className="h-4 w-4 text-purple-400" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Search Results */}
          {Object.entries(groupedItems).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => {
                const Icon = item.icon || Hash;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item.href)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-purple-500/10"
                  >
                    <Icon className="h-4 w-4 text-purple-400" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>

        {/* Footer */}
        <div className="border-t border-border/50 px-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Use ↑↓ to navigate, ↵ to select, ESC to close</span>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-xs border rounded">⌘</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 text-xs border rounded">K</kbd>
            </div>
          </div>
        </div>
      </div>
    </CommandDialog>
  );
}