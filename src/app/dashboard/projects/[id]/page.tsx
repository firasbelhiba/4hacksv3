'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Github, Globe, Video, FileText, Users, Calendar, Trophy, ExternalLink,
         Code, Brain, Target, Link2, Activity, Play, CheckCircle, AlertCircle, Clock,
         RefreshCw, BarChart3, TrendingUp, Award, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDateForDisplay } from '@/lib/form-utils';
import { apiClient } from '@/lib/api/client';

import { fetchBackend } from '@/lib/api/fetch-backend';
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

export default function ProjectDashboard() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetchBackend(`/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data.project);
        } else {
          setError('Failed to fetch project details');
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Error loading project');
      }
    }

    async function fetchReviewStatus() {
      try {
        const status = await apiClient.projects.reviews.getStatus(projectId);
        setReviewStatus(status);
      } catch (error) {
        console.error('Error loading review status:', error);
      }
    }

    Promise.all([fetchProject(), fetchReviewStatus()])
      .finally(() => setLoading(false));
  }, [projectId]);

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

  const getReviewScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleStartReview = async (type: string) => {
    try {
      let url = '';
      let redirectUrl = '';

      switch (type) {
        case 'code-quality':
          const response = await fetchBackend(`/projects/${projectId}/code-quality`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (response.ok) {
            redirectUrl = `/dashboard/projects/${projectId}/code-quality`;
          }
          break;
        case 'coherence':
          redirectUrl = `/dashboard/projects/${projectId}/coherence-progress`;
          break;
        case 'innovation':
          redirectUrl = `/dashboard/projects/${projectId}/innovation-progress`;
          break;
        case 'hedera':
          const hederaResponse = await fetchBackend(`/projects/${projectId}/review/hedera`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              options: { maxFiles: 30, includeCodeAnalysis: true }
            })
          });
          if (hederaResponse.ok) {
            redirectUrl = `/dashboard/projects/${projectId}/hedera-progress`;
          }
          break;
      }

      if (redirectUrl) {
        router.push(redirectUrl);
      }
    } catch (error) {
      console.error('Error starting review:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Card className="max-w-md mx-auto border-red-200 bg-red-50">
            <CardContent className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-red-600 mb-4" />
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Project</h2>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href={`/dashboard/hackathons/${project.hackathon.id}/projects`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/50 hover:text-foreground transition-all duration-200 hover:shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Projects</span>
          </Link>
        </div>

        {/* Project Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{project.name}</h1>
                    <p className="text-indigo-100 text-lg">by {project.teamName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className={`${getStatusColor(project.status)} border-white/30`}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-2 text-indigo-100">
                    <Trophy className="w-4 h-4" />
                    <span>Track: {project.track.name}</span>
                  </div>
                </div>
              </div>

              {/* Project Links */}
              <div className="flex flex-wrap gap-3">
                <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </Link>
                {project.demoUrl && (
                  <Link href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                      <Globe className="w-4 h-4 mr-2" />
                      Demo
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </Link>
                )}
                {project.videoUrl && (
                  <Link href={project.videoUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                      <Video className="w-4 h-4 mr-2" />
                      Video
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </Link>
                )}
                {project.presentationUrl && (
                  <Link href={project.presentationUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                      <FileText className="w-4 h-4 mr-2" />
                      Slides
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Animated background elements */}
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-xl animate-pulse delay-1000"></div>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Description & Team */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Project Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Team Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Team Name</h4>
                    <p className="text-lg font-semibold text-blue-600">{project.teamName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Team Members</h4>
                    <p className="text-muted-foreground">{formatTeamMembers(project.teamMembers)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Review Status Overview */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Review Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviewStatus && reviewStatus.hasAnyReviews ? (
                  <div className="space-y-4">
                    {reviewStatus.combinedScore !== null && (
                      <div className="text-center p-4 bg-white/50 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600 mb-1">
                          {Math.round(reviewStatus.combinedScore)}/100
                        </div>
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Code Quality */}
                      <div className="flex items-center justify-between p-2 bg-white/30 rounded">
                        <span className="text-sm font-medium">Code Quality</span>
                        {reviewStatus.codeQuality.status === 'completed' ? (
                          <Badge className={`${getReviewScoreColor(reviewStatus.codeQuality.score || 0)} border-none`}>
                            {reviewStatus.codeQuality.score}/100
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50">
                            {reviewStatus.codeQuality.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                          </Badge>
                        )}
                      </div>

                      {/* Coherence */}
                      <div className="flex items-center justify-between p-2 bg-white/30 rounded">
                        <span className="text-sm font-medium">Coherence</span>
                        {reviewStatus.coherence.status === 'completed' ? (
                          <Badge className={`${getReviewScoreColor(reviewStatus.coherence.score || 0)} border-none`}>
                            {reviewStatus.coherence.score}/100
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50">
                            {reviewStatus.coherence.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                          </Badge>
                        )}
                      </div>

                      {/* Innovation */}
                      <div className="flex items-center justify-between p-2 bg-white/30 rounded">
                        <span className="text-sm font-medium">Innovation</span>
                        {reviewStatus.innovation.status === 'completed' ? (
                          <Badge className={`${getReviewScoreColor(reviewStatus.innovation.score || 0)} border-none`}>
                            {reviewStatus.innovation.score}/100
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50">
                            {reviewStatus.innovation.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                          </Badge>
                        )}
                      </div>

                      {/* Hedera */}
                      <div className="flex items-center justify-between p-2 bg-white/30 rounded">
                        <span className="text-sm font-medium">Hedera Tech</span>
                        {reviewStatus.hedera.status === 'completed' ? (
                          <Badge className="bg-cyan-50 text-cyan-700 border-none">
                            {reviewStatus.hedera.confidence}% confidence
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50">
                            {reviewStatus.hedera.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No reviews completed yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Metadata */}
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  Project Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="font-medium">{formatDateForDisplay(project.createdAt, 'MMM d, yyyy')}</span>
                  </div>
                  {project.submittedAt && (
                    <div className="flex justify-between">
                      <span>Submitted:</span>
                      <span className="font-medium">{formatDateForDisplay(project.submittedAt, 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Hackathon:</span>
                    <span className="font-medium">{project.hackathon.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Analysis & Review Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Code Quality Analysis */}
          <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" />
                Code Quality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {reviewStatus?.codeQuality.status === 'completed' ? (
                  <>
                    <div className={`text-3xl font-bold mb-2 ${getReviewScoreColor(reviewStatus.codeQuality.score || 0).split(' ')[0]}`}>
                      {reviewStatus.codeQuality.score}/100
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold mb-2 text-gray-400">--/100</div>
                    <Badge variant="outline" className="bg-gray-50">
                      {reviewStatus?.codeQuality.status === 'in_progress' ? (
                        <>
                          <Clock className="w-3 h-3 mr-1 animate-pulse" />
                          In Progress
                        </>
                      ) : (
                        'Not Started'
                      )}
                    </Badge>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {reviewStatus?.codeQuality.status === 'completed' ? (
                  <Button
                    onClick={() => router.push(`/dashboard/projects/${projectId}/code-quality`)}
                    className="flex-1"
                    size="sm"
                  >
                    View Report
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleStartReview('code-quality')}
                    className="flex-1"
                    size="sm"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Start Analysis
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Coherence Analysis */}
          <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Coherence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {reviewStatus?.coherence.status === 'completed' ? (
                  <>
                    <div className={`text-3xl font-bold mb-2 ${getReviewScoreColor(reviewStatus.coherence.score || 0).split(' ')[0]}`}>
                      {reviewStatus.coherence.score}/100
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold mb-2 text-gray-400">--/100</div>
                    <Badge variant="outline" className="bg-gray-50">
                      {reviewStatus?.coherence.status === 'in_progress' ? (
                        <>
                          <Clock className="w-3 h-3 mr-1 animate-pulse" />
                          In Progress
                        </>
                      ) : (
                        'Not Started'
                      )}
                    </Badge>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {reviewStatus?.coherence.status === 'completed' ? (
                  <Button
                    onClick={() => router.push(`/dashboard/projects/${projectId}/coherence-report`)}
                    className="flex-1"
                    size="sm"
                  >
                    View Report
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleStartReview('coherence')}
                    className="flex-1"
                    size="sm"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Start Analysis
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Innovation Analysis */}
          <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Innovation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {reviewStatus?.innovation.status === 'completed' ? (
                  <>
                    <div className={`text-3xl font-bold mb-2 ${getReviewScoreColor(reviewStatus.innovation.score || 0).split(' ')[0]}`}>
                      {reviewStatus.innovation.score}/100
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold mb-2 text-gray-400">--/100</div>
                    <Badge variant="outline" className="bg-gray-50">
                      {reviewStatus?.innovation.status === 'in_progress' ? (
                        <>
                          <Clock className="w-3 h-3 mr-1 animate-pulse" />
                          In Progress
                        </>
                      ) : (
                        'Not Started'
                      )}
                    </Badge>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {reviewStatus?.innovation.status === 'completed' ? (
                  <Button
                    onClick={() => router.push(`/dashboard/projects/${projectId}/innovation-report`)}
                    className="flex-1"
                    size="sm"
                  >
                    View Report
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleStartReview('innovation')}
                    className="flex-1"
                    size="sm"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Start Analysis
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hedera Technology Analysis */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 to-blue-50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-cyan-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-cyan-600" />
                Hedera Tech
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {reviewStatus?.hedera.status === 'completed' ? (
                  <>
                    <div className="text-3xl font-bold mb-2 text-cyan-600">
                      {reviewStatus.hedera.confidence}%
                    </div>
                    <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {reviewStatus.hedera.technologyCategory === 'HEDERA' ? 'Detected' :
                       reviewStatus.hedera.technologyCategory === 'OTHER_BLOCKCHAIN' ? 'Other Chain' : 'No Blockchain'}
                    </Badge>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold mb-2 text-gray-400">--%</div>
                    <Badge variant="outline" className="bg-gray-50">
                      {reviewStatus?.hedera.status === 'in_progress' ? (
                        <>
                          <Clock className="w-3 h-3 mr-1 animate-pulse" />
                          In Progress
                        </>
                      ) : (
                        'Not Started'
                      )}
                    </Badge>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {reviewStatus?.hedera.status === 'completed' ? (
                  <Button
                    onClick={() => router.push(`/dashboard/projects/${projectId}/hedera-report`)}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    size="sm"
                  >
                    View Report
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleStartReview('hedera')}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    size="sm"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Start Analysis
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}