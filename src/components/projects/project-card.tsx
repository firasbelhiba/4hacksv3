'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Github, Globe, Video, FileText, Users, Calendar, Trophy, ExternalLink, Zap, Loader2, ClipboardCheck, AlertCircle, Clock, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateForDisplay } from '@/lib/form-utils';
import { ReviewModal } from './review-modal';
import { EligibilityResultModal } from './eligibility-result-modal';
import { apiClient } from '@/lib/api/client';

type ReviewStatusSummary = {
  hasCodeQuality: boolean;
  hasCoherence: boolean;
  hasInnovation: boolean;
  hasHedera: boolean;
  codeQualityScore?: number;
  coherenceScore?: number;
  innovationScore?: number;
  hederaScore?: number;
};
import { cn } from '@/lib/utils';

import { fetchBackend } from '@/lib/api/fetch-backend';
// Type is now imported from the service

interface TeamMember {
  name: string;
  email?: string;
  role?: string;
}

interface Track {
  id: string;
  name: string;
  description: string;
}

interface Hackathon {
  id: string;
  name: string;
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
  hackathon: Hackathon;
}

interface ProjectCardProps {
  project: Project;
  onViewDetails?: (project: Project) => void;
  onAnalyzeCode?: (project: Project) => void;
  onStartCoherenceReview?: (project: Project) => void;
  isAnalyzing?: boolean;
}

