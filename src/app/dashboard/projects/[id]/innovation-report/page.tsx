'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Share2, Lightbulb, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InnovationRadar } from '@/components/reports/innovation/innovation-radar';
import { SimilarProjects } from '@/components/reports/innovation/similar-projects';
import { UniqueAspects } from '@/components/reports/innovation/unique-aspects';
import { PatentIndicator } from '@/components/reports/innovation/patent-indicator';
import { ImpactAssessment } from '@/components/reports/innovation/impact-assessment';
import { AnalysisHistory } from '@/components/reports/innovation/analysis-history';

import { fetchBackend } from '@/lib/api/fetch-backend';
interface InnovationReport {
  id: string;
  score: number;
  summary: string;
  noveltyScore: number;
  creativityScore: number;
  technicalInnovation: number;
  marketInnovation: number;
  implementationInnovation: number;
  similarProjects: any[];
  uniqueAspects: string[];
  innovationEvidence: any[];
  potentialImpact: string;
  patentPotential: boolean;
  patentabilityScore?: number; // AI-generated patent score (0-100)
  patentAssessment?: {         // Detailed AI patent assessment
    patentPotential: boolean;
    patentabilityScore: number;
    noveltyAssessment: {
      score: number;
      reasoning: string;
    };
    nonObviousnessAssessment: {
      score: number;
      reasoning: string;
    };
    industrialApplicability: {
      score: number;
      reasoning: string;
    };
    patentableElements: string[];
    priorArtConcerns: string[];
    recommendations: string[];
    confidence: number;
  };
  suggestions: string[];
  agentModel: string;
  processingTime: number;
  status: string;
  createdAt: string;
  project: {
    id: string;
    name: string;
    teamName: string;
    githubUrl: string;
    track: {
      name: string;
    };
    hackathon: {
      name: string;
    };
  };
}

