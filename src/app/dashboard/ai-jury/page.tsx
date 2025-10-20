'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useBreadcrumbs } from '@/contexts/layout-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { GradientText } from '@/components/shared/gradient-bg';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Scale,
  Trophy,
  Settings,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Users,
  Filter,
  Target,
  Activity,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { staggerContainerVariants, staggerItemVariants, cardHoverVariants } from '@/lib/page-transitions';
import { cn } from '@/lib/utils';
import { TournamentBracket } from '@/components/ai-jury/tournament-bracket';
import { VirtualizedTournamentBracket } from '@/components/ai-jury/tournament/VirtualizedTournamentBracket';
import { LiveLogsSidebar } from '@/components/ai-jury/sidebar/LiveLogsSidebar';
import { toast } from 'react-hot-toast';

import { fetchBackend } from '@/lib/api/fetch-backend';
interface Hackathon {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  _count: {
    projects: number;
    tracks: number;
  };
  tracks: Array<{
    id: string;
    name: string;
    _count: {
      projects: number;
    };
  }>;
  projects?: Array<{
    id: string;
    name: string;
    teamName: string;
    track: {
      id: string;
      name: string;
    };
    githubUrl?: string;
    demoUrl?: string;
  }>;
}

interface AIJurySession {
  id: string;
  hackathonId: string;
  status: string;
  currentLayer: number;
  totalLayers: number;
  totalProjects: number;
  eliminatedProjects: number;
  eligibilityCriteria: any;
  layerResults: any;
  finalResults: any;
}

interface EligibilityCriteria {
  requiredTechnologies?: string[];
  submissionDeadline?: boolean;
  repositoryAccess?: boolean;
  repositoryPublic?: boolean;
  customCriteria?: Array<{
    id: string;
    name: string;
    description: string;
    required: boolean;
  }>;
}

