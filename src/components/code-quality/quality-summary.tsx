'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QualityBadge } from './quality-badge';
import { ScoreMeter } from './score-meter';
import {
  FileCode,
  AlertTriangle,
  Bug,
  Shield,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface QualityReport {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  overallScore: number | null;
  technicalScore: number | null;
  securityScore: number | null;
  documentationScore: number | null;
  performanceScore: number | null;
  richnessScore: number | null;
  analysisErrors?: string[];
  partialAnalysis?: boolean;
  codeSmellsCount: number;
  bugsCount: number;
  vulnerabilitiesCount: number;
  totalLinesAnalyzed: number;
  analysisTimeMs?: number;
  errorMessage?: string;
  createdAt: string;
}

interface QualitySummaryProps {
  report: QualityReport;
  showDetails?: boolean;
}

export function QualitySummary({ report, showDetails = true }: QualitySummaryProps) {
  if (report.status === 'PENDING') {
    return (
      <Card className="border-dashed border-2 border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-blue-700 font-medium">Analysis Queued</p>
            <p className="text-blue-600 text-sm">Your code quality analysis will start shortly</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (report.status === 'IN_PROGRESS') {
    return (
      <Card className="border-dashed border-2 border-yellow-200 bg-yellow-50/50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="animate-pulse rounded-full h-8 w-8 bg-yellow-600 mx-auto"></div>
            <p className="text-yellow-700 font-medium">Analysis in Progress</p>
            <p className="text-yellow-600 text-sm">Analyzing your repository with AI...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (report.status === 'FAILED') {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto" />
            <p className="text-red-700 font-medium">Analysis Failed</p>
            <p className="text-red-600 text-sm">{report.errorMessage || 'An error occurred during analysis'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Overall Quality Score
            </CardTitle>
            <QualityBadge score={report.overallScore} size="lg" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ScoreMeter
              score={report.overallScore}
              size="lg"
              showValue={false}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{report.overallScore}</div>
                <div className="text-muted-foreground">Overall</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{report.technicalScore}</div>
                <div className="text-muted-foreground">Technical</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">{report.securityScore}</div>
                <div className="text-muted-foreground">Security</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDetails && (
        <>
          {/* Detailed Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScoreMeter
                score={report.technicalScore}
                label="Technical Quality"
              />
              <ScoreMeter
                score={report.securityScore}
                label="Security"
              />
              <ScoreMeter
                score={report.documentationScore}
                label="Documentation"
              />
              <ScoreMeter
                score={report.performanceScore}
                label="Performance"
              />
              <ScoreMeter
                score={report.richnessScore}
                label="Code Richness"
              />
            </CardContent>
          </Card>

          {/* Issues Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Issues Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <FileCode className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-yellow-800">{report.codeSmellsCount}</div>
                    <div className="text-sm text-yellow-700">Code Smells</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <Bug className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-orange-800">{report.bugsCount}</div>
                    <div className="text-sm text-orange-700">Potential Bugs</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Shield className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-800">{report.vulnerabilitiesCount}</div>
                    <div className="text-sm text-red-700">Vulnerabilities</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Analysis Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Lines Analyzed</div>
                  <div className="font-semibold">{report.totalLinesAnalyzed?.toLocaleString() || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Analysis Time</div>
                  <div className="font-semibold">
                    {report.analysisTimeMs ? formatDuration(report.analysisTimeMs) : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Completed</div>
                  <div className="font-semibold">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}