export default function InnovationReportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [report, setReport] = useState<InnovationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedoingAnalysis, setIsRedoingAnalysis] = useState(false);
  const [allReports, setAllReports] = useState<any[]>([]);

  useEffect(() => {
    async function fetchReport() {
      try {
        // First, get the latest innovation report for this project
        const reportsResponse = await fetchBackend(`/projects/${projectId}/review/innovation`);
        if (!reportsResponse.ok) {
          throw new Error('Failed to fetch innovation reports');
        }

        const reportsData = await reportsResponse.json();
        if (!reportsData.success || reportsData.data.length === 0) {
          throw new Error('No innovation reports found for this project');
        }

        // Set all reports for history
        setAllReports(reportsData.data);

        const latestReport = reportsData.data.find((r: any) => !r.isArchived) || reportsData.data[0]; // Get latest active report

        // Get the detailed report
        const detailResponse = await fetchBackend(`/projects/${projectId}/review/innovation/${latestReport.id}`);
        if (!detailResponse.ok) {
          throw new Error('Failed to fetch detailed innovation report');
        }

        const detailData = await detailResponse.json();
        if (!detailData.success) {
          throw new Error(detailData.error || 'Failed to load innovation report');
        }

        setReport(detailData.data);
      } catch (err) {
        console.error('Error fetching innovation report:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchReport();
    }
  }, [projectId]);

  const handleGoBack = () => {
    router.push(`/dashboard/projects/${projectId}`);
  };

  const handleRedoAnalysis = async () => {
    if (isRedoingAnalysis) return;

    // Confirm with user before proceeding
    const confirmed = window.confirm(
      'Are you sure you want to redo the innovation analysis? This will delete the current report and generate a new one. This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setIsRedoingAnalysis(true);

      // Archive the existing innovation report first (instead of deleting)
      const archiveResponse = await fetchBackend(`/projects/${projectId}/review/innovation/${report?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true })
      });

      if (!archiveResponse.ok) {
        console.warn('Could not archive existing report, proceeding anyway');
      }

      // Redirect to progress page to start new analysis
      router.push(`/dashboard/projects/${projectId}/innovation-progress`);
    } catch (error) {
      console.error('Error starting redo analysis:', error);
      setIsRedoingAnalysis(false);
      setError('Failed to restart analysis. Please try again.');
    }
  };

  const handleViewReport = (reportId: string) => {
    // Refresh the page with the selected report
    window.location.href = `/dashboard/projects/${projectId}/innovation-report?reportId=${reportId}`;
  };

  const handleArchiveReport = async (reportId: string) => {
    try {
      const response = await fetchBackend(`/projects/${projectId}/review/innovation/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true })
      });

      if (response.ok) {
        // Refresh the reports list
        const reportsResponse = await fetchBackend(`/projects/${projectId}/review/innovation`);
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          setAllReports(reportsData.data);
        }
      }
    } catch (error) {
      console.error('Error archiving report:', error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this analysis? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetchBackend(`/projects/${projectId}/review/innovation/${reportId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Refresh the reports list
        const reportsResponse = await fetchBackend(`/projects/${projectId}/review/innovation`);
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          setAllReports(reportsData.data);
        }
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleCompareReports = (reportId1: string, reportId2: string) => {
    // Navigate to comparison page
    router.push(`/dashboard/projects/${projectId}/innovation-comparison?reports=${reportId1},${reportId2}`);
  };

  const getInnovationGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (score >= 85) return { grade: 'A', color: 'text-green-600' };
    if (score >= 80) return { grade: 'A-', color: 'text-green-600' };
    if (score >= 75) return { grade: 'B+', color: 'text-blue-600' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600' };
    if (score >= 65) return { grade: 'B-', color: 'text-blue-600' };
    if (score >= 60) return { grade: 'C+', color: 'text-yellow-600' };
    if (score >= 55) return { grade: 'C', color: 'text-yellow-600' };
    if (score >= 50) return { grade: 'C-', color: 'text-yellow-600' };
    return { grade: 'D', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading innovation report...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Innovation Report</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'Unable to load the innovation report'}
              </p>
              <Button onClick={handleGoBack}>
                Return to Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate overall score from individual components (like InnovationRadar does)
  const calculatedOverallScore = Math.round(
    (report.noveltyScore + report.creativityScore + report.technicalInnovation +
     report.marketInnovation + report.implementationInnovation) / 5
  );

  const innovationGrade = getInnovationGrade(calculatedOverallScore);

  // Prepare data for components
  const radarData = {
    noveltyScore: report.noveltyScore,
    creativityScore: report.creativityScore,
    technicalInnovation: report.technicalInnovation,
    marketInnovation: report.marketInnovation,
    implementationInnovation: report.implementationInnovation,
  };

  // Use real AI patent assessment data (no more mock data!)
  const patentData = report.patentAssessment ? {
    patentPotential: report.patentPotential,
    patentabilityScore: report.patentabilityScore || report.patentAssessment.patentabilityScore || 0,
    noveltyAssessment: report.patentAssessment.noveltyAssessment || {
      score: report.noveltyScore,
      reasoning: "Based on novelty analysis"
    },
    nonObviousnessAssessment: report.patentAssessment.nonObviousnessAssessment || {
      score: report.technicalInnovation,
      reasoning: "Based on technical innovation assessment"
    },
    industrialApplicability: report.patentAssessment.industrialApplicability || {
      score: report.marketInnovation,
      reasoning: "Based on market innovation potential"
    },
    patentableElements: report.patentAssessment.patentableElements || report.uniqueAspects.slice(0, 3) || [],
    priorArtConcerns: report.patentAssessment.priorArtConcerns || [],
    recommendations: report.patentAssessment.recommendations || report.suggestions.slice(0, 3) || [],
    confidence: report.patentAssessment.confidence || 50
  } : {
    // Fallback for old reports without patent assessment data
    patentPotential: report.patentPotential,
    patentabilityScore: report.patentabilityScore || 0,
    noveltyAssessment: { score: report.noveltyScore, reasoning: "Legacy assessment" },
    nonObviousnessAssessment: { score: report.technicalInnovation, reasoning: "Legacy assessment" },
    industrialApplicability: { score: report.marketInnovation, reasoning: "Legacy assessment" },
    patentableElements: report.uniqueAspects.slice(0, 3) || [],
    priorArtConcerns: [],
    recommendations: report.suggestions.slice(0, 3) || [],
    confidence: 0
  };

  // Mock impact data
  const impactData = {
    overallImpactScore: Math.round((report.marketInnovation + report.technicalInnovation) / 2),
    socialImpact: {
      score: Math.max(report.marketInnovation - 10, 30),
      description: "Potential to benefit target users and communities",
      beneficiaries: "Primary target audience and stakeholders",
      scale: 'regional' as const
    },
    economicImpact: {
      score: report.marketInnovation,
      marketSize: "To be determined through market research",
      revenueModel: "Based on project description and approach",
      jobCreation: "Potential for employment creation"
    },
    environmentalImpact: {
      score: Math.max(60, report.implementationInnovation - 20),
      sustainability: "Environmental considerations of the solution",
      carbonFootprint: "Impact analysis needed"
    },
    technologicalImpact: {
      score: report.technicalInnovation,
      advancement: "Technical innovation and advancement potential",
      adoption: "Technology adoption prospects"
    },
    userImpact: {
      score: Math.max(report.creativityScore, 50),
      benefits: "Direct benefits to end users",
      usability: "User experience and accessibility"
    },
    timelineToImpact: 'medium-term' as const,
    keySuccessFactors: ["Strong technical execution", "Market validation", "User adoption"],
    riskFactors: ["Technical challenges", "Market competition", "Adoption barriers"],
    impactMeasurement: ["User engagement metrics", "Performance indicators", "Market penetration"]
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-amber-500" />
                Innovation Report
              </h1>
              <p className="text-muted-foreground">
                {report.project.name} • {report.project.teamName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedoAnalysis}
              disabled={isRedoingAnalysis}
            >
              {isRedoingAnalysis ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isRedoingAnalysis ? 'Starting...' : 'Redo Analysis'}
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Innovation Score Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Innovation Overview</span>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`text-3xl font-bold ${innovationGrade.color}`}>
                    {innovationGrade.grade}
                  </div>
                  <div className="text-xs text-muted-foreground">Grade</div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${innovationGrade.color}`}>
                    {calculatedOverallScore}/100
                  </div>
                  <div className="text-xs text-muted-foreground">Innovation Score</div>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{report.summary}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div>Track: {report.project.track.name}</div>
              <div>•</div>
              <div>Hackathon: {report.project.hackathon.name}</div>
              <div>•</div>
              <div>Analysis Time: {Math.round(report.processingTime / 1000)}s</div>
              <div>•</div>
              <div>Model: {report.agentModel}</div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Innovation Radar - Full width on mobile, 2 cols on xl */}
          <div className="xl:col-span-2">
            <InnovationRadar data={radarData} />
          </div>

          {/* Patent Indicator */}
          <div>
            <PatentIndicator data={patentData} />
          </div>
        </div>

        {/* Secondary Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Unique Aspects */}
          <UniqueAspects
            aspects={report.uniqueAspects}
            evidence={report.innovationEvidence}
          />

          {/* Similar Projects */}
          <SimilarProjects projects={report.similarProjects} />
        </div>

        {/* Impact Assessment */}
        <div className="mb-6">
          <ImpactAssessment data={impactData} />
        </div>

        {/* Suggestions and Next Steps */}
        {report.suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Recommendations for Enhancement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-amber-600">{index + 1}</span>
                    </div>
                    <p className="text-sm text-amber-800">{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis History */}
        <div className="mb-6">
          <AnalysisHistory
            reports={allReports}
            currentReportId={report?.id}
            onViewReport={handleViewReport}
            onArchiveReport={handleArchiveReport}
            onDeleteReport={handleDeleteReport}
            onCompareReports={handleCompareReports}
          />
        </div>
      </div>
    </div>
  );
}