'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface DashboardBarChartProps {
  title: string;
  description?: string;
  data: BarChartData[];
  bars: Array<{
    dataKey: string;
    fill: string;
    name: string;
    stackId?: string;
  }>;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  layout?: 'horizontal' | 'vertical';
  formatTooltip?: (value: any, name: string) => [string, string];
  className?: string;
}

export function DashboardBarChart({
  title,
  description,
  data,
  bars,
  height = 300,
  showGrid = true,
  showLegend = true,
  layout = 'vertical',
  formatTooltip,
  className,
}: DashboardBarChartProps) {
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatTooltip ? formatTooltip(entry.value, entry.name)[0] : entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`border-border/50 bg-card/50 backdrop-blur-sm ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm text-muted-foreground">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout={layout}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted-foreground/20"
                horizontal={layout === 'vertical'}
                vertical={layout === 'horizontal'}
              />
            )}
            <XAxis
              type={layout === 'vertical' ? 'category' : 'number'}
              dataKey={layout === 'vertical' ? 'name' : undefined}
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type={layout === 'vertical' ? 'number' : 'category'}
              dataKey={layout === 'horizontal' ? 'name' : undefined}
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={customTooltip} />
            {showLegend && (
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="square"
              />
            )}
            {bars.map((bar, index) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                fill={bar.fill}
                name={bar.name}
                stackId={bar.stackId}
                radius={[2, 2, 0, 0]}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Preset configurations for common use cases
export const HackathonComparisonChart = ({ data }: { data: BarChartData[] }) => (
  <DashboardBarChart
    title="Hackathon Performance Comparison"
    description="Compare participation and scores across hackathons"
    data={data}
    bars={[
      { dataKey: 'projects', fill: '#8884d8', name: 'Total Projects' },
      { dataKey: 'avgScore', fill: '#82ca9d', name: 'Average Score' },
    ]}
    formatTooltip={(value, name) => [
      name === 'Average Score' ? `${Math.round(value * 10) / 10}/100` : `${value}`,
      name
    ]}
  />
);

export const TrackPerformanceChart = ({ data }: { data: BarChartData[] }) => (
  <DashboardBarChart
    title="Track Performance Analysis"
    description="Project distribution and performance by track"
    data={data}
    bars={[
      { dataKey: 'submissions', fill: '#8884d8', name: 'Submissions' },
      { dataKey: 'completed', fill: '#82ca9d', name: 'Completed Evaluations' },
    ]}
    layout="horizontal"
    formatTooltip={(value, name) => [`${value} projects`, name]}
  />
);

export const ScoreDistributionChart = ({ data }: { data: BarChartData[] }) => (
  <DashboardBarChart
    title="Score Distribution"
    description="Distribution of project scores across ranges"
    data={data}
    bars={[
      { dataKey: 'count', fill: '#8884d8', name: 'Number of Projects' },
    ]}
    formatTooltip={(value, name) => [`${value} projects`, 'Projects in Range']}
  />
);

export const MonthlyActivityChart = ({ data }: { data: BarChartData[] }) => (
  <DashboardBarChart
    title="Monthly Activity Overview"
    description="Track platform activity over time"
    data={data}
    bars={[
      { dataKey: 'hackathons', fill: '#8884d8', name: 'New Hackathons', stackId: 'activity' },
      { dataKey: 'projects', fill: '#82ca9d', name: 'Project Submissions', stackId: 'activity' },
      { dataKey: 'evaluations', fill: '#ffc658', name: 'Completed Evaluations', stackId: 'activity' },
    ]}
    formatTooltip={(value, name) => [`${value}`, name]}
    height={350}
  />
);

export const TechnologyComparisonChart = ({ data }: { data: BarChartData[] }) => (
  <DashboardBarChart
    title="Technology Usage Comparison"
    description="Most popular technologies and frameworks"
    data={data}
    bars={[
      { dataKey: 'usage', fill: '#8884d8', name: 'Projects Using' },
      { dataKey: 'avgScore', fill: '#82ca9d', name: 'Average Score' },
    ]}
    layout="horizontal"
    formatTooltip={(value, name) => [
      name === 'Average Score' ? `${Math.round(value * 10) / 10}/100` : `${value} projects`,
      name
    ]}
  />
);