'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, X, Clock, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HederaProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
  details?: any;
  duration?: number;
}

interface HederaProgressProps {
  steps: HederaProgressStep[];
  currentStep?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  onComplete?: () => void;
  className?: string;
  projectName?: string;
}

export function HederaProgress({
  steps,
  currentStep,
  onCancel,
  onRetry,
  onComplete,
  className,
  projectName
}: HederaProgressProps) {
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

  const getStepIcon = (step: HederaProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStatus = (step: HederaProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'destructive';
      case 'in_progress':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const isComplete = steps.every(step => step.status === 'completed');
  const hasError = steps.some(step => step.status === 'error');
  const currentStepData = steps.find(step => step.id === currentStep);

  return (
    <Card className={cn("w-full max-w-4xl mx-auto h-full flex flex-col", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Link2 className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Hedera Technology Analysis</CardTitle>
              {projectName && (
                <p className="text-sm text-muted-foreground mt-1">
                  Analyzing blockchain technology usage in "{projectName}"
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm">
              {formatDuration(elapsedTime)}
            </Badge>
            {onCancel && !isComplete && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 flex-1 flex flex-col">
        {/* Progress Summary */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {steps.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {steps.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Steps</div>
            </div>
          </div>

          <div className="text-right">
            {isComplete ? (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Analysis Complete
              </Badge>
            ) : hasError ? (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                Analysis Failed
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Analyzing...
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4 flex-1">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-start space-x-4 p-4 rounded-lg transition-colors",
                step.status === 'in_progress' && "bg-blue-50 border border-blue-200",
                step.status === 'completed' && "bg-green-50 border border-green-200",
                step.status === 'error' && "bg-red-50 border border-red-200",
                step.status === 'pending' && "bg-gray-50 border border-gray-200"
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">{step.label}</h4>
                  <Badge variant={getStepStatus(step) as any} className="text-xs">
                    {step.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                {step.message && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {step.message}
                  </p>
                )}

                {step.duration && step.status === 'completed' && (
                  <div className="text-xs text-muted-foreground">
                    Completed in {formatDuration(step.duration)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t mt-auto">
          {hasError && onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Retry Analysis
            </Button>
          )}

          {isComplete && onComplete && (
            <Button onClick={onComplete} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
              View Analysis Results
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for managing Hedera progress state
export function useHederaProgress() {
  const [steps, setSteps] = useState<HederaProgressStep[]>([
    {
      id: 'initialization',
      label: 'Initializing Analysis',
      status: 'pending',
      message: 'Setting up the analysis environment and preparing to scan the project'
    },
    {
      id: 'code_scanning',
      label: 'Scanning Project Files',
      status: 'pending',
      message: 'Examining project structure and identifying relevant code files'
    },
    {
      id: 'pattern_matching',
      label: 'Pattern Detection',
      status: 'pending',
      message: 'Looking for Hedera SDK imports, HashConnect usage, and blockchain patterns'
    },
    {
      id: 'ai_analysis',
      label: 'AI-Powered Analysis',
      status: 'pending',
      message: 'Using AI to analyze code for blockchain technology usage and integration'
    },
    {
      id: 'technology_classification',
      label: 'Technology Classification',
      status: 'pending',
      message: 'Categorizing the detected blockchain technologies and assessing confidence'
    },
    {
      id: 'report_generation',
      label: 'Generating Report',
      status: 'pending',
      message: 'Compiling analysis results into a comprehensive report'
    }
  ]);

  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const startStep = (stepId: string, message?: string) => {
    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          status: 'in_progress',
          message: message || step.message,
          duration: Date.now()
        };
      }
      return step;
    }));
    setCurrentStep(stepId);
  };

  const completeStep = (stepId: string, message?: string, details?: any) => {
    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        const duration = step.duration ? Date.now() - step.duration : undefined;
        return {
          ...step,
          status: 'completed',
          message: message || step.message,
          details,
          duration
        };
      }
      return step;
    }));
    setCurrentStep(null);
  };

  const failStep = (stepId: string, message: string) => {
    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          status: 'error',
          message
        };
      }
      return step;
    }));
    setCurrentStep(null);
  };

  const resetSteps = () => {
    setSteps(prev => prev.map(step => ({
      ...step,
      status: 'pending',
      duration: undefined,
      details: undefined
    })));
    setCurrentStep(null);
  };

  return {
    steps,
    currentStep,
    startStep,
    completeStep,
    failStep,
    resetSteps
  };
}