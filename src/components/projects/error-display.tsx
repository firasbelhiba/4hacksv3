'use client';

import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, Copy, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-hot-toast';
import type { ValidationError } from '@/lib/validations/project';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  errors: ValidationError[];
  title?: string;
  maxDisplayErrors?: number;
  onRetry?: () => void;
  onDownloadErrors?: () => void;
  className?: string;
}

interface GroupedError {
  row: number;
  errors: ValidationError[];
}

export function ErrorDisplay({
  errors,
  title = 'Validation Errors',
  maxDisplayErrors = 10,
  onRetry,
  onDownloadErrors,
  className
}: ErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Group errors by row
  const groupedErrors: GroupedError[] = Object.entries(
    errors.reduce((acc, error) => {
      if (!acc[error.row]) acc[error.row] = [];
      acc[error.row].push(error);
      return acc;
    }, {} as Record<number, ValidationError[]>)
  ).map(([row, errors]) => ({
    row: parseInt(row),
    errors: errors,
  })).sort((a, b) => a.row - b.row);

  // Calculate statistics
  const errorStats = {
    totalErrors: errors.length,
    affectedRows: groupedErrors.length,
    fieldErrors: errors.reduce((acc, error) => {
      acc[error.field] = (acc[error.field] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const displayedErrors = isExpanded ? groupedErrors : groupedErrors.slice(0, maxDisplayErrors);
  const hasMoreErrors = groupedErrors.length > maxDisplayErrors;

  const toggleRowExpansion = (row: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(row)) {
      newExpanded.delete(row);
    } else {
      newExpanded.add(row);
    }
    setExpandedRows(newExpanded);
  };

  const copyErrorsToClipboard = async () => {
    try {
      const errorText = errors.map(error =>
        `Row ${error.row} - ${error.field}: ${error.message}${error.value ? ` (${error.value})` : ''}`
      ).join('\n');

      await navigator.clipboard.writeText(errorText);
      toast.success('Errors copied to clipboard');
    } catch {
      toast.error('Failed to copy errors');
    }
  };

  const downloadErrorsAsCSV = () => {
    const csvContent = [
      'Row,Field,Message,Value',
      ...errors.map(error =>
        `${error.row},"${error.field}","${error.message}","${error.value || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validation_errors.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('Error report downloaded');
  };

  const getMostCommonFields = (): Array<{ field: string; count: number }> => {
    return Object.entries(errorStats.fieldErrors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([field, count]) => ({ field, count }));
  };

  if (errors.length === 0) {
    return null;
  }

  return (
    <Card className={cn('border-red-200 bg-red-50 dark:bg-red-950/20', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
            <AlertCircle className="w-5 h-5" />
            {title}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyErrorsToClipboard}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadErrors || downloadErrorsAsCSV}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Summary */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Found {errorStats.totalErrors} errors across {errorStats.affectedRows} rows.
            Please fix these issues before uploading.
          </AlertDescription>
        </Alert>

        {/* Error Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{errorStats.totalErrors}</div>
            <div className="text-sm text-red-700 dark:text-red-300">Total Errors</div>
          </div>
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{errorStats.affectedRows}</div>
            <div className="text-sm text-red-700 dark:text-red-300">Affected Rows</div>
          </div>
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">
              {Object.keys(errorStats.fieldErrors).length}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">Error Types</div>
          </div>
        </div>

        {/* Most Common Error Fields */}
        <div>
          <h4 className="font-medium text-red-900 dark:text-red-100 mb-3">
            Most Common Issues
          </h4>
          <div className="flex flex-wrap gap-2">
            {getMostCommonFields().map(({ field, count }) => (
              <Badge
                key={field}
                variant="outline"
                className="border-red-300 text-red-700"
              >
                {field} ({count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Error Details */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {displayedErrors.map((groupedError) => (
            <div
              key={groupedError.row}
              className="border border-red-200 rounded-lg bg-white dark:bg-gray-800"
            >
              <button
                onClick={() => toggleRowExpansion(groupedError.row)}
                className="w-full p-3 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedRows.has(groupedError.row) ? (
                    <ChevronDown className="w-4 h-4 text-red-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-medium text-red-900 dark:text-red-100">
                    Row {groupedError.row}
                  </span>
                  <Badge variant="outline" className="border-red-300 text-red-700">
                    {groupedError.errors.length} errors
                  </Badge>
                </div>
              </button>

              {expandedRows.has(groupedError.row) && (
                <div className="px-3 pb-3 space-y-2 border-t border-red-200">
                  {groupedError.errors.map((error, index) => (
                    <div
                      key={index}
                      className="p-3 bg-red-50 dark:bg-red-950/30 rounded border border-red-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-red-900 dark:text-red-100">
                            {error.field}
                          </h5>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            {error.message}
                          </p>
                          {error.value && (
                            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs">
                              <span className="font-medium">Current Value:</span>{' '}
                              <span className="font-mono">{String(error.value)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {hasMoreErrors && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              {isExpanded ? (
                <>Show Less</>
              ) : (
                <>Show {groupedErrors.length - maxDisplayErrors} More Rows</>
              )}
            </Button>
          </div>
        )}

        {/* Actions */}
        {onRetry && (
          <div className="flex gap-2 pt-4 border-t border-red-200">
            <Button
              onClick={onRetry}
              variant="outline"
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Upload
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Component for displaying field-specific error summaries
 */
interface FieldErrorSummaryProps {
  errors: ValidationError[];
  className?: string;
}

export function FieldErrorSummary({ errors, className }: FieldErrorSummaryProps) {
  const fieldGroups = errors.reduce((acc, error) => {
    if (!acc[error.field]) {
      acc[error.field] = {
        count: 0,
        examples: [],
      };
    }
    acc[error.field].count++;
    if (acc[error.field].examples.length < 3) {
      acc[error.field].examples.push({
        row: error.row,
        message: error.message,
        value: error.value,
      });
    }
    return acc;
  }, {} as Record<string, { count: number; examples: Array<{ row: number; message: string; value?: any }> }>);

  return (
    <Card className={cn('border-amber-200 bg-amber-50', className)}>
      <CardHeader>
        <CardTitle className="text-amber-900">Error Summary by Field</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(fieldGroups)
            .sort(([, a], [, b]) => b.count - a.count)
            .map(([field, data]) => (
              <div key={field} className="p-4 bg-white rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-amber-900">{field}</h4>
                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                    {data.count} errors
                  </Badge>
                </div>
                <div className="space-y-2">
                  {data.examples.map((example, index) => (
                    <div key={index} className="text-sm text-amber-800">
                      <span className="font-medium">Row {example.row}:</span> {example.message}
                      {example.value && (
                        <span className="ml-2 font-mono text-xs bg-amber-100 px-1 rounded">
                          {String(example.value)}
                        </span>
                      )}
                    </div>
                  ))}
                  {data.count > 3 && (
                    <div className="text-xs text-amber-600">
                      ...and {data.count - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ErrorDisplay;