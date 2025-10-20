'use client';

import { TrendingUp, Users, Leaf, Zap, Heart, Globe, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ImpactData {
  overallImpactScore: number;
  socialImpact: {
    score: number;
    description: string;
    beneficiaries: string;
    scale: 'local' | 'regional' | 'national' | 'global';
  };
  economicImpact: {
    score: number;
    marketSize: string;
    revenueModel: string;
    jobCreation: string;
  };
  environmentalImpact: {
    score: number;
    sustainability: string;
    carbonFootprint: string;
  };
  technologicalImpact: {
    score: number;
    advancement: string;
    adoption: string;
  };
  userImpact: {
    score: number;
    benefits: string;
    usability: string;
  };
  timelineToImpact: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  keySuccessFactors: string[];
  riskFactors: string[];
  impactMeasurement: string[];
}

interface ImpactAssessmentProps {
  data: ImpactData;
  className?: string;
}

export function ImpactAssessment({ data, className }: ImpactAssessmentProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScaleIcon = (scale: string) => {
    switch (scale) {
      case 'global':
        return <Globe className="w-4 h-4" />;
      case 'national':
        return <Users className="w-4 h-4" />;
      case 'regional':
        return <TrendingUp className="w-4 h-4" />;
      case 'local':
        return <Heart className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getScaleColor = (scale: string) => {
    switch (scale) {
      case 'global':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'national':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'regional':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'local':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimelineColor = (timeline: string) => {
    switch (timeline) {
      case 'immediate':
        return 'bg-green-100 text-green-800';
      case 'short-term':
        return 'bg-blue-100 text-blue-800';
      case 'medium-term':
        return 'bg-yellow-100 text-yellow-800';
      case 'long-term':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const impactCategories = [
    {
      name: 'Social Impact',
      icon: <Heart className="w-5 h-5" />,
      data: data.socialImpact,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    {
      name: 'Economic Impact',
      icon: <TrendingUp className="w-5 h-5" />,
      data: data.economicImpact,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Environmental Impact',
      icon: <Leaf className="w-5 h-5" />,
      data: data.environmentalImpact,
      color: 'text-green-600',
      bgColor: 'bg-emerald-100'
    },
    {
      name: 'Technological Impact',
      icon: <Zap className="w-5 h-5" />,
      data: data.technologicalImpact,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'User Impact',
      icon: <Users className="w-5 h-5" />,
      data: data.userImpact,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>Impact Assessment</span>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(data.overallImpactScore)}`}>
              {data.overallImpactScore}/100
            </div>
            <div className="text-xs text-muted-foreground">Overall Impact</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Impact Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Scale of Impact</span>
              <Badge variant="outline" className={getScaleColor(data.socialImpact.scale)}>
                <div className="flex items-center gap-1">
                  {getScaleIcon(data.socialImpact.scale)}
                  <span className="capitalize">{data.socialImpact.scale}</span>
                </div>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.socialImpact.beneficiaries}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Timeline to Impact</span>
              <Badge variant="secondary" className={getTimelineColor(data.timelineToImpact)}>
                {data.timelineToImpact.replace('-', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Impact Categories */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium">Impact Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {impactCategories.map((category, index) => (
              <div
                key={index}
                className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${category.bgColor}`}>
                      <div className={category.color}>
                        {category.icon}
                      </div>
                    </div>
                    <span className="font-medium text-sm">{category.name}</span>
                  </div>
                  <span className={`text-sm font-bold ${getScoreColor(category.data.score)}`}>
                    {category.data.score}/100
                  </span>
                </div>
                <Progress value={category.data.score} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {typeof category.data === 'object' && 'description' in category.data
                    ? category.data.description
                    : category.data.benefits || category.data.advancement || 'Impact assessment completed'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Success Factors */}
        {data.keySuccessFactors.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-600" />
              Key Success Factors
            </h4>
            <div className="space-y-2">
              {data.keySuccessFactors.map((factor, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-3 h-3 text-green-600" />
                  </div>
                  <p className="text-sm text-green-800">{factor}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {data.riskFactors.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-600" />
              Risk Factors
            </h4>
            <div className="space-y-2">
              {data.riskFactors.map((risk, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Heart className="w-3 h-3 text-red-600" />
                  </div>
                  <p className="text-sm text-red-800">{risk}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact Measurement */}
        {data.impactMeasurement.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Impact Measurement
            </h4>
            <div className="space-y-2">
              {data.impactMeasurement.map((measurement, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-sm text-blue-800">{measurement}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact Summary */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Impact Potential Summary</h4>
          <p className="text-sm text-blue-700">
            {data.overallImpactScore >= 80
              ? 'Exceptional impact potential with strong potential for positive change across multiple dimensions.'
              : data.overallImpactScore >= 60
              ? 'Good impact potential with meaningful benefits for target beneficiaries and stakeholders.'
              : data.overallImpactScore >= 40
              ? 'Moderate impact potential. Consider enhancing impact through broader reach or deeper benefits.'
              : 'Limited impact potential. Focus on increasing value proposition and beneficiary reach.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className={getScaleColor(data.socialImpact.scale)}>
              {data.socialImpact.scale.charAt(0).toUpperCase() + data.socialImpact.scale.slice(1)} Scale
            </Badge>
            <Badge variant="secondary" className={getTimelineColor(data.timelineToImpact)}>
              {data.timelineToImpact.replace('-', ' ')} Timeline
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}