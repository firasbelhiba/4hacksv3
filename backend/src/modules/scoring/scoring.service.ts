import { Injectable } from '@nestjs/common';

// Standardized weight configurations
export const SCORING_CONFIGURATIONS = {
  HACKATHON_STANDARD: {
    codeQuality: 0.35, // 35% - Technical implementation quality
    innovation: 0.25, // 25% - Innovation and creativity
    coherence: 0.25, // 25% - Project coherence and alignment
    hedera: 0.15, // 15% - Blockchain technology usage
  },
  INNOVATION_FOCUSED: {
    codeQuality: 0.25,
    innovation: 0.4, // 40% - For innovation-focused competitions
    coherence: 0.2,
    hedera: 0.15,
  },
  TECHNICAL_FOCUSED: {
    codeQuality: 0.5, // 50% - For technical competitions
    innovation: 0.2,
    coherence: 0.2,
    hedera: 0.1,
  },
  BALANCED: {
    codeQuality: 0.25, // Equal weight distribution
    innovation: 0.25,
    coherence: 0.25,
    hedera: 0.25,
  },
} as const;

export type ScoringConfiguration = keyof typeof SCORING_CONFIGURATIONS;

export interface LayerWeights {
  codeQuality: number;
  innovation: number;
  coherence: number;
  hedera: number;
}

export interface LayerScores {
  codeQuality: number;
  innovation: number;
  coherence: number;
  hedera: number;
}

export interface UnifiedScore {
  overall: number;
  layers: LayerScores;
  weights: LayerWeights;
  methodology: string;
  confidence: number;
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  baseScores: LayerScores;
  weightedScores: LayerScores;
  penalties: Array<{ type: string; amount: number; reason: string }>;
  bonuses: Array<{ type: string; amount: number; reason: string }>;
  finalScore: number;
}

export interface ScoreCalculationOptions {
  configuration?: ScoringConfiguration;
  customWeights?: Partial<LayerWeights>;
  applyQualityAdjustments?: boolean;
}

@Injectable()
export class ScoringService {
  /**
   * Calculate unified score from layer scores
   */
  calculateUnifiedScore(
    layerScores: Partial<LayerScores>,
    options: ScoreCalculationOptions = {}
  ): UnifiedScore {
    // Get configuration weights
    const weights = this.getWeights(options.configuration, options.customWeights);

    // Normalize scores
    const scores = this.normalizeScores(layerScores);

    // Calculate base weighted score
    const breakdown = this.calculateWithWeights(scores, weights, options);

    // Calculate confidence based on completeness
    const completeness = this.calculateCompleteness(scores);
    const confidence = Math.min(1, completeness * 1.2); // Boost confidence slightly if all layers present

    return {
      overall: Math.max(0, Math.min(100, breakdown.finalScore)),
      layers: scores,
      weights,
      methodology: this.getMethodologyDescription(options.configuration),
      confidence,
      breakdown,
    };
  }

  /**
   * Get weights for calculation
   */
  private getWeights(
    configuration?: ScoringConfiguration,
    customWeights?: Partial<LayerWeights>
  ): LayerWeights {
    const baseWeights = SCORING_CONFIGURATIONS[configuration || 'HACKATHON_STANDARD'];

    if (customWeights) {
      return { ...baseWeights, ...customWeights };
    }

    return baseWeights;
  }

  /**
   * Normalize scores to 0-100 range and fill missing with defaults
   */
  private normalizeScores(scores: Partial<LayerScores>): LayerScores {
    return {
      codeQuality: this.normalizeScore(scores.codeQuality),
      innovation: this.normalizeScore(scores.innovation),
      coherence: this.normalizeScore(scores.coherence),
      hedera: this.normalizeScore(scores.hedera),
    };
  }

