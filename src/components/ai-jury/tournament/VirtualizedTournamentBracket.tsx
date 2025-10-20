'use client';

import React, { useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Crown,
  Users,
  Filter,
  Code,
  CheckCircle,
  X,
  Target,
  Zap,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualizedProjectGrid, useGridDimensions, VirtualizedProjectCard } from './VirtualizedProjectGrid';
import { ProjectFilters } from './ProjectFilters';
import { useProjectFilter } from '@/hooks/useProjectFilter';

interface Project {
  id: string;
  name: string;
  teamName: string;
  track: {
    id: string;
    name: string;
  };
  githubUrl?: string;
  demoUrl?: string;
  eliminated?: boolean;
  eliminationLayer?: number;
  finalScore?: number;
  layerResults?: Record<number, any>;
}

interface LayerResult {
  projectId: string;
  eliminated: boolean;
  score?: number;
  reason?: string;
  evidence: any;
  layer: number;
}

interface VirtualizedTournamentBracketProps {
  projects: Project[];
  layerResults: Record<number, LayerResult[]>;
  currentLayer: number;
  sessionStatus: string;
  onProjectClick?: (project: Project) => void;
  className?: string;
}

const layerConfig = {
  1: {
    name: 'Eligibility',
    icon: Filter,
    color: 'from-blue-500 to-cyan-500',
    description: 'Basic eligibility criteria check',
  },
  2: {
    name: 'Hedera',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    description: 'Hedera technology verification',
  },
  3: {
    name: 'Code Quality',
    icon: Code,
    color: 'from-orange-500 to-red-500',
    description: 'Code richness and quality assessment',
  },
  4: {
    name: 'Final Analysis',
    icon: Trophy,
    color: 'from-green-500 to-emerald-500',
    description: 'Coherence and innovation scoring',
  },
};

