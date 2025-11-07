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
  ArrowUpDown,
  Zap,
  ShieldCheck,
  XCircle,
  Save,
  Package,
  Trash2,
  Calendar,
  Layers,
  Eye,
  ExternalLink,
  RefreshCw,
  Download
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
import * as XLSX from 'xlsx';

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
  // Repository status (set after checking)
  repositoryStatus?: {
    accessible: boolean;
    isPublic: boolean;
    error?: string;
  };
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
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const pageSize = 50;

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

  // Bulk Analysis state
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loadingAllProjects, setLoadingAllProjects] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadedProjectsCount, setLoadedProjectsCount] = useState(0);
  const [totalProjectsToLoad, setTotalProjectsToLoad] = useState(0);

  // Eligibility criteria state
  const [eligibilityCriteria, setEligibilityCriteria] = useState({
    githubExists: true, // Required
    isPublic: false, // Optional - check repository is public
  });

  // Repository check state
  const [checkingRepositories, setCheckingRepositories] = useState(false);
  const [checkProgress, setCheckProgress] = useState({ checked: 0, total: 0 });

  // Save batch state
  const [showSaveBatchModal, setShowSaveBatchModal] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const [savingBatch, setSavingBatch] = useState(false);

  // Batches state
  const [batches, setBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  // Hedera analysis state
  const [selectedHederaBatch, setSelectedHederaBatch] = useState<string>('');
  const [runningHederaAnalysis, setRunningHederaAnalysis] = useState(false);
  const [hederaResults, setHederaResults] = useState<any[]>([]);
  const [hederaAnalysisComplete, setHederaAnalysisComplete] = useState(false);
  const [hederaProgress, setHederaProgress] = useState({ analyzed: 0, total: 0 });

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

  const fetchAllProjects = async () => {
    setLoadingAllProjects(true);
    setLoadingProgress(0);
    setLoadedProjectsCount(0);
    setTotalProjectsToLoad(totalProjects || 0);

    try {
      const batchSize = 200;
      let currentPage = 1;
      let allFetchedProjects: Project[] = [];
      let hasMore = true;
      let total = totalProjects || 0;

      while (hasMore) {
        // Fetch batch
        const response = await fetchBackend(
          `/hackathons/${hackathonId}/projects?page=${currentPage}&pageSize=${batchSize}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data: ProjectsResponse = await response.json();
        if (!data.success) {
          throw new Error('Failed to fetch projects');
        }

        // Update total on first batch
        if (currentPage === 1) {
          total = data.pagination.total;
          setTotalProjectsToLoad(total);
        }

        // Add fetched projects
        allFetchedProjects = [...allFetchedProjects, ...data.data];

        // Update progress
        const loadedCount = allFetchedProjects.length;
        setLoadedProjectsCount(loadedCount);
        setLoadingProgress(Math.min(Math.round((loadedCount / total) * 100), 100));

        // Check if we have more
        hasMore = data.pagination.hasNextPage;
        currentPage++;

        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Final update
      setAllProjects(allFetchedProjects);
      setLoadedProjectsCount(allFetchedProjects.length);
      setLoadingProgress(100);

      // Reset progress after completion
      setTimeout(() => {
        setLoadingProgress(0);
      }, 500);
    } catch (error) {
      console.error('Error fetching all projects:', error);
      toast.error('Failed to load all projects for analysis');
      setLoadingProgress(0);
      setLoadedProjectsCount(0);
      setTotalProjectsToLoad(0);
    } finally {
      setLoadingAllProjects(false);
    }
  };

  const checkAllRepositories = async () => {
    if (allProjects.length === 0) {
      toast.error('No projects loaded. Please load projects first.');
      return;
    }

    // IMPORTANT: Only check projects with valid GitHub URLs
    const projectsToCheck = allProjects.filter(p => p.githubUrl && p.githubUrl !== 'N/A');

    if (projectsToCheck.length === 0) {
      toast.error('No projects with valid GitHub URLs to check.');
      return;
    }

    console.log(`[Repository Check] Starting batch check for ${projectsToCheck.length} projects with valid URLs (out of ${allProjects.length} total)`);

    setCheckingRepositories(true);
    setCheckProgress({ checked: 0, total: projectsToCheck.length });

    try {
      // Get IDs of only projects with valid GitHub URLs
      const projectIds = projectsToCheck.map(p => p.id);

      // Split into batches of 100
      const BATCH_SIZE = 100;
      const batches = [];
      for (let i = 0; i < projectIds.length; i += BATCH_SIZE) {
        batches.push(projectIds.slice(i, i + BATCH_SIZE));
      }

      console.log(`[Repository Check] Split into ${batches.length} batches of ${BATCH_SIZE}`);

      toast.loading(`Checking repositories... (0/${projectsToCheck.length})`, { id: 'check-repos' });

      let totalChecked = 0;
      const allResults: any[] = [];

      // Process each batch sequentially
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchNumber = batchIndex + 1;

        console.log(`[Repository Check] Processing batch ${batchNumber}/${batches.length} (${batch.length} projects)`);

        // Call backend API for this batch
        const response = await fetchBackend(`/hackathons/${hackathonId}/projects/check-repositories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ projectIds: batch }),
        });

        if (!response.ok) {
          throw new Error(`Failed to check batch ${batchNumber}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(`Failed to check batch ${batchNumber}`);
        }

        // Accumulate results
        allResults.push(...data.results);
        totalChecked += batch.length;

        // Update progress
        setCheckProgress({ checked: totalChecked, total: projectsToCheck.length });
        toast.loading(`Checking repositories... (${totalChecked}/${projectsToCheck.length})`, { id: 'check-repos' });

        // Update UI with results from this batch
        const updatedProjects = allProjects.map(project => {
          // If project has no GitHub URL or N/A, mark it explicitly as not checkable
          if (!project.githubUrl || project.githubUrl === 'N/A') {
            return {
              ...project,
              repositoryStatus: {
                accessible: false,
                isPublic: false,
                error: 'No GitHub URL provided',
              },
            };
          }

          // Otherwise, find the result from all accumulated results
          const result = allResults.find((r: any) => r.projectId === project.id);
          if (result) {
            return {
              ...project,
              repositoryStatus: {
                accessible: result.accessible,
                isPublic: result.isPublic,
                error: result.error,
              },
            };
          }
          return project;
        });

        // Update state after each batch
        setAllProjects(updatedProjects);

        console.log(`[Repository Check] Batch ${batchNumber}/${batches.length} completed. Total checked: ${totalChecked}/${projectsToCheck.length}`);
      }

      // Final statistics
      const publicRepos = allResults.filter(r => r.isPublic).length;
      const privateRepos = allResults.filter(r => r.accessible && !r.isPublic).length;
      const inaccessibleRepos = allResults.filter(r => !r.accessible).length;

      console.log(`[Repository Check] Final Results:`, {
        totalProjects: allProjects.length,
        checkedRepos: allResults.length,
        public: publicRepos,
        private: privateRepos,
        inaccessible: inaccessibleRepos,
      });

      toast.success(`Checked ${allResults.length} repositories! Found ${publicRepos} public, ${privateRepos} private.`, { id: 'check-repos' });
    } catch (error) {
      console.error('Error checking repositories:', error);
      toast.error('Failed to check repositories', { id: 'check-repos' });
    } finally {
      setCheckingRepositories(false);
    }
  };

  // Combined function: Load projects + optionally check repositories
  const runEligibilityAnalysis = async () => {
    setLoadingAllProjects(true);
    setLoadingProgress(0);
    setLoadedProjectsCount(0);
    setTotalProjectsToLoad(totalProjects || 0);

    try {
      // Step 1: Load all projects
      toast.loading('Step 1/2: Loading projects...', { id: 'analysis' });

      const batchSize = 200;
      let currentPage = 1;
      let allFetchedProjects: Project[] = [];
      let hasMore = true;
      let total = totalProjects || 0;

      while (hasMore) {
        const response = await fetchBackend(
          `/hackathons/${hackathonId}/projects?page=${currentPage}&pageSize=${batchSize}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data: ProjectsResponse = await response.json();
        if (!data.success) {
          throw new Error('Failed to fetch projects');
        }

        if (currentPage === 1) {
          total = data.pagination.total;
          setTotalProjectsToLoad(total);
        }

        allFetchedProjects = [...allFetchedProjects, ...data.data];

        const loadedCount = allFetchedProjects.length;
        setLoadedProjectsCount(loadedCount);
        setLoadingProgress(Math.min(Math.round((loadedCount / total) * 100), 100));

        hasMore = data.pagination.hasNextPage;
        currentPage++;

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setAllProjects(allFetchedProjects);
      console.log(`[Analysis] Loaded ${allFetchedProjects.length} projects`);

      // Step 2: If "Repository is Public" is checked, run repository check
      if (eligibilityCriteria.isPublic) {
        toast.loading('Step 2/2: Checking repositories...', { id: 'analysis' });
        setCheckingRepositories(true);

        const projectsToCheck = allFetchedProjects.filter(p => p.githubUrl && p.githubUrl !== 'N/A');

        if (projectsToCheck.length > 0) {
          setCheckProgress({ checked: 0, total: projectsToCheck.length });

          const projectIds = projectsToCheck.map(p => p.id);
          const BATCH_SIZE = 100;
          const batches = [];
          for (let i = 0; i < projectIds.length; i += BATCH_SIZE) {
            batches.push(projectIds.slice(i, i + BATCH_SIZE));
          }

          console.log(`[Analysis] Checking ${projectsToCheck.length} repositories in ${batches.length} batches`);

          let totalChecked = 0;
          const allResults: any[] = [];

          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            const batchNumber = batchIndex + 1;

            const response = await fetchBackend(`/hackathons/${hackathonId}/projects/check-repositories`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ projectIds: batch }),
            });

            if (!response.ok) {
              throw new Error(`Failed to check batch ${batchNumber}`);
            }

            const data = await response.json();

            if (!data.success) {
              throw new Error(`Failed to check batch ${batchNumber}`);
            }

            allResults.push(...data.results);
            totalChecked += batch.length;

            setCheckProgress({ checked: totalChecked, total: projectsToCheck.length });
            toast.loading(`Step 2/2: Checking repositories (${totalChecked}/${projectsToCheck.length})...`, { id: 'analysis' });

            const updatedProjects = allFetchedProjects.map(project => {
              if (!project.githubUrl || project.githubUrl === 'N/A') {
                return {
                  ...project,
                  repositoryStatus: {
                    accessible: false,
                    isPublic: false,
                    error: 'No GitHub URL provided',
                  },
                };
              }

              const result = allResults.find((r: any) => r.projectId === project.id);
              if (result) {
                return {
                  ...project,
                  repositoryStatus: {
                    accessible: result.accessible,
                    isPublic: result.isPublic,
                    error: result.error,
                  },
                };
              }
              return project;
            });

            allFetchedProjects = updatedProjects;
            setAllProjects(updatedProjects);
          }

          const publicRepos = allResults.filter(r => r.isPublic).length;
          const privateRepos = allResults.filter(r => r.accessible && !r.isPublic).length;

          console.log(`[Analysis] Repository check completed: ${publicRepos} public, ${privateRepos} private`);
        }

        setCheckingRepositories(false);
      }

      // Final success message
      const eligible = allFetchedProjects.filter(project => {
        if (eligibilityCriteria.githubExists) {
          if (!project.githubUrl || project.githubUrl === 'N/A') return false;
        }
        if (eligibilityCriteria.isPublic) {
          if (!project.repositoryStatus || !project.repositoryStatus.isPublic) return false;
        }
        return true;
      });

      toast.success(`Analysis complete! Found ${eligible.length} eligible projects.`, { id: 'analysis' });
      setLoadingProgress(0);

    } catch (error) {
      console.error('Error running eligibility analysis:', error);
      toast.error('Failed to run analysis', { id: 'analysis' });
      setLoadingProgress(0);
      setLoadedProjectsCount(0);
      setTotalProjectsToLoad(0);
    } finally {
      setLoadingAllProjects(false);
      setCheckingRepositories(false);
    }
  };

  const saveBatch = async () => {
    if (!batchName.trim()) {
      toast.error('Please enter a batch name');
      return;
    }

    const eligibleProjects = getEligibleProjects();

    if (eligibleProjects.length === 0) {
      toast.error('No eligible projects to save');
      return;
    }

    setSavingBatch(true);

    try {
      // Deduplicate project IDs to avoid issues with duplicate entries
      const uniqueProjectIds = [...new Set(eligibleProjects.map(p => p.id))];

      const payload = {
        name: batchName,
        description: batchDescription,
        projectIds: uniqueProjectIds,
        criteria: eligibilityCriteria,
      };

      console.log('[Save Batch] Sending payload:', {
        hackathonId,
        originalCount: eligibleProjects.length,
        uniqueCount: uniqueProjectIds.length,
        hasDuplicates: eligibleProjects.length !== uniqueProjectIds.length,
        projectCount: payload.projectIds.length,
        projectIds: payload.projectIds.slice(0, 5), // First 5 IDs for debugging
        criteria: payload.criteria,
      });

      const response = await fetchBackend(`/hackathons/${hackathonId}/eligibility-batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save batch');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Failed to save batch');
      }

      toast.success(`Batch "${batchName}" saved successfully with ${eligibleProjects.length} projects!`);
      setShowSaveBatchModal(false);
      setBatchName('');
      setBatchDescription('');

      // Reload batches list
      fetchBatches();
    } catch (error: any) {
      console.error('Error saving batch:', error);
      toast.error(error.message || 'Failed to save batch');
    } finally {
      setSavingBatch(false);
    }
  };

  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      const response = await fetchBackend(`/hackathons/${hackathonId}/eligibility-batches`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Failed to fetch batches');
      }

      setBatches(data.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoadingBatches(false);
    }
  };

  const deleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) {
      return;
    }

    try {
      const response = await fetchBackend(`/hackathons/${hackathonId}/eligibility-batches/${batchId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete batch');
      }

      toast.success('Batch deleted successfully');
      fetchBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error('Failed to delete batch');
    }
  };

  const viewBatchDetails = async (batchId: string) => {
    try {
      const response = await fetchBackend(`/hackathons/${hackathonId}/eligibility-batches/${batchId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch batch details');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Failed to fetch batch details');
      }

      setSelectedBatch(data.data);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      toast.error('Failed to load batch details');
    }
  };

  const runHederaAnalysis = async () => {
    if (!selectedHederaBatch) {
      toast.error('Please select a batch first');
      return;
    }

    setRunningHederaAnalysis(true);
    setHederaAnalysisComplete(false);
    setHederaResults([]);

    try {
      // Get the selected batch details to get project IDs
      const batchResponse = await fetchBackend(`/hackathons/${hackathonId}/eligibility-batches/${selectedHederaBatch}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!batchResponse.ok) {
        throw new Error('Failed to fetch batch details');
      }

      const batchData = await batchResponse.json();
      if (!batchData.success) {
        throw new Error('Failed to fetch batch details');
      }

      const projectIds = batchData.data.batchProjects.map((bp: any) => bp.projectId);

      console.log('[Hedera Analysis] Starting analysis for', projectIds.length, 'projects');
      console.log('[Hedera Analysis] Project IDs:', projectIds);

      // Initialize progress
      setHederaProgress({ analyzed: 0, total: projectIds.length });

      // Run Hedera analysis
      const response = await fetchBackend(`/hackathons/${hackathonId}/hedera-analysis/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ projectIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Hedera Analysis] Error response:', errorData);
        throw new Error(errorData.message || 'Failed to run Hedera analysis');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to run Hedera analysis');
      }

      // Poll for results with progress updates
      await pollHederaResults(projectIds);

      toast.success(data.message || 'Hedera analysis completed successfully');
      setHederaAnalysisComplete(true);
    } catch (error: any) {
      console.error('Error running Hedera analysis:', error);
      toast.error(error.message || 'Failed to run Hedera analysis');
    } finally {
      setRunningHederaAnalysis(false);
      setHederaProgress({ analyzed: 0, total: 0 });
    }
  };

  const pollHederaResults = async (projectIds: string[]) => {
    // Calculate timeout: 1.5 seconds per project + 2 minute buffer
    const estimatedSeconds = Math.ceil(projectIds.length * 1.5) + 120;
    const maxAttempts = estimatedSeconds; // Poll every second
    const pollInterval = 1000; // Poll every 1 second for real-time updates

    console.log(`[Hedera Analysis] Will poll for up to ${Math.ceil(estimatedSeconds / 60)} minutes`);

    let previousAnalyzedCount = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      // Fetch current results
      const results = await Promise.all(
        projectIds.map(async (projectId) => {
          try {
            const project = allProjects.find(p => p.id === projectId);
            if (!project) return null;

            const response = await fetchBackend(`/projects/${projectId}/hedera-report`, {
              method: 'GET',
              credentials: 'include',
            });

            if (!response.ok) return { project, report: null, analyzed: false };

            const data = await response.json();
            return {
              project,
              report: data.success ? data.data : null,
              analyzed: data.success && data.data !== null,
            };
          } catch (error) {
            return null;
          }
        })
      );

      const validResults = results.filter(r => r !== null);
      const analyzedCount = validResults.filter(r => r.analyzed).length;

      // Update progress immediately when count changes
      if (analyzedCount !== previousAnalyzedCount) {
        console.log(`[Hedera Analysis] Progress: ${analyzedCount}/${projectIds.length}`);
        setHederaProgress({ analyzed: analyzedCount, total: projectIds.length });
        setHederaResults(validResults);
        previousAnalyzedCount = analyzedCount;
      }

      // Check if all projects have been analyzed
      if (analyzedCount >= projectIds.length) {
        console.log('[Hedera Analysis] All projects analyzed successfully');
        break;
      }

      // Log progress every 30 seconds
      if (attempt > 0 && attempt % 30 === 0) {
        const elapsed = Math.floor(attempt / 60);
        const remaining = Math.ceil((projectIds.length - analyzedCount) * 1.5 / 60);
        console.log(`[Hedera Analysis] ${elapsed}m elapsed, ${analyzedCount}/${projectIds.length} complete, ~${remaining}m remaining`);
      }
    }

    // Final check - if we timed out, log the status
    if (previousAnalyzedCount < projectIds.length) {
      console.warn(`[Hedera Analysis] Polling timed out. Completed: ${previousAnalyzedCount}/${projectIds.length}`);
      toast.warning(`Analysis timed out. ${previousAnalyzedCount} of ${projectIds.length} projects completed.`);
    }
  };

  const fetchHederaResults = async (projectIds: string[]) => {
    try {
      // Fetch hedera reports for the analyzed projects
      const results = await Promise.all(
        projectIds.map(async (projectId) => {
          try {
            const project = allProjects.find(p => p.id === projectId);
            if (!project) return null;

            // Fetch hedera report for this project
            const response = await fetchBackend(`/projects/${projectId}/hedera-report`, {
              method: 'GET',
              credentials: 'include',
            });

            if (!response.ok) return { project, report: null };

            const data = await response.json();
            return {
              project,
              report: data.success ? data.data : null,
            };
          } catch (error) {
            console.error(`Error fetching report for project ${projectId}:`, error);
            return null;
          }
        })
      );

      const validResults = results.filter(r => r !== null);
      setHederaResults(validResults);
    } catch (error) {
      console.error('Error fetching Hedera results:', error);
    }
  };

  const getEligibleProjects = () => {
    const eligible = allProjects.filter(project => {
      // Check GitHub exists criterion
      if (eligibilityCriteria.githubExists) {
        if (!project.githubUrl || project.githubUrl === 'N/A') {
          return false;
        }
      }

      // Check isPublic criterion - when checked, REQUIRE analysis AND public status
      if (eligibilityCriteria.isPublic) {
        // If not analyzed yet, exclude it
        if (!project.repositoryStatus) {
          return false;
        }
        // If analyzed but not public, exclude it
        if (!project.repositoryStatus.isPublic) {
          return false;
        }
      }

      // All criteria passed
      return true;
    });

    // Log filter results for debugging
    console.log(`[Filter] Eligible projects:`, {
      total: allProjects.length,
      eligible: eligible.length,
      criteria: eligibilityCriteria,
      sample: eligible.slice(0, 3).map(p => ({
        name: p.name,
        hasUrl: !!p.githubUrl && p.githubUrl !== 'N/A',
        status: p.repositoryStatus,
      })),
    });

    return eligible;
  };

  const getIneligibleProjects = () => {
    return allProjects.filter(project => {
      // Ineligible if it doesn't meet any of the eligible criteria
      if (eligibilityCriteria.githubExists) {
        if (!project.githubUrl || project.githubUrl === 'N/A') {
          return true;
        }
      }

      // Check isPublic criterion - when checked, exclude unanalyzed or non-public repos
      if (eligibilityCriteria.isPublic) {
        // If not analyzed yet, it's ineligible
        if (!project.repositoryStatus) {
          return true;
        }
        // If analyzed but not public, it's ineligible
        if (!project.repositoryStatus.isPublic) {
          return true;
        }
      }

      return false;
    });
  };

  const getIneligibilityReason = (project: Project): string => {
    // Check for missing GitHub URL first
    if (!project.githubUrl || project.githubUrl === 'N/A') {
      return 'No GitHub URL';
    }

    // If we have a repository status, check for specific issues
    if (project.repositoryStatus) {
      if (!project.repositoryStatus.accessible) {
        return 'Inaccessible Repository';
      }
      if (project.repositoryStatus.accessible && !project.repositoryStatus.isPublic) {
        return 'Private Repository';
      }
    }

    // Default fallback
    return 'Does not meet criteria';
  };

  // Export functions
  const exportToExcel = (projects: Project[], filename: string) => {
    try {
      // Prepare CSV data
      const headers = ['Project Name', 'Team Name', 'GitHub URL', 'Track', 'Status', 'Reason'];
      const rows = projects.map(project => [
        project.name || '',
        project.teamName || '',
        project.githubUrl || 'N/A',
        project.track?.name || 'N/A',
        getEligibleProjects().some(p => p.id === project.id) ? 'Eligible' : 'Ineligible',
        getEligibleProjects().some(p => p.id === project.id) ? 'Meets all criteria' : getIneligibilityReason(project)
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${projects.length} projects to ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export projects');
    }
  };

  const exportEligibleProjects = () => {
    const eligible = getEligibleProjects();
    exportToExcel(eligible, `eligible-projects-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportIneligibleProjects = () => {
    const ineligible = getIneligibleProjects();
    exportToExcel(ineligible, `ineligible-projects-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Hedera Export Functions
  const exportHederaToCSV = (results: any[], filename: string, withHedera: boolean) => {
    try {
      // Prepare CSV data with Hedera-specific columns
      const headers = [
        'Project Name',
        'Team Name',
        'GitHub URL',
        'Hedera Status',
        'Confidence %',
        'Technologies',
        'Complexity Level',
        'Summary'
      ];

      const rows = results
        .filter(r => withHedera ? r.report?.hederaPresenceDetected : !r.report?.hederaPresenceDetected)
        .map(result => [
          result.project.name || '',
          result.project.teamName || '',
          result.project.githubUrl || 'N/A',
          result.report?.hederaPresenceDetected ? 'Detected' : 'Not Detected',
          result.report?.confidence || 0,
          (result.report?.detectedTechnologies || []).join('; ') || 'None',
          result.report?.complexityLevel || 'N/A',
          result.report?.summary || 'N/A'
        ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${rows.length} projects to ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export projects');
    }
  };

  const exportHederaProjects = () => {
    exportHederaToCSV(
      hederaResults,
      `hedera-detected-projects-${new Date().toISOString().split('T')[0]}.csv`,
      true
    );
  };

  const exportNonHederaProjects = () => {
    exportHederaToCSV(
      hederaResults,
      `no-hedera-projects-${new Date().toISOString().split('T')[0]}.csv`,
      false
    );
  };

  // Comprehensive Export All function for batch analysis with Excel formatting and colors
  const exportAllBatchResults = async () => {
    try {
      if (!selectedHederaBatch) {
        toast.error('Please select a batch first');
        return;
      }

      toast.loading('Fetching complete batch data...');

      // Fetch complete batch data with ALL projects
      const batchResponse = await fetchBackend(`/hackathons/${hackathonId}/eligibility-batches/${selectedHederaBatch}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!batchResponse.ok) {
        throw new Error('Failed to fetch batch details');
      }

      const batchData = await batchResponse.json();
      if (!batchData.success) {
        throw new Error('Failed to fetch batch details');
      }

      const batch = batchData.data;
      const allBatchProjects = batch.batchProjects || [];

      if (allBatchProjects.length === 0) {
        toast.error('No projects found in this batch');
        return;
      }

      toast.dismiss();

      console.log('[Export] Batch data structure:', batch);
      console.log('[Export] First project sample:', allBatchProjects[0]);

      // Prepare data with all project details
      const exportData = allBatchProjects.map((bp: any) => {
        const project = bp.project;
        const hederaReport = project.hederaReports?.[0] || null;
        const eligibilityReport = project.eligibilityReports?.[0] || null;

        // Extract eligibility data from eligibility report
        const hasGithubRepo = project.githubUrl && project.githubUrl !== 'N/A' && project.githubUrl.trim() !== '';

        // Check if repo is public from eligibility report or accessibility check
        let isPublicRepo = false;
        if (eligibilityReport && eligibilityReport.accessibilityCheck) {
          isPublicRepo = eligibilityReport.accessibilityCheck.isPublic === true;
        }

        const hasHedera = hederaReport?.hederaPresenceDetected || false;

        // Final eligibility: must have GitHub repo, must be public, and must have Hedera
        const isEligible = hasGithubRepo && isPublicRepo && hasHedera;

        return {
          'Project Name': project.name || 'N/A',
          'Team Name': project.teamName || 'N/A',
          'GitHub Link': hasGithubRepo ? project.githubUrl : 'N/A',
          'Demo Link': project.demoUrl || 'N/A',
          'Video Link': project.videoUrl || 'N/A',
          'Presentation Link': project.presentationUrl || 'N/A',
          'Track': project.track?.name || 'N/A',
          'Existent Github Repo': hasGithubRepo ? 'YES' : 'NO',
          'Public Github Repo': isPublicRepo ? 'YES' : 'NO',
          'Hedera Use': hasHedera ? 'YES' : 'NO',
          'Eligible': isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE',
          'Hedera Confidence %': hederaReport?.confidence || 0,
          'Complexity Level': hederaReport?.complexityLevel || 'N/A',
          'Hedera Technologies': (hederaReport?.detectedTechnologies || []).join(', ') || 'None',
          'Hedera Summary': hederaReport?.summary || 'N/A',
          'Eligibility Reason': eligibilityReport?.reason || 'N/A',
          'Repository Status': eligibilityReport?.repositoryStatus || 'N/A'
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Batch Analysis Results');

      // Set column widths for better readability
      const colWidths = [
        { wch: 30 }, // Project Name
        { wch: 25 }, // Team Name
        { wch: 50 }, // GitHub Link
        { wch: 40 }, // Demo Link
        { wch: 40 }, // Video Link
        { wch: 40 }, // Presentation Link
        { wch: 20 }, // Track
        { wch: 22 }, // Existent Github Repo
        { wch: 22 }, // Public Github Repo
        { wch: 15 }, // Hedera Use
        { wch: 18 }, // Eligible
        { wch: 20 }, // Hedera Confidence %
        { wch: 18 }, // Complexity Level
        { wch: 40 }, // Hedera Technologies
        { wch: 50 }, // Hedera Summary
        { wch: 40 }, // Eligibility Reason
        { wch: 25 }  // Repository Status
      ];
      ws['!cols'] = colWidths;

      // Apply cell styling for headers and data
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

      // Style header row (bold and colored background)
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1";
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }

      // Style data rows with colors based on eligibility and status
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const rowData = exportData[R - 1];

        // Color the "Eligible" column (Column K - index 10)
        const eligibleCol = 10;
        const eligibleAddress = XLSX.utils.encode_col(eligibleCol) + (R + 1);
        if (ws[eligibleAddress]) {
          ws[eligibleAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: rowData['Eligible'] === 'ELIGIBLE' ? "00B050" : "FF0000" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }

        // Color YES/NO columns with conditional formatting
        // Columns: Existent Github (7), Public Github (8), Hedera Use (9)
        const yesNoColumns = [7, 8, 9];
        yesNoColumns.forEach(col => {
          const address = XLSX.utils.encode_col(col) + (R + 1);
          if (ws[address]) {
            const value = ws[address].v;
            ws[address].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: value === 'YES' ? "92D050" : "FFC000" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          }
        });

        // Color confidence percentage (Column L - index 11)
        const confidenceCol = 11;
        const confidenceAddress = XLSX.utils.encode_col(confidenceCol) + (R + 1);
        if (ws[confidenceAddress]) {
          const confidence = rowData['Hedera Confidence %'];
          let color = "CCCCCC"; // Gray for 0
          if (confidence >= 80) color = "00B050"; // Green
          else if (confidence >= 60) color = "92D050"; // Light green
          else if (confidence >= 40) color = "FFC000"; // Orange
          else if (confidence > 0) color = "FF6B6B"; // Red

          ws[confidenceAddress].s = {
            font: { bold: true, color: { rgb: confidence > 0 ? "FFFFFF" : "000000" } },
            fill: { fgColor: { rgb: color } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      }

      // Generate filename with date
      const filename = `batch-analysis-complete-${new Date().toISOString().split('T')[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);

      const eligibleCount = exportData.filter(d => d['Eligible'] === 'ELIGIBLE').length;
      const withHedera = exportData.filter(d => d['Hedera Use'] === 'YES').length;

      toast.success(
        `Exported ${exportData.length} projects (${eligibleCount} eligible, ${withHedera} with Hedera) to ${filename}`,
        { duration: 5000 }
      );
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export batch results to Excel');
    }
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

        // Fetch projects with pagination
        const projectsResponse = await fetchBackend(`/hackathons/${hackathonId}/projects?page=${currentPage}&pageSize=${pageSize}`, {
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
        setTotalProjects(projectsData.pagination.total);
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
  }, [hackathonId, currentPage]);

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
            value: totalProjects,
          },
          {
            label: 'Current Page',
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-2" onClick={() => fetchRankingData()}>
            <Trophy className="w-4 h-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="bulk-analysis" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Bulk Analysis
          </TabsTrigger>
          <TabsTrigger value="batches" className="flex items-center gap-2" onClick={() => fetchBatches()}>
            <Package className="w-4 h-4" />
            Batches
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
            <>
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

              {/* Pagination Controls */}
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalProjects)} of {totalProjects} projects
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-sm">Page {currentPage} of {Math.ceil(totalProjects / pageSize)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(totalProjects / pageSize)}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.ceil(totalProjects / pageSize))}
                      disabled={currentPage >= Math.ceil(totalProjects / pageSize)}
                    >
                      Last
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
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

        {/* Bulk Analysis Tab */}
        <TabsContent value="bulk-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Bulk Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Run analysis operations on multiple projects at once
              </p>
            </CardHeader>
            <CardContent>
              {/* Nested Tabs for Bulk Analysis */}
              <Tabs defaultValue="eligibility" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="eligibility"
                    className="flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Eligibility Analysis
                  </TabsTrigger>
                  <TabsTrigger
                    value="hedera"
                    className="flex items-center gap-2"
                    onClick={() => fetchBatches()}
                  >
                    <GitBranch className="w-4 h-4" />
                    Hedera Analysis
                  </TabsTrigger>
                </TabsList>

                {/* Eligibility Analysis Sub-tab */}
                <TabsContent value="eligibility" className="space-y-4">
                  {/* Eligibility Criteria Section - Always Visible */}
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Eligibility Criteria
                          </CardTitle>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Projects must meet ALL checked criteria to be considered eligible
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* GitHub Exists Criterion */}
                            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                              <input
                                type="checkbox"
                                id="githubExists"
                                checked={eligibilityCriteria.githubExists}
                                onChange={(e) => setEligibilityCriteria({
                                  ...eligibilityCriteria,
                                  githubExists: e.target.checked
                                })}
                                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <label
                                htmlFor="githubExists"
                                className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                              >
                                GitHub Repository URL Exists
                              </label>
                              <Badge variant={eligibilityCriteria.githubExists ? "default" : "outline"} className="text-xs">
                                {eligibilityCriteria.githubExists ? "Required" : "Optional"}
                              </Badge>
                            </div>

                            {/* Repository is Public Criterion */}
                            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                              <input
                                type="checkbox"
                                id="isPublic"
                                checked={eligibilityCriteria.isPublic}
                                onChange={(e) => {
                                  setEligibilityCriteria({
                                    ...eligibilityCriteria,
                                    isPublic: e.target.checked
                                  });
                                }}
                                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <label
                                htmlFor="isPublic"
                                className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                              >
                                Repository is Public (not private)
                              </label>
                              <Badge variant={eligibilityCriteria.isPublic ? "default" : "outline"} className="text-xs">
                                {eligibilityCriteria.isPublic ? "Required" : "Optional"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                  {/* Loading State */}
                  {loadingAllProjects || checkingRepositories ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                      <LoadingSpinner size="lg" />
                      <div className="w-full max-w-md space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {checkingRepositories
                              ? 'Checking repositories...'
                              : 'Loading all projects...'}
                          </span>
                          <span className="font-semibold text-blue-600">
                            {checkingRepositories
                              ? `${checkProgress.checked} / ${checkProgress.total}`
                              : `${loadedProjectsCount} / ${totalProjectsToLoad}`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300 ease-out"
                            style={{
                              width: checkingRepositories
                                ? `${Math.round((checkProgress.checked / checkProgress.total) * 100)}%`
                                : `${loadingProgress}%`
                            }}
                          />
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          {checkingRepositories ? (
                            `Step 2/2: Verifying repository accessibility...`
                          ) : (
                            loadingProgress < 50
                              ? 'Step 1/2: Connecting to server...'
                              : loadingProgress < 90
                              ? 'Step 1/2: Fetching projects data...'
                              : 'Step 1/2: Processing results...'
                          )}
                        </p>
                      </div>
                    </div>
                  ) : allProjects.length > 0 ? (
                    <div className="space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Eligible Projects Card */}
                        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                              <ShieldCheck className="w-5 h-5" />
                              Eligible Projects
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                              {getEligibleProjects().length}
                            </div>
                            <p className="text-sm text-green-600 dark:text-green-500 mt-2">
                              Projects with valid GitHub URLs
                            </p>
                          </CardContent>
                        </Card>

                        {/* Ineligible Projects Card */}
                        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                              <XCircle className="w-5 h-5" />
                              Ineligible Projects
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-4xl font-bold text-red-600 dark:text-red-400">
                              {getIneligibleProjects().length}
                            </div>
                            <p className="text-sm text-red-600 dark:text-red-500 mt-2">
                              Projects with N/A GitHub URLs
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Export Buttons */}
                      <div className="flex gap-4">
                        <Button
                          onClick={exportEligibleProjects}
                          disabled={getEligibleProjects().length === 0}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Download className="mr-2 w-4 h-4" />
                          Export Eligible Projects ({getEligibleProjects().length})
                        </Button>
                        <Button
                          onClick={exportIneligibleProjects}
                          disabled={getIneligibleProjects().length === 0}
                          variant="outline"
                          className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                        >
                          <Download className="mr-2 w-4 h-4" />
                          Export Ineligible Projects ({getIneligibleProjects().length})
                        </Button>
                      </div>

                      {/* Debug Statistics Panel */}
                      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Debug Statistics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-muted-foreground">Total Projects</div>
                              <div className="text-lg font-semibold">{allProjects.length}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">With GitHub URLs</div>
                              <div className="text-lg font-semibold">
                                {allProjects.filter(p => p.githubUrl && p.githubUrl !== 'N/A').length}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Analyzed</div>
                              <div className="text-lg font-semibold">
                                {allProjects.filter(p => p.repositoryStatus).length}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Public Repos</div>
                              <div className="text-lg font-semibold text-green-600">
                                {allProjects.filter(p => p.repositoryStatus?.isPublic).length}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Private Repos</div>
                              <div className="text-lg font-semibold text-orange-600">
                                {allProjects.filter(p => p.repositoryStatus && !p.repositoryStatus.isPublic && p.repositoryStatus.accessible).length}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Inaccessible</div>
                              <div className="text-lg font-semibold text-red-600">
                                {allProjects.filter(p => p.repositoryStatus && !p.repositoryStatus.accessible).length}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">N/A URLs</div>
                              <div className="text-lg font-semibold text-gray-600">
                                {allProjects.filter(p => !p.githubUrl || p.githubUrl === 'N/A').length}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Pending Check</div>
                              <div className="text-lg font-semibold text-gray-600">
                                {allProjects.filter(p => (p.githubUrl && p.githubUrl !== 'N/A') && !p.repositoryStatus).length}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                            <strong>Active Filters:</strong> {eligibilityCriteria.githubExists && 'GitHub URL exists'}{eligibilityCriteria.githubExists && eligibilityCriteria.isPublic && ' + '}{eligibilityCriteria.isPublic && 'Public repository'}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Eligible Projects List */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2 text-green-600">
                                <ShieldCheck className="w-5 h-5" />
                                Eligible Projects ({getEligibleProjects().length})
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Projects with valid GitHub repository links
                              </p>
                            </div>
                            {getEligibleProjects().length > 0 && (
                              <Button
                                onClick={() => setShowSaveBatchModal(true)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save Batch
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {getEligibleProjects().length > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {getEligibleProjects().map((project) => (
                                <div
                                  key={project.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">{project.name}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">{project.track.name}</Badge>
                                      <span className="text-xs">{project.teamName}</span>
                                      {/* Repository Status Badge */}
                                      {project.repositoryStatus && (
                                        project.repositoryStatus.isPublic ? (
                                          <Badge className="text-xs bg-green-500 hover:bg-green-600">Public</Badge>
                                        ) : project.repositoryStatus.accessible ? (
                                          <Badge className="text-xs bg-orange-500 hover:bg-orange-600">Private</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-xs text-red-500">Inaccessible</Badge>
                                        )
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={project.githubUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                                    >
                                      View GitHub
                                    </a>
                                    <ShieldCheck className="w-5 h-5 text-green-500" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              No eligible projects found
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Ineligible Projects List */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-5 h-5" />
                            Ineligible Projects ({getIneligibleProjects().length})
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Projects without valid GitHub repository links
                          </p>
                        </CardHeader>
                        <CardContent>
                          {getIneligibleProjects().length > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {getIneligibleProjects().map((project) => (
                                <div
                                  key={project.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">{project.name}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">{project.track.name}</Badge>
                                      <span className="text-xs">{project.teamName}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="destructive" className="text-xs">
                                      {getIneligibilityReason(project)}
                                    </Badge>
                                    <XCircle className="w-5 h-5 text-red-500" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              All projects have valid GitHub URLs!
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8 text-blue-500" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          Ready to Run Analysis
                        </h3>
                        <p className="text-muted-foreground max-w-md">
                          Select your eligibility criteria above, then click "Run Analysis" to load and filter projects.
                        </p>
                      </div>
                      <Button
                        onClick={runEligibilityAnalysis}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        disabled={loadingAllProjects || checkingRepositories}
                      >
                        {loadingAllProjects || checkingRepositories ? (
                          <>
                            <LoadingSpinner className="mr-2" />
                            Running Analysis...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="mr-2 w-4 h-4" />
                            Run Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Hedera Analysis Sub-tab */}
                <TabsContent value="hedera" className="space-y-4">
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <GitBranch className="w-5 h-5" />
                        Hedera Blockchain Analysis
                      </CardTitle>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Analyze projects for Hedera blockchain integration and usage (Level 1: Fast Detection)
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Batch Selection */}
                        <div className="flex items-end gap-4">
                          <div className="flex-1">
                            <label htmlFor="hederaBatch" className="block text-sm font-medium mb-2">
                              Select Eligibility Batch
                            </label>
                            <select
                              id="hederaBatch"
                              value={selectedHederaBatch}
                              onChange={(e) => setSelectedHederaBatch(e.target.value)}
                              className="w-full px-3 py-2 border rounded-md bg-background border-input"
                              disabled={runningHederaAnalysis}
                            >
                              <option value="">Choose a batch to analyze...</option>
                              {batches.map((batch) => (
                                <option key={batch.id} value={batch.id}>
                                  {batch.name} ({batch.totalProjects} projects)
                                </option>
                              ))}
                            </select>
                          </div>
                          <Button
                            onClick={runHederaAnalysis}
                            disabled={!selectedHederaBatch || runningHederaAnalysis}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                          >
                            {runningHederaAnalysis ? (
                              <>
                                <LoadingSpinner className="mr-2" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <GitBranch className="mr-2 w-4 h-4" />
                                Run Analysis
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={async () => {
                              try {
                                console.log('[Hedera] Loading all results from database...');

                                // Fetch ALL hedera reports for this hackathon
                                const response = await fetchBackend(`/hackathons/${hackathonId}/hedera-reports`, {
                                  method: 'GET',
                                  credentials: 'include',
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to load Hedera reports');
                                }

                                const data = await response.json();
                                console.log(`[Hedera] Loaded ${data.data.length} total projects`);

                                // Filter to only include projects with reports
                                const resultsWithReports = data.data.filter((r: any) => r.report !== null);
                                console.log(`[Hedera] ${resultsWithReports.length} projects have Hedera reports`);

                                const withHedera = resultsWithReports.filter((r: any) => r.report?.hederaPresenceDetected);
                                console.log(`[Hedera] ${withHedera.length} projects detected with Hedera`);

                                setHederaResults(resultsWithReports);
                                setHederaAnalysisComplete(true);

                                toast.success(`Loaded ${resultsWithReports.length} analyzed projects (${withHedera.length} with Hedera)`);
                              } catch (error: any) {
                                console.error('[Hedera] Error loading results:', error);
                                toast.error(error.message || 'Failed to load results');
                              }
                            }}
                            variant="outline"
                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          >
                            <RefreshCw className="mr-2 w-4 h-4" />
                            Load Results
                          </Button>
                        </div>

                        {/* Help Text */}
                        {!selectedHederaBatch && batches.length === 0 && (
                          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200">
                            <p className="font-medium mb-2">To get started:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Go to the <strong>Eligibility Analysis</strong> tab</li>
                              <li>Run eligibility checks and save a batch</li>
                              <li>Come back here and select your saved batch</li>
                              <li>Click "Run Analysis" to detect Hedera usage</li>
                            </ol>
                          </div>
                        )}

                        {/* Progress Bar */}
                        {runningHederaAnalysis && hederaProgress.total > 0 && (
                          <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Analyzing projects for Hedera usage...
                              </span>
                              <span className="font-semibold text-blue-600">
                                {hederaProgress.analyzed} / {hederaProgress.total}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="h-2.5 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-blue-500 to-purple-500"
                                style={{
                                  width: `${hederaProgress.total > 0 ? (hederaProgress.analyzed / hederaProgress.total) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                {hederaProgress.total > 0
                                  ? `${Math.round((hederaProgress.analyzed / hederaProgress.total) * 100)}%`
                                  : '0%'} complete
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Analyzing Hedera blockchain integration...
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Results Section */}
                        {hederaAnalysisComplete && hederaResults.length > 0 && (
                          <div className="space-y-4 mt-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Total Analyzed */}
                              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm">
                                    <FolderOpen className="w-4 h-4" />
                                    Total Analyzed
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    {hederaResults.length}
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Hedera Detected */}
                              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                                    <GitBranch className="w-4 h-4" />
                                    Hedera Detected
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {hederaResults.filter(r => r.report?.hederaPresenceDetected).length}
                                  </div>
                                </CardContent>
                              </Card>

                              {/* No Hedera */}
                              <Card className="border-gray-200 bg-gray-50 dark:bg-gray-950/20">
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-400 text-sm">
                                    <XCircle className="w-4 h-4" />
                                    No Hedera
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                                    {hederaResults.filter(r => !r.report?.hederaPresenceDetected).length}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Export Buttons */}
                            <div className="space-y-3">
                              {/* Export All Button - Full width */}
                              <Button
                                onClick={exportAllBatchResults}
                                disabled={!selectedHederaBatch}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 shadow-lg"
                              >
                                <Download className="mr-2 w-5 h-5" />
                                Export All Batch Results to Excel
                              </Button>

                              {/* Separate Export Buttons */}
                              <div className="flex gap-4">
                                <Button
                                  onClick={exportHederaProjects}
                                  disabled={hederaResults.filter(r => r.report?.hederaPresenceDetected).length === 0}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Download className="mr-2 w-4 h-4" />
                                  Export Hedera Projects ({hederaResults.filter(r => r.report?.hederaPresenceDetected).length})
                                </Button>
                                <Button
                                  onClick={exportNonHederaProjects}
                                  disabled={hederaResults.filter(r => !r.report?.hederaPresenceDetected).length === 0}
                                  variant="outline"
                                  className="flex-1 border-gray-500 text-gray-600 hover:bg-gray-50"
                                >
                                  <Download className="mr-2 w-4 h-4" />
                                  Export Non-Hedera Projects ({hederaResults.filter(r => !r.report?.hederaPresenceDetected).length})
                                </Button>
                              </div>
                            </div>

                            {/* Projects List */}
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold">Analysis Results:</h3>
                              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {hederaResults.map((result, index) => (
                                  <Card
                                    key={index}
                                    className={`${
                                      result.report?.hederaPresenceDetected
                                        ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10'
                                        : 'border-gray-200'
                                    }`}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-medium">{result.project.name}</h4>
                                            {result.report?.hederaPresenceDetected ? (
                                              <Badge className="bg-green-600 text-white">
                                                <GitBranch className="w-3 h-3 mr-1" />
                                                Hedera Detected
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline">No Hedera</Badge>
                                            )}
                                          </div>

                                          {result.project.teamName && (
                                            <div className="text-sm text-muted-foreground mb-2">
                                              Team: {result.project.teamName}
                                            </div>
                                          )}

                                          {result.report?.hederaPresenceDetected && (
                                            <div className="space-y-2 mt-3">
                                              <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium">Confidence:</span>
                                                <Badge variant="secondary">{result.report.confidence}%</Badge>
                                                {result.report.complexityLevel && (
                                                  <>
                                                    <span className="font-medium ml-2">Complexity:</span>
                                                    <Badge variant="secondary">{result.report.complexityLevel}</Badge>
                                                  </>
                                                )}
                                              </div>

                                              {result.report.summary && (
                                                <p className="text-sm text-muted-foreground">
                                                  {result.report.summary}
                                                </p>
                                              )}

                                              {result.report.detectedTechnologies?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                  {result.report.detectedTechnologies.map((tech: string, i: number) => (
                                                    <Badge key={i} variant="outline" className="text-xs">
                                                      {tech}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {result.project.githubUrl && result.project.githubUrl !== 'N/A' && (
                                          <a
                                            href={result.project.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                          </a>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batches Tab */}
        <TabsContent value="batches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-500" />
                Saved Eligibility Batches
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                View and manage your saved project batches
              </p>
            </CardHeader>
            <CardContent>
              {loadingBatches ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <LoadingSpinner size="lg" />
                  <p className="text-sm text-muted-foreground">Loading batches...</p>
                </div>
              ) : batches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                  <Package className="w-16 h-16 text-muted-foreground/40" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No Batches Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      You haven't saved any eligibility batches yet. Go to the Bulk Analysis tab to run eligibility checks and save batches.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch) => (
                    <Card key={batch.id} className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-lg font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                              <Layers className="w-5 h-5" />
                              {batch.name}
                            </CardTitle>
                            {batch.description && (
                              <p className="text-sm text-muted-foreground">
                                {batch.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBatch(batch.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-purple-700 dark:text-purple-400">
                              {batch.totalProjects} Projects
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(batch.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>

                        {batch.criteria && Object.keys(batch.criteria).length > 0 && (
                          <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                            <div className="text-xs font-medium text-muted-foreground mb-2">
                              Eligibility Criteria
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {batch.criteria.githubExists && (
                                <Badge variant="outline" className="text-xs">
                                  GitHub URL exists
                                </Badge>
                              )}
                              {batch.criteria.isPublic && (
                                <Badge variant="outline" className="text-xs">
                                  Public repository
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewBatchDetails(batch.id)}
                            className="w-full bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-700 dark:bg-purple-950/40 dark:hover:bg-purple-950/60 dark:text-purple-300"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Projects ({batch.totalProjects})
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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

      {/* Batch Details Modal */}
      <Dialog open={!!selectedBatch} onOpenChange={(open) => !open && setSelectedBatch(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              {selectedBatch?.name}
            </DialogTitle>
            {selectedBatch?.description && (
              <p className="text-sm text-muted-foreground">
                {selectedBatch.description}
              </p>
            )}
          </DialogHeader>

          {selectedBatch && (
            <div className="space-y-4">
              {/* Batch Info */}
              <div className="flex flex-wrap gap-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                    {selectedBatch.totalProjects} Projects
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Created {new Date(selectedBatch.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* Criteria */}
              {selectedBatch.criteria && Object.keys(selectedBatch.criteria).length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Eligibility Criteria Applied
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedBatch.criteria.githubExists && (
                      <Badge variant="outline" className="text-xs">
                        GitHub URL exists
                      </Badge>
                    )}
                    {selectedBatch.criteria.isPublic && (
                      <Badge variant="outline" className="text-xs">
                        Public repository
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Projects List */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Projects in this batch:</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {selectedBatch.batchProjects?.map((bp: any) => (
                    <Card key={bp.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="font-medium">{bp.project.name}</div>
                            {bp.project.teamName && (
                              <div className="text-sm text-muted-foreground">
                                Team: {bp.project.teamName}
                              </div>
                            )}
                            {bp.project.track && (
                              <Badge variant="secondary" className="text-xs">
                                {bp.project.track.name}
                              </Badge>
                            )}
                          </div>
                          {bp.project.githubUrl && bp.project.githubUrl !== 'N/A' && (
                            <a
                              href={bp.project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setSelectedBatch(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Batch Modal */}
      <Dialog open={showSaveBatchModal} onOpenChange={setShowSaveBatchModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-green-600" />
              Save Eligibility Batch
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Save {getEligibleProjects().length} eligible projects as a named batch for Layer 2 analysis
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="batchName" className="text-sm font-medium">
                Batch Name *
              </label>
              <Input
                id="batchName"
                placeholder="e.g., Layer 1 - Valid Repos"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                disabled={savingBatch}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="batchDescription" className="text-sm font-medium">
                Description (Optional)
              </label>
              <textarea
                id="batchDescription"
                placeholder="Add notes about this batch..."
                value={batchDescription}
                onChange={(e) => setBatchDescription(e.target.value)}
                disabled={savingBatch}
                className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
              />
            </div>
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardContent className="pt-4">
                <div className="text-sm space-y-1">
                  <div className="font-medium text-blue-900 dark:text-blue-100">Batch Summary</div>
                  <div className="text-muted-foreground">
                    {getEligibleProjects().length} projects will be saved
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Criteria: {eligibilityCriteria.githubExists && 'GitHub URL exists'}
                    {eligibilityCriteria.githubExists && eligibilityCriteria.isPublic && ' + '}
                    {eligibilityCriteria.isPublic && 'Public repository'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveBatchModal(false);
                setBatchName('');
                setBatchDescription('');
              }}
              disabled={savingBatch}
            >
              Cancel
            </Button>
            <Button
              onClick={saveBatch}
              disabled={savingBatch || !batchName.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {savingBatch ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Batch
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}