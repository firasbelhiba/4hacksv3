'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface DashboardLineChartProps {
  title: string;
  description?: string;
  data: LineChartData[];
  lines: Array<{
    dataKey: string;
    stroke: string;
    name: string;
    strokeWidth?: number;
    dot?: boolean;
  }>;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  formatTooltip?: (value: any, name: string) => [string, string];
  className?: string;
}

export function DashboardLineChart({
  title,
  description,
  data,
  lines,
  height = 300,
  showGrid = true,
  showLegend = true,
  formatTooltip,
  className,
}: DashboardLineChartProps) {
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
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/20" />
            )}
            <XAxis
              dataKey="name"
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={customTooltip} />
            {showLegend && (
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="line"
              />
            )}
            {lines.map((line, index) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth || 2}
                dot={line.dot !== false}
                name={line.name}
                activeDot={{ r: 6, className: "fill-background stroke-2" }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Preset configurations for common use cases
export const ProjectSubmissionTrendChart = ({ data }: { data: LineChartData[] }) => (
  <DashboardLineChart
    title="Project Submissions Over Time"
    description="Track project submission patterns and growth"
    data={data}
    lines={[
      { dataKey: 'submissions', stroke: '#8884d8', name: 'Total Submissions' },
      { dataKey: 'evaluations', stroke: '#82ca9d', name: 'Completed Evaluations' },
    ]}
    formatTooltip={(value, name) => [`${value} ${name.toLowerCase()}`, name]}
  />
);

export const ScoreTrendChart = ({ data }: { data: LineChartData[] }) => (
  <DashboardLineChart
    title="Average Scores Trend"
    description="Track evaluation score trends over time"
    data={data}
    lines={[
      { dataKey: 'codeQuality', stroke: '#8884d8', name: 'Code Quality' },
      { dataKey: 'innovation', stroke: '#82ca9d', name: 'Innovation' },
      { dataKey: 'coherence', stroke: '#ffc658', name: 'Coherence' },
      { dataKey: 'overall', stroke: '#ff7300', name: 'Overall Score', strokeWidth: 3 },
    ]}
    formatTooltip={(value, name) => [`${Math.round(value * 10) / 10}/100`, name]}
  />
);

export const SystemHealthTrendChart = ({ data }: { data: LineChartData[] }) => (
  <DashboardLineChart
    title="System Performance Metrics"
    description="Monitor system health and response times"
    data={data}
    lines={[
      { dataKey: 'dbLatency', stroke: '#8884d8', name: 'Database Latency (ms)' },
      { dataKey: 'apiResponse', stroke: '#82ca9d', name: 'API Response Time (ms)' },
      { dataKey: 'aiResponse', stroke: '#ffc658', name: 'AI Response Time (ms)' },
    ]}
    formatTooltip={(value, name) => [`${value}ms`, name.replace(' (ms)', '')]}
  />
);