'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InnovationProgress, useInnovationProgress } from '@/components/reports/innovation/innovation-progress';

import { fetchBackend } from '@/lib/api/fetch-backend';
export default function InnovationProgressPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    steps,
    currentStep,
    startStep,
    completeStep,
    failStep,
    resetSteps
  } = useInnovationProgress();

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

  // Poll for innovation report status
  useEffect(() => {
    if (!isPolling) return;

    let pollCount = 0;
    const maxPolls = 180; // 3 minutes of polling (1 second intervals)

    const pollStatus = async () => {
      try {
        // First, check if there are any innovation reports for this project
        const reportsResponse = await fetchBackend(`/projects/${projectId}/review/innovation`);
        if (!reportsResponse.ok) return;

        const reportsData = await reportsResponse.json();

        // Filter out archived reports to only consider active reports
        const activeReports = reportsData.success
          ? reportsData.data.filter((report: any) => !report.isArchived)
          : [];

        if (!reportsData.success || activeReports.length === 0) {
          // No active reports found, start a new innovation review
          console.log('🔄 No active innovation reports found, starting new analysis...');
          const startResponse = await fetchBackend(`/projects/${projectId}/review/innovation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ options: {} })
          });

          if (startResponse.ok) {
            const startData = await startResponse.json();
            if (startData.success) {
              console.log('✅ New innovation analysis started successfully');
              setReportId(startData.data.projectId);
              startStep('analyze-code', 'Starting codebase analysis...');
            }
          } else {
            console.error('❌ Failed to start new innovation analysis');
          }
          return;
        }

        const latestReport = activeReports[0];
        console.log('📊 Found active innovation report:', latestReport.id, 'Status:', latestReport.status);
        setReportId(latestReport.id);

        // Update progress based on report status
        if (latestReport.status === 'PENDING' && currentStep !== 'analyze-code') {
          startStep('analyze-code', 'Analyzing repository structure...');
        } else if (latestReport.status === 'IN_PROGRESS') {
          // Simulate progress through steps based on time
          const progressSteps = [
            { step: 'assess-novelty', message: 'Evaluating novelty and uniqueness...' },
            { step: 'search-similar', message: 'Searching for similar projects...' },
            { step: 'evaluate-patent', message: 'Assessing patent potential...' },
            { step: 'impact-assessment', message: 'Evaluating market impact...' },
            { step: 'generate-report', message: 'Compiling final report...' }
          ];

          const stepIndex = Math.min(Math.floor(pollCount / 30), progressSteps.length - 1);
          const currentProgressStep = progressSteps[stepIndex];

          if (currentStep !== currentProgressStep.step) {
            // Complete previous steps
            for (let i = 0; i < stepIndex; i++) {
              completeStep(progressSteps[i].step, 'Completed successfully');
            }
            // Start current step
            startStep(currentProgressStep.step, currentProgressStep.message);
          }
        } else if (latestReport.status === 'COMPLETED') {
          // Complete all steps
          completeStep('analyze-code', 'Codebase analysis complete', { files: '15 analyzed' });
          completeStep('assess-novelty', 'Novelty assessment complete', { score: latestReport.noveltyScore });
          completeStep('search-similar', 'Similar projects identified', { found: '3 projects' });
          completeStep('evaluate-patent', 'Patent analysis complete', { potential: latestReport.patentPotential ? 'High' : 'Low' });
          completeStep('impact-assessment', 'Impact assessment complete', { score: Math.round((latestReport.marketInnovation + latestReport.technicalInnovation) / 2) });
          completeStep('generate-report', 'Innovation report generated', { score: `${latestReport.score}/100` });

          setIsPolling(false);
        } else if (latestReport.status === 'FAILED') {
          failStep('generate-report', 'Innovation analysis failed', 'Please try again');
          setIsPolling(false);
        }

        pollCount++;
        if (pollCount >= maxPolls) {
          setError('Analysis is taking longer than expected. Please refresh the page to check status.');
          setIsPolling(false);
        }

      } catch (error) {
        console.error('Error polling innovation status:', error);
        setError('Failed to check analysis status');
        setIsPolling(false);
      }
    };

    // Initial poll
    pollStatus();

    // Set up interval
    const interval = setInterval(pollStatus, 1000);

    return () => clearInterval(interval);
  }, [projectId, isPolling, currentStep, startStep, completeStep, failStep]);

  const handleCancel = () => {
    setIsPolling(false);
    router.push(`/dashboard/projects/${projectId}`);
  };

  const handleRetry = () => {
    setError(null);
    resetSteps();
    setIsPolling(true);
  };

  const handleComplete = () => {
    router.push(`/dashboard/projects/${projectId}/innovation-report`);
  };

  const handleGoBack = () => {
    router.push(`/dashboard/projects/${projectId}`);
  };

  // Check if analysis is complete
  const isComplete = steps.every(step => step.status === 'completed');
  const hasErrors = steps.some(step => step.status === 'error');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" onClick={handleGoBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-amber-500" />
              Innovation Analysis
            </h1>
            <p className="text-muted-foreground">
              {project?.name || 'Project'} • {project?.teamName || 'Team'}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-900 mb-2">Analysis Error</h3>
            <p className="text-red-800 text-sm">{error}</p>
            <Button onClick={handleRetry} className="mt-3" size="sm">
              Retry Analysis
            </Button>
          </div>
        )}

        {/* Progress Component */}
        <InnovationProgress
          steps={steps}
          currentStep={currentStep}
          onCancel={handleCancel}
          onRetry={hasErrors ? handleRetry : undefined}
          onComplete={isComplete ? handleComplete : undefined}
          projectName={project?.name}
        />

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="font-medium text-amber-900 mb-2">What's Being Analyzed?</h3>
          <ul className="text-amber-800 text-sm space-y-1">
            <li>• Code architecture and implementation patterns</li>
            <li>• Novelty and creativity of the solution approach</li>
            <li>• Technical innovation and implementation quality</li>
            <li>• Market potential and competitive landscape</li>
            <li>• Patent potential and intellectual property assessment</li>
            <li>• Overall innovation impact and recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}