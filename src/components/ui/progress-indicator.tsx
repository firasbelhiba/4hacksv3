'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, GitBranch, FileCode, Brain, BarChart3, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface AnalysisStage {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedDuration?: number; // in seconds
  startedAt?: Date;
  completedAt?: Date;
}

interface ProgressIndicatorProps {
  stages: AnalysisStage[];
  currentStage?: string;
  progress: number; // 0-100
  totalFiles?: number;
  processedFiles?: number;
  estimatedTimeRemaining?: number;
  onCancel?: () => void;
}

export function ProgressIndicator({
  stages,
  currentStage,
  progress,
  totalFiles,
  processedFiles,
  estimatedTimeRemaining,
  onCancel
}: ProgressIndicatorProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStageProgress = (stage: AnalysisStage) => {
    if (stage.status === 'completed') return 100;
    if (stage.status === 'in_progress' && stage.id === currentStage) {
      return Math.min(progress, 100);
    }
    return 0;
  };

  const getStatusColor = (status: AnalysisStage['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Code Quality Analysis
          </CardTitle>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            {progress.toFixed(0)}% Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* File Progress */}
        {totalFiles && (
          <div className="flex items-center justify-between text-sm bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-600" />
              <span>Files Processed</span>
            </div>
            <span className="font-mono">
              {processedFiles || 0} / {totalFiles}
            </span>
          </div>
        )}

        {/* Time Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span>Elapsed: {formatTime(elapsedTime)}</span>
          </div>
          {estimatedTimeRemaining && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Est. Remaining: {formatTime(estimatedTimeRemaining)}</span>
            </div>
          )}
        </div>

        {/* Analysis Stages */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Analysis Stages</h4>
          <div className="space-y-2">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = stage.id === currentStage;
              const stageProgress = getStageProgress(stage);

              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isActive ? 'bg-blue-50 border-blue-200' : 'bg-background border-border'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full">
                    {stage.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : stage.status === 'in_progress' ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    ) : stage.status === 'failed' ? (
                      <Icon className="w-5 h-5 text-red-600" />
                    ) : (
                      <Icon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm">{stage.name}</h5>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(stage.status)}`}
                      >
                        {stage.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stage.description}
                    </p>

                    {/* Stage Progress Bar */}
                    {stage.status === 'in_progress' && (
                      <div className="mt-2">
                        <Progress value={stageProgress} className="h-1" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <div className="pt-4 border-t">
            <button
              onClick={onCancel}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Cancel Analysis
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Default analysis stages
export const defaultAnalysisStages: AnalysisStage[] = [
  {
    id: 'repository_fetch',
    name: 'Repository Access',
    description: 'Connecting to GitHub and fetching repository information',
    icon: GitBranch,
    status: 'pending',
    estimatedDuration: 10
  },
  {
    id: 'file_discovery',
    name: 'File Discovery',
    description: 'Scanning repository structure and identifying code files',
    icon: FileCode,
    status: 'pending',
    estimatedDuration: 15
  },
  {
    id: 'code_analysis',
    name: 'AI Code Analysis',
    description: 'Running AI analysis on each file for quality assessment',
    icon: Brain,
    status: 'pending',
    estimatedDuration: 120
  },
  {
    id: 'report_generation',
    name: 'Report Generation',
    description: 'Compiling analysis results and generating quality report',
    icon: BarChart3,
    status: 'pending',
    estimatedDuration: 20
  }
];