export default function AIJuryPage() {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<AIJurySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [eligibilityCriteria, setEligibilityCriteria] = useState<EligibilityCriteria>({
    submissionDeadline: true,
    repositoryAccess: true,
    repositoryPublic: false,
    customCriteria: []
  });
  const [showEligibilityForm, setShowEligibilityForm] = useState(false);
  const [selectedHackathonProjects, setSelectedHackathonProjects] = useState<any[]>([]);
  const [useVirtualizedBracket, setUseVirtualizedBracket] = useState(false);
  const [showLiveProgress, setShowLiveProgress] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetType, setResetType] = useState<'soft' | 'hard'>('soft');

  // Set breadcrumbs
  useBreadcrumbs([
    { label: 'AI Jury', href: '/dashboard/ai-jury' }
  ]);

  // Fetch hackathons
  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        setLoading(true);
        const response = await fetchBackend('/hackathons', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch hackathons');
        }

        const data = await response.json();
        if (data.success) {
          setHackathons(data.data);
        }
      } catch (error) {
        console.error('Error fetching hackathons:', error);
        toast.error('Failed to load hackathons');
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  // Fetch current AI Jury session and projects when hackathon is selected
  useEffect(() => {
    const fetchSessionAndProjects = async () => {
      if (!selectedHackathon) {
        setCurrentSession(null);
        setSelectedHackathonProjects([]);
        return;
      }

      try {
        setSessionLoading(true);

        // Fetch AI jury session
        // NOTE: AI Jury endpoints return raw data, not wrapped in { success, data }
        const sessionResponse = await fetchBackend(`/ai-jury/sessions?hackathonId=${selectedHackathon}`, {
          credentials: 'include',
        });

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          // AI Jury returns raw session data directly
          setCurrentSession(sessionData);
        } else if (sessionResponse.status !== 404) {
          throw new Error('Failed to fetch AI jury session');
        }

        // Fetch projects for this hackathon
        const projectsResponse = await fetchBackend(`/hackathons/${selectedHackathon}/projects?limit=100`, {
          credentials: 'include',
        });

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          if (projectsData.success) {
            setSelectedHackathonProjects(projectsData.data);
          }
        }

      } catch (error) {
        console.error('Error fetching session and projects:', error);
        toast.error('Failed to load AI jury session data');
      } finally {
        setSessionLoading(false);
      }
    };

    fetchSessionAndProjects();
  }, [selectedHackathon]);

  const selectedHackathonData = hackathons.find(h => h.id === selectedHackathon);

  // Auto-enable virtualized bracket for large datasets
  React.useEffect(() => {
    if (selectedHackathonProjects.length > 100) {
      setUseVirtualizedBracket(true);
    }
  }, [selectedHackathonProjects.length]);

  // Auto-show live progress when session starts
  React.useEffect(() => {
    if (currentSession && currentSession.status !== 'PENDING' && currentSession.status !== 'COMPLETED' && currentSession.status !== 'FAILED') {
      setShowLiveProgress(true);
    }
  }, [currentSession?.status]);

  const getSessionStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { variant: 'secondary' as const, text: 'Not Started', color: 'text-gray-400' },
      'LAYER_1_ELIGIBILITY': { variant: 'default' as const, text: 'Layer 1: Eligibility', color: 'text-blue-400' },
      'LAYER_2_HEDERA': { variant: 'default' as const, text: 'Layer 2: Hedera', color: 'text-purple-400' },
      'LAYER_3_CODE_QUALITY': { variant: 'default' as const, text: 'Layer 3: Code Quality', color: 'text-orange-400' },
      'LAYER_4_FINAL_ANALYSIS': { variant: 'default' as const, text: 'Layer 4: Final Analysis', color: 'text-green-400' },
      'COMPLETED': { variant: 'outline' as const, text: 'Completed', color: 'text-green-500' },
      'FAILED': { variant: 'destructive' as const, text: 'Failed', color: 'text-red-400' }
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];
  };

  const handleCreateSession = async () => {
    if (!selectedHackathon) {
      toast.error('Please select a hackathon first');
      return;
    }

    setShowEligibilityForm(true);
  };

  const handleStartJury = async () => {
    try {
      setSessionLoading(true);

      // Create session
      const response = await fetchBackend('/ai-jury/sessions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hackathonId: selectedHackathon,
          eligibilityCriteria
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create AI jury session');
      }

      const data = await response.json();
      // AI Jury createSession returns raw session data
      setCurrentSession(data);
      setShowEligibilityForm(false);
      toast.success('AI Jury session created successfully!');

      // Start layer 1 automatically
      await executeLayer(data.id, 1);
    } catch (error) {
      console.error('Error creating AI jury session:', error);
      toast.error('Failed to create AI jury session');
    } finally {
      setSessionLoading(false);
    }
  };

  const executeLayer = async (sessionId: string, layer: number) => {
    try {
      const layerNames = {
        1: 'Eligibility Check',
        2: 'Hedera Technology Filter',
        3: 'Code Quality Assessment',
        4: 'Final Analysis'
      };

      toast.loading(`Executing Layer ${layer}: ${layerNames[layer as keyof typeof layerNames]}...`, {
        id: `layer-${layer}`,
      });

      const response = await fetchBackend(`/ai-jury/sessions/${sessionId}/execute-layer`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ layer }),
      });

      if (!response.ok) {
        throw new Error(`Failed to execute layer ${layer}`);
      }

      const data = await response.json();
      // AI Jury executeLayer returns raw layer result data
      toast.success(
        `Layer ${layer} completed! ${data.eliminated} eliminated, ${data.advanced} advanced`,
        { id: `layer-${layer}`, duration: 3000 }
      );

      // Refresh current session
      const sessionResponse = await fetchBackend(`/ai-jury/sessions?hackathonId=${selectedHackathon}`, {
        credentials: 'include',
      });

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        // AI Jury returns raw session data directly
        setCurrentSession(sessionData);
      }

      // Auto-execute next layer if not the final layer
      if (layer < 4) {
        // Add a small delay between layers for UX
        setTimeout(() => {
          executeLayer(sessionId, layer + 1);
        }, 2000);
      } else {
        toast.success('🎉 AI Jury process completed! Top 5 projects selected per track.', {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error(`Error executing layer ${layer}:`, error);
      toast.error(`Failed to execute layer ${layer}`, { id: `layer-${layer}` });
    }
  };

  const handleResetSession = async (type: 'soft' | 'hard') => {
    if (!currentSession) {
      toast.error('No active session to reset');
      return;
    }

    try {
      setSessionLoading(true);

      const method = type === 'hard' ? 'DELETE' : 'POST';
      const response = await fetchBackend(`/ai-jury/sessions/${currentSession.id}/reset`, {
        method: method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${type} reset session`);
      }

      const data = await response.json();

      // AI Jury reset returns raw data
      if (type === 'hard') {
        // Hard reset - session was deleted
        setCurrentSession(null);
        setShowLiveProgress(false);
        toast.success('🗑️ AI Jury session completely deleted! You can now create a new one.', {
          duration: 4000,
        });
      } else {
        // Soft reset - session was reset to initial state
        setCurrentSession(data);
        setShowLiveProgress(false);
        toast.success('🔄 AI Jury session reset! Ready to run analysis again.', {
          duration: 4000,
        });
      }

      setShowResetConfirm(false);
    } catch (error) {
      console.error(`Error ${type} resetting session:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${type} reset session`);
    } finally {
      setSessionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={staggerItemVariants}>
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              <Scale className="w-8 h-8 text-purple-400" />
              AI <GradientText>Jury</GradientText>
            </span>
          }
          description="Tournament-style project evaluation with multi-layer elimination process"
          badge={{
            text: 'Beta',
            variant: 'secondary'
          }}
          stats={selectedHackathonData ? [
            {
              label: 'Total Projects',
              value: selectedHackathonData._count.projects.toString(),
              trend: 'neutral' as const
            },
            {
              label: 'Tracks',
              value: selectedHackathonData._count.tracks.toString(),
              trend: 'neutral' as const
            },
            {
              label: 'Remaining',
              value: currentSession
                ? (currentSession.totalProjects - currentSession.eliminatedProjects).toString()
                : selectedHackathonData._count.projects.toString(),
              trend: 'down' as const
            }
          ] : []}
        />
      </motion.div>

      {/* Hackathon Selection */}
      <motion.div variants={staggerItemVariants}>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Select Hackathon
            </CardTitle>
            <CardDescription>
              Choose a hackathon to run the AI jury evaluation on
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedHackathon} onValueChange={setSelectedHackathon}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a hackathon..." />
              </SelectTrigger>
              <SelectContent>
                {hackathons.map((hackathon) => (
                  <SelectItem key={hackathon.id} value={hackathon.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{hackathon.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {hackathon._count.projects} projects • {hackathon._count.tracks} tracks
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedHackathonData && (
              <div className="flex flex-wrap gap-2">
                {selectedHackathonData.tracks.map((track) => (
                  <Badge key={track.id} variant="outline" className="text-xs">
                    {track.name}: {track._count.projects} projects
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Session Status */}
      {selectedHackathon && (
        <motion.div variants={staggerItemVariants}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-400" />
                  AI Jury Session
                </span>
                {currentSession && (
                  <Badge {...getSessionStatusBadge(currentSession.status)}>
                    {getSessionStatusBadge(currentSession.status).text}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {currentSession
                  ? 'Manage your current AI jury evaluation session'
                  : 'No active AI jury session for this hackathon'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentSession ? (
                <div className="space-y-4">
                  {/* Session Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-background/30 rounded-lg border border-border/30">
                      <div className="text-2xl font-bold text-blue-400">{currentSession.currentLayer}</div>
                      <div className="text-xs text-muted-foreground">Current Layer</div>
                    </div>
                    <div className="text-center p-3 bg-background/30 rounded-lg border border-border/30">
                      <div className="text-2xl font-bold text-green-400">{currentSession.totalProjects - currentSession.eliminatedProjects}</div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                    <div className="text-center p-3 bg-background/30 rounded-lg border border-border/30">
                      <div className="text-2xl font-bold text-red-400">{currentSession.eliminatedProjects}</div>
                      <div className="text-xs text-muted-foreground">Eliminated</div>
                    </div>
                    <div className="text-center p-3 bg-background/30 rounded-lg border border-border/30">
                      <div className="text-2xl font-bold text-purple-400">{Math.round((currentSession.eliminatedProjects / currentSession.totalProjects) * 100)}%</div>
                      <div className="text-xs text-muted-foreground">Eliminated</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {currentSession.status === 'PENDING' && (
                      <Button
                        onClick={handleStartJury}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        disabled={sessionLoading}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Jury Process
                      </Button>
                    )}

                    {['LAYER_1_ELIGIBILITY', 'LAYER_2_HEDERA', 'LAYER_3_CODE_QUALITY', 'LAYER_4_FINAL_ANALYSIS'].includes(currentSession.status) && (
                      <>
                        <Button
                          variant="outline"
                          disabled={sessionLoading}
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                      </>
                    )}

                    {(currentSession.status === 'COMPLETED' || currentSession.status === 'FAILED') && (
                      <>
                        <Button
                          variant="outline"
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          disabled={sessionLoading}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          View Results
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            setResetType('soft');
                            setShowResetConfirm(true);
                          }}
                          disabled={sessionLoading}
                          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reset & Retry
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            setResetType('hard');
                            setShowResetConfirm(true);
                          }}
                          disabled={sessionLoading}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Session
                        </Button>
                      </>
                    )}

                    {currentSession.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setResetType('hard');
                          setShowResetConfirm(true);
                        }}
                        disabled={sessionLoading}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Session
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center">
                    <Scale className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ready to Start AI Jury</h3>
                    <p className="text-muted-foreground mb-4">
                      Configure eligibility criteria and begin the tournament-style evaluation process
                    </p>
                    <Button
                      onClick={handleCreateSession}
                      className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure & Start
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Eligibility Form Modal/Section */}
      <AnimatePresence>
        {showEligibilityForm && selectedHackathonData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            variants={staggerItemVariants}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-400" />
                  Eligibility Criteria
                </CardTitle>
                <CardDescription>
                  Configure the criteria for Layer 1 elimination
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Repository Visibility */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Repository Visibility</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={eligibilityCriteria.repositoryPublic}
                          onChange={(e) => setEligibilityCriteria(prev => ({
                            ...prev,
                            repositoryPublic: e.target.checked
                          }))}
                          className="rounded border-border"
                        />
                        <span className="text-sm">Repository must be public</span>
                      </label>
                      <p className="text-xs text-muted-foreground ml-6">
                        Only projects with public repositories will pass Layer 1
                      </p>
                    </div>
                  </div>

                  {/* Required Checks */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Required Criteria</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={eligibilityCriteria.submissionDeadline}
                          onChange={(e) => setEligibilityCriteria(prev => ({
                            ...prev,
                            submissionDeadline: e.target.checked
                          }))}
                          className="rounded border-border"
                        />
                        <span className="text-sm">Submitted before deadline</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={eligibilityCriteria.repositoryAccess}
                          onChange={(e) => setEligibilityCriteria(prev => ({
                            ...prev,
                            repositoryAccess: e.target.checked
                          }))}
                          className="rounded border-border"
                        />
                        <span className="text-sm">Repository accessible</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    onClick={() => setShowEligibilityForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStartJury}
                    disabled={sessionLoading}
                    className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                  >
                    {sessionLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        Start AI Jury
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-background border border-border/50 rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                  resetType === 'hard' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                )}>
                  {resetType === 'hard' ? (
                    <Trash2 className="w-6 h-6" />
                  ) : (
                    <RefreshCw className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    {resetType === 'hard' ? 'Delete AI Jury Session?' : 'Reset AI Jury Session?'}
                  </h3>

                  <div className="space-y-3 text-sm text-muted-foreground mb-6">
                    {resetType === 'hard' ? (
                      <>
                        <div className="flex items-center gap-2 text-red-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">This action cannot be undone!</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 ml-6">
                          <li>Permanently delete the entire AI jury session</li>
                          <li>Remove all layer results and analysis data</li>
                          <li>Clear tournament bracket and rankings</li>
                          <li>You'll need to create a completely new session</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-blue-400">
                          <RefreshCw className="w-4 h-4" />
                          <span className="font-medium">Session will be reset to initial state</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 ml-6">
                          <li>Keep session configuration and eligibility criteria</li>
                          <li>Clear all layer results and tournament data</li>
                          <li>Reset status to "PENDING" - ready to run again</li>
                          <li>Perfect for retesting with the same criteria</li>
                        </ul>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowResetConfirm(false)}
                      disabled={sessionLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant={resetType === 'hard' ? 'destructive' : 'default'}
                      onClick={() => handleResetSession(resetType)}
                      disabled={sessionLoading}
                      className={resetType === 'soft' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      {sessionLoading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          {resetType === 'hard' ? 'Deleting...' : 'Resetting...'}
                        </>
                      ) : (
                        <>
                          {resetType === 'hard' ? (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Session
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reset Session
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tournament Bracket Visualization */}
      {currentSession && currentSession.status !== 'PENDING' && selectedHackathonData && (
        <motion.div variants={staggerItemVariants}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Tournament Bracket
                  {selectedHackathonProjects.length > 100 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedHackathonProjects.length} projects
                    </Badge>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  {/* Live Progress Toggle */}
                  <Button
                    variant={showLiveProgress ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowLiveProgress(!showLiveProgress)}
                    className="text-xs"
                    title={showLiveProgress ? "Hide Live Progress" : "Show Live Progress"}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    {showLiveProgress ? (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Live
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Show Live
                      </>
                    )}
                  </Button>

                  {/* Bracket View Toggle */}
                  <div className="flex items-center gap-1 border border-border/50 rounded-md p-1">
                    <Button
                      variant={useVirtualizedBracket ? "outline" : "default"}
                      size="sm"
                      onClick={() => setUseVirtualizedBracket(false)}
                      className="text-xs h-7"
                    >
                      Classic
                    </Button>
                    <Button
                      variant={useVirtualizedBracket ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseVirtualizedBracket(true)}
                      className="text-xs h-7"
                    >
                      Performance
                      {selectedHackathonProjects.length > 100 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Recommended
                        </Badge>
                      )}
                    </Button>
                  </div>

                  {/* Reset/Delete Controls */}
                  <div className="flex items-center gap-1">
                    {currentSession && (
                      <>
                        {/* Reset Button - Only show for completed/failed sessions */}
                        {(currentSession.status === 'COMPLETED' || currentSession.status === 'FAILED') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetType('soft');
                              setShowResetConfirm(true);
                            }}
                            disabled={sessionLoading}
                            className="text-xs h-7 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                            title="Reset session and retry analysis"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Reset
                          </Button>
                        )}

                        {/* Delete Button - Show for all non-running sessions */}
                        {!['LAYER_1_ELIGIBILITY', 'LAYER_2_HEDERA', 'LAYER_3_CODE_QUALITY', 'LAYER_4_FINAL_ANALYSIS'].includes(currentSession.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetType('hard');
                              setShowResetConfirm(true);
                            }}
                            disabled={sessionLoading}
                            className="text-xs h-7 border-red-500/30 text-red-400 hover:bg-red-500/10"
                            title="Delete entire session"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardTitle>
              <CardDescription>
                {useVirtualizedBracket
                  ? "High-performance view optimized for large datasets with advanced filtering"
                  : "Champions League style elimination visualization"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {useVirtualizedBracket ? (
                <VirtualizedTournamentBracket
                  projects={selectedHackathonProjects}
                  layerResults={currentSession.layerResults || {}}
                  currentLayer={currentSession.currentLayer}
                  sessionStatus={currentSession.status}
                  onProjectClick={(project) => {
                    console.log('Project clicked:', project);
                    // Could open a project detail modal here
                  }}
                />
              ) : (
                <TournamentBracket
                  projects={selectedHackathonProjects}
                  layerResults={currentSession.layerResults || {}}
                  currentLayer={currentSession.currentLayer}
                  sessionStatus={currentSession.status}
                  onProjectClick={(project) => {
                    console.log('Project clicked:', project);
                    // Could open a project detail modal here
                  }}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Live Logs Sidebar */}
      {currentSession && (
        <>
          <LiveLogsSidebar
            sessionId={currentSession.id}
            enabled={currentSession.status !== 'PENDING' && currentSession.status !== 'COMPLETED' && currentSession.status !== 'FAILED'}
            defaultOpen={showLiveProgress}
            onToggle={(isOpen) => setShowLiveProgress(isOpen)}
          />

          {/* Floating Live Progress Button (when sidebar is closed) */}
          {!showLiveProgress && currentSession.status !== 'PENDING' && currentSession.status !== 'COMPLETED' && currentSession.status !== 'FAILED' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed bottom-6 right-6 z-40"
            >
              <Button
                onClick={() => setShowLiveProgress(true)}
                className={cn(
                  'w-14 h-14 rounded-full shadow-2xl',
                  'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600',
                  'border-2 border-white/20'
                )}
                size="icon"
                title="Open Live Progress"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <Activity className="w-6 h-6 text-white" />
                </motion.div>
              </Button>

              {/* Pulse animation for attention */}
              <motion.div
                className="absolute inset-0 rounded-full bg-purple-500/30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}