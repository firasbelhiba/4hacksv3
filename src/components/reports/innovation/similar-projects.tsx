'use client';

import { ExternalLink, GitBranch, BookOpen, Building, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SimilarProject {
  name: string;
  description: string;
  source: 'github' | 'academic' | 'commercial' | 'other';
  url?: string;
  similarityScore: number; // 0-100
  differenceHighlights: string[];
}

interface SimilarProjectsProps {
  projects: SimilarProject[];
  className?: string;
}

export function SimilarProjects({ projects, className }: SimilarProjectsProps) {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'github':
        return <GitBranch className="w-4 h-4" />;
      case 'academic':
        return <BookOpen className="w-4 h-4" />;
      case 'commercial':
        return <Building className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'github':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'academic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'commercial':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getSimilarityText = (score: number) => {
    if (score >= 80) return 'Very Similar';
    if (score >= 60) return 'Similar';
    if (score >= 40) return 'Somewhat Similar';
    return 'Different';
  };

  if (projects.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Similar Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Lightbulb className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-medium text-lg mb-2">Highly Unique Project!</h3>
            <p className="text-muted-foreground text-sm">
              No similar projects were found, indicating high novelty and uniqueness.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Similar Projects</span>
          <Badge variant="outline">
            {projects.length} found
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{project.name}</h4>
                    <Badge
                      variant="outline"
                      className={getSourceColor(project.source)}
                    >
                      <div className="flex items-center gap-1">
                        {getSourceIcon(project.source)}
                        <span className="capitalize">{project.source}</span>
                      </div>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {project.description}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getSimilarityColor(project.similarityScore)}`}>
                    {project.similarityScore}% {getSimilarityText(project.similarityScore)}
                  </div>
                  {project.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(project.url, '_blank')}
                      className="text-xs"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              </div>

              {project.differenceHighlights && project.differenceHighlights.length > 0 && (
                <div className="border-t border-border pt-3">
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">
                    Key Differences:
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {project.differenceHighlights?.map((difference, diffIndex) => (
                      <Badge
                        key={diffIndex}
                        variant="secondary"
                        className="text-xs"
                      >
                        {difference}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Innovation Insight */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Innovation Insight</h4>
              <p className="text-sm text-blue-700">
                {projects.filter(p => p.similarityScore >= 80).length > 0
                  ? 'Several highly similar projects exist. Consider emphasizing unique differentiators and novel approaches to increase innovation score.'
                  : projects.filter(p => p.similarityScore >= 60).length > 0
                  ? 'Some similar projects exist, but your approach has clear differentiators. Good foundation for innovation.'
                  : 'Few similar projects found. This indicates strong novelty and uniqueness in your approach.'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}