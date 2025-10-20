'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Download, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HederaScoreDisplay } from '@/components/reports/hedera/hedera-score';
import { TechnologyDetection } from '@/components/reports/hedera/technology-detection';
import { Recommendations } from '@/components/reports/hedera/recommendations';
import { formatDateForDisplay } from '@/lib/form-utils';

import { fetchBackend } from '@/lib/api/fetch-backend';
interface HederaReport {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  technologyCategory: 'HEDERA' | 'OTHER_BLOCKCHAIN' | 'NO_BLOCKCHAIN';
  confidence: number;
  detectedTechnologies: string[];
  hederaUsageScore?: number;
  hederaPresenceDetected?: boolean;
  complexityLevel?: 'SIMPLE' | 'MODERATE' | 'ADVANCED';
  evidenceFiles: Array<{
    file: string;
    patterns: string[];
    confidence: number;
  }>;
  detectedPatterns: {
    sdkUsage?: string[];
    smartContracts?: string[];
    accountServices?: string[];
    tokenServices?: string[];
    consensusServices?: string[];
    fileServices?: string[];
    mirrorNodeUsage?: string[];
    hashConnectIntegration?: string[];
  };
  libraryUsage: {
    hederaSDK?: string;
    hashConnect?: string;
    otherBlockchainLibs?: string[];
  };
  recommendations: string[];
  summary?: string;
  strengths: string[];
  improvements: string[];
  processingTime?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export default function HederaReportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [report, setReport] = useState<HederaReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch project details
  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetchBackend(`/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data.project);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    }

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Fetch Hedera reports
  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const response = await fetchBackend(`/projects/${projectId}/review/hedera`);

        if (response.ok) {
          const data = await response.json();
          const reports = data.data;

          if (reports && reports.length > 0) {
            // Get the latest completed report first, then failed reports if no completed ones
            const completedReport = reports.find((r: HederaReport) => r.status === 'COMPLETED');
            const failedReport = reports.find((r: HederaReport) => r.status === 'FAILED');

            if (completedReport) {
              setReport(completedReport);
            } else if (failedReport) {
              setReport(failedReport);
            } else {
              setError('No completed Hedera analysis found. Please run the analysis first.');
            }
          } else {
            setError('No Hedera analysis found for this project.');
          }
        } else {
          setError('Failed to fetch Hedera analysis reports.');
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError('An error occurred while loading the report.');
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchReports();
    }
  }, [projectId]);

  const handleStartNewAnalysis = async () => {
    try {
      const response = await fetchBackend(`/projects/${projectId}/review/hedera`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            maxFiles: 30,
            includeCodeAnalysis: true
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/dashboard/projects/${projectId}/hedera-progress`);
      } else {
        alert(`Error starting Hedera analysis: ${data.error}`);
      }
    } catch (error) {
      console.error('Error starting analysis:', error);
      alert('Failed to start new analysis. Please try again.');
    }
  };

  const handleDeleteReport = async () => {
    if (!report) return;

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this Hedera analysis report? This action cannot be undone.'
    );

    if (!confirmDelete) return;

    try {
      const response = await fetchBackend(`/projects/${projectId}/review/hedera`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Navigate back to project page after successful deletion
        router.push(`/dashboard/projects/${projectId}`);
      } else {
        const data = await response.json();
        alert(`Error deleting report: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/projects/${projectId}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
          </div>

          {/* Error Display */}
          <Card className="h-full flex flex-col">
            <CardContent className="p-8 text-center flex-1 flex flex-col">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Report Available</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex-1"></div>
              <Button onClick={handleStartNewAnalysis}>
                Start Hedera Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/projects/${projectId}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleStartNewAnalysis}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run New Analysis
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteReport}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Report
            </Button>
          </div>
        </div>

        {/* Report Header */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Hedera Technology Analysis Report</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Project: {project?.name || 'Loading...'}
                </p>
              </div>
              <div className="text-right space-y-1">
                {getStatusBadge(report.status)}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDateForDisplay(report.createdAt, 'MMM d, yyyy \'at\' h:mm a')}
                </div>
                {report.processingTime && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    Processed in {report.processingTime}s
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Handle Failed Reports */}
        {report.status === 'FAILED' ? (
          <Card className="border-2 border-red-200 bg-red-50 h-full flex flex-col">
            <CardContent className="p-8 text-center flex-1 flex flex-col">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-red-800">AI Analysis Failed</h2>
              <p className="text-red-700 mb-4">
                The AI analysis could not be completed successfully for this project.
              </p>
              {report.errorMessage && (
                <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-red-800 mb-2">Error Details:</h3>
                  <p className="text-sm text-red-700 font-mono break-words">{report.errorMessage}</p>
                </div>
              )}
              <div className="text-sm text-red-600 mb-6">
                <p>Possible reasons:</p>
                <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
                  <li>AI service temporarily unavailable</li>
                  <li>Repository access issues</li>
                  <li>Invalid project structure</li>
                  <li>API rate limiting</li>
                </ul>
              </div>
              <div className="flex-1"></div>
              <div className="flex justify-center space-x-3">
                <Button onClick={handleStartNewAnalysis}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Main Score Display */}
            <HederaScoreDisplay
              confidence={report.confidence}
              technologyCategory={report.technologyCategory}
              hederaUsageScore={report.hederaUsageScore}
              hederaPresenceDetected={report.hederaPresenceDetected}
              complexityLevel={report.complexityLevel}
              summary={report.summary}
            />

            {/* Technology Detection */}
            <TechnologyDetection
              detectedTechnologies={report.detectedTechnologies}
              evidenceFiles={report.evidenceFiles}
              detectedPatterns={report.detectedPatterns}
              libraryUsage={report.libraryUsage}
              projectGithubUrl={project?.githubUrl}
            />

            {/* Recommendations */}
            <Recommendations
              recommendations={report.recommendations}
              strengths={report.strengths}
              improvements={report.improvements}
              technologyCategory={report.technologyCategory}
            />
          </>
        )}

        {/* Report Metadata */}
        <Card className="bg-muted/30 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Report Metadata</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Report ID:</span>
                <p className="font-mono text-xs bg-background px-2 py-1 rounded mt-1">{report.id}</p>
              </div>
              <div>
                <span className="font-medium">Analysis Model:</span>
                <p className="mt-1">meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo</p>
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>
                <p className="mt-1">{formatDateForDisplay(report.updatedAt, 'MMM d, yyyy \'at\' h:mm a')}</p>
              </div>
              {report.status === 'FAILED' && report.errorMessage && (
                <div className="col-span-full">
                  <span className="font-medium">Error Message:</span>
                  <p className="mt-1 text-red-600 font-mono text-xs bg-red-50 px-2 py-1 rounded break-words">{report.errorMessage}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}