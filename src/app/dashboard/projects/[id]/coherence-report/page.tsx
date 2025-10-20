'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Calendar, Clock, ExternalLink, Download, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { CoherenceScoreDisplay } from '@/components/reports/coherence/coherence-score';
import { TrackAlignmentDisplay } from '@/components/reports/coherence/track-alignment';
import { ReadmeAnalysisDisplay } from '@/components/reports/coherence/readme-analysis';
import { InconsistencyList } from '@/components/reports/coherence/inconsistency-list';
import { formatDateForDisplay } from '@/lib/form-utils';

import { fetchBackend } from '@/lib/api/fetch-backend';
interface CoherenceReport {
  id: string;
  score: number;
  summary: string;
  trackAlignment: number;
  readmeExists: boolean;
  readmeQuality: number;
  projectPurpose: string;
  trackJustification: string;
  inconsistencies: any[];
  suggestions: any[];
  evidence: any;
  processingTime: number;
  status: string;
  createdAt: string;
  updatedAt: string;
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

export default function CoherenceReportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [report, setReport] = useState<CoherenceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadCoherenceReport();
  }, [projectId]);

  const loadCoherenceReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get the latest report status
      const statusResponse = await fetchBackend(`/projects/${projectId}/review/coherence/status`);
      const statusData = await statusResponse.json();

      if (!statusData.success || !statusData.data.hasReport) {
        setError('No coherence report found for this project');
        return;
      }

      const reportId = statusData.data.report.id;

      // Get the detailed report
      const reportResponse = await fetchBackend(`/projects/${projectId}/review/coherence/${reportId}`);
      const reportData = await reportResponse.json();

      if (!reportData.success) {
        setError('Failed to load coherence report');
        return;
      }

      setReport(reportData.data);
    } catch (err) {
      console.error('Error loading coherence report:', err);
      setError('Failed to load coherence report');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const exportReport = () => {
    if (!report) return;

    const exportData = {
      project: report.project.name,
      team: report.project.teamName,
      track: report.project.track.name,
      hackathon: report.project.hackathon.name,
      reportDate: formatDateForDisplay(report.createdAt, 'MMM d, yyyy'),
      overallScore: report.score,
      trackAlignment: report.trackAlignment,
      readmeQuality: report.readmeQuality,
      summary: report.summary,
      projectPurpose: report.projectPurpose,
      trackJustification: report.trackJustification,
      inconsistencies: report.inconsistencies,
      suggestions: report.suggestions,
      processingTime: `${(report.processingTime / 1000).toFixed(1)}s`
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coherence-report-${report.project.name.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!report) return;

    try {
      setDeleting(true);
      setShowDeleteModal(false);

      const response = await fetchBackend(`/projects/${projectId}/review/coherence/${report.id}/delete`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete report');
      }

      // Navigate back to project page after successful deletion
      router.push(`/dashboard/projects/${projectId}`);

    } catch (error) {
      console.error('Error deleting report:', error);
      setShowDeleteModal(false);
      // You could show a toast here instead of alert if preferred
      alert(error instanceof Error ? error.message : 'Failed to delete report');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading coherence report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    // Determine if this is an error or just no report exists
    const isNoReportFound = error === 'No coherence report found for this project';

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="mb-6">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
          </div>
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              {isNoReportFound ? (
                <>
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-blue-500" />
                  </div>
                  <h2 className="text-xl font-semibold mb-4">No Report Yet</h2>
                  <p className="text-muted-foreground mb-6">
                    No coherence analysis has been run for this project yet.
                    Run a coherence review to analyze project consistency and track alignment.
                  </p>
                  <div className="space-y-3">
                    <Link href={`/dashboard/projects/${projectId}`}>
                      <Button className="w-full">
                        Return to Project
                      </Button>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      You can start a coherence review from the project page using the "Review" menu.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExternalLink className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-xl font-semibold mb-4">Report Error</h2>
                  <p className="text-muted-foreground mb-4">
                    {error || 'Failed to load the coherence report.'}
                  </p>
                  <div className="space-y-3">
                    <Button onClick={loadCoherenceReport} variant="outline" className="w-full">
                      Try Again
                    </Button>
                    <Link href={`/dashboard/projects/${projectId}`}>
                      <Button className="w-full">
                        Return to Project
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={exportReport}
              variant="outline"
              disabled={deleting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Link href={report.project.githubUrl} target="_blank">
              <Button variant="outline" disabled={deleting}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Repository
              </Button>
            </Link>
            <Button
              onClick={handleDeleteClick}
              variant="outline"
              disabled={deleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Report
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Coherence Review Report</h1>
          <p className="text-lg text-muted-foreground">
            Project: <span className="font-medium">{report.project.name}</span> by {report.project.teamName}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Generated {formatDateForDisplay(report.createdAt, 'MMM d, yyyy h:mm a')}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Processing time: {(report.processingTime / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="mb-8">
        <CoherenceScoreDisplay
          score={report.score}
          grade={getScoreGrade(report.score)}
          summary={report.summary}
          trackAlignment={report.trackAlignment}
          readmeQuality={report.readmeQuality}
          evidence={report.evidence}
        />
      </div>

      {/* Score Breakdown - Track Alignment and README Quality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Track Alignment</h3>
            <div className={`text-2xl font-bold ${getScoreColor(report.trackAlignment)}`}>
              {Math.round(report.trackAlignment)}/100
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">README Quality</h3>
            <div className={`text-2xl font-bold ${getScoreColor(report.readmeQuality)}`}>
              {Math.round(report.readmeQuality)}/100
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Sections */}
      <div className="space-y-8">
        {/* Track Alignment */}
        <TrackAlignmentDisplay
          alignment={report.trackAlignment}
          justification={report.trackJustification}
          trackName={report.project.track.name}
          projectPurpose={report.projectPurpose}
        />

        {/* README Analysis */}
        <ReadmeAnalysisDisplay
          readmeExists={report.readmeExists}
          readmeQuality={report.readmeQuality}
          evidence={report.evidence}
        />

        {/* Inconsistencies */}
        {report.inconsistencies && report.inconsistencies.length > 0 && (
          <InconsistencyList inconsistencies={report.inconsistencies} />
        )}

        {/* AI Recommendations */}
        {report.suggestions && report.suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-indigo-600" />
                AI Recommendations for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Priority-sorted recommendations */}
                {report.suggestions
                  .sort((a: any, b: any) => {
                    const priorityOrder = { 'high': 3, 'critical': 4, 'medium': 2, 'low': 1 };
                    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                  })
                  .map((suggestion: any, index: number) => (
                    <div
                      key={index}
                      className={`rounded-lg p-4 border-l-4 ${
                        suggestion.priority === 'critical' ? 'border-red-500 bg-red-50/50 dark:bg-red-950/10' :
                        suggestion.priority === 'high' ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/10' :
                        suggestion.priority === 'medium' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/10' :
                        'border-gray-500 bg-gray-50/50 dark:bg-gray-950/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={
                                suggestion.priority === 'critical' ? 'destructive' :
                                suggestion.priority === 'high' ? 'destructive' :
                                suggestion.priority === 'medium' ? 'default' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {suggestion.priority?.toUpperCase() || 'MEDIUM'}
                            </Badge>
                            {suggestion.category && (
                              <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                                {suggestion.category.replace('_', ' ')}
                              </span>
                            )}
                          </div>

                          <h4 className="font-medium text-sm mb-1">
                            {suggestion.action || suggestion.description || suggestion}
                          </h4>

                          {suggestion.rationale && (
                            <p className="text-sm text-muted-foreground mb-2">{suggestion.rationale}</p>
                          )}

                          {suggestion.impact && (
                            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                              Expected Impact: {suggestion.impact}
                            </p>
                          )}
                        </div>

                        <div className={`w-1 h-full rounded ${
                          suggestion.priority === 'critical' ? 'bg-red-500' :
                          suggestion.priority === 'high' ? 'bg-orange-500' :
                          suggestion.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                        }`} />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Coherence Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this coherence report for{' '}
              <span className="font-medium text-foreground">{report?.project.name}</span>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ This action cannot be undone
              </p>
              <p className="text-sm text-red-600 mt-1">
                The report data will be permanently deleted from the system.
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}