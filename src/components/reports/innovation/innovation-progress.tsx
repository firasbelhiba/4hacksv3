'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, X, Clock, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InnovationProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
  details?: any;
  duration?: number;
}

interface InnovationProgressProps {
  steps: InnovationProgressStep[];
  currentStep?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  onComplete?: () => void;
  className?: string;
  projectName?: string;
}

export function InnovationProgress({
  steps,
  currentStep,
  onCancel,
  onRetry,
  onComplete,
  className,
  projectName
}: InnovationProgressProps) {
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getStepIcon = (step: InnovationProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStatusColor = (step: InnovationProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'in_progress':
        return 'border-amber-200 bg-amber-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const hasErrors = steps.some(step => step.status === 'error');
  const isCompleted = completedSteps === totalSteps && !hasErrors;
  const isInProgress = steps.some(step => step.status === 'in_progress');

  return (
    <Card className={cn('w-full h-full flex flex-col', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : hasErrors ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <Lightbulb className="w-5 h-5 text-amber-600 animate-pulse" />
            )}
            Innovation Analysis Progress
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {completedSteps}/{totalSteps} steps
            </Badge>
            <Badge variant="outline">
              {formatDuration(elapsedTime)}
            </Badge>
          </div>
        </div>
        {projectName && (
          <p className="text-sm text-muted-foreground">
            Analyzing {projectName} for innovation potential...
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round((completedSteps / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                hasErrors ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-amber-500'
              )}
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3 flex-1">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'p-4 rounded-lg border transition-colors',
                getStepStatusColor(step),
                currentStep === step.id && 'ring-2 ring-amber-400'
              )}
            >
              <div className="flex items-center gap-3">
                {getStepIcon(step)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{step.label}</h4>
                    <Badge
                      variant={
                        step.status === 'completed'
                          ? 'default'
                          : step.status === 'error'
                          ? 'destructive'
                          : step.status === 'in_progress'
                          ? 'default'
                          : 'secondary'
                      }
                      className={
                        step.status === 'in_progress' ? 'bg-amber-100 text-amber-800 border-amber-200' : ''
                      }
                    >
                      {step.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {step.message && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.message}
                    </p>
                  )}
                  {step.duration && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed in {formatDuration(step.duration)}
                    </p>
                  )}
                </div>
              </div>

              {/* Step Details */}
              {step.details && step.status === 'error' && (
                <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                  <h5 className="font-medium text-red-900 mb-2">Error Details</h5>
                  <div className="text-sm text-red-800">
                    {typeof step.details === 'string' ? (
                      <p>{step.details}</p>
                    ) : (
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(step.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {step.details && step.status === 'completed' && typeof step.details === 'object' && (
                <div className="mt-3 p-3 bg-green-100 rounded border border-green-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {Object.entries(step.details).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="font-semibold text-green-900">
                          {typeof value === 'number' ? value.toLocaleString() : String(value)}
                        </div>
                        <div className="text-green-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t mt-auto">
          {hasErrors && onRetry && (
            <Button onClick={onRetry} variant="outline">
              Retry Analysis
            </Button>
          )}
          {!isCompleted && onCancel && (
            <Button onClick={onCancel} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
          {isCompleted && onComplete && (
            <Button className="flex-1" onClick={onComplete}>
              <CheckCircle className="w-4 h-4 mr-2" />
              View Innovation Report
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook for managing innovation progress steps
 */
export function useInnovationProgress() {
  const initialSteps: Omit<InnovationProgressStep, 'status'>[] = [
    {
      id: 'analyze-code',
      label: 'Analyzing Codebase',
      message: 'Scanning repository structure and implementation patterns...'
    },
    {
      id: 'assess-novelty',
      label: 'Assessing Novelty',
      message: 'Evaluating uniqueness and originality of the approach...'
    },
    {
      id: 'search-similar',
      label: 'Searching Similar Projects',
      message: 'Finding and comparing with similar solutions...'
    },
    {
      id: 'evaluate-patent',
      label: 'Patent Potential Analysis',
      message: 'Assessing intellectual property and patentability...'
    },
    {
      id: 'impact-assessment',
      label: 'Impact Assessment',
      message: 'Evaluating potential market and social impact...'
    },
    {
      id: 'generate-report',
      label: 'Generating Report',
      message: 'Compiling comprehensive innovation analysis...'
    }
  ];

  const [steps, setSteps] = useState<InnovationProgressStep[]>(
    initialSteps.map(step => ({ ...step, status: 'pending' }))
  );
  const [currentStep, setCurrentStep] = useState<string | undefined>();

  const updateStep = (
    stepId: string,
    updates: Partial<InnovationProgressStep>,
    duration?: number
  ) => {
    setSteps(prev =>
      prev.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            ...updates,
            ...(duration && { duration }),
          };
        }
        return step;
      })
    );
  };

  const startStep = (stepId: string, message?: string) => {
    updateStep(stepId, { status: 'in_progress', message });
    setCurrentStep(stepId);
  };

  const completeStep = (stepId: string, message?: string, details?: any, duration?: number) => {
    updateStep(stepId, { status: 'completed', message, details }, duration);
    setCurrentStep(undefined);
  };

  const failStep = (stepId: string, message?: string, details?: any) => {
    updateStep(stepId, { status: 'error', message, details });
    setCurrentStep(undefined);
  };

  const resetSteps = () => {
    setSteps(prev =>
      prev.map(step => ({ ...step, status: 'pending', message: undefined, details: undefined }))
    );
    setCurrentStep(undefined);
  };

  return {
    steps,
    currentStep,
    startStep,
    completeStep,
    failStep,
    updateStep,
    resetSteps,
  };
}

export default InnovationProgress;