export function VirtualizedTournamentBracket({
  projects,
  layerResults,
  currentLayer,
  sessionStatus,
  onProjectClick,
  className,
}: VirtualizedTournamentBracketProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height, itemsPerRow } = useGridDimensions(containerRef);
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Process projects with elimination data
  const bracketProjects: Project[] = useMemo(() => {
    return projects.map((project) => {
      const projectLayerResults: Record<number, LayerResult> = {};
      let eliminated = false;
      let eliminationLayer: number | undefined;
      let finalScore = 0;

      // Check each layer for this project
      for (let layer = 1; layer <= 4; layer++) {
        const layerResult = layerResults[layer]?.find((r) => r.projectId === project.id);
        if (layerResult) {
          projectLayerResults[layer] = layerResult;
          if (layerResult.eliminated && !eliminated) {
            eliminated = true;
            eliminationLayer = layer;
          }
          if (layer === 4 && layerResult.score !== undefined) {
            finalScore = layerResult.score;
          }
        }
      }

      return {
        ...project,
        eliminated,
        eliminationLayer,
        finalScore,
        layerResults: projectLayerResults,
      };
    });
  }, [projects, layerResults]);

  // Use project filter hook
  const {
    filteredProjects,
    filterOptions,
    updateFilter,
    resetFilters,
    statistics,
  } = useProjectFilter(bracketProjects);

  // Get tracks for filters
  const tracks = useMemo(() => {
    const trackCounts = bracketProjects.reduce((acc, project) => {
      acc[project.track.name] = (acc[project.track.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(trackCounts).map(([name, count]) => ({
      id: name,
      name,
      count,
    }));
  }, [bracketProjects]);

  // Layer-specific filtering
  const layerProjects = useMemo(() => {
    if (selectedLayer === null) return filteredProjects;

    return filteredProjects.filter((project) => {
      const layerResult = layerResults[selectedLayer]?.find((r) => r.projectId === project.id);
      return layerResult !== undefined;
    });
  }, [filteredProjects, selectedLayer, layerResults]);

  // Separate active and eliminated for selected layer
  const { activeProjects, eliminatedProjects } = useMemo(() => {
    const active = layerProjects.filter((p) => !p.eliminated);
    const eliminated = layerProjects.filter((p) => p.eliminated);

    return { activeProjects: active, eliminatedProjects: eliminated };
  }, [layerProjects]);

  // Get layer statistics
  const getLayerStats = (layer: number) => {
    const results = layerResults[layer] || [];
    const eliminated = results.filter((r) => r.eliminated).length;
    const advanced = results.filter((r) => !r.eliminated).length;
    const total = results.length;

    return { eliminated, advanced, total };
  };

  // Render project card
  const renderProjectCard = (project: Project, index: number, isVisible: boolean) => (
    <VirtualizedProjectCard isVisible={isVisible}>
      <ProjectCard
        project={project}
        currentLayer={currentLayer}
        onProjectClick={onProjectClick}
        isWinner={sessionStatus === 'COMPLETED' && !project.eliminated}
        isCompact={eliminatedProjects.includes(project)}
      />
    </VirtualizedProjectCard>
  );

  // Layer header component
  const LayerHeader = ({ layer }: { layer: number }) => {
    const config = layerConfig[layer as keyof typeof layerConfig];
    const stats = getLayerStats(layer);
    const Icon = config.icon;
    const isActive = layer === currentLayer;
    const isCompleted = layer < currentLayer;
    const isSelected = selectedLayer === layer;

    return (
      <motion.div
        className={cn(
          'p-4 rounded-xl border cursor-pointer transition-all',
          'hover:border-border/80 hover:bg-card/80',
          isSelected && 'bg-card border-border shadow-lg',
          isActive && 'border-blue-500/50 bg-blue-500/5',
          isCompleted && 'border-green-500/30 bg-green-500/5'
        )}
        onClick={() => setSelectedLayer(isSelected ? null : layer)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-3 rounded-xl bg-gradient-to-r shadow-lg',
                config.color,
                isActive && 'animate-pulse'
              )}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Layer {layer}: {config.name}
                {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                {isActive && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Target className="w-4 h-4 text-blue-500" />
                  </motion.div>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {stats.total > 0 && (
              <div className="text-right">
                <div className="text-sm space-x-4">
                  {stats.eliminated > 0 && (
                    <span className="text-red-400">
                      <X className="w-3 h-3 inline mr-1" />
                      {stats.eliminated}
                    </span>
                  )}
                  {stats.advanced > 0 && (
                    <span className="text-green-400">
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      {stats.advanced}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{stats.total} processed</div>
              </div>
            )}

            {isSelected ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={cn('space-y-6', className)} ref={containerRef}>
      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <ProjectFilters
              filterOptions={filterOptions}
              onFilterChange={updateFilter}
              onReset={resetFilters}
              statistics={statistics}
              tracks={tracks}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer Headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((layer) => (
          <LayerHeader key={layer} layer={layer} />
        ))}
      </div>

      {/* Selected Layer Content */}
      <AnimatePresence mode="wait">
        {selectedLayer !== null && (
          <motion.div
            key={selectedLayer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Active Projects */}
            {activeProjects.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Active Projects ({activeProjects.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                </div>

                <Card className="bg-green-500/5 border-green-500/20">
                  <CardContent className="p-4">
                    <VirtualizedProjectGrid
                      items={activeProjects}
                      itemHeight={160} // Height for project cards
                      containerHeight={Math.min(600, Math.max(320, activeProjects.length * 80))}
                      itemsPerRow={itemsPerRow}
                      renderItem={renderProjectCard}
                      gap={16}
                      className="rounded-lg"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Eliminated Projects */}
            {eliminatedProjects.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  Eliminated Projects ({eliminatedProjects.length})
                </h3>

                <Card className="bg-red-500/5 border-red-500/20">
                  <CardContent className="p-4">
                    <VirtualizedProjectGrid
                      items={eliminatedProjects}
                      itemHeight={120} // Smaller height for eliminated projects
                      containerHeight={Math.min(400, Math.max(240, eliminatedProjects.length * 60))}
                      itemsPerRow={itemsPerRow + 2} // More items per row for eliminated
                      renderItem={renderProjectCard}
                      gap={12}
                      className="rounded-lg"
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overall View */}
      {selectedLayer === null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Projects Overview</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>

          <VirtualizedProjectGrid
            items={filteredProjects}
            itemHeight={160}
            containerHeight={600}
            itemsPerRow={itemsPerRow}
            renderItem={renderProjectCard}
            gap={16}
            className="bg-card/50 border border-border/50 rounded-lg p-4"
          />
        </motion.div>
      )}

      {/* Winners Section */}
      {sessionStatus === 'COMPLETED' && activeProjects.length > 0 && (
        <motion.div
          className="mt-8 p-6 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl border border-yellow-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h2 className="text-2xl font-bold text-yellow-500">Championship Winners</h2>
            <Crown className="w-8 h-8 text-yellow-500" />
          </div>

          <VirtualizedProjectGrid
            items={activeProjects.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))}
            itemHeight={180}
            containerHeight={400}
            itemsPerRow={Math.min(itemsPerRow, 3)}
            renderItem={renderProjectCard}
            gap={20}
            className="rounded-lg"
          />
        </motion.div>
      )}
    </div>
  );
}

// Enhanced Project Card Component
const ProjectCard: React.FC<{
  project: Project;
  currentLayer: number;
  onProjectClick?: (project: Project) => void;
  isWinner?: boolean;
  isCompact?: boolean;
}> = ({ project, currentLayer, onProjectClick, isWinner = false, isCompact = false }) => {
  const router = useRouter();
  const getCardState = () => {
    if (project.eliminated) return 'eliminated';
    if (isWinner) return 'winner';
    return 'visible';
  };

  const getEliminationBadge = () => {
    if (!project.eliminated || !project.eliminationLayer) return null;

    const layer = layerConfig[project.eliminationLayer as keyof typeof layerConfig];
    return (
      <Badge
        variant="destructive"
        className="absolute top-2 right-2 text-xs z-10 px-1.5 py-0.5 backdrop-blur-sm"
      >
        ✕ {layer.name}
      </Badge>
    );
  };

  const getScoreBadge = () => {
    if (project.eliminated) return null;

    // Show the latest available score
    for (let layer = currentLayer; layer >= 1; layer--) {
      const result = project.layerResults?.[layer];
      if (result && result.score !== undefined) {
        return (
          <Badge
            variant="outline"
            className="absolute top-2 left-2 text-xs z-10 bg-green-500/20 text-green-400 border-green-500/50 px-1.5 py-0.5 backdrop-blur-sm"
          >
            {Math.round(result.score)}
          </Badge>
        );
      }
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative h-full"
      whileHover={{ scale: 1.02, z: 10 }}
      onClick={() => onProjectClick?.(project)}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-300 relative overflow-hidden h-full',
          // Size variations
          isCompact ? 'min-h-[100px]' : 'min-h-[140px]',
          // Base styling
          'border-border/50 bg-card/50 backdrop-blur-sm',
          // State-based styling
          project.eliminated && 'border-red-500/30 bg-red-500/5',
          isWinner && 'border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/20',
          // Active project enhancement
          !project.eliminated && !isWinner && 'hover:shadow-lg hover:shadow-purple-500/20'
        )}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />

        {/* Badges */}
        {getEliminationBadge()}
        {getScoreBadge()}

        <CardContent className={cn('relative flex flex-col justify-between h-full', isCompact ? 'p-3' : 'p-4')}>
          {/* Project Header */}
          <div className={isCompact ? 'mb-2' : 'mb-3'}>
            <h4 className={cn('font-semibold leading-tight mb-1', isCompact ? 'text-xs' : 'text-sm', project.eliminated ? 'text-red-400' : 'text-foreground')}>
              <span className="line-clamp-2" title={project.name}>
                {project.name}
              </span>
            </h4>
            <p className={cn('text-muted-foreground truncate', isCompact ? 'text-xs' : 'text-xs')} title={project.teamName}>
              👥 {project.teamName}
            </p>
          </div>

          {/* Track Badge */}
          <Badge variant="outline" className={cn('w-full justify-center truncate', isCompact ? 'text-xs px-1 py-0.5' : 'text-xs')} title={project.track.name}>
            🏆 {project.track.name}
          </Badge>

          {/* Progress Indicators */}
          {!isCompact && (
            <div className="mt-3 flex justify-center gap-1">
              {[1, 2, 3, 4].map((layer) => {
                const result = project.layerResults?.[layer];
                const layerPassed = result && !result.eliminated;
                const layerFailed = result && result.eliminated;
                const layerPending = !result && layer <= currentLayer;

                return (
                  <div
                    key={layer}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      layerPassed && 'bg-green-500',
                      layerFailed && 'bg-red-500',
                      layerPending && 'bg-yellow-500 animate-pulse',
                      !result && layer > currentLayer && 'bg-gray-600'
                    )}
                    title={`Layer ${layer}`}
                  />
                );
              })}
            </div>
          )}

          {/* Final Score for Winners */}
          {isWinner && project.finalScore !== undefined && (
            <div className="mt-3 pt-2 border-t border-border/30 text-center">
              <div className="text-lg font-bold text-green-400 flex items-center justify-center gap-1">
                🏆 {Math.round(project.finalScore)}
              </div>
              <div className="text-xs text-muted-foreground">Final Score</div>
            </div>
          )}

          {/* View Details Button */}
          <div className="mt-3 pt-2 border-t border-border/30 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "text-xs h-7 px-3 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30 transition-all",
                isCompact && "h-6 px-2 text-xs"
              )}
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click event
                router.push(`/dashboard/ai-jury/projects/${project.id}`);
              }}
            >
              <Eye className={cn("mr-2", isCompact ? "w-3 h-3" : "w-3 h-3")} />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};