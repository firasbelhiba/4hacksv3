'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Filter,
  FolderOpen,
  Plus,
  Upload,
  Target,
  CheckCircle2,
  FileText,
  GitBranch,
  Brain,
  Trophy,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectDetailModal } from '@/components/projects/project-detail-modal';
import { ProgressIndicator, defaultAnalysisStages, type AnalysisStage } from '@/components/ui/progress-indicator';
import { toast } from 'react-hot-toast';

import { fetchBackend } from '@/lib/api/fetch-backend';
interface TeamMember {
  name: string;
  email?: string;
  role?: string;
}

interface Track {
  id: string;
  name: string;
}

interface ReportSummary {
  id: string;
  status: string;
  score?: number;
  overallScore?: number;
  hederaUsageScore?: number;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  teamName: string;
  teamMembers: TeamMember[];
  githubUrl: string;
  demoUrl?: string | null;
  videoUrl?: string | null;
  presentationUrl?: string | null;
  status: string;
  submittedAt?: string | null;
  createdAt: string;
  track: Track;
  hackathon: {
    id: string;
    name: string;
  };
  // Pre-loaded reports from backend eager loading
  innovation_reports?: ReportSummary[];
  coherence_reports?: ReportSummary[];
  hedera_analysis_reports?: ReportSummary[];
  code_quality_reports?: ReportSummary[];
}

interface ProjectRankingData {
  id: string;
  name: string;
  teamName: string;
  track: string;
  codeQuality: number | null | undefined;
  innovation: number | null | undefined;
  coherence: number | null | undefined;
  hedera: number | null | undefined;
  average: number | null | undefined;
  completedReports: number;
  totalReports: number;
}

interface HackathonData {
  id: string;
  name: string;
  description: string;
  organizationName: string;
  tracks: Track[];
  _count: {
    projects: number;
    tracks: number;
  };
}

interface ProjectsResponse {
  success: boolean;
  data: Project[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Coherence analysis stages
const coherenceAnalysisStages: AnalysisStage[] = [
  {
    id: 'analyze-structure',
    name: 'Repository Structure',
    description: 'Analyzing repository structure and documentation',
    icon: GitBranch,
    status: 'pending',
    estimatedDuration: 30
  },
  {
    id: 'extract-purpose',
    name: 'Project Purpose',
    description: 'Extracting and understanding project goals',
    icon: Target,
    status: 'pending',
    estimatedDuration: 45
  },
  {
    id: 'track-alignment',
    name: 'Track Alignment',
    description: 'Analyzing alignment with track requirements',
    icon: CheckCircle2,
    status: 'pending',
    estimatedDuration: 60
  },
  {
    id: 'readme-analysis',
    name: 'README Analysis',
    description: 'Assessing documentation quality and accuracy',
    icon: FileText,
    status: 'pending',
    estimatedDuration: 40
  },
  {
    id: 'detect-inconsistencies',
    name: 'Inconsistency Detection',
    description: 'Identifying conflicts and gaps in information',
    icon: Brain,
    status: 'pending',
    estimatedDuration: 50
  },
  {
    id: 'generate-report',
    name: 'Report Generation',
    description: 'Compiling comprehensive coherence analysis',
    icon: FileText,
    status: 'pending',
    estimatedDuration: 25
  }
];

export default function HackathonProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const [hackathon, setHackathon] = useState<HackathonData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analyzingProject, setAnalyzingProject] = useState<string | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [analysisStages, setAnalysisStages] = useState<AnalysisStage[]>(defaultAnalysisStages);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [progressData, setProgressData] = useState({
    progress: 0,
    totalFiles: 0,
    processedFiles: 0,
    estimatedTimeRemaining: 0
  });

  // Coherence review state
  const [coherenceAnalyzingProject, setCoherenceAnalyzingProject] = useState<string | null>(null);
  const [showCoherenceProgressModal, setShowCoherenceProgressModal] = useState(false);
  const [coherenceStages, setCoherenceStages] = useState<AnalysisStage[]>(coherenceAnalysisStages);
  const [coherenceCurrentStage, setCoherenceCurrentStage] = useState<string>('');
  const [coherenceProgressData, setCoherenceProgressData] = useState({
    progress: 0
  });

  // Ranking state
  const [rankingData, setRankingData] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [sortColumn, setSortColumn] = useState('average');
  const [sortDirection, setSortDirection] = useState('desc');

  const hackathonId = params.id as string;

