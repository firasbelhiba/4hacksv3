'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Users,
  GitBranch,
  Star,
  Award,
  Zap,
  Target,
  Crown,
  Filter,
  Code,
  CheckCircle,
  X,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

interface LayerResult {
  projectId: string;
  eliminated: boolean;
  score?: number;
  reason?: string;
  evidence: any;
  layer: number;
}

interface BracketProject extends Project {
  eliminated: boolean;
  eliminationLayer?: number;
  finalScore?: number;
  layerResults: Record<number, LayerResult>;
}

interface TournamentBracketProps {
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
    description: 'Basic eligibility criteria check'
  },
  2: {
    name: 'Hedera',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    description: 'Hedera technology verification'
  },
  3: {
    name: 'Code Quality',
    icon: Code,
    color: 'from-orange-500 to-red-500',
    description: 'Code richness and quality assessment'
  },
  4: {
    name: 'Final Analysis',
    icon: Trophy,
    color: 'from-green-500 to-emerald-500',
    description: 'Coherence and innovation scoring'
  }
};

export function TournamentBracket({
  projects,
  layerResults,
  currentLayer,
  sessionStatus,
  onProjectClick,
  className
}: TournamentBracketProps) {
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [animationPhase, setAnimationPhase] = useState<number>(0);
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);

  // Process projects with elimination data
  const bracketProjects: BracketProject[] = projects.map(project => {
    const projectLayerResults: Record<number, LayerResult> = {};
    let eliminated = false;
    let eliminationLayer: number | undefined;
    let finalScore = 0;

    // Check each layer for this project
    for (let layer = 1; layer <= 4; layer++) {
      const layerResult = layerResults[layer]?.find(r => r.projectId === project.id);
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

  // Get unique tracks
  const tracks = Array.from(new Set(projects.map(p => p.track.name))).map(trackName => ({
    id: trackName,
    name: trackName,
    projects: bracketProjects.filter(p => p.track.name === trackName)
  }));

  // Filter projects by selected track
  const filteredProjects = selectedTrack === 'all'
    ? bracketProjects
    : bracketProjects.filter(p => p.track.name === selectedTrack);

  // Group projects by elimination status
  const activeProjects = filteredProjects.filter(p => !p.eliminated);
  const eliminatedProjects = filteredProjects.filter(p => p.eliminated);

  // Get layer statistics
  const getLayerStats = (layer: number) => {
    const results = layerResults[layer] || [];
    const eliminated = results.filter(r => r.eliminated).length;
    const advanced = results.filter(r => !r.eliminated).length;
    const total = results.length;

    return { eliminated, advanced, total };
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const projectCardVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
    eliminated: {
      opacity: 0.6,
      scale: 0.85,
      filter: 'grayscale(0.3)',
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
    winner: {
      scale: 1.05,
      boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)',
      transition: {
        duration: 0.3,
        repeat: Infinity,
        repeatType: 'reverse',
      },
    },
  };

  const layerHeaderVariants = {
    inactive: { opacity: 0.6, scale: 0.95 },
    active: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
      },
    },
    completed: {
      opacity: 0.8,
      scale: 0.98,
    },
  };

  const ProjectCard = ({ project, isWinner = false, isCompact = false }: {
    project: BracketProject;
    isWinner?: boolean;
    isCompact?: boolean;
  }) => {
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
        const result = project.layerResults[layer];
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
        variants={projectCardVariants}
        initial="hidden"
        animate={getCardState()}
        className="relative m-1.5 md:m-2" // Enhanced margin for better spacing and badge visibility
        whileHover={{ scale: 1.02, z: 10 }}
        onClick={() => onProjectClick?.(project)}
      >
        <Card className={cn(
          'cursor-pointer transition-all duration-300 relative overflow-hidden',
          // Size variations
          isCompact ? 'min-h-[100px]' : 'min-h-[140px]',
          // Base styling
          'border-border/50 bg-card/50 backdrop-blur-sm',
          // State-based styling
          project.eliminated && 'border-red-500/30 bg-red-500/5',
          isWinner && 'border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/20',
          // Active project enhancement
          !project.eliminated && !isWinner && 'hover:shadow-lg hover:shadow-purple-500/20'
        )}>
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />

          {/* Elimination/Score Badges */}
          {getEliminationBadge()}
          {getScoreBadge()}

          <CardContent className={cn(
            'relative flex flex-col justify-between h-full',
            isCompact ? 'p-3' : 'p-4'
          )}>
            {/* Project Header */}
            <div className={isCompact ? 'mb-2' : 'mb-3'}>
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className={cn(
                    'font-semibold leading-tight mb-1',
                    isCompact ? 'text-xs' : 'text-sm',
                    project.eliminated ? 'text-red-400' : 'text-foreground'
                  )}>
                    <span className="line-clamp-2" title={project.name}>
                      {project.name}
                    </span>
                  </h4>
                  <p className={cn(
                    'text-muted-foreground truncate',
                    isCompact ? 'text-xs' : 'text-xs'
                  )} title={project.teamName}>
                    👥 {project.teamName}
                  </p>
                </div>
              </div>

              {/* Track Badge */}
              <Badge
                variant="outline"
                className={cn(
                  'w-full justify-center truncate',
                  isCompact ? 'text-xs px-1 py-0.5' : 'text-xs'
                )}
                title={project.track.name}
              >
                🏆 {project.track.name}
              </Badge>
            </div>

            {/* Progress Indicators - Simplified for compact */}
            {!isCompact ? (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground text-center mb-1">Layer Progress</div>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4].map(layer => {
                    const result = project.layerResults[layer];
                    const layerPassed = result && !result.eliminated;
                    const layerFailed = result && result.eliminated;
                    const layerPending = !result && layer <= currentLayer;
                    const layerConfig_layer = layerConfig[layer as keyof typeof layerConfig];

                    return (
                      <div
                        key={layer}
                        className="flex flex-col items-center"
                        title={`Layer ${layer}: ${layerConfig_layer.name} - ${
                          layerPassed ? 'Passed' :
                          layerFailed ? 'Failed' :
                          layerPending ? 'Processing' : 'Pending'
                        }`}
                      >
                        <div className={cn(
                          'w-3 h-3 rounded-full border-2 transition-all duration-300',
                          layerPassed && 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50',
                          layerFailed && 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50',
                          layerPending && 'bg-yellow-500 border-yellow-400 animate-pulse shadow-lg shadow-yellow-500/50',
                          !result && layer > currentLayer && 'bg-gray-600 border-gray-500'
                        )} />
                        <div className="text-xs text-muted-foreground mt-0.5">{layer}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Simplified progress for compact cards */
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4].map(layer => {
                  const result = project.layerResults[layer];
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
              <div className="mt-3 pt-2 border-t border-border/30">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400 flex items-center justify-center gap-1">
                    🏆 {Math.round(project.finalScore)}
                  </div>
                  <div className="text-xs text-muted-foreground">Final Score</div>
                </div>
              </div>
            )}

            {/* Elimination Reason for Eliminated Projects */}
            {project.eliminated && project.eliminationLayer && project.layerResults[project.eliminationLayer]?.reason && (
              <div className="mt-2 pt-2 border-t border-red-500/20">
                <div className="text-xs text-red-400 text-center truncate"
                     title={project.layerResults[project.eliminationLayer].reason}>
                  💔 {project.layerResults[project.eliminationLayer].reason}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const LayerHeader = ({ layer, isActive, isCompleted }: {
    layer: number;
    isActive: boolean;
    isCompleted: boolean;
  }) => {
    const config = layerConfig[layer as keyof typeof layerConfig];
    const stats = getLayerStats(layer);
    const Icon = config.icon;

    const getState = () => {
      if (isCompleted) return 'completed';
      if (isActive) return 'active';
      return 'inactive';
    };

    return (
      <motion.div
        variants={layerHeaderVariants}
        animate={getState()}
        className="flex items-center justify-between p-4 mb-4"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-3 rounded-xl bg-gradient-to-r',
            config.color,
            'shadow-lg',
            isActive && 'animate-pulse'
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>

          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Layer {layer}: {config.name}
              {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
              {isActive && <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Target className="w-4 h-4 text-blue-500" />
              </motion.div>}
            </h3>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="text-right">
            <div className="text-sm space-x-4">
              {stats.eliminated > 0 && (
                <span className="text-red-400">
                  <X className="w-3 h-3 inline mr-1" />
                  {stats.eliminated} eliminated
                </span>
              )}
              {stats.advanced > 0 && (
                <span className="text-green-400">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  {stats.advanced} advanced
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.total} processed
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      className={cn('space-y-6', className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Track Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={selectedTrack === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTrack('all')}
        >
          All Tracks ({bracketProjects.length})
        </Button>
        {tracks.map(track => (
          <Button
            key={track.id}
            variant={selectedTrack === track.name ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTrack(track.name)}
          >
            {track.name} ({track.projects.length})
          </Button>
        ))}
      </div>

      {/* Tournament Layers */}
      {[1, 2, 3, 4].map(layer => {
        const isActive = layer === currentLayer;
        const isCompleted = layer < currentLayer;
        const layerResults_layer = layerResults[layer] || [];
        const layerProjects = filteredProjects.filter(p => {
          // Show projects that were processed in this layer
          return layerResults_layer.some(r => r.projectId === p.id);
        });

        if (layer > currentLayer && layerProjects.length === 0) {
          return null; // Don't show future layers with no data
        }

        return (
          <motion.div
            key={layer}
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: layer * 0.1 }}
          >
            <LayerHeader
              layer={layer}
              isActive={isActive}
              isCompleted={isCompleted}
            />

            {layerProjects.length > 0 && (
              <div className="space-y-6">
                {/* Active Projects Section */}
                {layerProjects.filter(p => !p.eliminated).length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h4 className="text-sm font-medium text-green-400">
                        Active Projects ({layerProjects.filter(p => !p.eliminated).length} advancing)
                      </h4>
                    </div>
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 p-3 md:p-4 bg-green-500/5 rounded-xl border border-green-500/20"
                      variants={containerVariants}
                    >
                      {layerProjects
                        .filter(p => !p.eliminated)
                        .map(project => (
                          <ProjectCard
                            key={`${layer}-active-${project.id}`}
                            project={project}
                            isWinner={layer === 4 && project.finalScore !== undefined}
                          />
                        ))}
                    </motion.div>
                  </div>
                )}

                {/* Eliminated Projects Section */}
                {layerProjects.filter(p => p.eliminated).length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <h4 className="text-sm font-medium text-red-400">
                          Eliminated Projects ({layerProjects.filter(p => p.eliminated).length} eliminated in Layer {layer})
                        </h4>
                      </div>
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => {
                          const layerKey = `layer-${layer}-eliminated`;
                          setExpandedLayer(expandedLayer === layerKey ? null : layerKey);
                        }}
                      >
                        {expandedLayer === `layer-${layer}-eliminated` ? 'Hide' : 'Show'} eliminated
                      </button>
                    </div>
                    <AnimatePresence>
                      {(expandedLayer === `layer-${layer}-eliminated` || expandedLayer === null) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 md:gap-3 p-3 md:p-4 bg-red-500/5 rounded-xl border border-red-500/20"
                        >
                          {layerProjects
                            .filter(p => p.eliminated)
                            .map(project => (
                              <ProjectCard
                                key={`${layer}-eliminated-${project.id}`}
                                project={project}
                                isWinner={false}
                                isCompact={true}
                              />
                            ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* Layer Separator */}
            {layer < 4 && layerProjects.length > 0 && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-px bg-border flex-1 w-16" />
                  <ArrowRight className="w-4 h-4" />
                  <div className="h-px bg-border flex-1 w-16" />
                </div>
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Final Winners Section */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 p-3 md:p-4">
            {activeProjects
              .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
              .map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProjectCard project={project} isWinner={true} />
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Statistics */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{filteredProjects.length}</div>
          <div className="text-xs text-muted-foreground">Total Projects</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{eliminatedProjects.length}</div>
          <div className="text-xs text-muted-foreground">Eliminated</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{activeProjects.length}</div>
          <div className="text-xs text-muted-foreground">Remaining</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {filteredProjects.length > 0 ? Math.round((eliminatedProjects.length / filteredProjects.length) * 100) : 0}%
          </div>
          <div className="text-xs text-muted-foreground">Elimination Rate</div>
        </Card>
      </motion.div>
    </motion.div>
  );
}