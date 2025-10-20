'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code, Package, File, CheckCircle, AlertCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface TechnologyDetectionProps {
  detectedTechnologies: string[];
  hederaPresenceDetected?: boolean;
  presenceEvidence?: Array<{
    type: string;
    file: string;
    patterns: string[];
    confidence: number;
    description: string;
  }>;
  evidenceFiles: Array<{
    file: string;
    patterns: string[];
    confidence: number;
    codeSnippets?: Array<{
      pattern: string;
      snippet: string;
      lineNumber: number;
    }>;
  }>;
  detectedPatterns: {
    sdkUsage?: string[];
    smartContracts?: string[];
    accountServices?: string[];
    tokenServices?: string[];
    consensusServices?: string[];
    fileServices?: string[];
    mirrorNodeUsage?: string[];
    hashConnectIntegration?: string[];
  };
  libraryUsage: {
    hederaSDK?: string;
    hashConnect?: string;
    otherBlockchainLibs?: string[];
  };
  projectGithubUrl?: string;
}

export function TechnologyDetection({
  detectedTechnologies,
  hederaPresenceDetected,
  presenceEvidence,
  evidenceFiles,
  detectedPatterns,
  libraryUsage,
  projectGithubUrl
}: TechnologyDetectionProps) {
  // Add null safety for all props
  const safeDetectedTechnologies = Array.isArray(detectedTechnologies) ? detectedTechnologies : [];
  const safeHederaPresenceDetected = hederaPresenceDetected || false;
  const safePresenceEvidence = Array.isArray(presenceEvidence) ? presenceEvidence : [];
  const safeEvidenceFiles = Array.isArray(evidenceFiles) ? evidenceFiles : [];
  const safeDetectedPatterns = detectedPatterns && typeof detectedPatterns === 'object' ? detectedPatterns : {};
  const safeLibraryUsage = libraryUsage && typeof libraryUsage === 'object' ? libraryUsage : {};

  // State for tracking expanded evidence files
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  // Helper function to generate GitHub file URL
  const getGitHubFileUrl = (filePath: string, lineNumber?: number) => {
    if (!projectGithubUrl) return null;
    const baseUrl = projectGithubUrl.endsWith('/') ? projectGithubUrl.slice(0, -1) : projectGithubUrl;
    const lineFragment = lineNumber ? `#L${lineNumber}` : '';
    return `${baseUrl}/blob/main/${filePath}${lineFragment}`;
  };

  // Toggle expansion state
  const toggleFileExpansion = (filePath: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(filePath)) {
      newExpanded.delete(filePath);
    } else {
      newExpanded.add(filePath);
    }
    setExpandedFiles(newExpanded);
  };
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (confidence >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getPatternIcon = (patternType: string) => {
    switch (patternType) {
      case 'sdkUsage':
        return <Package className="w-4 h-4" />;
      case 'smartContracts':
        return <Code className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const formatPatternName = (patternType: string) => {
    const names: { [key: string]: string } = {
      sdkUsage: 'SDK Usage',
      smartContracts: 'Smart Contracts',
      accountServices: 'Account Services',
      tokenServices: 'Token Services',
      consensusServices: 'Consensus Services',
      fileServices: 'File Services',
      mirrorNodeUsage: 'Mirror Node',
      hashConnectIntegration: 'HashConnect'
    };
    return names[patternType] || patternType;
  };

  return (
    <div className="space-y-6">
      {/* Detected Technologies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            Detected Technologies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safeDetectedTechnologies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {safeDetectedTechnologies.map((tech, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                  {tech}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No specific technologies detected</p>
          )}
        </CardContent>
      </Card>

      {/* Library Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Library Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-3">Hedera Libraries</h4>
              <div className="space-y-2">
                {safeLibraryUsage.hederaSDK && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Hedera SDK: <code className="bg-muted px-1 rounded">{safeLibraryUsage.hederaSDK}</code></span>
                  </div>
                )}
                {safeLibraryUsage.hashConnect && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">HashConnect: <code className="bg-muted px-1 rounded">{safeLibraryUsage.hashConnect}</code></span>
                  </div>
                )}
                {!safeLibraryUsage.hederaSDK && !safeLibraryUsage.hashConnect && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-muted-foreground">No Hedera libraries detected</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Other Blockchain Libraries</h4>
              <div className="space-y-2">
                {safeLibraryUsage.otherBlockchainLibs && safeLibraryUsage.otherBlockchainLibs.length > 0 ? (
                  safeLibraryUsage.otherBlockchainLibs.map((lib, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm"><code className="bg-muted px-1 rounded">{lib}</code></span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">No other blockchain libraries detected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Pattern Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            Pattern Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(safeDetectedPatterns).map(([patternType, patterns]) => (
              patterns && patterns.length > 0 && (
                <div key={patternType} className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    {getPatternIcon(patternType)}
                    {formatPatternName(patternType)}
                  </h4>
                  <div className="space-y-1">
                    {patterns.slice(0, 3).map((pattern: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs bg-purple-50">
                        {pattern}
                      </Badge>
                    ))}
                    {patterns.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-gray-50">
                        +{patterns.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )
            ))}
            {Object.values(safeDetectedPatterns).every(patterns => !patterns || patterns.length === 0) && (
              <p className="text-sm text-muted-foreground col-span-full">No specific patterns detected</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Evidence Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="w-5 h-5 text-orange-600" />
            Evidence Files
            {safeEvidenceFiles.length > 0 && (
              <Badge variant="outline" className="ml-auto">
                {safeEvidenceFiles.length} file{safeEvidenceFiles.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safeEvidenceFiles.length > 0 ? (
            <div className="space-y-3">
              {safeEvidenceFiles.map((evidence, index) => {
                // Enhanced file type detection
                const getFileTypeIcon = (fileName: string) => {
                  if (fileName.endsWith('.json')) return '📦';
                  if (fileName.includes('.js') || fileName.includes('.ts')) return '💻';
                  if (fileName.endsWith('.md') || fileName.endsWith('.txt')) return '📄';
                  if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) return '⚙️';
                  return '📁';
                };

                const getFileTypeLabel = (fileName: string) => {
                  if (fileName.endsWith('.json')) return 'Config';
                  if (fileName.includes('.js') || fileName.includes('.ts')) return 'Code';
                  if (fileName.endsWith('.md') || fileName.endsWith('.txt')) return 'Docs';
                  if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) return 'Config';
                  return 'File';
                };

                const fileGithubUrl = getGitHubFileUrl(evidence.file);
                const isExpanded = expandedFiles.has(evidence.file);
                const hasCodeSnippets = evidence.codeSnippets && evidence.codeSnippets.length > 0;

                return (
                  <div key={index} className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getFileTypeIcon(evidence.file)}</span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            {fileGithubUrl ? (
                              <a
                                href={fileGithubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-mono bg-background px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer flex items-center gap-1"
                              >
                                {evidence.file}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                                {evidence.file}
                              </code>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">
                            {getFileTypeLabel(evidence.file)}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className={getConfidenceColor(evidence.confidence || 0)}>
                        {evidence.confidence || 0}% confidence
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          Found patterns ({(evidence.patterns || []).length}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(evidence.patterns || []).map((pattern, patternIndex) => (
                            <Badge
                              key={patternIndex}
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Code Snippets Section */}
                      {hasCodeSnippets && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              Code Examples ({evidence.codeSnippets!.length}):
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFileExpansion(evidence.file)}
                              className="h-6 px-2 text-xs"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3 mr-1" />
                                  Hide Code
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3 mr-1" />
                                  See Code
                                </>
                              )}
                            </Button>
                          </div>

                          {isExpanded && (
                            <div className="space-y-3">
                              {evidence.codeSnippets!.map((snippet, snippetIndex) => (
                                <div key={snippetIndex} className="bg-gray-900 rounded-lg p-3 text-sm">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                                      Pattern: {snippet.pattern}
                                    </Badge>
                                    {fileGithubUrl && (
                                      <a
                                        href={getGitHubFileUrl(evidence.file, snippet.lineNumber) || fileGithubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                      >
                                        Line {snippet.lineNumber}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                  <pre className="text-gray-300 text-xs overflow-x-auto whitespace-pre-wrap">
                                    {snippet.snippet}
                                  </pre>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Summary */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Summary</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Found {safeEvidenceFiles.length} file{safeEvidenceFiles.length > 1 ? 's' : ''} containing Hedera technology patterns.
                  Files are sorted by confidence level (highest first).
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No evidence files found</p>
              <p className="text-xs text-muted-foreground mt-1">
                This could mean either no Hedera technology was detected, or the analysis couldn't access file contents.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}