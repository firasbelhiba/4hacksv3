'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link2, Shield } from 'lucide-react';

interface HederaScoreDisplayProps {
  technologyCategory: 'HEDERA' | 'OTHER_BLOCKCHAIN' | 'NO_BLOCKCHAIN';
  hederaUsageScore?: number;
  hederaPresenceDetected?: boolean;
  complexityLevel?: 'SIMPLE' | 'MODERATE' | 'ADVANCED';
  confidence?: number;
  summary?: string;
}

export function HederaScoreDisplay({
  technologyCategory,
  hederaUsageScore,
  hederaPresenceDetected,
  complexityLevel,
  confidence,
  summary
}: HederaScoreDisplayProps) {
  // Add null safety for all props
  const safeTechnologyCategory = technologyCategory || 'NO_BLOCKCHAIN';
  const safeHederaUsageScore = hederaUsageScore;
  const safeHederaPresenceDetected = hederaPresenceDetected || false;
  const safeComplexityLevel = complexityLevel;
  const safeConfidence = confidence;
  const safeSummary = summary;

  // Overall score is simply the Hedera usage score
  const calculateOverallScore = (): number => {
    if (safeTechnologyCategory === 'NO_BLOCKCHAIN') {
      return 0; // No Hedera integration
    }

    if (safeTechnologyCategory === 'OTHER_BLOCKCHAIN') {
      return 15; // Uses blockchain but not Hedera
    }

    // For HEDERA projects, overall score = usage score
    if (safeHederaUsageScore !== undefined && safeHederaUsageScore >= 0) {
      return Math.round(safeHederaUsageScore);
    }

    // No valid usage score from AI
    return 0;
  };

  const overallScore = calculateOverallScore();

  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getOverallScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Basic';
    return 'None';
  };

  const getTechnologyBadgeColor = (category: string) => {
    switch (category) {
      case 'HEDERA':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'OTHER_BLOCKCHAIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'NO_BLOCKCHAIN':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Removed network badge function - no longer showing network usage

  const getComplexityBadgeColor = (level: string) => {
    switch (level) {
      case 'SIMPLE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ADVANCED':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityDescription = (level?: string) => {
    switch (level) {
      case 'SIMPLE':
        return 'Basic Hedera integration with fundamental features';
      case 'MODERATE':
        return 'Multi-service Hedera implementation with good architecture';
      case 'ADVANCED':
        return 'Sophisticated Hedera integration with comprehensive features';
      default:
        return 'Complexity level not determined';
    }
  };

  const getTechnologyDescription = (category: string, hederaPresent: boolean) => {
    if (!hederaPresent && category === 'NO_BLOCKCHAIN') {
      return 'No Hedera blockchain integration detected in this project';
    }

    switch (category) {
      case 'HEDERA':
        return 'Hedera blockchain integration detected and analyzed';
      case 'OTHER_BLOCKCHAIN':
        return 'Uses blockchain technology but not Hedera Hashgraph';
      case 'NO_BLOCKCHAIN':
        return 'No Hedera blockchain integration found';
      default:
        return 'Technology classification uncertain';
    }
  };

  const formatTechnologyCategory = (category: string) => {
    switch (category) {
      case 'HEDERA':
        return 'Hedera Hashgraph';
      case 'OTHER_BLOCKCHAIN':
        return 'Other Blockchain';
      case 'NO_BLOCKCHAIN':
        return 'No Blockchain';
      default:
        return category;
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Link2 className="w-6 h-6 text-cyan-600" />
          Hedera Technology Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technology Status */}
          <div className="text-center">
            <div className="space-y-4">
              <Badge variant="outline" className={`text-lg px-4 py-2 ${getTechnologyBadgeColor(safeTechnologyCategory)}`}>
                {formatTechnologyCategory(safeTechnologyCategory)}
              </Badge>

              {safeComplexityLevel && safeTechnologyCategory === 'HEDERA' && (
                <Badge variant="outline" className={`text-sm px-3 py-1 ${getComplexityBadgeColor(safeComplexityLevel)}`}>
                  {safeComplexityLevel} Integration
                </Badge>
              )}

              <div className="text-center">
                <div className="flex justify-between text-sm mb-1">
                  <span>Technology Classification</span>
                  <span className="font-medium">
                    {safeTechnologyCategory === 'HEDERA' ? 'Confirmed' :
                     safeTechnologyCategory === 'OTHER_BLOCKCHAIN' ? 'Other Tech' : 'None Detected'}
                  </span>
                </div>
                <Progress
                  value={safeTechnologyCategory === 'HEDERA' ? 100 : safeTechnologyCategory === 'OTHER_BLOCKCHAIN' ? 50 : 10}
                  className="h-2"
                />
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Analysis Breakdown</h4>

            <div className="space-y-3">
              {/* Overall Score */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">
                    <span className={`text-3xl ${getOverallScoreColor(overallScore)}`}>
                      {overallScore}
                    </span>
                    <span className="text-gray-500 text-lg">/100</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Overall Hedera Review Score</div>
                  <div className={`font-medium ${getOverallScoreColor(overallScore)}`}>
                    {getOverallScoreLabel(overallScore)}
                  </div>
                  <Progress value={overallScore} className="h-3 mt-3" />
                </div>
              </div>

              {safeHederaUsageScore !== undefined && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hedera Usage Score</span>
                    <span className="font-medium">{Math.round(safeHederaUsageScore!)}/100</span>
                  </div>
                  <Progress value={safeHederaUsageScore!} className="h-2" />
                </div>
              )}
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Analysis Summary</h4>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {getTechnologyDescription(safeTechnologyCategory, safeHederaPresenceDetected)}
              </p>

              {safeComplexityLevel && safeTechnologyCategory === 'HEDERA' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h5 className="font-medium text-blue-900 mb-1">
                    Complexity Analysis
                  </h5>
                  <p className="text-sm text-blue-800">
                    {getComplexityDescription(safeComplexityLevel)}
                  </p>
                </div>
              )}

              {safeSummary && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h5 className="font-medium mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Analysis Summary:
                  </h5>
                  <p className="text-sm leading-relaxed">
                    {safeSummary}
                  </p>
                </div>
              )}

              {safeTechnologyCategory === 'HEDERA' && safeHederaPresenceDetected && (
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                  <p className="text-sm text-cyan-800">
                    <strong>Hedera Integration Confirmed:</strong> This project implements
                    Hedera Hashgraph technology with {safeComplexityLevel?.toLowerCase() || 'detected'} complexity.
                  </p>
                </div>
              )}

              {safeTechnologyCategory === 'NO_BLOCKCHAIN' && !safeHederaPresenceDetected && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    <strong>No Hedera Integration:</strong> This project does not use Hedera blockchain technology.
                    Consider integrating Hedera services to enhance your application with decentralized features.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}