  const pollProgress = async (projectId: string, reportId: string) => {
    try {
      const response = await fetchBackend(`/projects/${projectId}/code-quality/${reportId}/progress`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) return;

      const data = await response.json();
      if (!data.success) return;

      const report = data.data;

      setProgressData({
        progress: report.progress || 0,
        totalFiles: report.totalFiles || 0,
        processedFiles: report.processedFiles || 0,
        estimatedTimeRemaining: report.estimatedTimeRemaining || 0
      });

      setCurrentStage(report.currentStage || '');

      const updatedStages = analysisStages.map(stage => {
        if (report.stageProgress && report.stageProgress[stage.id]) {
          return {
            ...stage,
            status: report.stageProgress[stage.id].status,
            startedAt: report.stageProgress[stage.id].startedAt ? new Date(report.stageProgress[stage.id].startedAt) : undefined,
            completedAt: report.stageProgress[stage.id].completedAt ? new Date(report.stageProgress[stage.id].completedAt) : undefined
          };
        }
        return stage;
      });

      setAnalysisStages(updatedStages);

      if (report.status === 'COMPLETED' || report.status === 'FAILED') {
        setShowProgressModal(false);
        setAnalyzingProject(null);

        if (report.status === 'COMPLETED') {
          toast.success('Code quality analysis completed!');
        } else {
          toast.error('Analysis failed. Please try again.');
        }

        return false;
      }

      return true;
    } catch (error) {
      console.error('Error polling progress:', error);
      return true;
    }
  };

