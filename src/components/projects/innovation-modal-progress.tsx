'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InnovationProgress, useInnovationProgress, InnovationProgressStep } from '@/components/reports/innovation/innovation-progress';

import { fetchBackend } from '@/lib/api/fetch-backend';
interface InnovationModalProgressProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function InnovationModalProgress({
  projectId,
  projectName,
  isOpen,
  onClose,
  onComplete
}: InnovationModalProgressProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSessionId, setAnalysisSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    steps,
    currentStep,
    startStep,
    completeStep,
    failStep,
    resetSteps
  } = useInnovationProgress();

  // Start analysis when modal opens
  useEffect(() => {
    if (isOpen && !isAnalyzing && !analysisSessionId) {
      const timer = setTimeout(() => {
        startAnalysis();
      }, 100); // Small delay to prevent rapid fire requests

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const startAnalysis = async () => {
    // Prevent duplicate calls
    if (isAnalyzing) {
      console.log('Analysis already in progress, skipping duplicate request');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    resetSteps();

    try {
      startStep('analyze-code', 'Setting up innovation analysis environment...');

      // Start the Innovation analysis via API
      const response = await fetchBackend(`/projects/${projectId}/review/innovation`, {
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

      if (!response.ok || !data.success) {
        // Handle 409 conflict (analysis already running) differently
        if (response.status === 409) {
          setError('Analysis is already running for this project. Please wait...');
          setIsAnalyzing(false);
          return;
        }
        throw new Error(data.error || 'Failed to start Innovation analysis');
      }

      completeStep('analyze-code', 'Analysis environment ready');

      // Start real progress polling
      setAnalysisSessionId(data.data?.reportId || 'analysis-started');
      await pollAnalysisProgress();

    } catch (error) {
      console.error('Error starting Innovation analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      failStep('analyze-code', `Failed to start analysis: ${errorMessage}`);
      setIsAnalyzing(false);
    }
  };

  const mapStageToStep = (stage: string): string => {
    const stageMapping: Record<string, string> = {
      'starting': 'analyze-code',
      'file_fetch': 'analyze-code',
      'file_analysis': 'analyze-code',
      'novelty_assessment': 'assess-novelty',
      'similar_search': 'search-similar',
      'patent_analysis': 'evaluate-patent',
      'impact_analysis': 'impact-assessment',
      'ai_analysis': 'impact-assessment',
      'report_generation': 'generate-report',
      'completed': 'generate-report'
    };
    return stageMapping[stage] || 'analyze-code';
  };

  const pollAnalysisProgress = async () => {
    const maxPollTime = 5 * 60 * 1000; // 5 minutes max
    const pollInterval = 2000; // Poll every 2 seconds
    const startTime = Date.now();
    let lastProgress = -1;
    let lastStage = '';

    while (Date.now() - startTime < maxPollTime) {
      try {
        const response = await fetchBackend(`/projects/${projectId}/review/innovation?progress=true`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          console.error('Failed to poll progress:', data.error);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

        const { progress, currentStage, isComplete, hasError, errorMessage } = data.data;

        // Update progress if it changed
        if (progress !== lastProgress || currentStage !== lastStage) {
          const stepId = mapStageToStep(currentStage);
          const step = steps.find(s => s.id === stepId);

          if (step && progress > lastProgress) {
            if (lastProgress >= 0) {
              // Complete previous step if moving to new one
              const lastStepId = mapStageToStep(lastStage);
              if (lastStepId !== stepId && lastStepId) {
                completeStep(lastStepId, `Stage completed`);
              }
            }

            startStep(stepId, `${currentStage} (${progress}%)`);
          }

          lastProgress = progress;
          lastStage = currentStage;
        }

        if (hasError) {
          const stepId = mapStageToStep(currentStage);
          failStep(stepId, errorMessage || 'Analysis failed');
          setError(errorMessage || 'Analysis failed');
          setIsAnalyzing(false);
          return;
        }

        if (isComplete) {
          // Complete all remaining steps
          steps.forEach(step => {
            if (step.status === 'pending' || step.status === 'in-progress') {
              completeStep(step.id, `${step.label} completed successfully`);
            }
          });

          setIsAnalyzing(false);
          onComplete?.();
          return;
        }

      } catch (error) {
        console.error('Error polling progress:', error);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Timeout - analysis taking too long
    setError('Analysis timed out after 5 minutes');
    failStep('generate-report', 'Analysis timed out');
    setIsAnalyzing(false);
  };

  const handleClose = () => {
    if (isAnalyzing) {
      const confirmClose = window.confirm('Analysis is in progress. Are you sure you want to close?');
      if (!confirmClose) return;
    }

    setIsAnalyzing(false);
    setAnalysisSessionId(null);
    setError(null);
    resetSteps();
    onClose();
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    setAnalysisSessionId(null);
    startAnalysis();
  };

  const isComplete = steps.every(step => step.status === 'completed');
  const hasError = steps.some(step => step.status === 'error') || !!error;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" style={{ margin: 0, padding: '1rem' }}>
      <div className="bg-background rounded-lg shadow-2xl overflow-hidden" style={{ width: '90vw', maxWidth: '800px', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Innovation Analysis</h2>
            <p className="text-sm text-muted-foreground">
              Analyzing "{projectName}" for innovation potential and uniqueness
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Content */}
        <div className="p-4" style={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Analysis Failed</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <InnovationProgress
            steps={steps}
            currentStep={currentStep || undefined}
            onCancel={undefined} // Handled by modal close
            onRetry={hasError ? handleRetry : undefined}
            onComplete={isComplete ? handleComplete : undefined}
            projectName={projectName}
            className="border-0 shadow-none p-0"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground">
            {isAnalyzing && 'Analysis in progress...'}
            {isComplete && 'Analysis completed successfully'}
            {hasError && 'Analysis encountered errors'}
          </div>

          <div className="flex gap-2">
            {!isAnalyzing && (
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            )}

            {isComplete && (
              <Button
                onClick={() => {
                  handleClose();
                  window.location.href = `/dashboard/projects/${projectId}/innovation-report`;
                }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Report
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}