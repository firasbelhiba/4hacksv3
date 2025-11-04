'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DiamondIcon,
  CodeIcon,
  ArchiveIcon,
  SettingsIcon,
  LinkIcon,
  BrainIcon,
  BarChart3Icon,
  InfoIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon
} from 'lucide-react';

interface RichnessEvidencePanelProps {
  richnessScore: number;
  richnessEvidence: string[];
  richnessJustification: string;
  richnessBreakdown?: {
    architecturalPatterns: number;
    businessLogic: number;
    frameworkUtilization: number;
    codeOrganization: number;
    integrationComplexity: number;
  };
  structuralAnalysis?: any;
}

const ScoreBreakdownChart: React.FC<{ breakdown: any }> = ({ breakdown }) => {
  const richnessScore = breakdown?.richnessScore || 0;
  const totalFiles = breakdown?.totalFiles || 0;

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { icon: CheckCircleIcon, color: 'text-green-600', label: 'Complex' };
    if (score >= 60) return { icon: TrendingUpIcon, color: 'text-blue-600', label: 'Moderate' };
    if (score >= 40) return { icon: AlertTriangleIcon, color: 'text-orange-600', label: 'Basic' };
    return { icon: XCircleIcon, color: 'text-red-600', label: 'Very Simple' };
  };

  const status = getScoreStatus(richnessScore);
  const StatusIcon = status.icon;

  return (
    <div className="space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        <BarChart3Icon className="w-5 h-5 text-indigo-600" />
        Richness Score (Based on File Count)
      </h4>

      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${status.color}`} />
            <span className="font-medium text-sm">Project Richness</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${status.color}`}>
              {richnessScore}/100
            </span>
            <Badge
              variant={richnessScore >= 80 ? "default" : richnessScore >= 60 ? "secondary" : "outline"}
              className="text-xs"
            >
              {status.label}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Progress value={richnessScore} className="h-2" />
          </div>
          <div className="w-4 h-2 rounded-full bg-indigo-500" />
        </div>

        <div className="mt-3">
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-1 font-medium">
            Total files in repository: {totalFiles}
          </div>
          {breakdown?.richnessJustification && (
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded p-3 mt-2">
              <div className="flex items-start gap-2">
                <InfoIcon className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-xs text-indigo-600 dark:text-indigo-400 block mb-1">WHY THIS SCORE?</span>
                  <p className="text-xs leading-relaxed">{breakdown.richnessJustification}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EvidenceList: React.FC<{ evidence: string[]; title: string; icon: React.ComponentType<any> }> = ({
  evidence,
  title,
  icon: IconComponent
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayedEvidence = showAll ? evidence : evidence.slice(0, 5);

  if (!evidence || evidence.length === 0) {
    return (
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold flex items-center gap-2 mb-3">
          <IconComponent className="w-5 h-5 text-gray-500" />
          {title}
        </h4>
        <p className="text-gray-500 italic text-sm">No evidence available</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-semibold flex items-center gap-2 mb-3">
        <IconComponent className="w-5 h-5 text-indigo-600" />
        {title}
        <Badge variant="outline" className="text-xs">
          {evidence.length} items
        </Badge>
      </h4>

      <div className="space-y-3">
        {displayedEvidence.map((item, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {item}
              </p>
            </div>
          </div>
        ))}
      </div>

      {evidence.length > 5 && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : `Show ${evidence.length - 5} More`}
          </Button>
        </div>
      )}
    </div>
  );
};

const RichnessJustificationCard: React.FC<{ justification: string; score: number }> = ({
  justification,
  score
}) => {
  const getRichnessLevel = (score: number) => {
    if (score >= 80) return { level: 'Exceptional', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' };
    if (score >= 70) return { level: 'High', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' };
    if (score >= 60) return { level: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' };
    if (score >= 40) return { level: 'Basic', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20' };
    return { level: 'Template-based', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' };
  };

  const richnessLevel = getRichnessLevel(score);

  return (
    <div className={`border rounded-lg p-4 ${richnessLevel.bgColor}`}>
      <div className="flex items-center gap-2 mb-3">
        <BrainIcon className={`w-5 h-5 ${richnessLevel.color}`} />
        <span className="font-semibold">AI Analysis Summary</span>
        <Badge className={richnessLevel.color}>
          {richnessLevel.level} Richness
        </Badge>
      </div>

      <div className="prose prose-sm max-w-none">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {justification}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${richnessLevel.color}`}>
            {score}/100
          </div>
          <div className="text-xs text-gray-600">Richness Score</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-semibold ${richnessLevel.color}`}>
            {richnessLevel.level}
          </div>
          <div className="text-xs text-gray-600">Assessment Level</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-600">
            {score >= 70 ? 'Custom' : score >= 40 ? 'Mixed' : 'Template'}
          </div>
          <div className="text-xs text-gray-600">Implementation Type</div>
        </div>
      </div>
    </div>
  );
};

const StructuralInsights: React.FC<{ structuralAnalysis: any }> = ({ structuralAnalysis }) => {
  if (!structuralAnalysis) {
    return (
      <div className="border rounded-lg p-4">
        <p className="text-gray-500 italic">No structural analysis data available</p>
      </div>
    );
  }

  const insights = [
    {
      title: 'Architectural Patterns',
      value: structuralAnalysis.architecturalPatterns?.length || 0,
      description: 'Design patterns implemented',
      icon: ArchiveIcon,
      color: 'text-purple-600'
    },
    {
      title: 'Framework Depth',
      value: Math.round(
        (Array.isArray(structuralAnalysis.frameworkUtilization) && structuralAnalysis.frameworkUtilization.length > 0)
          ? structuralAnalysis.frameworkUtilization.reduce((avg: number, fw: any) => avg + fw.utilizationDepth, 0) / structuralAnalysis.frameworkUtilization.length
          : 0
      ),
      description: 'Average framework utilization',
      icon: CodeIcon,
      color: 'text-green-600'
    },
    {
      title: 'Module Cohesion',
      value: structuralAnalysis.structuralComplexity?.cohesionScore || 0,
      description: 'Code organization quality',
      icon: LinkIcon,
      color: 'text-blue-600'
    },
    {
      title: 'Custom Logic',
      value: structuralAnalysis.businessLogic?.customAlgorithms?.length || 0,
      description: 'Custom algorithms detected',
      icon: BrainIcon,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        <InfoIcon className="w-5 h-5 text-indigo-600" />
        Structural Insights
      </h4>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {insights.map((insight, index) => {
          const IconComponent = insight.icon;
          return (
            <div key={index} className="border rounded-lg p-4 text-center">
              <IconComponent className={`w-6 h-6 ${insight.color} mx-auto mb-2`} />
              <div className={`text-2xl font-bold ${insight.color}`}>
                {insight.value}
              </div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {insight.title}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {insight.description}
              </div>
            </div>
          );
        })}
      </div>

      {structuralAnalysis.recommendations && structuralAnalysis.recommendations.length > 0 && (
        <div className="mt-6">
          <h5 className="font-medium mb-3">Structural Recommendations</h5>
          <div className="space-y-2">
            {structuralAnalysis.recommendations.slice(0, 3).map((rec: any, index: number) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {rec.priority}
                  </Badge>
                  <span className="font-medium text-sm">{rec.category}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {rec.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Impact: {rec.impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const RichnessEvidencePanel: React.FC<RichnessEvidencePanelProps> = ({
  richnessScore,
  richnessEvidence,
  richnessJustification,
  richnessBreakdown,
  structuralAnalysis
}) => {
  return (
    <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <DiamondIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Code Richness Analysis</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Detailed assessment of implementation depth and architectural sophistication
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-bold text-purple-600">
              {richnessScore}/100
            </div>
            <div className="text-xs text-gray-600">Richness Score</div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="breakdown" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown" className="space-y-4">
            {richnessBreakdown ? (
              <ScoreBreakdownChart breakdown={richnessBreakdown} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DiamondIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Detailed score breakdown not available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4">
            <EvidenceList
              evidence={richnessEvidence}
              title="Richness Evidence"
              icon={DiamondIcon}
            />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <RichnessJustificationCard
              justification={richnessJustification}
              score={richnessScore}
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <StructuralInsights structuralAnalysis={structuralAnalysis} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};