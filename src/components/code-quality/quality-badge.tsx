'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QualityBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  className?: string;
}

export function QualityBadge({ score, size = 'md', showScore = true, className }: QualityBadgeProps) {
  const getGradeInfo = (score: number) => {
    if (score >= 90) {
      return {
        grade: 'A',
        color: 'bg-green-100 text-green-800 border-green-200',
        description: 'Excellent',
      };
    } else if (score >= 80) {
      return {
        grade: 'B',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        description: 'Good',
      };
    } else if (score >= 70) {
      return {
        grade: 'C',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        description: 'Average',
      };
    } else if (score >= 60) {
      return {
        grade: 'D',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        description: 'Below Average',
      };
    } else {
      return {
        grade: 'F',
        color: 'bg-red-100 text-red-800 border-red-200',
        description: 'Poor',
      };
    }
  };

  const gradeInfo = getGradeInfo(score);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        gradeInfo.color,
        sizeClasses[size],
        'font-semibold border',
        className
      )}
      title={`${gradeInfo.description} (${score}/100)`}
    >
      <span className="font-bold">{gradeInfo.grade}</span>
      {showScore && <span className="ml-1">({score})</span>}
    </Badge>
  );
}