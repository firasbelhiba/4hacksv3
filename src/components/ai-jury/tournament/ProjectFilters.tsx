'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  SortAsc,
  SortDesc,
  Users,
  Trophy,
  Target,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOptions {
  searchQuery: string;
  selectedTrack: string;
  statusFilter: 'all' | 'active' | 'eliminated';
  sortBy: 'name' | 'team' | 'track' | 'score';
  sortOrder: 'asc' | 'desc';
  eliminationLayer?: number;
}

interface Statistics {
  total: number;
  active: number;
  eliminated: number;
  byTrack: Record<string, number>;
  byLayer: Record<number, number>;
}

interface ProjectFiltersProps {
  filterOptions: FilterOptions;
  onFilterChange: (updates: Partial<FilterOptions>) => void;
  onReset: () => void;
  statistics: Statistics;
  tracks: Array<{ id: string; name: string; count: number }>;
  className?: string;
}

export function ProjectFilters({
  filterOptions,
  onFilterChange,
  onReset,
  statistics,
  tracks,
  className,
}: ProjectFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState(filterOptions.searchQuery);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ searchQuery: searchValue });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, onFilterChange]);

  const layerNames = {
    1: 'Eligibility',
    2: 'Hedera',
    3: 'Code Quality',
    4: 'Final Analysis',
  };

  const hasActiveFilters =
    filterOptions.searchQuery ||
    filterOptions.selectedTrack !== 'all' ||
    filterOptions.statusFilter !== 'all' ||
    filterOptions.eliminationLayer !== undefined;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search projects, teams, or tracks..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-4"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchValue('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Quick Filters & Advanced Toggle */}
        <div className="flex items-center gap-2">
          {/* Track Filter */}
          <Select
            value={filterOptions.selectedTrack}
            onValueChange={(value) => onFilterChange({ selectedTrack: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tracks ({statistics.total})</SelectItem>
              {tracks.map((track) => (
                <SelectItem key={track.id} value={track.name}>
                  {track.name} ({track.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filterOptions.statusFilter}
            onValueChange={(value: 'all' | 'active' | 'eliminated') =>
              onFilterChange({ statusFilter: value })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({statistics.total})</SelectItem>
              <SelectItem value="active">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Active ({statistics.active})
                </div>
              </SelectItem>
              <SelectItem value="eliminated">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  Eliminated ({statistics.eliminated})
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'transition-colors',
              isExpanded && 'bg-accent',
              hasActiveFilters && 'border-blue-500 text-blue-600'
            )}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {[
                  filterOptions.searchQuery && 'search',
                  filterOptions.selectedTrack !== 'all' && 'track',
                  filterOptions.statusFilter !== 'all' && 'status',
                  filterOptions.eliminationLayer && 'layer',
                ].filter(Boolean).length}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-card/50 border border-border/50 rounded-lg space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Sort Options */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={filterOptions.sortBy}
                      onValueChange={(value: 'name' | 'team' | 'track' | 'score') =>
                        onFilterChange({ sortBy: value })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="track">Track</SelectItem>
                        <SelectItem value="score">Score</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onFilterChange({
                          sortOrder: filterOptions.sortOrder === 'asc' ? 'desc' : 'asc',
                        })
                      }
                    >
                      {filterOptions.sortOrder === 'asc' ? (
                        <SortAsc className="w-4 h-4" />
                      ) : (
                        <SortDesc className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Elimination Layer Filter */}
                {statistics.eliminated > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Eliminated In Layer</label>
                    <Select
                      value={filterOptions.eliminationLayer?.toString() || 'all'}
                      onValueChange={(value) =>
                        onFilterChange({
                          eliminationLayer: value === 'all' ? undefined : parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Layers</SelectItem>
                        {Object.entries(statistics.byLayer).map(([layer, count]) => (
                          <SelectItem key={layer} value={layer}>
                            Layer {layer}: {layerNames[parseInt(layer) as keyof typeof layerNames]} ({count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Statistics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-lg font-bold">{statistics.total}</div>
                    <div className="text-xs text-muted-foreground">Total Projects</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-green-400" />
                  <div>
                    <div className="text-lg font-bold text-green-400">{statistics.active}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-400" />
                  <div>
                    <div className="text-lg font-bold text-red-400">{statistics.eliminated}</div>
                    <div className="text-xs text-muted-foreground">Eliminated</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-lg font-bold text-purple-400">
                      {statistics.total > 0 ? Math.round((statistics.eliminated / statistics.total) * 100) : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Elimination Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filterOptions.searchQuery && (
            <Badge variant="secondary" className="gap-1">
              <Search className="w-3 h-3" />
              "{filterOptions.searchQuery}"
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => {
                  setSearchValue('');
                  onFilterChange({ searchQuery: '' });
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {filterOptions.selectedTrack !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <Trophy className="w-3 h-3" />
              {filterOptions.selectedTrack}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => onFilterChange({ selectedTrack: 'all' })}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {filterOptions.statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filterOptions.statusFilter}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => onFilterChange({ statusFilter: 'all' })}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {filterOptions.eliminationLayer && (
            <Badge variant="secondary" className="gap-1">
              Layer {filterOptions.eliminationLayer}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => onFilterChange({ eliminationLayer: undefined })}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}