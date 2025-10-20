'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useBreadcrumbs } from '@/contexts/layout-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/shared/page-header';
import { GradientText } from '@/components/shared/gradient-bg';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  FileText,
  Code,
  Shield,
  Zap,
  Award,
  ExternalLink,
  Github,
  Play,
  Download,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  TrendingUp,
  Database,
  Layers,
  Lightbulb,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { staggerContainerVariants, staggerItemVariants } from '@/lib/page-transitions';
import { toast } from 'react-hot-toast';

import { fetchBackend } from '@/lib/api/fetch-backend';
interface ProjectAnalysis {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string;
    teamName: string;
    githubUrl: string;
    demoUrl?: string;
    videoUrl?: string;
    presentationUrl?: string;
    technologies: string[];
    status: string;
    submittedAt: string;
    hackathon: {
      id: string;
      name: string;
      slug: string;
    };
    track: {
      id: string;
      name: string;
    };
  };
  analysisReports: {
    codeQuality: any;
    hedera: any;
    coherence: any;
    innovation: any;
  };
  allReports: {
    codeQuality: any[];
    hedera: any[];
    coherence: any[];
    innovation: any[];
  };
  aiJuryHistory: any[];
  summary: {
    analysisProgress: number;
    overallScore: number | null;
    reportStatus: Record<string, string>;
    totalReports: number;
    lastAnalyzed: string | null;
  };
  metadata: {
    generatedAt: string;
    aiJurySessions: number;
  };
}

