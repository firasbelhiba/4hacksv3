import { useState, useMemo, useCallback } from 'react';

interface Project {
  id: string;
  name: string;
  teamName: string;
  track: {
    id: string;
    name: string;
  };
  eliminated?: boolean;
  eliminationLayer?: number;
  finalScore?: number;
}

interface FilterOptions {
  searchQuery: string;
  selectedTrack: string;
  statusFilter: 'all' | 'active' | 'eliminated';
  sortBy: 'name' | 'team' | 'track' | 'score';
  sortOrder: 'asc' | 'desc';
  eliminationLayer?: number;
}

interface UseProjectFilterReturn {
  filteredProjects: Project[];
  filterOptions: FilterOptions;
  updateFilter: (updates: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  statistics: {
    total: number;
    active: number;
    eliminated: number;
    byTrack: Record<string, number>;
    byLayer: Record<number, number>;
  };
}

const defaultFilterOptions: FilterOptions = {
  searchQuery: '',
  selectedTrack: 'all',
  statusFilter: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
};

export function useProjectFilter(projects: Project[]): UseProjectFilterReturn {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultFilterOptions);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => !p.eliminated).length;
    const eliminated = projects.filter(p => p.eliminated).length;

    const byTrack = projects.reduce((acc, project) => {
      acc[project.track.name] = (acc[project.track.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byLayer = projects.reduce((acc, project) => {
      if (project.eliminated && project.eliminationLayer) {
        acc[project.eliminationLayer] = (acc[project.eliminationLayer] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    return {
      total,
      active,
      eliminated,
      byTrack,
      byLayer,
    };
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Apply search filter
    if (filterOptions.searchQuery.trim()) {
      const query = filterOptions.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query) ||
        project.teamName.toLowerCase().includes(query) ||
        project.track.name.toLowerCase().includes(query) ||
        project.id.toLowerCase().includes(query)
      );
    }

    // Apply track filter
    if (filterOptions.selectedTrack !== 'all') {
      filtered = filtered.filter(project => project.track.name === filterOptions.selectedTrack);
    }

    // Apply status filter
    switch (filterOptions.statusFilter) {
      case 'active':
        filtered = filtered.filter(project => !project.eliminated);
        break;
      case 'eliminated':
        filtered = filtered.filter(project => project.eliminated);
        break;
      // 'all' doesn't filter
    }

    // Apply elimination layer filter
    if (filterOptions.eliminationLayer !== undefined) {
      filtered = filtered.filter(project =>
        project.eliminationLayer === filterOptions.eliminationLayer
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filterOptions.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'team':
          comparison = a.teamName.localeCompare(b.teamName);
          break;
        case 'track':
          comparison = a.track.name.localeCompare(b.track.name);
          break;
        case 'score':
          comparison = (b.finalScore || 0) - (a.finalScore || 0); // Higher scores first by default
          break;
        default:
          comparison = 0;
      }

      return filterOptions.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [projects, filterOptions]);

  // Update filter options
  const updateFilter = useCallback((updates: Partial<FilterOptions>) => {
    setFilterOptions(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilterOptions(defaultFilterOptions);
  }, []);

  return {
    filteredProjects,
    filterOptions,
    updateFilter,
    resetFilters,
    statistics,
  };
}

// Utility function for debounced search
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useMemo(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}