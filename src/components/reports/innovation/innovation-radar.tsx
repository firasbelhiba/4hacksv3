'use client';

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InnovationRadarProps {
  data: {
    noveltyScore: number;
    creativityScore: number;
    technicalInnovation: number;
    marketInnovation: number;
    implementationInnovation: number;
  };
  className?: string;
}

export function InnovationRadar({ data, className }: InnovationRadarProps) {
  const radarData = [
    {
      aspect: 'Novelty',
      score: data.noveltyScore,
      fullMark: 100,
    },
    {
      aspect: 'Creativity',
      score: data.creativityScore,
      fullMark: 100,
    },
    {
      aspect: 'Technical',
      score: data.technicalInnovation,
      fullMark: 100,
    },
    {
      aspect: 'Market',
      score: data.marketInnovation,
      fullMark: 100,
    },
    {
      aspect: 'Implementation',
      score: data.implementationInnovation,
      fullMark: 100,
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // green-500
    if (score >= 60) return '#F59E0B'; // amber-500
    if (score >= 40) return '#EF4444'; // red-500
    return '#6B7280'; // gray-500
  };

  const overallScore = Math.round(
    (data.noveltyScore + data.creativityScore + data.technicalInnovation +
     data.marketInnovation + data.implementationInnovation) / 5
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Innovation Radar</span>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: getScoreColor(overallScore) }}>
              {overallScore}/100
            </div>
            <div className="text-xs text-muted-foreground">Overall Score</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <PolarGrid
                stroke="#e5e7eb"
                strokeDasharray="3 3"
              />
              <PolarAngleAxis
                dataKey="aspect"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                className="text-xs"
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickCount={6}
              />
              <Radar
                name="Innovation Score"
                dataKey="score"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.2}
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Breakdown */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Novelty</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${data.noveltyScore}%`,
                      backgroundColor: getScoreColor(data.noveltyScore)
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-8">{data.noveltyScore}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Creativity</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${data.creativityScore}%`,
                      backgroundColor: getScoreColor(data.creativityScore)
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-8">{data.creativityScore}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Technical</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${data.technicalInnovation}%`,
                      backgroundColor: getScoreColor(data.technicalInnovation)
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-8">{data.technicalInnovation}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Market</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${data.marketInnovation}%`,
                      backgroundColor: getScoreColor(data.marketInnovation)
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-8">{data.marketInnovation}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Implementation</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${data.implementationInnovation}%`,
                      backgroundColor: getScoreColor(data.implementationInnovation)
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-8">{data.implementationInnovation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Innovation Level Indicator */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Innovation Level</h4>
              <p className="text-sm text-muted-foreground">
                {overallScore >= 90 ? 'Breakthrough Innovation' :
                 overallScore >= 80 ? 'Highly Innovative' :
                 overallScore >= 70 ? 'Significantly Innovative' :
                 overallScore >= 60 ? 'Moderately Innovative' :
                 overallScore >= 50 ? 'Somewhat Innovative' :
                 'Low Innovation'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Percentile</div>
              <div className="font-bold">
                {overallScore >= 90 ? 'Top 10%' :
                 overallScore >= 80 ? 'Top 20%' :
                 overallScore >= 70 ? 'Top 30%' :
                 overallScore >= 60 ? 'Top 50%' :
                 'Below Average'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}