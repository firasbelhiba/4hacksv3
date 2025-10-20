import {
  LayoutDashboard,
  Trophy,
  FolderOpen,
  Brain,
  BarChart3,
  Settings,
  Plus,
  Users,
  FileText,
  Scale
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
  isActive?: boolean;
  children?: NavItem[];
}

export interface QuickAction {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  shortcut?: string;
}

export const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and quick stats'
  },
  {
    title: 'Hackathons',
    href: '/dashboard/hackathons',
    icon: Trophy,
    description: 'Manage hackathon events'
  },
  {
    title: 'AI Jury',
    href: '/dashboard/ai-jury',
    icon: Scale,
    description: 'Tournament-style project evaluation'
  }
];

export const quickActions: QuickAction[] = [
  {
    title: 'Create Hackathon',
    href: '/dashboard/hackathons/new',
    icon: Plus,
    description: 'Start a new hackathon event',
    shortcut: 'Ctrl+N'
  },
  {
    title: 'Upload Projects',
    href: '/dashboard/projects/upload',
    icon: FileText,
    description: 'Bulk upload project submissions'
  },
  {
    title: 'Manage Users',
    href: '/dashboard/users',
    icon: Users,
    description: 'View and manage participants'
  }
];

// Helper function to check if a path is active
export function isActiveRoute(currentPath: string, itemHref: string): boolean {
  if (itemHref === '/dashboard') {
    return currentPath === '/dashboard';
  }
  return currentPath.startsWith(itemHref);
}