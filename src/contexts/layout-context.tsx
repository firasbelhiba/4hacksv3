'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface LayoutContextType {
  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Mobile menu state
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Command palette state
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;

  // Loading state
  pageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Breadcrumbs state
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Loading state
  const [pageLoading, setPageLoading] = useState(false);

  // Toggle functions
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleCommandPalette = () => setCommandPaletteOpen(!commandPaletteOpen);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }

      // Cmd/Ctrl + B for sidebar toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
        } else if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, mobileMenuOpen]);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [breadcrumbs]); // Use breadcrumbs as proxy for route changes

  const value: LayoutContextType = {
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    mobileMenuOpen,
    setMobileMenuOpen,
    toggleMobileMenu,
    commandPaletteOpen,
    setCommandPaletteOpen,
    toggleCommandPalette,
    breadcrumbs,
    setBreadcrumbs,
    pageLoading,
    setPageLoading
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    // Provide fallback values instead of throwing error
    console.warn('useLayout must be used within a LayoutProvider. Using fallback values.');
    return {
      sidebarOpen: true,
      setSidebarOpen: () => {},
      sidebarCollapsed: false,
      setSidebarCollapsed: () => {},
      toggleSidebar: () => {},
      mobileMenuOpen: false,
      setMobileMenuOpen: () => {},
      toggleMobileMenu: () => {},
      commandPaletteOpen: false,
      setCommandPaletteOpen: () => {},
      toggleCommandPalette: () => {},
      breadcrumbs: [],
      setBreadcrumbs: () => {},
      pageLoading: false,
      setPageLoading: () => {}
    } as LayoutContextType;
  }
  return context;
}

// Custom hook for managing breadcrumbs
export function useBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
  const { setBreadcrumbs } = useLayout();

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    // Remove cleanup function to prevent infinite loops
  }, [JSON.stringify(breadcrumbs)]); // Use JSON.stringify to compare array contents
}