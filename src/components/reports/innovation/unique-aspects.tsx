'use client';

import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UniqueAspectsProps {
  aspects: string[];
  evidence?: Array<{
    category: 'technical' | 'market' | 'implementation' | 'creative';
    description: string;
    significance: 'high' | 'medium' | 'low';
    examples: string[];
  }>;
  className?: string;
}

export function UniqueAspects({ aspects, evidence = [], className }: UniqueAspectsProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return '⚙️';
      case 'market':
        return '📈';
      case 'implementation':
        return '🔧';
      case 'creative':
        return '🎨';
      default:
        return '💡';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'market':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'implementation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'creative':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>Unique Aspects</span>
          <Badge variant="outline" className="ml-auto">
            {aspects.length} identified
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {aspects.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">No Unique Aspects Identified</h3>
            <p className="text-muted-foreground text-sm">
              Consider adding more distinctive features or novel approaches to increase innovation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unique Aspects List */}
            <div className="space-y-3">
              {aspects.map((aspect, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border"
                >
                  <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{aspect}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Evidence Section */}
            {evidence.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Supporting Evidence
                </h4>
                <div className="space-y-4">
                  {evidence.map((item, index) => (
                    <div
                      key={index}
                      className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(item.category)}</span>
                          <Badge
                            variant="outline"
                            className={getCategoryColor(item.category)}
                          >
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={getSignificanceColor(item.significance)}
                          >
                            {item.significance.charAt(0).toUpperCase() + item.significance.slice(1)} Impact
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {item.description}
                      </p>

                      {item.examples.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground mb-2">
                            Examples:
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {item.examples.map((example, exampleIndex) => (
                              <Badge
                                key={exampleIndex}
                                variant="outline"
                                className="text-xs"
                              >
                                {example}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Innovation Strength Indicator */}
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">Innovation Strength</h4>
                  <p className="text-sm text-amber-700">
                    {aspects.length >= 5
                      ? 'Excellent! Multiple unique aspects indicate strong innovation potential.'
                      : aspects.length >= 3
                      ? 'Good innovation foundation with several distinctive features.'
                      : aspects.length >= 1
                      ? 'Some unique elements present. Consider developing more distinctive features.'
                      : 'Consider adding more unique and innovative elements to strengthen differentiation.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {aspects.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Enhancement Recommendations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {aspects.length < 3 && (
                    <li>• Explore additional novel features or approaches</li>
                  )}
                  <li>• Document and highlight these unique aspects in presentations</li>
                  <li>• Consider how these aspects address unmet market needs</li>
                  <li>• Evaluate potential for intellectual property protection</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}