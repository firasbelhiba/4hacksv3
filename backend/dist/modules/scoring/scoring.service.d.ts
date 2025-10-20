export declare const SCORING_CONFIGURATIONS: {
    readonly HACKATHON_STANDARD: {
        readonly codeQuality: 0.35;
        readonly innovation: 0.25;
        readonly coherence: 0.25;
        readonly hedera: 0.15;
    };
    readonly INNOVATION_FOCUSED: {
        readonly codeQuality: 0.25;
        readonly innovation: 0.4;
        readonly coherence: 0.2;
        readonly hedera: 0.15;
    };
    readonly TECHNICAL_FOCUSED: {
        readonly codeQuality: 0.5;
        readonly innovation: 0.2;
        readonly coherence: 0.2;
        readonly hedera: 0.1;
    };
    readonly BALANCED: {
        readonly codeQuality: 0.25;
        readonly innovation: 0.25;
        readonly coherence: 0.25;
        readonly hedera: 0.25;
    };
};
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
    penalties: Array<{
        type: string;
        amount: number;
        reason: string;
    }>;
    bonuses: Array<{
        type: string;
        amount: number;
        reason: string;
    }>;
    finalScore: number;
}
export interface ScoreCalculationOptions {
    configuration?: ScoringConfiguration;
    customWeights?: Partial<LayerWeights>;
    applyQualityAdjustments?: boolean;
}
export declare class ScoringService {
    calculateUnifiedScore(layerScores: Partial<LayerScores>, options?: ScoreCalculationOptions): UnifiedScore;
    private getWeights;
    private normalizeScores;
    private normalizeScore;
    private calculateWithWeights;
    private calculateCompleteness;
    private getMethodologyDescription;
    getAvailableConfigurations(): Array<{
        name: ScoringConfiguration;
        description: string;
        weights: LayerWeights;
    }>;
    compareScores(score1: UnifiedScore, score2: UnifiedScore): {
        overallDifference: number;
        layerDifferences: LayerScores;
        significantDifference: boolean;
        analysis: string;
    };
}
