'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Code, CheckCircle, Loader2, ExternalLink, Zap, Lightbulb, Link2, Shield, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api/client';

type ReviewStatusSummary = {
  codeQuality?: {
    status: string;
    reportId: string | null;
    score: number | null;
  };
  coherence?: {
    status: string;
    reportId: string | null;
    score: number | null;
  };
  innovation?: {
    status: string;
    reportId: string | null;
    score: number | null;
  };
  hedera?: {
    status: string;
    reportId: string | null;
    score: number | null;
    hederaUsageScore?: number | null;
  };
  // Legacy properties for backward compatibility
  hasCodeQuality?: boolean;
  hasCoherence?: boolean;
  hasInnovation?: boolean;
  hasHedera?: boolean;
  codeQualityScore?: number;
  coherenceScore?: number;
  innovationScore?: number;
  hederaScore?: number;
  hasAnyReviews?: boolean;
  isFullyReviewed?: boolean;
  combinedScore?: number;
};
import { HederaModalProgress } from './hedera-modal-progress';
import { InnovationModalProgress } from './innovation-modal-progress';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  teamName: string;
  track: {
    id: string;
    name: string;
    description: string;
  };
  hackathon: {
    id: string;
    name: string;
  };
}

interface ReviewModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onStartCodeReview?: () => void;
  onStartCoherenceReview?: () => void;
  onStartInnovationReview?: () => void;
  onStartHederaReview?: () => void;
  onStartEligibilityCheck?: () => void;
  onResetStuckCoherence?: () => void;
  onResetStuckHedera?: () => void;
  isAnalyzing?: boolean;
  reviewStatus?: ReviewStatusSummary | null;
}

