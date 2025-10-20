'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, RefreshCw, FileCode, AlertTriangle, Bug, Shield, Clock, Eye, ChevronDown, ChevronRight, Info, CheckCircle, XCircle, Trash2, TrendingUp, TrendingDown, Star, Target, Zap, Brain, Award, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageHeader } from '@/components/shared/page-header';
import { QualityBadge } from '@/components/code-quality/quality-badge';
import { QualitySummary } from '@/components/code-quality/quality-summary';
import { ScoreMeter } from '@/components/code-quality/score-meter';
import { ScoreDisplay, ScoreValue, ScoreNumber } from '@/components/code-quality/score-display';
import { RepositoryStructureVisualization } from '@/components/code-quality/repository-structure-visualization';
import { RichnessEvidencePanel } from '@/components/code-quality/richness-evidence-panel';
import { CodeSnippet, InlineCode } from '@/components/ui/code-snippet';
import { toast } from 'react-hot-toast';

import { fetchBackend } from '@/lib/api/fetch-backend';
interface Project {
  id: string;
  name: string;
  teamName: string;
  githubUrl: string;
  hackathon: { id: string; name: string };
  track: { id: string; name: string };
}

interface CodeQualityReport {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  overallScore: number | null;
  technicalScore: number | null;
  securityScore: number | null;
  documentationScore: number | null;
  performanceScore: number | null;
  richnessScore: number | null;
  analysisErrors: string[];
  partialAnalysis: boolean;
  codeSmellsCount: number;
  bugsCount: number;
  vulnerabilitiesCount: number;
  duplicatedLinesCount: number;
  totalLinesAnalyzed: number;
  fileAnalysis: {
    files: Array<{
      filename: string;
      path: string;
      language: string;
      linesOfCode: number;
      complexity: number;
      qualityScore: number;
      richnessScore: number;
      issues: {
        codeSmells: string[];
        bugs: string[];
        vulnerabilities: string[];
        suggestions: string[];
      };
      evidence?: {
        complexityEvidence: string[];
        qualityEvidence: string[];
        richnessEvidence: string[];
        positiveAspects: string[];
        negativeAspects: string[];
      };
      scoreJustification?: {
        complexityReason: string;
        qualityReason: string;
        richnessReason: string;
        overallReason: string;
      };
    }>;
    summary: {
      totalFiles: number;
      totalLines: number;
      codeSmellsCount: number;
      bugsCount: number;
      vulnerabilitiesCount: number;
    };
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    impact: string;
  }>;
  strengths: string[];
  improvements: string[];
  scoreEvidence?: {
    technicalEvidence: string[];
    securityEvidence: string[];
    documentationEvidence: string[];
    performanceEvidence: string[];
    richnessEvidence: string[];
    overallEvidence: string[];
  };
  scoreJustifications?: {
    technicalJustification: string;
    securityJustification: string;
    documentationJustification: string;
    performanceJustification: string;
    richnessJustification: string;
    overallJustification: string;
  };
  errorMessage?: string;
  analysisStartedAt: string;
  analysisCompletedAt?: string;
  analysisTimeMs?: number;
  createdAt: string;
  updatedAt: string;
  repositoryStructure?: any;
  packageAnalysis?: any;
  configurationAnalysis?: any;
  architecturalPatterns?: any[];
  frameworkUtilization?: any[];
  structuralComplexity?: any;
  project: Project;
}

