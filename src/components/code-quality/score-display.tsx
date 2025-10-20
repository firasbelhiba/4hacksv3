'use client';

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { AlertTriangleIcon, XCircleIcon } from 'lucide-react';

interface ScoreDisplayProps {
  score: number | null;
  maxScore?: number;
  label: string;
  showIcon?: boolean;
  className?: string;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  maxScore = 100,
  label,
  showIcon = true,
  className = ""
}) => {
  if (score === null || score === undefined) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <XCircleIcon className="w-4 h-4 text-red-500" />}
        <span className="text-red-600 font-medium">
          {label} (Analysis Failed)
        </span>
        <Badge variant="destructive" className="text-xs">
          ERROR
        </Badge>
      </div>
    );
  }

  return (
    <span className={className}>
      {label} ({score}/{maxScore})
    </span>
  );
};

interface ScoreValueProps {
  score: number | null;
  maxScore?: number;
  errorText?: string;
  className?: string;
}

export const ScoreValue: React.FC<ScoreValueProps> = ({
  score,
  maxScore = 100,
  errorText = "N/A",
  className = ""
}) => {
  if (score === null || score === undefined) {
    return (
      <span className={`text-red-600 font-medium ${className}`}>
        {errorText}
      </span>
    );
  }

  return (
    <span className={className}>
      {score}/{maxScore}
    </span>
  );
};

interface ScoreNumberProps {
  score: number | null;
  errorPlaceholder?: string;
  className?: string;
}

export const ScoreNumber: React.FC<ScoreNumberProps> = ({
  score,
  errorPlaceholder = "ERROR",
  className = ""
}) => {
  if (score === null || score === undefined) {
    return (
      <span className={`text-red-600 font-bold ${className}`}>
        {errorPlaceholder}
      </span>
    );
  }

  return (
    <span className={className}>
      {score}
    </span>
  );
};