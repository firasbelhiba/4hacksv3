'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface DashboardPieChartProps {
  title: string;
  description?: string;
  data: PieChartData[];
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  formatTooltip?: (value: any, name: string) => [string, string];
  className?: string;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000',
  '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'
];

export function DashboardPieChart({
  title,
  description,
  data,
  height = 300,
  showLegend = true,
  showLabels = false,
  innerRadius = 0,
  outerRadius = 80,
  formatTooltip,
  className,
  colors = DEFAULT_COLORS,
}: DashboardPieChartProps) {
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{data.name}</p>
          <p className="text-sm" style={{ color: data.payload.color }}>
            {formatTooltip ? formatTooltip(data.value, data.name)[0] : `${data.value}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {`${((data.value / data.payload.total) * 100).toFixed(1)}% of total`}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = (entry: any) => {
    const percent = ((entry.value / entry.total) * 100).toFixed(0);
    return `${percent}%`;
  };

  // Calculate total for percentage calculation
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  const dataWithTotal = data.map(entry => ({
    ...entry,
    total,
    color: entry.color || colors[data.indexOf(entry) % colors.length],
  }));

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
          <PieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={showLabels ? renderLabel : false}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey="value"
            >
              {dataWithTotal.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={customTooltip} />
            {showLegend && (
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="square"
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Preset configurations for common use cases
export const ProjectStatusChart = ({ data }: { data: PieChartData[] }) => (
  <DashboardPieChart
    title="Project Status Distribution"
    description="Current status of all projects"
    data={data}
    colors={['#22c55e', '#eab308', '#3b82f6', '#ef4444']}
    formatTooltip={(value, name) => [`${value} projects`, name]}
    showLabels
  />
);

export const TechnologyStackChart = ({ data }: { data: PieChartData[] }) => (
  <DashboardPieChart
    title="Technology Stack Usage"
    description="Most popular technologies used in projects"
    data={data}
    innerRadius={40}
    colors={['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000']}
    formatTooltip={(value, name) => [`${value} projects`, name]}
  />
);

export const EvaluationStatusChart = ({ data }: { data: PieChartData[] }) => (
  <DashboardPieChart
    title="Evaluation Progress"
    description="Status of project evaluations"
    data={data}
    colors={['#10b981', '#f59e0b', '#3b82f6', '#ef4444']}
    formatTooltip={(value, name) => [`${value} evaluations`, name]}
    showLabels
  />
);

export const HackathonParticipationChart = ({ data }: { data: PieChartData[] }) => (
  <DashboardPieChart
    title="Hackathon Participation"
    description="Project distribution across hackathons"
    data={data}
    innerRadius={30}
    formatTooltip={(value, name) => [`${value} projects`, name]}
  />
);