export default function ProjectAnalysisPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Set breadcrumbs
  useBreadcrumbs([
    { label: 'AI Jury', href: '/dashboard/ai-jury' },
    { label: 'Project Analysis', href: `/dashboard/ai-jury/projects/${params.projectId}` },
  ]);

  // Fetch project analysis
  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const response = await fetchBackend(`/ai-jury/projects/${params.projectId}/analysis`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Project not found or access denied');
            router.push('/dashboard/ai-jury');
            return;
          }
          throw new Error('Failed to fetch project analysis');
        }

        const data = await response.json();
        if (data.success) {
          setAnalysis(data.data);
        }
      } catch (error) {
        console.error('Error fetching project analysis:', error);
        toast.error('Failed to load project analysis');
      } finally {
        setLoading(false);
      }
    };

    if (params.projectId) {
      fetchAnalysis();
    }
  }, [params.projectId, router]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'IN_PROGRESS':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'FAILED':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const ScoreCircle = ({ score, label, color = "blue" }: { score: number | null; label: string; color?: string }) => (
    <div className="flex flex-col items-center">
      <div className={`relative w-16 h-16 rounded-full border-4 border-${color}-500/20 bg-${color}-500/5 flex items-center justify-center`}>
        <span className={`text-lg font-bold text-${color}-600`}>
          {score !== null ? Math.round(score) : '--'}
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-2 text-center">{label}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground mt-4">Loading project analysis...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Analysis Not Found</h3>
        <p className="text-muted-foreground mb-4">The requested project analysis could not be found.</p>
        <Button onClick={() => router.push('/dashboard/ai-jury')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to AI Jury
        </Button>
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
      {/* Header */}
      <motion.div variants={staggerItemVariants}>
        <PageHeader
          title={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/ai-jury')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <GradientText className="text-3xl font-bold">
                {analysis.project.name}
              </GradientText>
            </div>
          }
          description={
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary">{analysis.project.track.name}</Badge>
              <span className="text-muted-foreground">Team: {analysis.project.teamName}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{analysis.project.hackathon.name}</span>
            </div>
          }
        />
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={staggerItemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {analysis.summary.overallScore || '--'}
              </div>
              <div className="text-xs text-muted-foreground">Overall Score</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {analysis.summary.analysisProgress}%
              </div>
              <div className="text-xs text-muted-foreground">Analysis Complete</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Layers className="w-8 h-8 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {analysis.metadata.aiJurySessions}
              </div>
              <div className="text-xs text-muted-foreground">AI Jury Sessions</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <FileText className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {analysis.summary.totalReports}
              </div>
              <div className="text-xs text-muted-foreground">Total Reports</div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={staggerItemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="code">Code Quality</TabsTrigger>
            <TabsTrigger value="hedera">Hedera</TabsTrigger>
            <TabsTrigger value="coherence">Coherence</TabsTrigger>
            <TabsTrigger value="innovation">Innovation</TabsTrigger>
            <TabsTrigger value="ai-jury">AI Jury</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{analysis.project.description}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Technologies</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.project.technologies.map((tech, index) => (
                        <Badge key={index} variant="outline">{tech}</Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Submitted</p>
                      <p>{new Date(analysis.project.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant="outline">{analysis.project.status}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {analysis.project.githubUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={analysis.project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4 mr-2" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {analysis.project.demoUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={analysis.project.demoUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Demo
                        </a>
                      </Button>
                    )}
                    {analysis.project.videoUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={analysis.project.videoUrl} target="_blank" rel="noopener noreferrer">
                          <Play className="w-4 h-4 mr-2" />
                          Video
                        </a>
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Export Options */}
                  <div>
                    <p className="text-sm font-medium mb-2">Export Report</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(`/api/ai-jury/projects/${analysis.project.id}/export?format=json`, '_blank');
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(`/api/ai-jury/projects/${analysis.project.id}/export?format=csv`, '_blank');
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Analysis Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">{analysis.summary.analysisProgress}%</span>
                    </div>
                    <Progress value={analysis.summary.analysisProgress} className="w-full" />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {Object.entries(analysis.summary.reportStatus).map(([reportType, status]) => (
                      <div key={reportType} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span className="text-sm font-medium capitalize">{reportType.replace(/([A-Z])/g, ' $1')}</span>
                        </div>
                        <Badge className={cn("text-xs", getStatusColor(status))}>
                          {status}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {analysis.summary.lastAnalyzed && (
                    <>
                      <Separator />
                      <div className="text-xs text-muted-foreground">
                        Last analyzed: {new Date(analysis.summary.lastAnalyzed).toLocaleString()}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Score Breakdown */}
            {analysis.summary.overallScore && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-around items-center py-4">
                    <ScoreCircle
                      score={analysis.analysisReports.codeQuality?.overallScore || null}
                      label="Code Quality"
                      color="blue"
                    />
                    <ScoreCircle
                      score={analysis.analysisReports.hedera?.hederaUsageScore || null}
                      label="Hedera Usage"
                      color="green"
                    />
                    <ScoreCircle
                      score={analysis.analysisReports.coherence?.score || null}
                      label="Coherence"
                      color="purple"
                    />
                    <ScoreCircle
                      score={analysis.analysisReports.innovation?.score || null}
                      label="Innovation"
                      color="orange"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Other tabs would be implemented here with detailed report information */}
          <TabsContent value="code">
            <Card>
              <CardHeader>
                <CardTitle>Code Quality Analysis</CardTitle>
                <CardDescription>Detailed code quality metrics and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.analysisReports.codeQuality ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round(analysis.analysisReports.codeQuality.overallScore || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Overall</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(analysis.analysisReports.codeQuality.technicalScore || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Technical</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {Math.round(analysis.analysisReports.codeQuality.securityScore || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Security</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(analysis.analysisReports.codeQuality.richnessScore || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Richness</div>
                      </div>
                    </div>
                    {analysis.analysisReports.codeQuality.summary && (
                      <div>
                        <h4 className="font-medium mb-2">Summary</h4>
                        <p className="text-sm text-muted-foreground">{analysis.analysisReports.codeQuality.summary}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No code quality report available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Additional tabs would continue here... */}

        </Tabs>
      </motion.div>
    </motion.div>
  );
}