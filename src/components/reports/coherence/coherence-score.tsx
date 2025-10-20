'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface CoherenceScoreDisplayProps {
  score: number;
  grade: string;
  summary: string;
  trackAlignment?: number;
  readmeQuality?: number;
  evidence?: any;
}

export function CoherenceScoreDisplay({
  score,
  grade,
  summary,
  trackAlignment = 0,
  readmeQuality = 0,
  evidence
}: CoherenceScoreDisplayProps) {
  const [showAIDetails, setShowAIDetails] = useState(false);
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-8 h-8 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
    return <XCircle className="w-8 h-8 text-red-600" />;
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'Exceptional coherence - project is well-aligned and professionally documented';
    if (score >= 80) return 'Good coherence with minor areas for improvement';
    if (score >= 70) return 'Adequate coherence but needs attention in several areas';
    if (score >= 60) return 'Below average coherence with significant improvement needed';
    return 'Poor coherence requiring substantial work across multiple areas';
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Target className="w-6 h-6 text-indigo-600" />
          Overall Coherence Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score Circle */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-32 h-32 mx-auto mb-4">
              <div className="absolute inset-0">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                    className={getScoreColor(score)}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                  {Math.round(score)}
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
            </div>

            <div className="space-y-2">
              <Badge variant="outline" className={`text-lg px-3 py-1 ${getScoreBadgeColor(score)}`}>
                Grade: {grade}
              </Badge>
              <div className="flex justify-center">
                {getScoreIcon(score)}
              </div>
            </div>
          </div>

          {/* Progress Breakdown - Track Alignment and README Quality Only */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Score Breakdown</h4>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Track Alignment</span>
                  <span className="font-medium">{Math.round(trackAlignment)}/100</span>
                </div>
                <Progress value={trackAlignment} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>README Quality</span>
                  <span className="font-medium">{Math.round(readmeQuality)}/100</span>
                </div>
                <Progress value={readmeQuality} className="h-2" />
                {evidence?.readmeAnalysis && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{evidence.readmeAnalysis.verdict || 'AI assessment not available'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Assessment Summary</h4>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {getScoreDescription(score)}
              </p>

              <div className="bg-muted/50 rounded-lg p-4">
                <h5 className="font-medium mb-2">Key Findings:</h5>
                <p className="text-sm leading-relaxed">
                  {summary}
                </p>
              </div>

              {/* Expandable AI Assessment Details */}
              {evidence && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAIDetails(!showAIDetails)}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {showAIDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showAIDetails ? 'Hide AI Assessment Details' : 'Show AI Assessment Details'}
                  </button>

                  {showAIDetails && (
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                      <h6 className="font-medium text-indigo-900 dark:text-indigo-100 mb-3">AI Detailed Assessment</h6>

                      {/* README Analysis Details */}
                      {evidence.readmeAnalysis && (
                        <div className="space-y-3">
                          {evidence.readmeAnalysis.weaknesses && evidence.readmeAnalysis.weaknesses.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Main Issues Identified:</p>
                              <ul className="space-y-1">
                                {evidence.readmeAnalysis.weaknesses.slice(0, 3).map((weakness: string, index: number) => (
                                  <li key={index} className="text-sm text-red-800 dark:text-red-200 flex items-start gap-2">
                                    <XCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                                    <span>{weakness}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {evidence.readmeAnalysis.missingCritical && evidence.readmeAnalysis.missingCritical.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">Critical Missing Elements:</p>
                              <ul className="space-y-1">
                                {evidence.readmeAnalysis.missingCritical.slice(0, 3).map((missing: string, index: number) => (
                                  <li key={index} className="text-sm text-orange-800 dark:text-orange-200 flex items-start gap-2">
                                    <AlertTriangle className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                                    <span>{missing}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {evidence.readmeAnalysis.strengths && evidence.readmeAnalysis.strengths.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Positive Aspects:</p>
                              <ul className="space-y-1">
                                {evidence.readmeAnalysis.strengths.slice(0, 2).map((strength: string, index: number) => (
                                  <li key={index} className="text-sm text-green-800 dark:text-green-200 flex items-start gap-2">
                                    <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}