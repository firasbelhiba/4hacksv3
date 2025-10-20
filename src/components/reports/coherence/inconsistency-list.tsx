'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle, AlertCircle, Info, Lightbulb, CheckCircle } from 'lucide-react';

interface Inconsistency {
  type: string;
  title?: string;
  description: string;
  evidence?: string;
  severity: 'high' | 'medium' | 'low';
  sources?: string[];
  suggestion?: string;
}

interface InconsistencyListProps {
  inconsistencies: Inconsistency[];
}

export function InconsistencyList({ inconsistencies }: InconsistencyListProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'name':
      case 'naming':
        return '🏷️';
      case 'description':
        return '📝';
      case 'technologies':
      case 'tech':
        return '⚙️';
      case 'team':
        return '👥';
      case 'track':
        return '🎯';
      case 'urls':
      case 'links':
        return '🔗';
      case 'features':
        return '✨';
      default:
        return '📋';
    }
  };

  const groupedInconsistencies = inconsistencies.reduce((groups, inconsistency) => {
    const severity = inconsistency.severity || 'medium';
    if (!groups[severity]) {
      groups[severity] = [];
    }
    groups[severity].push(inconsistency);
    return groups;
  }, {} as Record<string, Inconsistency[]>);

  const severityOrder = ['high', 'medium', 'low'];
  const severityLabels = {
    high: 'Critical Issues',
    medium: 'Important Issues',
    low: 'Minor Issues'
  };

  if (inconsistencies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-green-600" />
            Project Consistency Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-lg mb-2">No Major Inconsistencies Found</h4>
            <p className="text-muted-foreground">
              The project information appears consistent across different sources.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
          Project Inconsistencies Found
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {inconsistencies.length} inconsistenc{inconsistencies.length === 1 ? 'y' : 'ies'} detected across project information
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          {severityOrder.map(severity => {
            const count = groupedInconsistencies[severity]?.length || 0;
            return (
              <div key={severity} className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold mb-1">
                  {getSeverityIcon(severity)}
                </div>
                <div className="text-lg font-semibold">{count}</div>
                <div className="text-xs text-muted-foreground capitalize">{severity}</div>
              </div>
            );
          })}
        </div>

        {/* Inconsistencies by Severity */}
        {severityOrder.map(severity => {
          const issues = groupedInconsistencies[severity];
          if (!issues || issues.length === 0) return null;

          return (
            <div key={severity} className="space-y-4">
              <div className="flex items-center gap-2">
                {getSeverityIcon(severity)}
                <h4 className="font-semibold text-lg">{severityLabels[severity as keyof typeof severityLabels]}</h4>
                <Badge variant="outline" className={getSeverityColor(severity)}>
                  {issues.length} issue{issues.length === 1 ? '' : 's'}
                </Badge>
              </div>

              <div className="space-y-3">
                {issues.map((inconsistency, index) => (
                  <Card key={index} className={`border-l-4 ${getBorderColor(inconsistency.severity)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-xl flex-shrink-0 mt-1">
                          {getTypeIcon(inconsistency.type)}
                        </div>

                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium">
                                {inconsistency.title || `${inconsistency.type} Inconsistency`}
                              </h5>
                              <Badge variant="secondary" className="text-xs mt-1">
                                {inconsistency.type}
                              </Badge>
                            </div>
                            <Badge variant="outline" className={getSeverityColor(inconsistency.severity)}>
                              {inconsistency.severity}
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground">
                            {inconsistency.description}
                          </p>

                          {/* Evidence */}
                          {inconsistency.evidence && (
                            <div className="bg-muted/50 rounded p-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Evidence:</p>
                              <p className="text-sm">{inconsistency.evidence}</p>
                            </div>
                          )}

                          {/* Sources */}
                          {inconsistency.sources && inconsistency.sources.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Affected sources:</p>
                              <div className="flex flex-wrap gap-1">
                                {inconsistency.sources.map((source, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Suggestion */}
                          {inconsistency.suggestion && (
                            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                              <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Suggestion:</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  {inconsistency.suggestion}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {/* Quick Fix Recommendations */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Quick Improvement Tips</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Ensure project name is consistent across README, repository, and description</li>
                  <li>• Verify that all mentioned technologies are actually used in the codebase</li>
                  <li>• Update documentation to reflect current project state and features</li>
                  <li>• Check that team member information is complete and accurate</li>
                  <li>• Validate that all provided URLs are accessible and relevant</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}