  const pollCoherenceProgress = async (projectId: string, reportId: string) => {
    try {
      const response = await fetchBackend(`/projects/${projectId}/review/coherence/${reportId}/progress`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) return;

      const data = await response.json();
      if (!data.success) return;

      const report = data.data;

      setCoherenceProgressData({
        progress: report.progress || 0
      });

      setCoherenceCurrentStage(report.currentStage || '');

      const updatedStages = coherenceStages.map(stage => {
        if (report.stageProgress && report.stageProgress[stage.id]) {
          return {
            ...stage,
            status: report.stageProgress[stage.id].status,
            startedAt: report.stageProgress[stage.id].startedAt ? new Date(report.stageProgress[stage.id].startedAt) : undefined,
            completedAt: report.stageProgress[stage.id].completedAt ? new Date(report.stageProgress[stage.id].completedAt) : undefined
          };
        }
        return stage;
      });

      setCoherenceStages(updatedStages);

      if (report.status === 'COMPLETED' || report.status === 'FAILED') {
        setShowCoherenceProgressModal(false);
        setCoherenceAnalyzingProject(null);

        if (report.status === 'COMPLETED') {
          toast.success('Coherence analysis completed!');
        } else {
          toast.error('Coherence analysis failed. Please try again.');
        }

        return false;
      }

      return true;
    } catch (error) {
      console.error('Error polling coherence progress:', error);
      return true;
    }
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleAnalyzeCode = async (project: Project) => {
    if (analyzingProject) {
      toast.error('Please wait for the current analysis to complete');
      return;
    }

    setAnalyzingProject(project.id);

    // Reset progress state
    setProgressData({
      progress: 0,
      totalFiles: 0,
      processedFiles: 0,
      estimatedTimeRemaining: 0
    });
    setCurrentStage('');
    setAnalysisStages(defaultAnalysisStages.map(stage => ({
      ...stage,
      status: 'pending' as const,
      icon: stage.icon || FileText // Add fallback icon
    })));

    try {
      toast.loading('Starting code quality analysis...', { id: `analysis-${project.id}` });

      const response = await fetchBackend(`/projects/${project.id}/code-quality`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start code quality analysis');
      }

      const reportId = data.data?.reportId;
      if (!reportId) {
        throw new Error('No report ID returned from analysis start');
      }

      toast.success('Code quality analysis started!', {
        id: `analysis-${project.id}`,
        duration: 2000
      });

      // Show progress modal
      setShowProgressModal(true);

      // Start polling for progress
      const pollInterval = setInterval(async () => {
        const shouldContinuePolling = await pollProgress(project.id, reportId);
        if (!shouldContinuePolling) {
          clearInterval(pollInterval);
        }
      }, 2000); // Poll every 2 seconds

      // Cleanup polling on component unmount or after 10 minutes max
      setTimeout(() => {
        clearInterval(pollInterval);
        if (analyzingProject === project.id) {
          setShowProgressModal(false);
          setAnalyzingProject(null);
          toast.error('Analysis timeout. Please check the results manually.');
        }
      }, 600000); // 10 minutes timeout

    } catch (error) {
      console.error('Error starting code quality analysis:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start analysis', {
        id: `analysis-${project.id}`
      });
      setAnalyzingProject(null);
      setShowProgressModal(false);
    }
  };

  const resetCoherenceState = () => {
    setCoherenceAnalyzingProject(null);
    setShowCoherenceProgressModal(false);
    setCoherenceProgressData({ progress: 0 });
    setCoherenceCurrentStage('');
    setCoherenceStages(coherenceAnalysisStages.map(stage => ({
      ...stage,
      status: 'pending' as const,
      icon: stage.icon || FileText // Add fallback icon
    })));
    toast.success('Coherence analysis state reset');
  };

  const fetchRankingData = async () => {
    setLoadingRanking(true);
    try {
      // Use pre-loaded report data from backend (NO API CALLS!)
      const rankingData: ProjectRankingData[] = projects.map(project => {
        let completedReports = 0;

        // Extract scores from pre-loaded reports
        const codeQualityReport = project.code_quality_reports?.[0];
        const innovationReport = project.innovation_reports?.[0];
        const coherenceReport = project.coherence_reports?.[0];
        const hederaReport = project.hedera_analysis_reports?.[0];

        // Code quality score
        const codeQualityScore =
          codeQualityReport?.status === 'COMPLETED' && codeQualityReport.overallScore !== null
            ? codeQualityReport.overallScore
            : null;
        if (codeQualityScore !== null) completedReports++;

        // Innovation score
        const innovationScore =
          innovationReport?.status === 'COMPLETED' && innovationReport.score !== null
            ? innovationReport.score
            : null;
        if (innovationScore !== null) completedReports++;

        // Coherence score
        const coherenceScore =
          coherenceReport?.status === 'COMPLETED' && coherenceReport.score !== null
            ? coherenceReport.score
            : null;
        if (coherenceScore !== null) completedReports++;

        // Hedera score (null means no Hedera usage = 0)
        const hederaScore =
          hederaReport?.status === 'COMPLETED'
            ? (hederaReport.hederaUsageScore === null ? 0 : hederaReport.hederaUsageScore)
            : null;
        if (hederaScore !== null) completedReports++;

        // Calculate average score
        const scores = [codeQualityScore, innovationScore, coherenceScore, hederaScore].filter(
          score => score !== null && score !== undefined
        );
        const average = scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : null;

        return {
          id: project.id,
          name: project.name,
          teamName: project.teamName,
          track: project.track.name,
          codeQuality: codeQualityScore,
          innovation: innovationScore,
          coherence: coherenceScore,
          hedera: hederaScore,
          average,
          completedReports,
          totalReports: 4,
        };
      });

      setRankingData(rankingData);
    } catch (error) {
      console.error('Error processing ranking data:', error);
      toast.error('Failed to load ranking data');
    } finally {
      setLoadingRanking(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortedRankingData = () => {
    const sorted = [...rankingData].sort((a, b) => {
      const aValue = a[sortColumn] || 0;
      const bValue = b[sortColumn] || 0;

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 80) return 'text-green-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    if (score >= 40) return 'text-orange-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getScoreBadgeVariant = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'outline';
    if (score >= 80) return 'default'; // Green
    if (score >= 60) return 'secondary'; // Yellow
    if (score >= 40) return 'destructive'; // Orange/Red
    return 'destructive'; // Red
  };

  const handleStartCoherenceReview = async (project: Project) => {
    if (coherenceAnalyzingProject) {
      // Show a more helpful error with an option to reset
      toast.error(
        'Please wait for the current coherence analysis to complete, or refresh the page if stuck',
        {
          duration: 6000,
          id: `coherence-blocked-${project.id}`
        }
      );

      // Auto-reset after 10 seconds if still stuck
      setTimeout(() => {
        if (coherenceAnalyzingProject === project.id) {
          console.warn('Auto-resetting stuck coherence analysis state');
          resetCoherenceState();
        }
      }, 10000);

      return;
    }

    setCoherenceAnalyzingProject(project.id);

    // Reset progress state
    setCoherenceProgressData({
      progress: 0
    });
    setCoherenceCurrentStage('');
    setCoherenceStages(coherenceAnalysisStages.map(stage => ({
      ...stage,
      status: 'pending' as const,
      icon: stage.icon || FileText // Add fallback icon
    })));

    try {
      toast.loading('Starting coherence analysis...', { id: `coherence-${project.id}` });

      const response = await fetchBackend(`/projects/${project.id}/review/coherence`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start coherence analysis');
      }

      toast.success('Coherence analysis started!', {
        id: `coherence-${project.id}`,
        duration: 2000
      });

      // Show progress modal
      setShowCoherenceProgressModal(true);

      // Start polling for progress
      const pollInterval = setInterval(async () => {
        // Get the latest report to poll
        const reportResponse = await fetchBackend(`/projects/${project.id}/review/coherence`);
        const reportData = await reportResponse.json();
        if (reportData.success && reportData.data.length > 0) {
          const latestReport = reportData.data[0]; // Get most recent report
          const shouldContinuePolling = await pollCoherenceProgress(project.id, latestReport.id);
          if (!shouldContinuePolling) {
            clearInterval(pollInterval);
          }
        }
      }, 3000); // Poll every 3 seconds

      // Cleanup polling on component unmount or after 10 minutes max
      setTimeout(() => {
        clearInterval(pollInterval);
        if (coherenceAnalyzingProject === project.id) {
          setShowCoherenceProgressModal(false);
          setCoherenceAnalyzingProject(null);
          toast.error('Coherence analysis timeout. Please check the results manually.');
        }
      }, 600000); // 10 minutes timeout

    } catch (error) {
      console.error('Error starting coherence analysis:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start coherence analysis', {
        id: `coherence-${project.id}`
      });
      setCoherenceAnalyzingProject(null);
      setShowCoherenceProgressModal(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Clear any stale analyzing state on component load
        setAnalyzingProject(null);
        setCoherenceAnalyzingProject(null);
        setShowProgressModal(false);
        setShowCoherenceProgressModal(false);

        // Fetch hackathon details
        const hackathonResponse = await fetchBackend(`/hackathons/${hackathonId}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!hackathonResponse.ok) {
          throw new Error('Failed to fetch hackathon details');
        }

        const hackathonData = await hackathonResponse.json();
        if (!hackathonData.success) {
          throw new Error(hackathonData.error || 'Failed to fetch hackathon');
        }

        setHackathon(hackathonData.data);

        // Fetch projects
        const projectsResponse = await fetchBackend(`/hackathons/${hackathonId}/projects?limit=50`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!projectsResponse.ok) {
          throw new Error('Failed to fetch projects');
        }

        const projectsData: ProjectsResponse = await projectsResponse.json();
        if (!projectsData.success) {
          throw new Error('Failed to fetch projects');
        }

        setProjects(projectsData.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    if (hackathonId) {
      fetchData();
    }
  }, [hackathonId]);

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === '' ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTrack = selectedTrack === '' || project.track.id === selectedTrack;
    const matchesStatus = selectedStatus === '' || project.status === selectedStatus;

    return matchesSearch && matchesTrack && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-muted-foreground">Loading projects...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto border-red-200 bg-red-50">
          <CardContent className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Projects</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Button
              onClick={() => router.push('/dashboard/hackathons')}
              variant="outline"
            >
              Back to Hackathons
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No hackathon data found</p>
            <Button
              onClick={() => router.push('/dashboard/hackathons')}
              className="mt-4"
            >
              Back to Hackathons
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/dashboard/hackathons/${hackathon.id}`}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {hackathon.name}
        </Link>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Projects"
        description={`All projects submitted to ${hackathon.name}`}
        stats={[
          {
            label: 'Total Projects',
            value: projects.length,
          },
          {
            label: 'Filtered Results',
            value: filteredProjects.length,
          },
          {
            label: 'Available Tracks',
            value: hackathon.tracks?.length || 0,
          },
        ]}
      >
        <div className="flex gap-2">
          <Link href={`/dashboard/hackathons/${hackathon.id}/projects/upload`}>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <Upload className="w-4 h-4 mr-2" />
              Upload Projects
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Tabs */}
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-2" onClick={() => fetchRankingData()}>
            <Trophy className="w-4 h-4" />
            Ranking
          </TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search projects, teams, or descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Track Filter */}
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background border-input min-w-[150px]"
                >
                  <option value="">All Tracks</option>
                  {hackathon.tracks?.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background border-input min-w-[150px]"
                >
                  <option value="">All Status</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="DRAFT">Draft</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                </select>

                {/* Clear Filters */}
                {(searchQuery || selectedTrack || selectedStatus) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTrack('');
                      setSelectedStatus('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Projects List */}
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onViewDetails={handleViewDetails}
                  onAnalyzeCode={handleAnalyzeCode}
                  onStartCoherenceReview={handleStartCoherenceReview}
                  isAnalyzing={analyzingProject === project.id}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 rounded-full flex items-center justify-center">
                  <FolderOpen className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {searchQuery || selectedTrack || selectedStatus ? 'No projects match your filters' : 'No projects yet'}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {searchQuery || selectedTrack || selectedStatus
                      ? 'Try adjusting your search criteria or clearing the filters to see more projects.'
                      : 'Projects submitted to this hackathon will appear here. Get started by uploading your first project.'
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  {(searchQuery || selectedTrack || selectedStatus) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedTrack('');
                        setSelectedStatus('');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Link href={`/dashboard/hackathons/${hackathon.id}/projects/upload`}>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Project
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Project Rankings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Rankings based on completed analysis reports. Average calculated as (Code Quality + Innovation + Coherence + Hedera) / 4
              </p>
            </CardHeader>
            <CardContent>
              {loadingRanking ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                  <p className="ml-4 text-muted-foreground">Loading ranking data...</p>
                </div>
              ) : rankingData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Rank</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Track</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSort('codeQuality')}
                        >
                          <div className="flex items-center gap-1">
                            Code Quality
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSort('innovation')}
                        >
                          <div className="flex items-center gap-1">
                            Innovation
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSort('coherence')}
                        >
                          <div className="flex items-center gap-1">
                            Coherence
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleSort('hedera')}
                        >
                          <div className="flex items-center gap-1">
                            Hedera
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 transition-colors font-semibold"
                          onClick={() => handleSort('average')}
                        >
                          <div className="flex items-center gap-1">
                            Average
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSortedRankingData().map((project, index) => (
                        <TableRow key={project.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            {project.average !== null && project.average !== undefined ? (
                              <div className="flex items-center gap-2">
                                {index < 3 && (
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                    index === 1 ? 'bg-gray-100 text-gray-800' :
                                    'bg-orange-100 text-orange-800'
                                  }`}>
                                    {index + 1}
                                  </div>
                                )}
                                {index >= 3 && <span className="text-muted-foreground">{index + 1}</span>}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{project.name}</div>
                              <div className="text-sm text-muted-foreground">{project.teamName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{project.track}</Badge>
                          </TableCell>
                          <TableCell className={getScoreColor(project.codeQuality)}>
                            {project.codeQuality !== null && project.codeQuality !== undefined ? `${project.codeQuality.toFixed(1)}%` : '-'}
                          </TableCell>
                          <TableCell className={getScoreColor(project.innovation)}>
                            {project.innovation !== null && project.innovation !== undefined ? `${project.innovation.toFixed(1)}%` : '-'}
                          </TableCell>
                          <TableCell className={getScoreColor(project.coherence)}>
                            {project.coherence !== null && project.coherence !== undefined ? `${project.coherence.toFixed(1)}%` : '-'}
                          </TableCell>
                          <TableCell className={getScoreColor(project.hedera)}>
                            {project.hedera !== null && project.hedera !== undefined ? `${project.hedera.toFixed(1)}%` : '-'}
                          </TableCell>
                          <TableCell>
                            {project.average !== null && project.average !== undefined ? (
                              <Badge variant={getScoreBadgeVariant(project.average)} className="font-semibold">
                                {project.average.toFixed(1)}%
                              </Badge>
                            ) : (
                              <Badge variant="outline">No Data</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  project.completedReports === project.totalReports ? 'bg-green-500' :
                                  project.completedReports > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                                }`} />
                                <span className="text-xs text-muted-foreground">
                                  {project.completedReports}/{project.totalReports}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {Math.round((project.completedReports / project.totalReports) * 100)}% complete
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Ranking Data Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete project analysis reports to see rankings here.
                  </p>
                  <Button onClick={fetchRankingData} variant="outline">
                    Refresh Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAnalyzeCode={handleAnalyzeCode}
          isAnalyzing={analyzingProject === selectedProject.id}
        />
      )}

      {/* Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Code Quality Analysis Progress</DialogTitle>
          </DialogHeader>
          <ProgressIndicator
            stages={analysisStages}
            currentStage={currentStage}
            progress={progressData.progress}
            totalFiles={progressData.totalFiles}
            processedFiles={progressData.processedFiles}
            estimatedTimeRemaining={progressData.estimatedTimeRemaining}
            onCancel={() => {
              setShowProgressModal(false);
              setAnalyzingProject(null);
              toast.error('Analysis cancelled by user');
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Coherence Progress Modal */}
      <Dialog open={showCoherenceProgressModal} onOpenChange={setShowCoherenceProgressModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Coherence Analysis Progress</DialogTitle>
          </DialogHeader>
          <ProgressIndicator
            stages={coherenceStages}
            currentStage={coherenceCurrentStage}
            progress={coherenceProgressData.progress}
            onCancel={() => {
              setShowCoherenceProgressModal(false);
              setCoherenceAnalyzingProject(null);
              toast.error('Coherence analysis cancelled by user');
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}