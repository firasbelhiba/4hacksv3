'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, CheckCircle, XCircle, AlertTriangle, Code, Target } from 'lucide-react';

interface ReadmeAnalysisDisplayProps {
  readmeExists: boolean;
  readmeQuality: number;
  evidence?: any;
}

export function ReadmeAnalysisDisplay({
  readmeExists,
  readmeQuality,
  evidence
}: ReadmeAnalysisDisplayProps) {
  const getQualityLevel = (score: number) => {
    if (score >= 85) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 70) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 55) return { level: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (score >= 40) return { level: 'Poor', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { level: 'Very Poor', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const qualityInfo = getQualityLevel(readmeQuality);

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 50) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          README Documentation Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* README Existence Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              readmeExists ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {readmeExists ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <h4 className="font-semibold">README File</h4>
              <p className="text-sm text-muted-foreground">
                {readmeExists ? 'Documentation found in repository' : 'No README file detected'}
              </p>
            </div>
          </div>
          <Badge variant={readmeExists ? 'default' : 'destructive'}>
            {readmeExists ? 'Found' : 'Missing'}
          </Badge>
        </div>

        {readmeExists && (
          <div>
            {/* README Quality Score */}
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">Documentation Quality</h4>
                  {getScoreIcon(readmeQuality)}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-3xl font-bold ${qualityInfo.color}`}>
                      {Math.round(readmeQuality)}/100
                    </span>
                    <Badge variant="outline" className={`${qualityInfo.bgColor} ${qualityInfo.color} border-current text-sm px-3 py-1`}>
                      {qualityInfo.level}
                    </Badge>
                  </div>

                  <Progress value={readmeQuality} className="h-3" />

                  <p className="text-sm text-muted-foreground">
                    Comprehensive assessment of documentation completeness, clarity, structure, and professional presentation
                  </p>

                  {/* AI Assessment Verdict */}
                  {evidence?.readmeAnalysis?.verdict && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg border-l-4 border-l-blue-500">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">AI Assessment</p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                            {evidence.readmeAnalysis.verdict}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Analysis Details */}
            {evidence && (
              <div className="space-y-4 mt-6">
                <h4 className="font-semibold text-lg">Detailed Analysis</h4>

                <div className="space-y-4">
                  {/* AI Detailed Assessment */}
                  {(evidence.readmeAnalysis?.strengths || evidence.readmeAnalysis?.weaknesses) && (
                    <Card className="border-l-4 border-l-indigo-500">
                      <CardContent className="p-4">
                        <h5 className="font-medium mb-3 text-indigo-700 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          AI Detailed Assessment
                        </h5>

                        {/* Strengths */}
                        {evidence.readmeAnalysis?.strengths && evidence.readmeAnalysis.strengths.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-green-700 mb-2">✅ Strengths Identified</p>
                            <ul className="space-y-1">
                              {evidence.readmeAnalysis.strengths.map((strength: string, index: number) => (
                                <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Weaknesses */}
                        {evidence.readmeAnalysis?.weaknesses && evidence.readmeAnalysis.weaknesses.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-red-700 mb-2">❌ Issues Found</p>
                            <ul className="space-y-1">
                              {evidence.readmeAnalysis.weaknesses.map((weakness: string, index: number) => (
                                <li key={index} className="text-sm text-red-800 flex items-start gap-2">
                                  <XCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                                  <span>{weakness}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Missing Critical Elements */}
                        {evidence.readmeAnalysis?.missingCritical && evidence.readmeAnalysis.missingCritical.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-orange-700 mb-2">⚠️ Missing Critical Elements</p>
                            <ul className="space-y-1">
                              {evidence.readmeAnalysis.missingCritical.map((missing: string, index: number) => (
                                <li key={index} className="text-sm text-orange-800 flex items-start gap-2">
                                  <AlertTriangle className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                                  <span>{missing}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* README-specific Recommendations */}
                  {evidence.readmeAnalysis?.recommendations && evidence.readmeAnalysis.recommendations.length > 0 && (
                    <Card className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <h5 className="font-medium mb-3 text-purple-700 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          AI Improvement Suggestions
                        </h5>
                        <div className="space-y-3">
                          {evidence.readmeAnalysis.recommendations.slice(0, 5).map((rec: any, index: number) => (
                            <div key={index} className="flex items-start gap-3">
                              <Badge
                                variant={rec.priority === 'high' || rec.priority === 'critical' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                                className="text-xs mt-0.5"
                              >
                                {rec.priority?.toUpperCase() || 'MED'}
                              </Badge>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{rec.suggestion || rec.action}</p>
                                {rec.issue && (
                                  <p className="text-xs text-muted-foreground mt-1">Issue: {rec.issue}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Positive Aspects */}
                    {evidence.readmeAnalysis?.positiveAspects && evidence.readmeAnalysis.positiveAspects.length > 0 && (
                      <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <h5 className="font-medium mb-3 text-green-700">✅ Strengths Found</h5>
                          <ul className="space-y-2">
                            {evidence.readmeAnalysis.positiveAspects.map((aspect: string, index: number) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{aspect}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Areas for Improvement */}
                    {evidence.readmeAnalysis?.negativeAspects && evidence.readmeAnalysis.negativeAspects.length > 0 && (
                      <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <h5 className="font-medium mb-3 text-orange-700">⚠️ Areas for Improvement</h5>
                          <ul className="space-y-2">
                            {evidence.readmeAnalysis.negativeAspects.map((aspect: string, index: number) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <span>{aspect}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Code Structure Evidence */}
                  {evidence.codeStructure && (
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Code className="w-5 h-5 text-indigo-600" />
                          <h5 className="font-medium">Code Structure Analysis</h5>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-indigo-600">
                              {evidence.codeStructure.totalFiles || 0}
                            </div>
                            <div className="text-muted-foreground">Files Analyzed</div>
                          </div>

                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {evidence.codeStructure.hasApi ? '✅' : '❌'}
                            </div>
                            <div className="text-muted-foreground">API Routes</div>
                          </div>

                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {evidence.codeStructure.hasFrontend ? '✅' : '❌'}
                            </div>
                            <div className="text-muted-foreground">Frontend</div>
                          </div>

                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {evidence.codeStructure.hasDatabase ? '✅' : '❌'}
                            </div>
                            <div className="text-muted-foreground">Database</div>
                          </div>
                        </div>

                        {evidence.codeStructure.technologies && evidence.codeStructure.technologies.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Technologies Detected:</p>
                            <div className="flex flex-wrap gap-1">
                              {evidence.codeStructure.technologies.slice(0, 10).map((tech: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                              {evidence.codeStructure.technologies.length > 10 && (
                                <Badge variant="outline" className="text-xs">
                                  +{evidence.codeStructure.technologies.length - 10} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!readmeExists && (
          <Card className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/10">
            <CardContent className="p-4">
              <h4 className="font-semibold text-red-700 mb-2">⚠️ Missing Documentation</h4>
              <p className="text-sm text-red-600 mb-3">
                No README file was found in the repository. This significantly impacts project presentation and accessibility.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Recommended README sections:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Project description and purpose</li>
                  <li>• Installation and setup instructions</li>
                  <li>• Usage examples and features</li>
                  <li>• Technology stack and dependencies</li>
                  <li>• API documentation (if applicable)</li>
                  <li>• Contributing guidelines</li>
                  <li>• Team information and credits</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}