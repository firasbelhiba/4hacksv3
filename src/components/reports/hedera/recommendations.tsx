'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Lightbulb, TrendingUp, ArrowRight } from 'lucide-react';

interface RecommendationsProps {
  recommendations: string[];
  strengths: string[];
  improvements: string[];
  technologyCategory: 'HEDERA' | 'OTHER_BLOCKCHAIN' | 'NO_BLOCKCHAIN';
}

export function Recommendations({
  recommendations,
  strengths,
  improvements,
  technologyCategory
}: RecommendationsProps) {
  // Add null safety for all props
  const safeRecommendations = recommendations || [];
  const safeStrengths = strengths || [];
  const safeImprovements = improvements || [];
  const safeTechnologyCategory = technologyCategory || 'NO_BLOCKCHAIN';
  return (
    <div className="space-y-6">
      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Analysis Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safeRecommendations.length > 0 ? (
            <div className="space-y-3">
              {safeRecommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <ArrowRight className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">{rec}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No specific recommendations available</p>
          )}
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Identified Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safeStrengths.length > 0 ? (
            <div className="space-y-2">
              {safeStrengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-800">{strength}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No specific strengths identified</p>
          )}
        </CardContent>
      </Card>

      {/* Areas for Improvement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safeImprovements.length > 0 ? (
            <div className="space-y-2">
              {safeImprovements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">{improvement}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No specific improvements identified</p>
          )}
        </CardContent>
      </Card>

      {/* Technology-Specific Recommendations */}
      {safeTechnologyCategory === 'HEDERA' && (
        <Card className="bg-cyan-50 border-cyan-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-800">
              <Lightbulb className="w-5 h-5" />
              Hedera Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-cyan-800 font-medium">SDK Integration</p>
                  <p className="text-xs text-cyan-700">Ensure you're using the latest Hedera SDK version for optimal performance and security</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-cyan-800 font-medium">Network Configuration</p>
                  <p className="text-xs text-cyan-700">Consider using testnet for development and mainnet for production deployment</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-cyan-800 font-medium">Error Handling</p>
                  <p className="text-xs text-cyan-700">Implement proper error handling for transaction failures and network issues</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {safeTechnologyCategory === 'OTHER_BLOCKCHAIN' && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <ArrowRight className="w-5 h-5" />
              Consider Hedera Migration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-purple-800">
                Your project uses other blockchain technologies. Consider evaluating Hedera Hashgraph for:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Badge variant="outline" className="bg-purple-100 text-purple-800 p-2">
                  ⚡ Faster transactions (3-5 seconds)
                </Badge>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 p-2">
                  💰 Lower fees (predictable pricing)
                </Badge>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 p-2">
                  🌱 Energy efficient (carbon negative)
                </Badge>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 p-2">
                  🔒 Enhanced security (aBFT consensus)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {safeTechnologyCategory === 'NO_BLOCKCHAIN' && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Lightbulb className="w-5 h-5" />
              Blockchain Integration Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                No blockchain technology detected. Consider Hedera Hashgraph for:
              </p>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                  <span className="text-sm text-gray-700">Decentralized data storage and verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                  <span className="text-sm text-gray-700">Immutable audit trails and timestamping</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                  <span className="text-sm text-gray-700">Token creation and management (HTS)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                  <span className="text-sm text-gray-700">Smart contract deployment and execution</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}