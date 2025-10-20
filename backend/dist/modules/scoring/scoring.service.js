"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringService = exports.SCORING_CONFIGURATIONS = void 0;
const common_1 = require("@nestjs/common");
exports.SCORING_CONFIGURATIONS = {
    HACKATHON_STANDARD: {
        codeQuality: 0.35,
        innovation: 0.25,
        coherence: 0.25,
        hedera: 0.15,
    },
    INNOVATION_FOCUSED: {
        codeQuality: 0.25,
        innovation: 0.4,
        coherence: 0.2,
        hedera: 0.15,
    },
    TECHNICAL_FOCUSED: {
        codeQuality: 0.5,
        innovation: 0.2,
        coherence: 0.2,
        hedera: 0.1,
    },
    BALANCED: {
        codeQuality: 0.25,
        innovation: 0.25,
        coherence: 0.25,
        hedera: 0.25,
    },
};
let ScoringService = class ScoringService {
    calculateUnifiedScore(layerScores, options = {}) {
        const weights = this.getWeights(options.configuration, options.customWeights);
        const scores = this.normalizeScores(layerScores);
        const breakdown = this.calculateWithWeights(scores, weights, options);
        const completeness = this.calculateCompleteness(scores);
        const confidence = Math.min(1, completeness * 1.2);
        return {
            overall: Math.max(0, Math.min(100, breakdown.finalScore)),
            layers: scores,
            weights,
            methodology: this.getMethodologyDescription(options.configuration),
            confidence,
            breakdown,
        };
    }
    getWeights(configuration, customWeights) {
        const baseWeights = exports.SCORING_CONFIGURATIONS[configuration || 'HACKATHON_STANDARD'];
        if (customWeights) {
            return { ...baseWeights, ...customWeights };
        }
        return baseWeights;
    }
    normalizeScores(scores) {
        return {
            codeQuality: this.normalizeScore(scores.codeQuality),
            innovation: this.normalizeScore(scores.innovation),
            coherence: this.normalizeScore(scores.coherence),
            hedera: this.normalizeScore(scores.hedera),
        };
    }
    normalizeScore(score) {
        if (score === undefined || score === null)
            return 0;
        return Math.max(0, Math.min(100, score));
    }
    calculateWithWeights(scores, weights, options) {
        const penalties = [];
        const bonuses = [];
        const weightedScores = {
            codeQuality: scores.codeQuality * weights.codeQuality,
            innovation: scores.innovation * weights.innovation,
            coherence: scores.coherence * weights.coherence,
            hedera: scores.hedera * weights.hedera,
        };
        let baseScore = 0;
        let totalWeight = 0;
        Object.entries(weights).forEach(([layer, weight]) => {
            const layerScore = scores[layer];
            if (layerScore > 0) {
                baseScore += layerScore * weight;
                totalWeight += weight;
            }
        });
        const adjustedScore = totalWeight > 0 ? baseScore / totalWeight : 0;
        let finalScore = adjustedScore;
        if (options.applyQualityAdjustments) {
            const completeness = this.calculateCompleteness(scores);
            if (completeness < 1) {
                const penalty = (1 - completeness) * 10;
                penalties.push({
                    type: 'incomplete_analysis',
                    amount: penalty,
                    reason: `Missing ${Math.round((1 - completeness) * 4)} analysis layer(s)`,
                });
                finalScore -= penalty;
            }
            if (adjustedScore >= 90) {
                const bonus = 5;
                bonuses.push({
                    type: 'exceptional',
                    amount: bonus,
                    reason: 'Exceptional overall performance',
                });
                finalScore += bonus;
            }
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
    calculateCompleteness(scores) {
        const totalLayers = 4;
        const completedLayers = Object.values(scores).filter(score => score > 0).length;
        return completedLayers / totalLayers;
    }
    getMethodologyDescription(configuration) {
        const config = configuration || 'HACKATHON_STANDARD';
        const weights = exports.SCORING_CONFIGURATIONS[config];
        return (`Unified scoring using ${config.toLowerCase().replace('_', ' ')} configuration: ` +
            `Code Quality (${weights.codeQuality * 100}%), ` +
            `Innovation (${weights.innovation * 100}%), ` +
            `Coherence (${weights.coherence * 100}%), ` +
            `Blockchain Usage (${weights.hedera * 100}%)`);
    }
    getAvailableConfigurations() {
        return [
            {
                name: 'HACKATHON_STANDARD',
                description: 'Standard hackathon evaluation with balanced technical and innovation focus',
                weights: exports.SCORING_CONFIGURATIONS.HACKATHON_STANDARD,
            },
            {
                name: 'INNOVATION_FOCUSED',
                description: 'Innovation-focused evaluation for creativity competitions',
                weights: exports.SCORING_CONFIGURATIONS.INNOVATION_FOCUSED,
            },
            {
                name: 'TECHNICAL_FOCUSED',
                description: 'Technical implementation focused evaluation',
                weights: exports.SCORING_CONFIGURATIONS.TECHNICAL_FOCUSED,
            },
            {
                name: 'BALANCED',
                description: 'Equal weight across all evaluation criteria',
                weights: exports.SCORING_CONFIGURATIONS.BALANCED,
            },
        ];
    }
    compareScores(score1, score2) {
        const overallDifference = score1.overall - score2.overall;
        const layerDifferences = {
            codeQuality: score1.layers.codeQuality - score2.layers.codeQuality,
            innovation: score1.layers.innovation - score2.layers.innovation,
            coherence: score1.layers.coherence - score2.layers.coherence,
            hedera: score1.layers.hedera - score2.layers.hedera,
        };
        const significantDifference = Math.abs(overallDifference) > 5 ||
            Object.values(layerDifferences).some(diff => Math.abs(diff) > 10);
        let analysis = `Overall difference: ${overallDifference.toFixed(1)} points. `;
        if (significantDifference) {
            const largestDiff = Object.entries(layerDifferences).reduce((max, [type, diff]) => (Math.abs(diff) > Math.abs(max.diff) ? { type, diff } : max), { type: '', diff: 0 });
            analysis += `Largest layer difference: ${largestDiff.type} (${largestDiff.diff.toFixed(1)} points).`;
        }
        else {
            analysis += 'Differences are within normal variance.';
        }
        return {
            overallDifference,
            layerDifferences,
            significantDifference,
            analysis,
        };
    }
};
exports.ScoringService = ScoringService;
exports.ScoringService = ScoringService = __decorate([
    (0, common_1.Injectable)()
], ScoringService);
//# sourceMappingURL=scoring.service.js.map