  /**
   * Normalize single score to 0-100 range, default to 0
   */
  private normalizeScore(score?: number): number {
    if (score === undefined || score === null) return 0;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate score with weights and adjustments
   */
  private calculateWithWeights(
    scores: LayerScores,
    weights: LayerWeights,
    options: ScoreCalculationOptions
  ): ScoreBreakdown {
    const penalties: Array<{ type: string; amount: number; reason: string }> = [];
    const bonuses: Array<{ type: string; amount: number; reason: string }> = [];

    // Calculate weighted scores
    const weightedScores: LayerScores = {
      codeQuality: scores.codeQuality * weights.codeQuality,
      innovation: scores.innovation * weights.innovation,
      coherence: scores.coherence * weights.coherence,
      hedera: scores.hedera * weights.hedera,
    };

    // Calculate base score
    let baseScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([layer, weight]) => {
      const layerScore = scores[layer as keyof LayerScores];
      if (layerScore > 0) {
        // Only include layers with valid scores
        baseScore += layerScore * weight;
        totalWeight += weight;
      }
    });

    // Normalize to account for missing layers
    const adjustedScore = totalWeight > 0 ? baseScore / totalWeight : 0;

    let finalScore = adjustedScore;

    if (options.applyQualityAdjustments) {
      // Apply completeness penalty
      const completeness = this.calculateCompleteness(scores);
      if (completeness < 1) {
        const penalty = (1 - completeness) * 10; // 10 points penalty per missing layer
        penalties.push({
          type: 'incomplete_analysis',
          amount: penalty,
          reason: `Missing ${Math.round((1 - completeness) * 4)} analysis layer(s)`,
        });
        finalScore -= penalty;
      }

      // Apply exceptional performance bonus
      if (adjustedScore >= 90) {
        const bonus = 5;
        bonuses.push({
          type: 'exceptional',
          amount: bonus,
          reason: 'Exceptional overall performance',
        });
        finalScore += bonus;
      }

      // Apply all-layers-complete bonus
      if (completeness === 1 && adjustedScore >= 80) {
        const bonus = 2;
        bonuses.push({
          type: 'completeness',
          amount: bonus,
          reason: 'Complete analysis across all layers',
        });
        finalScore += bonus;
      }
    }

    return {
      baseScores: scores,
      weightedScores,
      penalties,
      bonuses,
      finalScore,
    };
  }

  /**
   * Calculate completeness (0-1) based on how many layers have scores
   */
  private calculateCompleteness(scores: LayerScores): number {
    const totalLayers = 4;
    const completedLayers = Object.values(scores).filter(score => score > 0).length;
    return completedLayers / totalLayers;
  }

  /**
   * Get methodology description
   */
  private getMethodologyDescription(configuration?: ScoringConfiguration): string {
    const config = configuration || 'HACKATHON_STANDARD';
    const weights = SCORING_CONFIGURATIONS[config];

    return (
      `Unified scoring using ${config.toLowerCase().replace('_', ' ')} configuration: ` +
      `Code Quality (${weights.codeQuality * 100}%), ` +
      `Innovation (${weights.innovation * 100}%), ` +
      `Coherence (${weights.coherence * 100}%), ` +
      `Blockchain Usage (${weights.hedera * 100}%)`
    );
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

  /**
   * Compare two scores
   */
  compareScores(score1: UnifiedScore, score2: UnifiedScore): {
    overallDifference: number;
    layerDifferences: LayerScores;
    significantDifference: boolean;
    analysis: string;
  } {
    const overallDifference = score1.overall - score2.overall;

    const layerDifferences: LayerScores = {
      codeQuality: score1.layers.codeQuality - score2.layers.codeQuality,
      innovation: score1.layers.innovation - score2.layers.innovation,
      coherence: score1.layers.coherence - score2.layers.coherence,
      hedera: score1.layers.hedera - score2.layers.hedera,
    };

    const significantDifference =
      Math.abs(overallDifference) > 5 ||
      Object.values(layerDifferences).some(diff => Math.abs(diff) > 10);

    let analysis = `Overall difference: ${overallDifference.toFixed(1)} points. `;

    if (significantDifference) {
      const largestDiff = (
        Object.entries(layerDifferences) as [keyof LayerScores, number][]
      ).reduce(
        (max, [type, diff]) => (Math.abs(diff) > Math.abs(max.diff) ? { type, diff } : max),
        { type: '' as keyof LayerScores | '', diff: 0 }
      );
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
}
