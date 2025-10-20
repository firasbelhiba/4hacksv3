/**
 * Unified Score Calculator
 * Standardizes scoring methodology across all analysis layers
 */

import {
  AnalysisResult,
  AnalysisType,
  UnifiedScore,
  LayerWeights,
  ScoreEvidence,
  QualityMetrics,
} from './types';

// Standardized weight configurations
export const SCORING_CONFIGURATIONS = {
  HACKATHON_STANDARD: {
    codeQuality: 0.35,     // 35% - Technical implementation quality
    innovation: 0.25,      // 25% - Innovation and creativity
    coherence: 0.25,       // 25% - Project coherence and alignment
    hedera: 0.15,          // 15% - Blockchain technology usage
  },
  INNOVATION_FOCUSED: {
    codeQuality: 0.25,
    innovation: 0.40,      // 40% - For innovation-focused competitions
    coherence: 0.20,
    hedera: 0.15,
  },
  TECHNICAL_FOCUSED: {
    codeQuality: 0.50,     // 50% - For technical competitions
    innovation: 0.20,
    coherence: 0.20,
    hedera: 0.10,
  },
  BALANCED: {
    codeQuality: 0.25,     // Equal weight distribution
    innovation: 0.25,
    coherence: 0.25,
    hedera: 0.25,
  },
} as const;

type ScoringConfiguration = keyof typeof SCORING_CONFIGURATIONS;

interface ScoreCalculationOptions {
  configuration?: ScoringConfiguration;
  customWeights?: Partial<LayerWeights>;
  penaltyFactors?: PenaltyFactors;
  bonusFactors?: BonusFactors;
  qualityThreshold?: number;
}

interface PenaltyFactors {
  incompleteAnalysis?: number;    // Penalty for missing analysis layers
  lowQuality?: number;            // Penalty for low quality scores
  inconsistency?: number;         // Penalty for inconsistent results
  bias?: number;                  // Penalty for detected bias
}

interface BonusFactors {
  exceptional?: number;           // Bonus for exceptional scores
  consistency?: number;           // Bonus for high consistency
  completeness?: number;          // Bonus for complete analysis
}

interface ScoreBreakdown {
  baseScores: Record<AnalysisType, number>;
  weightedScores: Record<AnalysisType, number>;
  penalties: Array<{ type: string; amount: number; reason: string }>;
  bonuses: Array<{ type: string; amount: number; reason: string }>;
  finalScore: number;
  confidence: number;
}

export class ScoreCalculator {
  private defaultConfiguration: ScoringConfiguration = 'HACKATHON_STANDARD';
  private defaultPenalties: PenaltyFactors = {
    incompleteAnalysis: 0.1,      // 10% penalty
    lowQuality: 0.15,             // 15% penalty
    inconsistency: 0.05,          // 5% penalty
    bias: 0.2,                    // 20% penalty
  };
  private defaultBonuses: BonusFactors = {
    exceptional: 0.05,            // 5% bonus
    consistency: 0.03,            // 3% bonus
    completeness: 0.02,           // 2% bonus
  };

  /**
   * Calculate unified score from analysis results
   */
  async calculateUnifiedScore(
    results: AnalysisResult[],
    options: ScoreCalculationOptions = {}
  ): Promise<UnifiedScore> {
    // Get configuration weights
    const weights = this.getWeights(options.configuration, options.customWeights);

    // Extract and validate scores
    const scores = this.extractScores(results);

    // Calculate base weighted score
    const baseScore = this.calculateBaseScore(scores, weights);

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(results);

    // Apply penalties and bonuses
    const breakdown = this.calculateWithAdjustments(
      scores,
      weights,
      results,
      qualityMetrics,
      options
    );

    // Generate evidence
    const evidence = this.generateEvidence(breakdown, results, qualityMetrics);

    return {
      overall: Math.max(0, Math.min(100, breakdown.finalScore)),
      layers: scores,
      weights,
      methodology: this.getMethodologyDescription(options.configuration),
      confidence: breakdown.confidence,
      evidence,
    };
  }

  /**
   * Get weights for calculation
   */
  private getWeights(
    configuration?: ScoringConfiguration,
    customWeights?: Partial<LayerWeights>
  ): LayerWeights {
    const baseWeights = SCORING_CONFIGURATIONS[configuration || this.defaultConfiguration];

    if (customWeights) {
      return { ...baseWeights, ...customWeights };
    }

    return baseWeights;
  }

