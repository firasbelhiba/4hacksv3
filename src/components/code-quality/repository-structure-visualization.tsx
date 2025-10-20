'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  FolderIcon,
  FileIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TreePineIcon,
  CodeIcon,
  CpuIcon,
  DatabaseIcon,
  SettingsIcon,
  ShieldIcon,
  TestTubeIcon,
  ArrowRightIcon,
  InfoIcon
} from 'lucide-react';

interface RepositoryStructureProps {
  repositoryStructure: any;
  packageAnalysis: any;
  configurationAnalysis: any;
  architecturalPatterns: any[];
  frameworkUtilization: any[];
  structuralComplexity: any;
}

interface DirectoryTreeNodeProps {
  name: string;
  node: any;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
}

const DirectoryTreeNode: React.FC<DirectoryTreeNodeProps> = ({
  name,
  node,
  depth,
  expanded,
  onToggle
}) => {
  const isDirectory = node.type === 'directory';
  const hasChildren = isDirectory && node.children && Object.keys(node.children).length > 0;
  const indent = depth * 20;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer`}
        style={{ paddingLeft: `${12 + indent}px` }}
        onClick={hasChildren ? onToggle : undefined}
      >
        {hasChildren && (
          expanded ? (
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
          )
        )}
        {!hasChildren && <div className="w-4" />}

        {isDirectory ? (
          <FolderIcon className="w-4 h-4 text-blue-500" />
        ) : (
          <FileIcon className="w-4 h-4 text-gray-500" />
        )}

        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {name}
        </span>

        {!isDirectory && node.size && (
          <span className="text-xs text-gray-500 ml-auto">
            {(node.size / 1024).toFixed(1)}KB
          </span>
        )}

        {node.language && (
          <Badge variant="outline" className="text-xs ml-2">
            {node.language}
          </Badge>
        )}
      </div>

      {isDirectory && hasChildren && expanded && (
        <div>
          {Object.entries(node.children).map(([childName, childNode]) => (
            <DirectoryTreeComponent
              key={childName}
              name={childName}
              node={childNode}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DirectoryTreeComponent: React.FC<{
  name: string;
  node: any;
  depth: number;
}> = ({ name, node, depth }) => {
  const [expanded, setExpanded] = useState(depth < 2); // Auto-expand first 2 levels

  return (
    <DirectoryTreeNode
      name={name}
      node={node}
      depth={depth}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    />
  );
};

const ArchitecturalPatternsCard: React.FC<{ patterns: any[] }> = ({ patterns }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CpuIcon className="w-5 h-5 text-purple-600" />
          Architectural Patterns
        </CardTitle>
      </CardHeader>
      <CardContent>
        {patterns.length === 0 ? (
          <p className="text-gray-500 italic">No specific architectural patterns detected</p>
        ) : (
          <div className="space-y-4">
            {patterns.map((pattern, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    {pattern.name}
                  </h4>
                  <Badge
                    variant={pattern.confidence >= 80 ? "default" : pattern.confidence >= 60 ? "secondary" : "outline"}
                  >
                    {pattern.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {pattern.description}
                </p>
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Evidence:</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {pattern.evidence.map((evidence: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <ArrowRightIcon className="w-3 h-3 mt-1 text-gray-400 flex-shrink-0" />
                        <span>{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {pattern.files.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Affected Files ({pattern.files.length}):
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {pattern.files.slice(0, 5).map((file: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {file.split('/').pop()}
                        </Badge>
                      ))}
                      {pattern.files.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{pattern.files.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const FrameworkUtilizationCard: React.FC<{ frameworks: any[] }> = ({ frameworks }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CodeIcon className="w-5 h-5 text-green-600" />
          Framework Utilization
        </CardTitle>
      </CardHeader>
      <CardContent>
        {frameworks.length === 0 ? (
          <p className="text-gray-500 italic">No frameworks detected</p>
        ) : (
          <div className="space-y-4">
            {frameworks.map((framework, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    {framework.framework}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {framework.utilizationDepth}/100 depth
                    </span>
                    <Badge
                      variant={framework.utilizationDepth >= 70 ? "default" : framework.utilizationDepth >= 50 ? "secondary" : "outline"}
                    >
                      {framework.utilizationDepth >= 70 ? "Advanced" : framework.utilizationDepth >= 50 ? "Intermediate" : "Basic"}
                    </Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-3">
                  {framework.advancedFeatures.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                        Advanced Features:
                      </h5>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {framework.advancedFeatures.map((feature: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {framework.customImplementations.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-2">
                        Custom Implementations:
                      </h5>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {framework.customImplementations.map((impl: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-purple-500 mt-1">•</span>
                            <span>{impl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Integration Complexity</span>
                    <span>{framework.integrationComplexity}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${framework.integrationComplexity}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ConfigurationAnalysisCard: React.FC<{ configAnalysis: any }> = ({ configAnalysis }) => {
  const configTypes = [
    { key: 'buildConfigs', label: 'Build Configs', icon: SettingsIcon, color: 'blue' },
    { key: 'environmentConfigs', label: 'Environment Configs', icon: DatabaseIcon, color: 'green' },
    { key: 'deploymentConfigs', label: 'Deployment Configs', icon: CpuIcon, color: 'purple' },
    { key: 'testConfigs', label: 'Test Configs', icon: TestTubeIcon, color: 'orange' },
    { key: 'lintingConfigs', label: 'Linting Configs', icon: ShieldIcon, color: 'red' },
    { key: 'typeConfigs', label: 'Type Configs', icon: CodeIcon, color: 'indigo' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-orange-600" />
          Configuration Analysis
          <Badge variant="outline">
            {configAnalysis?.complexity || 0}/100 complexity
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configTypes.map((type) => {
            const configs = configAnalysis?.[type.key] || [];
            const IconComponent = type.icon;

            return (
              <div key={type.key} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className={`w-4 h-4 text-${type.color}-500`} />
                  <span className="font-medium text-sm">{type.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {configs.length}
                  </Badge>
                </div>
                {configs.length > 0 ? (
                  <div className="space-y-1">
                    {configs.slice(0, 3).map((config: string, i: number) => (
                      <div key={i} className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {config.split('/').pop()}
                      </div>
                    ))}
                    {configs.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{configs.length - 3} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">None detected</div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const PackageAnalysisCard: React.FC<{ packageAnalysis: any }> = ({ packageAnalysis }) => {
  if (!packageAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5 text-blue-600" />
            Package Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 italic">No package.json found</p>
        </CardContent>
      </Card>
    );
  }

  const dependencyCount = Object.keys(packageAnalysis.dependencies || {}).length;
  const devDependencyCount = Object.keys(packageAnalysis.devDependencies || {}).length;
  const scriptCount = Object.keys(packageAnalysis.scripts || {}).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseIcon className="w-5 h-5 text-blue-600" />
          Package Analysis
          <Badge variant="outline">
            {packageAnalysis.dependencyComplexity}/100 complexity
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Dependencies Overview</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Production Dependencies</span>
                <Badge variant="outline">{dependencyCount}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Development Dependencies</span>
                <Badge variant="outline">{devDependencyCount}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">NPM Scripts</span>
                <Badge variant="outline">{scriptCount}</Badge>
              </div>
            </div>

            {packageAnalysis.frameworksDetected?.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-sm mb-2">Detected Frameworks</h5>
                <div className="flex flex-wrap gap-1">
                  {packageAnalysis.frameworksDetected.map((framework: string, i: number) => (
                    <Badge key={i} className="text-xs">
                      {framework}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {packageAnalysis.buildToolsDetected?.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-sm mb-2">Build Tools</h5>
                <div className="flex flex-wrap gap-1">
                  {packageAnalysis.buildToolsDetected.map((tool: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-3">Key Scripts</h4>
            <div className="space-y-2">
              {Object.entries(packageAnalysis.scripts || {}).slice(0, 5).map(([script, command]) => (
                <div key={script} className="border rounded p-2">
                  <div className="font-mono text-sm font-medium">{script}</div>
                  <div className="font-mono text-xs text-gray-600 mt-1 truncate">
                    {command as string}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const RepositoryStructureVisualization: React.FC<RepositoryStructureProps> = ({
  repositoryStructure,
  packageAnalysis,
  configurationAnalysis,
  architecturalPatterns,
  frameworkUtilization,
  structuralComplexity
}) => {
  const [activeTab, setActiveTab] = useState<'structure' | 'patterns' | 'frameworks' | 'config' | 'package'>('structure');

  const tabs = [
    { id: 'structure', label: 'Directory Structure', icon: TreePineIcon },
    { id: 'patterns', label: 'Architectural Patterns', icon: CpuIcon },
    { id: 'frameworks', label: 'Framework Utilization', icon: CodeIcon },
    { id: 'config', label: 'Configuration', icon: SettingsIcon },
    { id: 'package', label: 'Package Analysis', icon: DatabaseIcon },
  ];

  return (
    <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <TreePineIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Repository Structure Analysis</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Comprehensive architectural and structural assessment
            </p>
          </div>
        </CardTitle>

        {/* Complexity Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {structuralComplexity?.directoryDepth || 0}
            </div>
            <div className="text-xs text-gray-600">Directory Depth</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {structuralComplexity?.moduleCount || 0}
            </div>
            <div className="text-xs text-gray-600">Modules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {structuralComplexity?.cohesionScore || 0}
            </div>
            <div className="text-xs text-gray-600">Cohesion Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {100 - (structuralComplexity?.couplingScore || 100)}
            </div>
            <div className="text-xs text-gray-600">Coupling Score</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2"
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'structure' && (
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TreePineIcon className="w-5 h-5 text-indigo-600" />
              Directory Structure
            </h4>
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 max-h-96 overflow-auto">
              {repositoryStructure && Object.keys(repositoryStructure).length > 0 ? (
                Object.entries(repositoryStructure).map(([name, node]) => (
                  <DirectoryTreeComponent
                    key={name}
                    name={name}
                    node={node}
                    depth={0}
                  />
                ))
              ) : (
                <p className="text-gray-500 italic">No directory structure data available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <ArchitecturalPatternsCard patterns={architecturalPatterns || []} />
        )}

        {activeTab === 'frameworks' && (
          <FrameworkUtilizationCard frameworks={frameworkUtilization || []} />
        )}

        {activeTab === 'config' && (
          <ConfigurationAnalysisCard configAnalysis={configurationAnalysis} />
        )}

        {activeTab === 'package' && (
          <PackageAnalysisCard packageAnalysis={packageAnalysis} />
        )}
      </CardContent>
    </Card>
  );
};