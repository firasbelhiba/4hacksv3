'use client';

import { Shield, CheckCircle, XCircle, AlertTriangle, FileText, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PatentData {
  patentPotential: boolean;
  patentabilityScore: number;
  noveltyAssessment: {
    score: number;
    reasoning: string;
  };
  nonObviousnessAssessment: {
    score: number;
    reasoning: string;
  };
  industrialApplicability: {
    score: number;
    reasoning: string;
  };
  patentableElements: string[];
  priorArtConcerns: string[];
  recommendations: string[];
  confidence: number;
}

interface PatentIndicatorProps {
  data: PatentData;
  className?: string;
}

export function PatentIndicator({ data, className }: PatentIndicatorProps) {
  // Don't show detailed grading for legacy data with 0% confidence
  const isLegacyData = data.confidence === 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getPatentStatusIcon = () => {
    if (data.patentPotential && data.patentabilityScore >= 70) {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    } else if (data.patentabilityScore >= 50) {
      return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
    } else {
      return <XCircle className="w-6 h-6 text-red-600" />;
    }
  };

  const getPatentStatusText = () => {
    if (data.patentPotential && data.patentabilityScore >= 70) {
      return 'High Patent Potential';
    } else if (data.patentabilityScore >= 50) {
      return 'Moderate Patent Potential';
    } else {
      return 'Low Patent Potential';
    }
  };

  const getPatentStatusColor = () => {
    if (data.patentPotential && data.patentabilityScore >= 70) {
      return 'text-green-700 bg-green-50 border-green-200';
    } else if (data.patentabilityScore >= 50) {
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    } else {
      return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>Patent Potential</span>
          </div>
          {!isLegacyData && (
            <div className="flex items-center gap-2">
              {getPatentStatusIcon()}
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(data.patentabilityScore)}`}>
                  {data.patentabilityScore}/100
                </div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall Status */}
        <div className={`p-4 rounded-lg border mb-6 ${isLegacyData ? 'border-gray-200 bg-gray-50 text-gray-700' : getPatentStatusColor()}`}>
          <div className="flex items-center gap-3">
            {isLegacyData ? (
              <AlertTriangle className="w-5 h-5 text-gray-600" />
            ) : (
              getPatentStatusIcon()
            )}
            <div>
              <h4 className="font-medium">
                {isLegacyData ? 'Patent Assessment (Legacy Data)' : getPatentStatusText()}
              </h4>
              <p className="text-sm opacity-90">
                Confidence: {data.confidence}%
              </p>
            </div>
          </div>
        </div>

        {/* Patent Criteria Assessment - Show content but hide scores for legacy data */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Patent Criteria Assessment
            {isLegacyData && <Badge variant="outline" className="bg-gray-100 text-gray-600">Legacy Data</Badge>}
          </h4>

          {/* Novelty */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Novelty</span>
              {!isLegacyData && (
                <span className={`text-sm font-bold ${getScoreColor(data.noveltyAssessment.score)}`}>
                  {data.noveltyAssessment.score}/100
                </span>
              )}
            </div>
            {!isLegacyData && <Progress value={data.noveltyAssessment.score} className="h-2" />}
            <p className="text-xs text-muted-foreground">
              {data.noveltyAssessment.reasoning}
            </p>
          </div>

          {/* Non-obviousness */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Non-obviousness</span>
              {!isLegacyData && (
                <span className={`text-sm font-bold ${getScoreColor(data.nonObviousnessAssessment.score)}`}>
                  {data.nonObviousnessAssessment.score}/100
                </span>
              )}
            </div>
            {!isLegacyData && <Progress value={data.nonObviousnessAssessment.score} className="h-2" />}
            <p className="text-xs text-muted-foreground">
              {data.nonObviousnessAssessment.reasoning}
            </p>
          </div>

          {/* Industrial Applicability */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Industrial Applicability</span>
              {!isLegacyData && (
                <span className={`text-sm font-bold ${getScoreColor(data.industrialApplicability.score)}`}>
                  {data.industrialApplicability.score}/100
                </span>
              )}
            </div>
            {!isLegacyData && <Progress value={data.industrialApplicability.score} className="h-2" />}
            <p className="text-xs text-muted-foreground">
              {data.industrialApplicability.reasoning}
            </p>
          </div>
        </div>

        {/* Patentable Elements */}
        {data.patentableElements.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-600" />
              Patentable Elements
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {data.patentableElements.length} identified
              </Badge>
              {isLegacyData && <Badge variant="outline" className="bg-gray-100 text-gray-600">Legacy</Badge>}
            </h4>
            <div className="space-y-2">
              {data.patentableElements.map((element, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                  <p className="text-sm text-green-800">{element}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prior Art Concerns */}
        {data.priorArtConcerns.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Prior Art Concerns
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                {data.priorArtConcerns.length} identified
              </Badge>
              {isLegacyData && <Badge variant="outline" className="bg-gray-100 text-gray-600">Legacy</Badge>}
            </h4>
            <div className="space-y-2">
              {data.priorArtConcerns.map((concern, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                  </div>
                  <p className="text-sm text-orange-800">{concern}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Recommendations
              {isLegacyData && <Badge variant="outline" className="bg-gray-100 text-gray-600">Legacy</Badge>}
            </h4>
            <div className="space-y-2">
              {data.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-sm text-blue-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patent Process Guidance - Only show for non-legacy data */}
        {!isLegacyData && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Next Steps for Patent Protection</h4>
            <div className="text-sm text-blue-700 space-y-1">
              {data.patentPotential ? (
                <>
                  <p>✓ Consider conducting a professional prior art search</p>
                  <p>✓ Document all innovative aspects thoroughly</p>
                  <p>✓ Consult with a patent attorney for formal application</p>
                  <p>✓ File provisional patent application to establish priority date</p>
                </>
              ) : (
                <>
                  <p>• Focus on developing more novel and non-obvious features</p>
                  <p>• Research existing solutions to identify differentiation opportunities</p>
                  <p>• Document innovative aspects for future patent consideration</p>
                  <p>• Consider trade secret protection for certain elements</p>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}