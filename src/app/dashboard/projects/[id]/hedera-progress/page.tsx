'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Link2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HederaProgress, useHederaProgress } from '@/components/reports/hedera/hedera-progress';

import { fetchBackend } from '@/lib/api/fetch-backend';
export default function HederaProgressPage() {
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
  } = useHederaProgress();

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

  // Poll for Hedera analysis status
  useEffect(() => {
    if (!isPolling) return;

    const pollStatus = async () => {
      try {
        const response = await fetchBackend(`/projects/${projectId}/review/hedera`);
        if (response.ok) {
          const data = await response.json();
          const reports = data.data;

          if (reports && reports.length > 0) {
            const latestReport = reports[0];
            setReportId(latestReport.id);

            // Update progress based on report status
            switch (latestReport.status) {
              case 'PENDING':
                if (currentStep !== 'initialization') {
                  startStep('initialization');
                }
                break;
              case 'IN_PROGRESS':
                // Simulate progress through different steps
                if (!currentStep) {
                  startStep('initialization');
                  setTimeout(() => {
                    completeStep('initialization');
                    startStep('code_scanning');
                  }, 1000);
                  setTimeout(() => {
                    completeStep('code_scanning');
                    startStep('pattern_matching');
                  }, 3000);
                  setTimeout(() => {
                    completeStep('pattern_matching');
                    startStep('ai_analysis');
                  }, 5000);
                  setTimeout(() => {
                    completeStep('ai_analysis');
                    startStep('technology_classification');
                  }, 15000);
                  setTimeout(() => {
                    completeStep('technology_classification');
                    startStep('report_generation');
                  }, 18000);
                }
                break;
              case 'COMPLETED':
                // Complete all steps
                if (steps.some(s => s.status !== 'completed')) {
                  steps.forEach((step, index) => {
                    if (step.status !== 'completed') {
                      setTimeout(() => {
                        completeStep(step.id);
                      }, index * 100);
                    }
                  });
                }
                setIsPolling(false);
                break;
              case 'FAILED':
                failStep(currentStep || 'initialization', 'Analysis failed. Please try again.');
                setIsPolling(false);
                break;
            }
          }
        }
      } catch (error) {
        console.error('Error polling Hedera status:', error);
        failStep(currentStep || 'initialization', 'Network error occurred.');
        setError('Failed to get analysis status');
        setIsPolling(false);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    pollStatus(); // Initial call

    return () => clearInterval(interval);
  }, [projectId, isPolling, currentStep, steps, startStep, completeStep, failStep]);

  const handleCancel = () => {
    setIsPolling(false);
    router.push(`/dashboard/projects/${projectId}`);
  };

  const handleRetry = async () => {
    try {
      resetSteps();
      setError(null);
      setIsPolling(true);

      // Start a new Hedera analysis
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

      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }
    } catch (error) {
      console.error('Error retrying analysis:', error);
      setError('Failed to start new analysis');
    }
  };

  const handleComplete = () => {
    if (reportId) {
      router.push(`/dashboard/projects/${projectId}/hedera-report`);
    } else {
      router.push(`/dashboard/projects/${projectId}`);
    }
  };

  const isComplete = steps.every(step => step.status === 'completed');
  const hasError = steps.some(step => step.status === 'error') || error;

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

          <div className="text-sm text-muted-foreground">
            Project: {project?.name || 'Loading...'}
          </div>
        </div>

        {/* Progress Component */}
        <HederaProgress
          steps={steps}
          currentStep={currentStep}
          onCancel={handleCancel}
          onRetry={hasError ? handleRetry : undefined}
          onComplete={isComplete ? handleComplete : undefined}
          projectName={project?.name}
        />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Analysis Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Information Panel */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Link2 className="w-5 h-5 mr-2 text-cyan-600" />
            About Hedera Technology Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground mb-2">What we analyze:</h3>
              <ul className="space-y-1">
                <li>• Hedera SDK imports and usage</li>
                <li>• HashConnect wallet integration</li>
                <li>• Mirror Node API interactions</li>
                <li>• Smart contract deployments</li>
                <li>• HTS token operations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">Detection includes:</h3>
              <ul className="space-y-1">
                <li>• Pattern matching in code files</li>
                <li>• AI-powered code analysis</li>
                <li>• Configuration file scanning</li>
                <li>• Dependency analysis</li>
                <li>• Network usage classification</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}