export default function CodeQualityReportPage() {
  const params = useParams();
  const router = useRouter();
  const [reports, setReports] = useState<CodeQualityReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<CodeQualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  const projectId = params.id as string;

  const toggleEvidence = (fileIndex: number) => {
    setExpandedEvidence(prev => ({
      ...prev,
      [fileIndex]: !prev[fileIndex]
    }));
  };

  const renderEnhancedEvidence = (evidenceText: string, fileLanguage?: string) => {
    // Check if the evidence contains code patterns
    const codePatterns = [
      /```[\s\S]*?```/g, // Code blocks
      /`[^`]+`/g, // Inline code
      /\b(?:function|class|const|let|var|if|for|while|switch)\b/g, // Keywords
      /\b\d+:\d+\b/g, // Line numbers
      /(?:line|lines)\s+\d+(?:-\d+)?/gi, // Line references
    ];

    let hasCode = codePatterns.some(pattern => pattern.test(evidenceText));

    if (hasCode) {
      // Split by code blocks and format them
      const parts = evidenceText.split(/(```[\s\S]*?```|`[^`]+`)/g);

      return (
        <div className="space-y-2">
          {parts.map((part, index) => {
            if (part.startsWith('```') && part.endsWith('```')) {
              // Code block
              const code = part.slice(3, -3).trim();
              return (
                <CodeSnippet
                  key={index}
                  code={code}
                  language={fileLanguage || 'text'}
                  className="text-xs"
                />
              );
            } else if (part.startsWith('`') && part.endsWith('`')) {
              // Inline code
              return (
                <InlineCode key={index} className="text-xs">
                  {part.slice(1, -1)}
                </InlineCode>
              );
            } else {
              // Regular text with enhanced formatting for line numbers
              const enhancedText = part.replace(
                /(?:line|lines)\s+(\d+(?:-\d+)?)/gi,
                (match, lineRef) => `line ${lineRef}`
              );

              return (
                <span key={index} className="text-xs">
                  {enhancedText.split(/(\b\d+:\d+\b)/).map((segment, segIndex) => (
                    /^\d+:\d+$/.test(segment) ? (
                      <InlineCode key={segIndex} className="text-xs font-mono">
                        {segment}
                      </InlineCode>
                    ) : (
                      segment
                    )
                  ))}
                </span>
              );
            }
          })}
        </div>
      );
    }

    // Fallback for non-code evidence with basic enhancements
    return (
      <span className="text-xs">
        {evidenceText.split(/(\b\d+:\d+\b)/).map((segment, index) => (
          /^\d+:\d+$/.test(segment) ? (
            <InlineCode key={index} className="text-xs font-mono">
              {segment}
            </InlineCode>
          ) : (
            segment
          )
        ))}
      </span>
    );
  };

  const fetchDetailedReport = async (reportId: string) => {
    try {
      const response = await fetchBackend(`/projects/${projectId}/code-quality/${reportId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch detailed report');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch detailed report');
      }

      return data.data;
    } catch (err) {
      console.error('Error fetching detailed report:', err);
      return null;
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetchBackend(`/projects/${projectId}/code-quality`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch code quality reports');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch reports');
      }

      setReports(data.data);

      // Select the most recent completed report by default and fetch its details
      const completedReports = data.data.filter((r: CodeQualityReport) => r.status === 'COMPLETED');
      if (completedReports.length > 0) {
        const detailedReport = await fetchDetailedReport(completedReports[0].id);
        if (detailedReport) {
          setSelectedReport(detailedReport);
        } else {
          setSelectedReport(completedReports[0]);
        }
      } else if (data.data.length > 0) {
        const detailedReport = await fetchDetailedReport(data.data[0].id);
        if (detailedReport) {
          setSelectedReport(detailedReport);
        } else {
          setSelectedReport(data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshReports = () => {
    setRefreshing(true);
    fetchReports();
  };

  const startNewAnalysis = async () => {
    try {
      const response = await fetchBackend(`/projects/${projectId}/code-quality`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start analysis');
      }

      toast.success('New code quality analysis started!');
      refreshReports();
    } catch (error) {
      console.error('Error starting analysis:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start analysis');
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    setDeleting(reportId);

    try {
      const response = await fetchBackend(`/projects/${projectId}/code-quality/${reportId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete report');
      }

      toast.success('Report deleted successfully');

      // Remove from local state
      setReports(prev => prev.filter(report => report.id !== reportId));

      // If this was the selected report, clear selection
      if (selectedReport?.id === reportId) {
        const remainingReports = reports.filter(report => report.id !== reportId);
        if (remainingReports.length > 0) {
          setSelectedReport(remainingReports[0]);
        } else {
          setSelectedReport(null);
        }
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete report');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchReports();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-muted-foreground">Loading code quality reports...</p>
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
            <AlertTriangle className="w-12 h-12 mx-auto text-red-600 mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Reports</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const project = selectedReport?.project || reports[0]?.project;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Enhanced Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/dashboard/hackathons/${project?.hackathon.id}/projects`}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-foreground transition-all duration-200 hover:shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Projects</span>
        </Link>
      </div>

      {/* Enhanced Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Brain className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Code Quality Analysis</h1>
                  <p className="text-indigo-100 text-lg">
                    {project ? `${project.name} by ${project.teamName}` : 'Comprehensive code analysis'}
                  </p>
                </div>
              </div>

              {selectedReport && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <Target className="w-6 h-6 text-yellow-300" />
                      <div>
                        <p className="text-sm text-indigo-100">Overall Score</p>
                        <p className="text-2xl font-bold">{selectedReport.overallScore}/100</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-orange-300" />
                      <div>
                        <p className="text-sm text-indigo-100">Issues Found</p>
                        <p className="text-2xl font-bold">
                          {selectedReport.codeSmellsCount + selectedReport.bugsCount + selectedReport.vulnerabilitiesCount}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <Activity className="w-6 h-6 text-green-300" />
                      <div>
                        <p className="text-sm text-indigo-100">Lines Analyzed</p>
                        <p className="text-2xl font-bold">{selectedReport.totalLinesAnalyzed?.toLocaleString() || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={refreshReports}
                variant="outline"
                disabled={refreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={startNewAnalysis}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm transition-all duration-200"
              >
                <Zap className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
            </div>
          </div>
        </div>

        {/* Animated background elements */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Enhanced Reports List */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Analysis History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <FileCode className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">No analyses yet</p>
                  <Button onClick={startNewAnalysis} size="sm" className="mt-3">
                    Start First Analysis
                  </Button>
                </div>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      selectedReport?.id === report.id
                        ? 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-md scale-[1.02]'
                        : 'border-slate-200 hover:border-indigo-200 hover:bg-gradient-to-r hover:from-slate-50 hover:to-indigo-50 dark:hover:from-slate-700 dark:hover:to-indigo-900/20'
                    }`}
                  >
                    <div
                      className="cursor-pointer"
                      onClick={async () => {
                        const detailedReport = await fetchDetailedReport(report.id);
                        if (detailedReport) {
                          setSelectedReport(detailedReport);
                        } else {
                          setSelectedReport(report);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant="outline"
                          className={
                            report.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm'
                              : report.status === 'FAILED'
                              ? 'bg-red-100 text-red-800 border-red-200 shadow-sm'
                              : 'bg-amber-100 text-amber-800 border-amber-200 shadow-sm animate-pulse'
                          }
                        >
                          {report.status === 'COMPLETED' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {report.status === 'FAILED' && <XCircle className="w-3 h-3 mr-1" />}
                          {report.status === 'IN_PROGRESS' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                          {report.status}
                        </Badge>
                        <div className="flex items-center gap-2">
                          {report.status === 'COMPLETED' && (
                            <div className="flex items-center gap-2">
                              <QualityBadge score={report.overallScore} size="sm" showScore={false} />
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {report.overallScore}
                              </span>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteReport(report.id);
                            }}
                            disabled={deleting === report.id}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()} at{' '}
                        {new Date(report.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Report Details */}
        <div className="lg:col-span-3">
          {selectedReport ? (
            <div className="space-y-8">
              <QualitySummary report={selectedReport} />

              {selectedReport.status === 'COMPLETED' && (
                <>
                  {/* Enhanced Overall Score Evidence */}
                  {(selectedReport.scoreEvidence || selectedReport.scoreJustifications) && (
                    <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                        <CardTitle className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Brain className="w-5 h-5 text-indigo-600" />
                          </div>
                          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                            Detailed Analysis Evidence
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {selectedReport.scoreJustifications && (
                          <div>
                            <h4 className="font-medium text-lg mb-4">Score Justifications</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="p-1 bg-blue-200 dark:bg-blue-800 rounded">
                                    <TrendingUp className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                                  </div>
                                  <h5 className="font-bold text-blue-800 dark:text-blue-300">Technical Score ({selectedReport.technicalScore}/100)</h5>
                                </div>
                                <p className="text-blue-700 dark:text-blue-400 text-sm leading-relaxed">{selectedReport.scoreJustifications.technicalJustification}</p>
                              </div>
                              <div className="p-6 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-800/20 rounded-xl border border-red-200 dark:border-red-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="p-1 bg-red-200 dark:bg-red-800 rounded">
                                    <Shield className="w-4 h-4 text-red-700 dark:text-red-300" />
                                  </div>
                                  <h5 className="font-bold text-red-800 dark:text-red-300">Security ({selectedReport.securityScore}/100)</h5>
                                </div>
                                <p className="text-red-700 dark:text-red-400 text-sm leading-relaxed">{selectedReport.scoreJustifications.securityJustification}</p>
                              </div>
                              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                                <h5 className="font-medium text-yellow-800 mb-2">
                                  <ScoreDisplay score={selectedReport.documentationScore} label="Documentation" />
                                </h5>
                                <p className="text-yellow-700 text-sm">{selectedReport.scoreJustifications?.documentationJustification || 'Documentation assessment based on available content'}</p>
                              </div>
                              <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                                <h5 className="font-medium text-orange-800 mb-2">
                                  <ScoreDisplay score={selectedReport.performanceScore} label="Performance" />
                                </h5>
                                <p className="text-orange-700 text-sm">{selectedReport.scoreJustifications?.performanceJustification || 'Performance assessment based on code patterns'}</p>
                              </div>
                              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20 rounded-xl border border-purple-200 dark:border-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="p-1 bg-purple-200 dark:bg-purple-800 rounded">
                                    <Zap className="w-4 h-4 text-purple-700 dark:text-purple-300" />
                                  </div>
                                  <h5 className="font-bold text-purple-800 dark:text-purple-300">
                                    <ScoreDisplay score={selectedReport.richnessScore} label="Code Richness" />
                                  </h5>
                                </div>
                                <p className="text-purple-700 dark:text-purple-400 text-sm leading-relaxed">{selectedReport.scoreJustifications?.richnessJustification || 'Richness assessment based on structural and architectural analysis'}</p>
                              </div>
                            </div>
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-500">
                              <h5 className="font-medium text-gray-800 mb-2">Overall Assessment ({selectedReport.overallScore}/100)</h5>
                              <p className="text-gray-700 text-sm">{selectedReport.scoreJustifications.overallJustification}</p>
                            </div>
                          </div>
                        )}

                        {selectedReport.scoreEvidence && (
                          <div>
                            <h4 className="font-medium text-lg mb-4">Supporting Evidence</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedReport.scoreEvidence.technicalEvidence?.length > 0 && (
                                <div className="p-4 bg-blue-50 rounded-lg">
                                  <h5 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    Technical Evidence
                                  </h5>
                                  <ul className="text-blue-700 text-sm space-y-2">
                                    {selectedReport.scoreEvidence.technicalEvidence.map((evidence, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>{evidence}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}


                              {selectedReport.scoreEvidence.securityEvidence?.length > 0 && (
                                <div className="p-4 bg-red-50 rounded-lg">
                                  <h5 className="font-medium text-red-800 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    Security Evidence
                                  </h5>
                                  <ul className="text-red-700 text-sm space-y-2">
                                    {selectedReport.scoreEvidence.securityEvidence.map((evidence, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-red-500 mt-1">•</span>
                                        <span>{evidence}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {selectedReport.scoreEvidence.documentationEvidence?.length > 0 && (
                                <div className="p-4 bg-yellow-50 rounded-lg">
                                  <h5 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    Documentation Evidence
                                  </h5>
                                  <ul className="text-yellow-700 text-sm space-y-2">
                                    {selectedReport.scoreEvidence.documentationEvidence.map((evidence, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-yellow-500 mt-1">•</span>
                                        <span>{evidence}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}


                              {selectedReport.scoreEvidence.performanceEvidence?.length > 0 && (
                                <div className="p-4 bg-orange-50 rounded-lg">
                                  <h5 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    Performance Evidence
                                  </h5>
                                  <ul className="text-orange-700 text-sm space-y-2">
                                    {selectedReport.scoreEvidence.performanceEvidence.map((evidence, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-orange-500 mt-1">•</span>
                                        <span>{evidence}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {selectedReport.scoreEvidence.richnessEvidence?.length > 0 && (
                                <div className="p-4 bg-purple-50 rounded-lg">
                                  <h5 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    Code Richness Evidence
                                  </h5>
                                  <ul className="text-purple-700 text-sm space-y-2">
                                    {selectedReport.scoreEvidence.richnessEvidence.map((evidence, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-purple-500 mt-1">•</span>
                                        <span>{evidence}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {selectedReport.scoreEvidence.overallEvidence?.length > 0 && (
                                <div className="p-4 bg-purple-50 rounded-lg md:col-span-2">
                                  <h5 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    Overall Evidence
                                  </h5>
                                  <ul className="text-purple-700 text-sm space-y-2">
                                    {selectedReport.scoreEvidence.overallEvidence.map((evidence, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-purple-500 mt-1">•</span>
                                        <span>{evidence}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Enhanced Richness Evidence Panel */}
                  <RichnessEvidencePanel
                    richnessScore={selectedReport.richnessScore || 0}
                    richnessEvidence={selectedReport.scoreEvidence?.richnessEvidence || []}
                    richnessJustification={selectedReport.scoreJustifications?.richnessJustification || 'Richness assessment based on structural and architectural analysis'}
                    richnessBreakdown={selectedReport.structuralComplexity?.richnessBreakdown}
                    structuralAnalysis={{
                      architecturalPatterns: selectedReport.architecturalPatterns,
                      frameworkUtilization: selectedReport.frameworkUtilization,
                      structuralComplexity: selectedReport.structuralComplexity,
                      businessLogic: {
                        customAlgorithms: selectedReport.structuralComplexity?.customAlgorithms || []
                      },
                      recommendations: []
                    }}
                  />

                  {/* Repository Structure Visualization */}
                  {(selectedReport.repositoryStructure || selectedReport.packageAnalysis || selectedReport.configurationAnalysis) && (
                    <RepositoryStructureVisualization
                      repositoryStructure={selectedReport.repositoryStructure || {}}
                      packageAnalysis={selectedReport.packageAnalysis || {}}
                      configurationAnalysis={selectedReport.configurationAnalysis || {}}
                      architecturalPatterns={selectedReport.architecturalPatterns || []}
                      frameworkUtilization={selectedReport.frameworkUtilization || []}
                      structuralComplexity={selectedReport.structuralComplexity || {}}
                    />
                  )}

                  {/* Enhanced File Analysis */}
                  {selectedReport.fileAnalysis?.files && selectedReport.fileAnalysis.files.length > 0 && (
                    <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20">
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileCode className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold text-xl">
                              File Analysis
                            </span>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                              {selectedReport.fileAnalysis.files.length} files analyzed
                            </p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {selectedReport.fileAnalysis.files.map((file, index) => (
                            <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-gradient-to-r from-slate-50/50 to-white dark:from-slate-800/50 dark:to-slate-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <FileCode className="w-5 h-5 text-indigo-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200">{file.filename}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{file.path}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-medium">
                                    {file.language}
                                  </Badge>
                                  <QualityBadge score={file.qualityScore} size="sm" />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-6">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-600" />
                                    <span className="text-blue-700 dark:text-blue-300 font-medium">Lines</span>
                                  </div>
                                  <span className="text-xl font-bold text-blue-800 dark:text-blue-200">{file.linesOfCode}</span>
                                </div>
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-orange-600" />
                                    <span className="text-orange-700 dark:text-orange-300 font-medium">Complexity</span>
                                  </div>
                                  <span className="text-xl font-bold text-orange-800 dark:text-orange-200">{file.complexity}/10</span>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                  <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-green-600" />
                                    <span className="text-green-700 dark:text-green-300 font-medium">Maintainability</span>
                                  </div>
                                </div>
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                  <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-purple-600" />
                                    <span className="text-purple-700 dark:text-purple-300 font-medium">Richness</span>
                                  </div>
                                  <span className="text-xl font-bold text-purple-800 dark:text-purple-200">
                                    <ScoreValue score={file.richnessScore} />
                                  </span>
                                </div>
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <span className="text-red-700 dark:text-red-300 font-medium">Issues</span>
                                  </div>
                                  <span className="text-xl font-bold text-red-800 dark:text-red-200">
                                    {file.issues.codeSmells.length + file.issues.bugs.length + file.issues.vulnerabilities.length}
                                  </span>
                                </div>
                              </div>

                              {(file.issues.codeSmells.length > 0 || file.issues.bugs.length > 0 || file.issues.vulnerabilities.length > 0) && (
                                <div className="space-y-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                  {file.issues.codeSmells.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1 bg-yellow-200 dark:bg-yellow-800 rounded">
                                          <AlertTriangle className="w-4 h-4 text-yellow-700 dark:text-yellow-300" />
                                        </div>
                                        <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300">Code Smells</p>
                                      </div>
                                      <ul className="text-sm text-yellow-700 space-y-1">
                                        {file.issues.codeSmells.map((smell, i) => (
                                          <li key={i} className="flex items-start gap-2">
                                            <span className="text-yellow-600">•</span>
                                            <span>
                                              {typeof smell === 'string' ? smell : (
                                                <div>
                                                  <span className="font-medium">{smell.smell || smell.type || smell.description}</span>
                                                  {smell.location && <span className="text-yellow-600 ml-2">({smell.location})</span>}
                                                </div>
                                              )}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {file.issues.bugs.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1 bg-orange-200 dark:bg-orange-800 rounded">
                                          <Bug className="w-4 h-4 text-orange-700 dark:text-orange-300" />
                                        </div>
                                        <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Potential Bugs</p>
                                      </div>
                                      <ul className="text-sm text-orange-700 space-y-1">
                                        {file.issues.bugs.map((bug, i) => (
                                          <li key={i} className="flex items-start gap-2">
                                            <span className="text-orange-600">•</span>
                                            <span>
                                              {typeof bug === 'string' ? bug : (
                                                <div>
                                                  <span className="font-medium">{bug.description || bug.bug || bug.issue}</span>
                                                  {bug.location && <span className="text-orange-600 ml-2">({bug.location})</span>}
                                                </div>
                                              )}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {file.issues.vulnerabilities.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1 bg-red-200 dark:bg-red-800 rounded">
                                          <Shield className="w-4 h-4 text-red-700 dark:text-red-300" />
                                        </div>
                                        <p className="text-sm font-bold text-red-800 dark:text-red-300">Security Issues</p>
                                      </div>
                                      <ul className="text-sm text-red-700 space-y-1">
                                        {file.issues.vulnerabilities.map((vuln, i) => (
                                          <li key={i} className="flex items-start gap-2">
                                            <span className="text-red-600">•</span>
                                            <span>
                                              {typeof vuln === 'string' ? vuln : (
                                                <div>
                                                  <span className="font-medium">{vuln.description || vuln.vulnerability || vuln.issue}</span>
                                                  {vuln.location && <span className="text-red-600 ml-2">({vuln.location})</span>}
                                                </div>
                                              )}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Suggestions */}
                              {file.issues.suggestions && file.issues.suggestions.length > 0 && (
                                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1 bg-indigo-200 dark:bg-indigo-800 rounded">
                                      <Zap className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />
                                    </div>
                                    <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Suggestions for Improvement</p>
                                  </div>
                                  <ul className="text-sm text-blue-700 space-y-1">
                                    {file.issues.suggestions.map((suggestion, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-blue-600">→</span>
                                        <span>
                                          {typeof suggestion === 'string' ? suggestion : (
                                            <div>
                                              <span className="font-medium">{suggestion.description || suggestion.suggestion || suggestion.recommendation}</span>
                                              {suggestion.location && <span className="text-blue-600 ml-2">({suggestion.location})</span>}
                                              {suggestion.steps && Array.isArray(suggestion.steps) && (
                                                <ul className="mt-1 ml-4 text-xs space-y-1">
                                                  {suggestion.steps.map((step, stepIndex) => (
                                                    <li key={stepIndex} className="text-blue-600">• {step}</li>
                                                  ))}
                                                </ul>
                                              )}
                                            </div>
                                          )}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Evidence and Score Justification */}
                              {(file.evidence || file.scoreJustification) && (
                                <div className="border-t pt-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleEvidence(index)}
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                                  >
                                    {expandedEvidence[index] ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                    <Info className="w-4 h-4" />
                                    Score Analysis & Evidence
                                  </Button>

                                  {expandedEvidence[index] && (
                                    <div className="mt-3 space-y-4 p-3 bg-muted/30 rounded-lg">
                                      {/* Score Justifications */}
                                      {file.scoreJustification && (
                                        <div className="space-y-3">
                                          <h5 className="font-medium text-sm">Score Justifications</h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                            <div className="p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                                              <p className="font-medium text-blue-800 mb-1">Complexity ({file.complexity}/10)</p>
                                              <p className="text-blue-700">{file.scoreJustification.complexityReason}</p>
                                            </div>
                                            <div className="p-2 bg-green-50 rounded border-l-2 border-green-400">
                                            </div>
                                            <div className="p-2 bg-purple-50 rounded border-l-2 border-purple-400">
                                              <p className="font-medium text-purple-800 mb-1">Quality ({file.qualityScore}/100)</p>
                                              <p className="text-purple-700">{file.scoreJustification.qualityReason}</p>
                                            </div>
                                            <div className="p-2 bg-pink-50 rounded border-l-2 border-pink-400">
                                              <p className="font-medium text-pink-800 mb-1">
                                                Richness (<ScoreValue score={file.richnessScore} />)
                                              </p>
                                              <p className="text-pink-700">{file.scoreJustification.richnessReason || 'Richness analysis not available'}</p>
                                            </div>
                                            <div className="p-2 bg-gray-50 rounded border-l-2 border-gray-400 md:col-span-2">
                                              <p className="font-medium text-gray-800 mb-1">Overall Assessment</p>
                                              <p className="text-gray-700">{file.scoreJustification.overallReason}</p>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Evidence */}
                                      {file.evidence && (
                                        <div className="space-y-3">
                                          <h5 className="font-medium text-sm">Supporting Evidence</h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {file.evidence.positiveAspects.length > 0 && (
                                              <div className="p-3 bg-green-50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                                  <p className="font-medium text-green-800 text-sm">Positive Aspects</p>
                                                </div>
                                                <ul className="text-xs text-green-700 space-y-2">
                                                  {file.evidence.positiveAspects.map((aspect, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                      <span className="text-green-500 mt-0.5">✓</span>
                                                      <div className="flex-1">
                                                        {renderEnhancedEvidence(aspect, file.language)}
                                                      </div>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}

                                            {file.evidence.negativeAspects.length > 0 && (
                                              <div className="p-3 bg-red-50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <XCircle className="w-4 h-4 text-red-600" />
                                                  <p className="font-medium text-red-800 text-sm">Areas of Concern</p>
                                                </div>
                                                <ul className="text-xs text-red-700 space-y-2">
                                                  {file.evidence.negativeAspects.map((aspect, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                      <span className="text-red-500 mt-0.5">×</span>
                                                      <div className="flex-1">
                                                        {renderEnhancedEvidence(aspect, file.language)}
                                                      </div>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}

                                            {file.evidence.complexityEvidence.length > 0 && (
                                              <div className="p-3 bg-orange-50 rounded-lg">
                                                <p className="font-medium text-orange-800 text-sm mb-2">Complexity Factors</p>
                                                <ul className="text-xs text-orange-700 space-y-2">
                                                  {file.evidence.complexityEvidence.map((evidence, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                      <span className="text-orange-500 mt-0.5">•</span>
                                                      <div className="flex-1">
                                                        {renderEnhancedEvidence(evidence, file.language)}
                                                      </div>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}


                                            {file.evidence.qualityEvidence.length > 0 && (
                                              <div className="p-3 bg-purple-50 rounded-lg">
                                                <p className="font-medium text-purple-800 text-sm mb-2">Quality Evidence</p>
                                                <ul className="text-xs text-purple-700 space-y-2">
                                                  {file.evidence.qualityEvidence.map((evidence, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                      <span className="text-purple-500 mt-0.5">•</span>
                                                      <div className="flex-1">
                                                        {renderEnhancedEvidence(evidence, file.language)}
                                                      </div>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}

                                            {file.evidence.richnessEvidence && file.evidence.richnessEvidence.length > 0 && (
                                              <div className="p-3 bg-pink-50 rounded-lg">
                                                <p className="font-medium text-pink-800 text-sm mb-2">Richness Evidence</p>
                                                <ul className="text-xs text-pink-700 space-y-2">
                                                  {file.evidence.richnessEvidence.map((evidence, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                      <span className="text-pink-500 mt-0.5">•</span>
                                                      <div className="flex-1">
                                                        {renderEnhancedEvidence(evidence, file.language)}
                                                      </div>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Enhanced Recommendations */}
                  {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                    <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Award className="w-6 h-6 text-amber-600" />
                          </div>
                          <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent font-bold text-xl">
                            Recommendations
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {selectedReport.recommendations.map((rec, index) => (
                            <div
                              key={index}
                              className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 ${
                                rec.priority === 'high'
                                  ? 'bg-gradient-to-r from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-800/20 border border-red-200 dark:border-red-700'
                                  : rec.priority === 'medium'
                                  ? 'bg-gradient-to-r from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/20 border border-yellow-200 dark:border-yellow-700'
                                  : 'bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20 border border-blue-200 dark:border-blue-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    rec.priority === 'high'
                                      ? 'bg-red-100 text-red-800 border-red-200'
                                      : rec.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                      : 'bg-blue-100 text-blue-800 border-blue-200'
                                  }
                                >
                                  {rec.priority.toUpperCase()}
                                </Badge>
                                <span className="font-medium">{rec.category}</span>
                              </div>
                              <p className="text-sm mb-2">{rec.description}</p>
                              <p className="text-xs text-muted-foreground">
                                <strong>Impact:</strong> {rec.impact}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Analysis Metadata */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        Analysis Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="font-medium text-blue-800 mb-1">Analysis Time</p>
                          <p className="text-blue-700">
                            {selectedReport.analysisTimeMs ? `${(selectedReport.analysisTimeMs / 1000).toFixed(1)}s` : 'N/A'}
                          </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="font-medium text-green-800 mb-1">Files Processed</p>
                          <p className="text-green-700">{selectedReport.fileAnalysis?.summary?.totalFiles || 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <p className="font-medium text-purple-800 mb-1">AI Model</p>
                          <p className="text-purple-700 text-xs">{selectedReport.aiModel || 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <p className="font-medium text-orange-800 mb-1">Repository</p>
                          {selectedReport.project?.githubUrl ? (
                            <a
                              href={selectedReport.project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-700 text-xs hover:underline"
                            >
                              View on GitHub
                            </a>
                          ) : (
                            <p className="text-orange-700 text-xs">N/A</p>
                          )}
                        </div>
                      </div>

                      {selectedReport.analysisStartedAt && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Started:</strong> {new Date(selectedReport.analysisStartedAt).toLocaleString()}
                            {selectedReport.analysisCompletedAt && (
                              <> • <strong>Completed:</strong> {new Date(selectedReport.analysisCompletedAt).toLocaleString()}</>
                            )}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Strengths and Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedReport.strengths && selectedReport.strengths.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-green-700 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {selectedReport.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <span className="text-green-600 mt-1">✓</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {selectedReport.improvements && selectedReport.improvements.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-orange-700 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Areas for Improvement
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {selectedReport.improvements.map((improvement, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <span className="text-orange-600 mt-1">→</span>
                                <span>{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <Eye className="w-16 h-16 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">No Report Selected</h3>
                  <p className="text-muted-foreground">
                    Select a report from the history or start a new analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}