export function ProjectCard({ project, onViewDetails, onAnalyzeCode, onStartCoherenceReview, isAnalyzing }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<{ eligible: boolean; reason: string; repositoryStatus: string } | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatusSummary | null>(null);
  const [loadingReviewStatus, setLoadingReviewStatus] = useState(true);

  // Don't auto-load review status - only load when user interacts with the card
  // This prevents 448 simultaneous API requests
  useEffect(() => {
    setLoadingReviewStatus(false);
  }, []);

  const loadReviewStatus = async () => {
    try {
      setLoadingReviewStatus(true);
      const status = await apiClient.projects.reviews.getStatus(project.id);
      setReviewStatus(status as ReviewStatusSummary);
    } catch (error) {
      console.error('Error loading review status:', error);
      // Don't show error to user, just don't show review status
    } finally {
      setLoadingReviewStatus(false);
    }
  };

  const handleOpenReviewModal = async () => {
    setShowReviewModal(true);
    // Load review status when modal is opened (lazy loading)
    if (!reviewStatus && !loadingReviewStatus) {
      await loadReviewStatus();
    }
  };

  const handleStartCodeReview = () => {
    if (onAnalyzeCode) {
      onAnalyzeCode(project);
    }
    setShowReviewModal(false);
  };

  const handleStartCoherenceReview = async () => {
    setShowReviewModal(false);
    // Note: This will be handled by the parent component that passes onStartCoherenceReview
    if (onStartCoherenceReview) {
      onStartCoherenceReview(project);
    }
  };

  const handleStartInnovationReview = async () => {
    // Innovation modal is now handled within ReviewModal, no external action needed
    setShowReviewModal(false);
  };

  const handleStartHederaReview = async () => {
    // No longer needed - ReviewModal now handles Hedera progress internally
    // The modal will stay open and show the HederaModalProgress component
  };

  const handleResetStuckCoherence = async () => {
    try {
      const response = await fetchBackend(`/projects/${project.id}/review/coherence/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Stuck coherence analysis has been reset. You can now start a new review.');
        // Reload review status to reflect the changes
        await loadReviewStatus();
      } else {
        alert(`Error resetting coherence analysis: ${data.error}`);
      }
    } catch (error) {
      console.error('Error resetting coherence analysis:', error);
      alert('Failed to reset coherence analysis. Please try again.');
    }
  };

  const handleResetStuckHedera = async () => {
    try {
      const response = await fetchBackend(`/projects/${project.id}/review/hedera`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert(`Stuck Hedera analysis has been reset. Deleted ${data.data.deletedCount} report(s). You can now start a new review.`);
        // Reload review status to reflect the changes
        await loadReviewStatus();
      } else {
        alert(`Error resetting Hedera analysis: ${data.error}`);
      }
    } catch (error) {
      console.error('Error resetting Hedera analysis:', error);
      alert('Failed to reset Hedera analysis. Please try again.');
    }
  };

  const handleStartEligibilityCheck = async () => {
    setShowReviewModal(false);

    try {
      // Call eligibility check API
      const response = await fetchBackend(`/projects/${project.id}/eligibility-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          criteria: {
            repositoryAccess: true,
            repositoryPublic: false,
            submissionDeadline: false
          }
        })
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Transform backend response to match modal interface
        const backendData = data.data;
        const transformedResult = {
          eligible: backendData.isEligible,
          reason: backendData.message,
          repositoryStatus: backendData.checks?.hasGithubUrl
            ? 'Repository accessible and valid'
            : 'Repository not accessible',
          checks: backendData.checks
        };
        setEligibilityResult(transformedResult);
        setEligibilityError(null);
        setShowEligibilityModal(true);
        // Refresh review status after check
        loadReviewStatus();
      } else {
        setEligibilityResult(null);
        setEligibilityError(data.error || 'Eligibility check failed');
        setShowEligibilityModal(true);
      }
    } catch (error) {
      console.error('Error running eligibility check:', error);
      setEligibilityResult(null);
      setEligibilityError('Failed to run eligibility check. Please try again.');
      setShowEligibilityModal(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTeamMembers = (members: TeamMember[]) => {
    if (!members || members.length === 0) return 'Solo project';
    return members.map(member => member.name).join(', ');
  };

  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderReviewStatusBadge = () => {
    if (loadingReviewStatus) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Loading...
        </Badge>
      );
    }

    if (!reviewStatus || !reviewStatus.hasAnyReviews) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          No Reviews
        </Badge>
      );
    }

    // Priority 1: Show NOT ELIGIBLE if project failed eligibility check
    if (reviewStatus.eligibility?.status === 'completed' && !reviewStatus.eligible) {
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 border-red-200 cursor-pointer hover:bg-red-200 transition-colors"
          title={`Not Eligible: ${reviewStatus.eligibility.reason || 'Project failed eligibility requirements'}`}
        >
          <X className="w-3 h-3 mr-1" />
          NOT ELIGIBLE
        </Badge>
      );
    }

    // Priority 2: Show ELIGIBLE if eligibility check passed
    if (reviewStatus.eligibility?.status === 'completed' && reviewStatus.eligible) {
      // If only eligibility is done, show eligible status
      const otherReviewsCount = [reviewStatus.codeQuality.status, reviewStatus.coherence.status, reviewStatus.innovation.status, reviewStatus.hedera.status].filter(s => s === 'completed').length;

      if (otherReviewsCount === 0) {
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-200"
            title="Project meets eligibility requirements"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            ELIGIBLE
          </Badge>
        );
      }
    }

    if (reviewStatus.isFullyReviewed) {
      const score = reviewStatus.combinedScore || 0;
      const color = score >= 80 ? 'bg-green-100 text-green-800' :
                   score >= 60 ? 'bg-blue-100 text-blue-800' :
                   'bg-orange-100 text-orange-800';

      // Check if this is a legacy 3-review completion or full 4-review completion
      const isLegacyComplete = reviewStatus.codeQuality.status === 'completed' &&
                              reviewStatus.coherence.status === 'completed' &&
                              reviewStatus.innovation.status === 'completed' &&
                              reviewStatus.hedera.status !== 'completed';

      const label = isLegacyComplete ? 'Complete (3/3)' : 'Complete (4/4)';

      return (
        <Badge variant="outline" className={color}>
          <CheckCircle className="w-3 h-3 mr-1" />
          {label}: {score}/100
        </Badge>
      );
    }

    // Partial reviews
    const completedReviews = [];
    if (reviewStatus.codeQuality.status === 'completed') {
      completedReviews.push(`Code: ${reviewStatus.codeQuality.score || 0}`);
    }
    if (reviewStatus.coherence.status === 'completed') {
      completedReviews.push(`Coherence: ${reviewStatus.coherence.score || 0}`);
    }
    if (reviewStatus.innovation.status === 'completed') {
      completedReviews.push(`Innovation: ${reviewStatus.innovation.score || 0}`);
    }
    if (reviewStatus.hedera.status === 'completed') {
      completedReviews.push(`Hedera: ${reviewStatus.hedera.confidence || 0}`);
    }

    if (completedReviews.length > 0) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          <ClipboardCheck className="w-3 h-3 mr-1" />
          {completedReviews.join(', ')}
        </Badge>
      );
    }

    // Check if innovation review is in progress
    const isInnovationInProgress = reviewStatus.innovation.status === 'in_progress';

    return (
      <Badge
        variant="outline"
        className="bg-yellow-100 text-yellow-800"
      >
        <Clock className="w-3 h-3 mr-1" />
        In Progress
      </Badge>
    );
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 bg-background/80 backdrop-blur-xl h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
              {project.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Team: {project.teamName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 ml-4">
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
            {renderReviewStatusBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* Description */}
        <div>
          <p className="text-sm text-muted-foreground">
            {isExpanded ? project.description : truncateDescription(project.description)}
            {project.description.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </p>
        </div>

        {/* Track and Team Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-600" />
            <span className="text-muted-foreground">Track:</span>
            <span className="font-medium">{project.track.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-muted-foreground">Team:</span>
            <span className="font-medium text-xs truncate" title={formatTeamMembers(project.teamMembers)}>
              {project.teamMembers?.length > 0 ? `${project.teamMembers.length} members` : 'Solo'}
            </span>
          </div>
        </div>

        {/* Team Members */}
        {project.teamMembers && project.teamMembers.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Team Members:</p>
            <p className="text-sm font-medium">{formatTeamMembers(project.teamMembers)}</p>
          </div>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-2">
          <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-8">
              <Github className="w-3 h-3 mr-1" />
              GitHub
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>
          {project.demoUrl && (
            <Link href={project.demoUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-8">
                <Globe className="w-3 h-3 mr-1" />
                Demo
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          )}
          {project.videoUrl && (
            <Link href={project.videoUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-8">
                <Video className="w-3 h-3 mr-1" />
                Video
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          )}
          {project.presentationUrl && (
            <Link href={project.presentationUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-8">
                <FileText className="w-3 h-3 mr-1" />
                Slides
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Created {formatDateForDisplay(project.createdAt, 'MMM d, yyyy')}</span>
          </div>
          {project.submittedAt && (
            <span>Submitted {formatDateForDisplay(project.submittedAt, 'MMM d, yyyy')}</span>
          )}
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1"></div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleOpenReviewModal}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
            size="sm"
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Review
          </Button>
          {onViewDetails && (
            <Button
              onClick={() => onViewDetails(project)}
              className="flex-1"
              variant="outline"
              size="sm"
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>

      {/* Review Modal */}
      <ReviewModal
        project={project}
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onStartCodeReview={handleStartCodeReview}
        onStartCoherenceReview={handleStartCoherenceReview}
        onStartInnovationReview={handleStartInnovationReview}
        onStartHederaReview={handleStartHederaReview}
        onStartEligibilityCheck={handleStartEligibilityCheck}
        onResetStuckCoherence={handleResetStuckCoherence}
        onResetStuckHedera={handleResetStuckHedera}
        isAnalyzing={isAnalyzing}
        reviewStatus={null} // Force ReviewModal to reload status fresh each time
      />

      {/* Eligibility Result Modal */}
      <EligibilityResultModal
        isOpen={showEligibilityModal}
        onClose={() => setShowEligibilityModal(false)}
        result={eligibilityResult}
        error={eligibilityError}
        projectName={project.name}
      />
    </Card>
  );
}