  /**
   * Extract scores from analysis results
   */
  private extractScores(results: AnalysisResult[]): Record<AnalysisType, number> {
    const scores: Record<AnalysisType, number> = {
      CODE_QUALITY: 0,
      INNOVATION: 0,
      COHERENCE: 0,
      HEDERA: 0,
    };

    results.forEach(result => {
      if (result.status === 'COMPLETED' && result.score !== undefined) {
        scores[result.analysisType] = this.normalizeScore(result.score);
      }
    });

    return scores;
  }

  /**
   * Normalize score to 0-100 range
   */
  private normalizeScore(score: number): number {
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate base weighted score
   */
  private calculateBaseScore(
    scores: Record<AnalysisType, number>,
    weights: LayerWeights
  ): number {
    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([layer, weight]) => {
      const layerScore = scores[layer as AnalysisType];
      if (layerScore > 0) { // Only include layers with valid scores
        weightedSum += layerScore * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate quality metrics from analysis results
   */
  private calculateQualityMetrics(results: AnalysisResult[]): QualityMetrics {
    const completedResults = results.filter(r => r.status === 'COMPLETED');
    const totalExpected = 4; // CODE_QUALITY, INNOVATION, COHERENCE, HEDERA

    // Calculate completeness
    const completeness = completedResults.length / totalExpected;

    // Calculate average confidence
    const avgConfidence = completedResults.length > 0
      ? completedResults.reduce((sum, r) => sum + (r.metadata.qualityMetrics?.confidence || 0), 0) / completedResults.length
      : 0;

    // Calculate consistency (how similar are the scores)
    const scores = completedResults.map(r => r.score || 0);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    const consistency = Math.max(0, 1 - (Math.sqrt(variance) / 50)); // Normalize to 0-1

    // Calculate reliability (based on response times and retries)
    const avgReliability = completedResults.length > 0
      ? completedResults.reduce((sum, r) => {
          const hasRetries = r.metadata.retryCount > 0;
          const fastResponse = r.metadata.duration < 60000; // Under 1 minute
          return sum + (hasRetries ? 0.5 : 1) * (fastResponse ? 1 : 0.8);
        }, 0) / completedResults.length
      : 0;

    // Calculate bias score (lower is better)
    const avgBias = completedResults.length > 0
      ? completedResults.reduce((sum, r) => sum + (r.metadata.qualityMetrics?.biasScore || 0), 0) / completedResults.length
      : 0;

    return {
      confidence: avgConfidence,
      consistency,
      completeness,
      reliability: avgReliability,
      biasScore: avgBias,
    };
  }

  /**
   * Calculate score with penalties and bonuses
   */
  private calculateWithAdjustments(
    scores: Record<AnalysisType, number>,
    weights: LayerWeights,
    results: AnalysisResult[],
    qualityMetrics: QualityMetrics,
    options: ScoreCalculationOptions
  ): ScoreBreakdown {
    const baseScore = this.calculateBaseScore(scores, weights);
    const penalties: Array<{ type: string; amount: number; reason: string }> = [];
    const bonuses: Array<{ type: string; amount: number; reason: string }> = [];

    const penaltyFactors = { ...this.defaultPenalties, ...options.penaltyFactors };
    const bonusFactors = { ...this.defaultBonuses, ...options.bonusFactors };

    let adjustedScore = baseScore;

    // Apply completeness penalty
    if (qualityMetrics.completeness < 1) {
      const penalty = (1 - qualityMetrics.completeness) * penaltyFactors.incompleteAnalysis! * 100;
      penalties.push({
        type: 'incomplete_analysis',
        amount: penalty,
        reason: `Missing ${Math.round((1 - qualityMetrics.completeness) * 4)} analysis layer(s)`,
      });
      adjustedScore -= penalty;
    }

    // Apply quality penalty
    if (qualityMetrics.confidence < 0.7) {
      const penalty = (0.7 - qualityMetrics.confidence) * penaltyFactors.lowQuality! * 100;
      penalties.push({
        type: 'low_quality',
        amount: penalty,
        reason: `Low analysis confidence: ${(qualityMetrics.confidence * 100).toFixed(1)}%`,
      });
      adjustedScore -= penalty;
    }

    // Apply consistency penalty
    if (qualityMetrics.consistency < 0.8) {
      const penalty = (0.8 - qualityMetrics.consistency) * penaltyFactors.inconsistency! * 100;
      penalties.push({
        type: 'inconsistency',
        amount: penalty,
        reason: `Inconsistent scores across layers`,
      });
      adjustedScore -= penalty;
    }

    // Apply bias penalty
    if (qualityMetrics.biasScore > 0.3) {
      const penalty = qualityMetrics.biasScore * penaltyFactors.bias! * 100;
      penalties.push({
        type: 'bias_detected',
        amount: penalty,
        reason: `Bias detected in analysis results`,
      });
      adjustedScore -= penalty;
    }

    // Apply exceptional performance bonus
    if (baseScore >= 90) {
      const bonus = bonusFactors.exceptional! * 100;
      bonuses.push({
        type: 'exceptional',
        amount: bonus,
        reason: 'Exceptional overall performance',
      });
      adjustedScore += bonus;
    }

    // Apply consistency bonus
    if (qualityMetrics.consistency >= 0.95) {
      const bonus = bonusFactors.consistency! * 100;
      bonuses.push({
        type: 'consistency',
        amount: bonus,
        reason: 'High consistency across all layers',
      });
      adjustedScore += bonus;
    }

    // Apply completeness bonus
    if (qualityMetrics.completeness === 1 && qualityMetrics.reliability >= 0.9) {
      const bonus = bonusFactors.completeness! * 100;
      bonuses.push({
        type: 'completeness',
        amount: bonus,
        reason: 'Complete and reliable analysis',
      });
      adjustedScore += bonus;
    }

    // Calculate confidence based on quality metrics
    const confidence = Math.min(1, (
      qualityMetrics.confidence * 0.4 +
      qualityMetrics.consistency * 0.3 +
      qualityMetrics.completeness * 0.2 +
      qualityMetrics.reliability * 0.1
    ));

    return {
      baseScores: scores,
      weightedScores: Object.fromEntries(
        Object.entries(scores).map(([type, score]) => [
          type,
          score * weights[type as keyof LayerWeights]
        ])
      ) as Record<AnalysisType, number>,
      penalties,
      bonuses,
      finalScore: adjustedScore,
      confidence,
    };
  }

  /**
   * Generate detailed evidence for the score
   */
  private generateEvidence(
    breakdown: ScoreBreakdown,
    results: AnalysisResult[],
    qualityMetrics: QualityMetrics
  ): ScoreEvidence {
    const calculations = [
      {
        step: 'base_calculation',
        description: 'Weighted average of layer scores',
        scores: breakdown.baseScores,
        weights: breakdown.weightedScores,
      },
      {
        step: 'quality_assessment',
        description: 'Quality metrics evaluation',
        metrics: qualityMetrics,
      },
      {
        step: 'adjustments',
        description: 'Penalties and bonuses applied',
        penalties: breakdown.penalties,
        bonuses: breakdown.bonuses,
      },
    ];

    const factors = [
      'Weighted combination of all analysis layers',
      'Quality and reliability of analysis results',
      'Consistency across different evaluation criteria',
      'Completeness of analysis coverage',
    ];

    const penalties = breakdown.penalties.map(p => p.reason);
    const bonuses = breakdown.bonuses.map(b => b.reason);

    const adjustments = [
      ...breakdown.penalties.map(p => ({
        type: 'penalty',
        amount: -p.amount,
        reason: p.reason,
      })),
      ...breakdown.bonuses.map(b => ({
        type: 'bonus',
        amount: b.amount,
        reason: b.reason,
      })),
    ];

    return {
      calculations,
      factors,
      penalties,
      bonuses,
      adjustments,
    };
  }

  /**
   * Get methodology description
   */
  private getMethodologyDescription(configuration?: ScoringConfiguration): string {
    const config = configuration || this.defaultConfiguration;
    const weights = SCORING_CONFIGURATIONS[config];

    return `Unified scoring using ${config.toLowerCase().replace('_', ' ')} configuration: ` +
      `Code Quality (${weights.codeQuality * 100}%), ` +
      `Innovation (${weights.innovation * 100}%), ` +
      `Coherence (${weights.coherence * 100}%), ` +
      `Blockchain Usage (${weights.hedera * 100}%)`;
  }

  /**
   * Public utility methods
   */

  /**
   * Validate score calculation inputs
   */
  validateResults(results: AnalysisResult[]): {
    valid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (results.length === 0) {
      issues.push('No analysis results provided');
      return { valid: false, issues, warnings };
    }

    // Check for required analysis types
    const completedTypes = new Set(
      results
        .filter(r => r.status === 'COMPLETED')
        .map(r => r.analysisType)
    );

    const requiredTypes: AnalysisType[] = ['CODE_QUALITY', 'INNOVATION', 'COHERENCE', 'HEDERA'];
    const missingTypes = requiredTypes.filter(type => !completedTypes.has(type));

    if (missingTypes.length > 0) {
      warnings.push(`Missing analysis types: ${missingTypes.join(', ')}`);
    }

    // Check for valid scores
    results.forEach(result => {
      if (result.status === 'COMPLETED') {
        if (result.score === undefined || result.score === null) {
          issues.push(`Missing score for ${result.analysisType} analysis`);
        } else if (result.score < 0 || result.score > 100) {
          issues.push(`Invalid score range for ${result.analysisType}: ${result.score}`);
        }
      }
    });

    // Check for quality issues
    results.forEach(result => {
      if (result.status === 'COMPLETED' && result.metadata.qualityMetrics) {
        const metrics = result.metadata.qualityMetrics;
        if (metrics.confidence < 0.5) {
          warnings.push(`Low confidence in ${result.analysisType}: ${(metrics.confidence * 100).toFixed(1)}%`);
        }
        if (metrics.biasScore > 0.5) {
          warnings.push(`High bias detected in ${result.analysisType}: ${(metrics.biasScore * 100).toFixed(1)}%`);
        }
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Compare two score calculations
   */
  compareScores(
    score1: UnifiedScore,
    score2: UnifiedScore
  ): {
    overallDifference: number;
    layerDifferences: Record<AnalysisType, number>;
    significantDifference: boolean;
    analysis: string;
  } {
    const overallDifference = score1.overall - score2.overall;

    const layerDifferences: Record<AnalysisType, number> = {
      CODE_QUALITY: score1.layers.CODE_QUALITY - score2.layers.CODE_QUALITY,
      INNOVATION: score1.layers.INNOVATION - score2.layers.INNOVATION,
      COHERENCE: score1.layers.COHERENCE - score2.layers.COHERENCE,
      HEDERA: score1.layers.HEDERA - score2.layers.HEDERA,
    };

    const significantDifference = Math.abs(overallDifference) > 5 ||
      Object.values(layerDifferences).some(diff => Math.abs(diff) > 10);

    let analysis = `Overall difference: ${overallDifference.toFixed(1)} points. `;

    if (significantDifference) {
      const largestDiff = Object.entries(layerDifferences)
        .reduce((max, [type, diff]) => Math.abs(diff) > Math.abs(max.diff) ? { type, diff } : max,
                { type: '', diff: 0 });
      analysis += `Largest layer difference: ${largestDiff.type} (${largestDiff.diff.toFixed(1)} points).`;
    } else {
      analysis += 'Differences are within normal variance.';
    }

    return {
      overallDifference,
      layerDifferences,
      significantDifference,
      analysis,
    };
  }

  /**
   * Get available scoring configurations
   */
  getAvailableConfigurations(): Array<{
    name: ScoringConfiguration;
    description: string;
    weights: LayerWeights;
  }> {
    return [
      {
        name: 'HACKATHON_STANDARD',
        description: 'Standard hackathon evaluation with balanced technical and innovation focus',
        weights: SCORING_CONFIGURATIONS.HACKATHON_STANDARD,
      },
      {
        name: 'INNOVATION_FOCUSED',
        description: 'Innovation-focused evaluation for creativity competitions',
        weights: SCORING_CONFIGURATIONS.INNOVATION_FOCUSED,
      },
      {
        name: 'TECHNICAL_FOCUSED',
        description: 'Technical implementation focused evaluation',
        weights: SCORING_CONFIGURATIONS.TECHNICAL_FOCUSED,
      },
      {
        name: 'BALANCED',
        description: 'Equal weight across all evaluation criteria',
        weights: SCORING_CONFIGURATIONS.BALANCED,
      },
    ];
  }
}