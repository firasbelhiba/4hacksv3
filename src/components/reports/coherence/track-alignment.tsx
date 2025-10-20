'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface TrackAlignmentDisplayProps {
  alignment: number;
  justification: string;
  trackName: string;
  projectPurpose: string;
}

export function TrackAlignmentDisplay({
  alignment,
  justification,
  trackName,
  projectPurpose
}: TrackAlignmentDisplayProps) {
  const getAlignmentLevel = (score: number) => {
    if (score >= 85) return { level: 'Excellent', color: 'text-green-600', icon: CheckCircle };
    if (score >= 70) return { level: 'Good', color: 'text-blue-600', icon: CheckCircle };
    if (score >= 55) return { level: 'Fair', color: 'text-yellow-600', icon: AlertCircle };
    if (score >= 40) return { level: 'Poor', color: 'text-orange-600', icon: AlertCircle };
    return { level: 'Very Poor', color: 'text-red-600', icon: XCircle };
  };

  const alignmentInfo = getAlignmentLevel(alignment);
  const AlignmentIcon = alignmentInfo.icon;

  const getProgressColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 55) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Target className="w-6 h-6 text-purple-600" />
          Track Alignment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alignment Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <AlignmentIcon className={`w-12 h-12 ${alignmentInfo.color}`} />
            </div>
            <div className={`text-3xl font-bold ${alignmentInfo.color} mb-2`}>
              {Math.round(alignment)}/100
            </div>
            <Badge
              variant="outline"
              className={`${
                alignment >= 85 ? 'bg-green-100 text-green-800 border-green-200' :
                alignment >= 70 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                alignment >= 55 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                alignment >= 40 ? 'bg-orange-100 text-orange-800 border-orange-200' :
                'bg-red-100 text-red-800 border-red-200'
              }`}
            >
              {alignmentInfo.level} Fit
            </Badge>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-semibold mb-3">Track Information</h4>
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Target Track:</p>
                <p className="font-medium text-lg">{trackName}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Alignment Progress:</p>
                <div className="flex items-center gap-3">
                  <Progress value={alignment} className="flex-1 h-3" />
                  <span className="text-sm font-medium">{Math.round(alignment)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Purpose */}
        <div>
          <h4 className="font-semibold mb-3">Project Purpose Analysis</h4>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm leading-relaxed">
              {projectPurpose}
            </p>
          </div>
        </div>

        {/* Alignment Justification */}
        <div>
          <h4 className="font-semibold mb-3">Track Alignment Assessment</h4>
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <p className="text-sm leading-relaxed">
              {justification}
            </p>
          </div>
        </div>

        {/* Alignment Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold mb-2">
              {alignment >= 85 ? '🎯' : alignment >= 70 ? '✅' : alignment >= 55 ? '⚠️' : '❌'}
            </div>
            <p className="text-sm font-medium">
              {alignment >= 85 ? 'Perfect Match' :
               alignment >= 70 ? 'Good Match' :
               alignment >= 55 ? 'Partial Match' :
               'Poor Match'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Overall Fit</p>
          </div>

          <div className="text-center p-4 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold mb-2">
              {alignment >= 75 ? '🏆' : alignment >= 60 ? '🥈' : alignment >= 45 ? '🥉' : '📝'}
            </div>
            <p className="text-sm font-medium">
              {alignment >= 75 ? 'Competitive' :
               alignment >= 60 ? 'Promising' :
               alignment >= 45 ? 'Developing' :
               'Needs Work'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Competition Readiness</p>
          </div>

          <div className="text-center p-4 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold mb-2">
              {alignment >= 80 ? '🚀' : alignment >= 65 ? '📈' : alignment >= 50 ? '🔄' : '🔧'}
            </div>
            <p className="text-sm font-medium">
              {alignment >= 80 ? 'Ready to Submit' :
               alignment >= 65 ? 'Minor Improvements' :
               alignment >= 50 ? 'Moderate Changes' :
               'Major Rework Needed'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Recommendation</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}