export function ReviewModal({
  project,
  isOpen,
  onClose,
  onStartCodeReview,
  onStartCoherenceReview,
  onStartInnovationReview,
  onStartHederaReview,
  onStartEligibilityCheck,
  onResetStuckCoherence,
  onResetStuckHedera,
  isAnalyzing,
  reviewStatus: propReviewStatus
}: ReviewModalProps) {
  const [reviewStatus, setReviewStatus] = useState<ReviewStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReviewType, setSelectedReviewType] = useState<'code-quality' | 'coherence' | 'innovation' | 'hedera' | 'eligibility' | null>(null);
  const [showHederaProgress, setShowHederaProgress] = useState(false);
  const [showInnovationProgress, setShowInnovationProgress] = useState(false);

  useEffect(() => {
    if (propReviewStatus) {
      setReviewStatus(propReviewStatus);
      setLoading(false);
    } else if (isOpen && project.id) {
      loadReviewStatus();
    }
  }, [isOpen, project.id, propReviewStatus]);

  const loadReviewStatus = async () => {
    try {
      setLoading(true);
      const status = await apiClient.projects.reviews.getStatus(project.id);
      console.log('DEBUG: Received review status:', status);
      console.log('DEBUG: Hedera status:', status.hedera);
      setReviewStatus(status);
    } catch (error) {
      console.error('Error loading review status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = (type: 'code-quality' | 'coherence' | 'innovation' | 'hedera' | 'eligibility') => {
    setSelectedReviewType(type);
    if (type === 'code-quality' && onStartCodeReview) {
      onStartCodeReview();
    } else if (type === 'coherence' && onStartCoherenceReview) {
      onStartCoherenceReview();
    } else if (type === 'innovation') {
      // Show Innovation progress modal instead of calling external handler
      setShowInnovationProgress(true);
    } else if (type === 'hedera') {
      // Show Hedera progress modal instead of calling external handler
      setShowHederaProgress(true);
    } else if (type === 'eligibility' && onStartEligibilityCheck) {
      onStartEligibilityCheck();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Not Started';
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" style={{ margin: 0, padding: '1rem' }}>
      <div className="bg-background rounded-lg shadow-2xl overflow-y-auto" style={{ width: '96vw', maxWidth: 'none', maxHeight: '92vh', minWidth: '96vw' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Select Review Type</h2>
            <p className="text-muted-foreground">
              Choose the type of review to perform for "{project.name}"
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadReviewStatus}
              disabled={loading}
              title="Refresh review status"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading review status...</span>
            </div>
          ) : (
            <>
              {/* Project Info */}
              <div className="bg-muted/50 rounded-lg p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Project</p>
                    <p className="font-medium">{project.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Team</p>
                    <p className="font-medium">{project.teamName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Track</p>
                    <p className="font-medium">{project.track.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hackathon</p>
                    <p className="font-medium">{project.hackathon.name}</p>
                  </div>
                </div>
              </div>

              {/* Overall Review Status */}
              {reviewStatus && reviewStatus.hasAnyReviews && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Review Progress</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="h-full flex flex-col">
                      <CardContent className="p-4 flex-1 flex flex-col justify-center">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Overall Progress</p>
                          <div className="mt-2">
                            {reviewStatus.isFullyReviewed ? (
                              <div className="text-green-600">
                                <CheckCircle className="w-8 h-8 mx-auto mb-1" />
                                <p className="font-bold">Complete</p>
                              </div>
                            ) : (
                              <div className="text-orange-600">
                                <div className="w-8 h-8 mx-auto mb-1 bg-orange-100 rounded-full flex items-center justify-center">
                                  <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse" />
                                </div>
                                <p className="font-bold">Partial</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {reviewStatus.combinedScore && (
                      <Card className="h-full flex flex-col">
                        <CardContent className="p-4 flex-1 flex flex-col justify-center">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Combined Score</p>
                            <p className="text-2xl font-bold mt-1">{reviewStatus.combinedScore}/100</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="h-full flex flex-col">
                      <CardContent className="p-4 flex-1 flex flex-col justify-center">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Reviews Completed</p>
                          <p className="text-2xl font-bold mt-1">
                            {(() => {
                              if (!reviewStatus?.codeQuality || !reviewStatus?.coherence || !reviewStatus?.innovation || !reviewStatus?.hedera) {
                                return '0/4';
                              }
                              const completedCount = [reviewStatus.codeQuality.status, reviewStatus.coherence.status, reviewStatus.innovation.status, reviewStatus.hedera.status].filter(s => s === 'completed').length;
                              const isLegacyComplete = reviewStatus.codeQuality.status === 'completed' && reviewStatus.coherence.status === 'completed' && reviewStatus.innovation.status === 'completed' && reviewStatus.hedera.status !== 'completed';

                              if (isLegacyComplete) {
                                return '3/3 (Legacy)';
                              } else if (completedCount === 4) {
                                return '4/4';
                              } else {
                                return `${completedCount}/4`;
                              }
                            })()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Review Type Selection */}
              <h3 className="text-lg font-semibold mb-6">Available Review Types</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-6">
                {/* Eligibility Check */}
                <Card className={`cursor-pointer transition-all duration-200 h-full flex flex-col ${
                  selectedReviewType === 'eligibility' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Eligibility Check</h4>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          Quick Check
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground mb-4">
                      Verify repository accessibility, submission timeline, and basic eligibility requirements
                    </p>

                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-medium text-muted-foreground">Checks include:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Repository accessibility (404/private check)</li>
                        <li>• GitHub URL validity</li>
                        <li>• Basic project submission requirements</li>
                        <li>• Repository visibility verification</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-4">
                      <p className="text-xs font-medium text-blue-800">💡 Recommended First Step</p>
                      <p className="text-xs text-blue-600">Run this before other reviews to catch repository issues early</p>
                    </div>

                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleStartReview('eligibility')}
                        disabled={isAnalyzing}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                      >
                        {isAnalyzing && selectedReviewType === 'eligibility' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Check Eligibility
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Code Quality Review */}
                <Card className={`cursor-pointer transition-all duration-200 h-full flex flex-col ${
                  selectedReviewType === 'code-quality' ? 'ring-2 ring-purple-500' : 'hover:shadow-md'
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Code className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Code Quality Review</h4>
                        {reviewStatus && reviewStatus.codeQuality && (
                          <Badge variant="outline" className={getStatusColor(reviewStatus.codeQuality.status)}>
                            {formatStatus(reviewStatus.codeQuality.status)}
                            {reviewStatus.codeQuality.score && ` (${reviewStatus.codeQuality.score}/100)`}
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground mb-4">
                      Analyze code structure, quality, and best practices using AI-powered analysis
                    </p>

                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-medium text-muted-foreground">Analysis includes:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Technical quality assessment</li>
                        <li>• Security vulnerability detection</li>
                        <li>• Performance optimization suggestions</li>
                      </ul>
                    </div>

                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      {reviewStatus?.codeQuality?.status === 'completed' ? (
                        <Link href={`/dashboard/projects/${project.id}/code-quality`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Report
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={() => handleStartReview('code-quality')}
                          disabled={isAnalyzing || reviewStatus?.codeQuality?.status === 'in-progress'}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white"
                        >
                          {isAnalyzing && selectedReviewType === 'code-quality' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Starting...
                            </>
                          ) : reviewStatus?.codeQuality?.status === 'in-progress' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              In Progress
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Start Review
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Coherence Review */}
                <Card className={`cursor-pointer transition-all duration-200 h-full flex flex-col ${
                  selectedReviewType === 'coherence' ? 'ring-2 ring-emerald-500' : 'hover:shadow-md'
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Coherence Review</h4>
                        {reviewStatus && reviewStatus.coherence && (
                          <Badge variant="outline" className={getStatusColor(reviewStatus.coherence.status)}>
                            {formatStatus(reviewStatus.coherence.status)}
                            {reviewStatus.coherence.score && ` (${reviewStatus.coherence.score}/100)`}
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground mb-4">
                      Verify project consistency, track alignment, and documentation accuracy
                    </p>

                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-medium text-muted-foreground">Analysis includes:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Track requirement alignment</li>
                        <li>• README quality assessment</li>
                        <li>• Documentation-code consistency</li>
                        <li>• Project completeness evaluation</li>
                      </ul>
                    </div>

                    {/* Track Info */}
                    <div className="bg-muted/50 rounded p-2 mb-4">
                      <p className="text-xs font-medium">Target Track:</p>
                      <p className="text-xs text-muted-foreground">{project.track.name}</p>
                    </div>

                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      {reviewStatus?.coherence?.status === 'completed' ? (
                        <Link href={`/dashboard/projects/${project.id}/coherence-report`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Report
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleStartReview('coherence')}
                            disabled={isAnalyzing || reviewStatus?.coherence?.status === 'in-progress'}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
                          >
                            {isAnalyzing && selectedReviewType === 'coherence' ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Starting...
                              </>
                            ) : reviewStatus?.coherence?.status === 'in-progress' ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                In Progress
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Start Review
                              </>
                            )}
                          </Button>
                          {reviewStatus?.coherence?.status === 'in-progress' && onResetStuckCoherence && (
                            <Button
                              onClick={onResetStuckCoherence}
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              title="Reset stuck coherence analysis"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Innovation Review */}
                <Card className={`cursor-pointer transition-all duration-200 h-full flex flex-col ${
                  selectedReviewType === 'innovation' ? 'ring-2 ring-amber-500' : 'hover:shadow-md'
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Innovation Review</h4>
                        {reviewStatus && reviewStatus.innovation && (
                          <Badge variant="outline" className={getStatusColor(reviewStatus.innovation.status)}>
                            {formatStatus(reviewStatus.innovation.status)}
                            {reviewStatus.innovation.score && ` (${reviewStatus.innovation.score}/100)`}
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground mb-4">
                      Assess creativity, novelty, and innovative potential of the project
                    </p>

                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-medium text-muted-foreground">Analysis includes:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Technical innovation assessment</li>
                        <li>• Market innovation potential</li>
                        <li>• Creative problem-solving evaluation</li>
                        <li>• Patent potential analysis</li>
                      </ul>
                    </div>

                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      {reviewStatus?.innovation?.status === 'completed' ? (
                        <Link href={`/dashboard/projects/${project.id}/innovation-report`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Report
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={() => handleStartReview('innovation')}
                          disabled={isAnalyzing || reviewStatus?.innovation?.status === 'in-progress' || showInnovationProgress}
                          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                          {isAnalyzing && selectedReviewType === 'innovation' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Starting...
                            </>
                          ) : reviewStatus?.innovation?.status === 'in-progress' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              In Progress
                            </>
                          ) : (
                            <>
                              <Lightbulb className="w-4 h-4 mr-2" />
                              Start Review
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Hedera Technology Review */}
                <Card className={`cursor-pointer transition-all duration-200 h-full flex flex-col ${
                  selectedReviewType === 'hedera' ? 'ring-2 ring-cyan-500' : 'hover:shadow-md'
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                        <Link2 className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Hedera Technology</h4>
                        {reviewStatus && reviewStatus.hedera && (
                          <Badge variant="outline" className={getStatusColor(reviewStatus.hedera.status)}>
                            {formatStatus(reviewStatus.hedera.status)}
                            {reviewStatus.hedera.hederaUsageScore !== undefined && reviewStatus.hedera.hederaUsageScore !== null && ` (${Math.round(reviewStatus.hedera.hederaUsageScore)}/100)`}
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground mb-4">
                      Analyze blockchain technology usage to identify Hedera, other blockchains, or no blockchain
                    </p>

                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-medium text-muted-foreground">Analysis includes:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Hedera SDK and HashConnect detection</li>
                        <li>• Smart contract and DApp analysis</li>
                        <li>• Mirror node integration assessment</li>
                        <li>• Other blockchain technology identification</li>
                      </ul>
                    </div>

                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                      {reviewStatus?.hedera?.status === 'completed' ? (
                        <Link href={`/dashboard/projects/${project.id}/hedera-report`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Report
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={() => handleStartReview('hedera')}
                          disabled={isAnalyzing || reviewStatus?.hedera?.status === 'in-progress' || showHederaProgress}
                          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                        >
                          {isAnalyzing && selectedReviewType === 'hedera' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Starting...
                            </>
                          ) : reviewStatus?.hedera?.status === 'in-progress' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              In Progress
                            </>
                          ) : (
                            <>
                              <Link2 className="w-4 h-4 mr-2" />
                              Start Review
                            </>
                          )}
                        </Button>
                      )}

                      {reviewStatus?.hedera?.status === 'in-progress' && onResetStuckHedera && (
                        <Button
                          onClick={onResetStuckHedera}
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          title="Reset stuck Hedera analysis"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reset
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Review All Button (Future) */}
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  disabled
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white opacity-50"
                >
                  Review All (Coming Soon)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Future feature: Run all four reviews sequentially
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t bg-muted/50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Hedera Progress Modal */}
      {showHederaProgress && (
        <HederaModalProgress
          projectId={project.id}
          projectName={project.name}
          isOpen={showHederaProgress}
          onClose={() => setShowHederaProgress(false)}
          onComplete={() => {
            setShowHederaProgress(false);
            // Refresh review status after completion
            loadReviewStatus();
          }}
        />
      )}

      {/* Innovation Progress Modal */}
      {showInnovationProgress && (
        <InnovationModalProgress
          projectId={project.id}
          projectName={project.name}
          isOpen={showInnovationProgress}
          onClose={() => setShowInnovationProgress(false)}
          onComplete={() => {
            setShowInnovationProgress(false);
            // Refresh review status after completion
            loadReviewStatus();
          }}
        />
      )}
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
