import {
  createCodeQualitySecurityManager,
  createCoherenceSecurityManager,
  createHederaSecurityManager,
  LayerSecurityManager,
  SecureAnalysisContext
} from './layer-security';
import { AnalysisRequest, AnalysisResult } from '../types';

export interface SecureAnalysisResult extends AnalysisResult {
  securityMetadata: {
    inputValidated: boolean;
    outputValidated: boolean;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    sanitizationApplied: boolean;
    quarantined: boolean;
    securityScanId: string;
    layerName: string;
  };
}

export interface SecurityWrapper {
  validateInput(request: AnalysisRequest): Promise<SecureAnalysisContext>;
  validateOutput(result: AnalysisResult, context: SecureAnalysisContext): Promise<{
    isValid: boolean;
    sanitizedResult?: AnalysisResult;
    issues: string[];
  }>;
  createSecureResult(
    result: AnalysisResult,
    context: SecureAnalysisContext,
    validation: any,
    scanId: string
  ): SecureAnalysisResult;
}

export class BaseSecurityWrapper implements SecurityWrapper {
  protected securityManager: LayerSecurityManager;
  protected layerName: string;
  private scanCounter: number = 0;

  constructor(securityManager: LayerSecurityManager, layerName: string) {
    this.securityManager = securityManager;
    this.layerName = layerName;
    this.setupSecurityEventHandlers();
  }

  private setupSecurityEventHandlers(): void {
    this.securityManager['securityEngine'].on('threatDetected', (event) => {
      console.warn(`[${this.layerName} SECURITY] Threat detected:`, {
        projectId: event.context?.split('-')[1] || 'unknown',
        threatLevel: event.result.threatLevel,
        threats: event.result.detectedThreats.map((t: any) => t.type),
        timestamp: event.timestamp
      });
    });
  }

  async validateInput(request: AnalysisRequest): Promise<SecureAnalysisContext> {
    return await this.securityManager.validateAnalysisRequest(request);
  }

  async validateOutput(result: AnalysisResult, context: SecureAnalysisContext) {
    return await this.securityManager.validateAnalysisResult(result, context);
  }

  createSecureResult(
    result: AnalysisResult,
    context: SecureAnalysisContext,
    validation: { isValid: boolean; sanitizedResult?: AnalysisResult; issues: string[] },
    scanId: string
  ): SecureAnalysisResult {
    const baseResult = validation.sanitizedResult || result;

    return {
      ...baseResult,
      securityMetadata: {
        inputValidated: true,
        outputValidated: validation.isValid,
        threatLevel: context.securityScan.threatLevel,
        sanitizationApplied: !!validation.sanitizedResult,
        quarantined: context.isQuarantined,
        securityScanId: scanId,
        layerName: this.layerName
      },
      metadata: {
        ...baseResult.metadata,
        securityScanResults: {
          inputThreats: context.securityScan.detectedThreats.length,
          outputIssues: validation.issues.length,
          overallSecurityScore: this.calculateSecurityScore(context, validation),
          securityVersion: '1.0.0'
        }
      }
    };
  }

  protected calculateSecurityScore(
    securityContext: SecureAnalysisContext,
    outputValidation: { isValid: boolean; issues: string[] }
  ): number {
    let score = 100;

    // Deduct points for input threats
    const inputThreatPenalty = securityContext.securityScan.detectedThreats.length * 10;
    score -= inputThreatPenalty;

    // Deduct points for output issues
    const outputIssuePenalty = outputValidation.issues.length * 5;
    score -= outputIssuePenalty;

    // Additional penalty for high-severity threats
    const criticalThreats = securityContext.securityScan.detectedThreats.filter(t => t.severity === 'CRITICAL').length;
    score -= criticalThreats * 20;

    return Math.max(0, score);
  }

  generateScanId(projectId: string): string {
    return `${this.layerName.toLowerCase()}-${projectId}-${++this.scanCounter}`;
  }

  createQuarantinedResponse(
    projectId: string,
    analysisType: string,
    securityContext: SecureAnalysisContext,
    scanId: string
  ): SecureAnalysisResult {
    return {
      status: 'FAILED',
      projectId,
      type: analysisType as any,
      score: 0,
      summary: `${this.layerName} analysis blocked due to security threats`,
      details: 'This analysis request has been quarantined due to security concerns.',
      recommendations: ['Contact security team for manual review'],
      metadata: {
        quarantineReason: 'Security threat detection',
        detectedThreats: securityContext.securityScan.detectedThreats.map(t => ({
          type: t.type,
          severity: t.severity,
          description: t.description
        })),
        processingTime: 0
      },
      securityMetadata: {
        inputValidated: true,
        outputValidated: false,
        threatLevel: securityContext.securityScan.threatLevel,
        sanitizationApplied: false,
        quarantined: true,
        securityScanId: scanId,
        layerName: this.layerName
      }
    };
  }

  async performLayerSpecificSecurityChecks(request: AnalysisRequest): Promise<void> {
    // Base implementation - can be overridden by specific layers
    if (request.repositoryUrl) {
      // Check for suspicious URLs
      const suspiciousPatterns = [
        /localhost/i,
        /127\.0\.0\.1/,
        /internal/i,
        /admin/i,
        /test.*injection/i
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(request.repositoryUrl)) {
          console.warn(`[${this.layerName} SECURITY] Suspicious repository URL detected:`, request.repositoryUrl);
          break;
        }
      }
    }
  }

  // Common security metrics and management
  async getSecurityMetrics() {
    return this.securityManager.getSecurityMetrics();
  }

  async updateSecurityConfig(config: any) {
    this.securityManager.updateSecurityConfig(config);
  }

  async isProjectQuarantined(projectId: string): Promise<boolean> {
    return this.securityManager.isRequestQuarantined(projectId);
  }

  async releaseFromQuarantine(projectId: string): Promise<void> {
    this.securityManager.releaseFromQuarantine(projectId);
  }
}

// Code Quality Security Wrapper
export class CodeQualitySecurityWrapper extends BaseSecurityWrapper {
  constructor() {
    super(createCodeQualitySecurityManager(), 'CodeQuality');
  }

  async performLayerSpecificSecurityChecks(request: AnalysisRequest): Promise<void> {
    await super.performLayerSpecificSecurityChecks(request);

    // Code quality specific checks
    if (request.options) {
      const options = request.options;

      // Check for excessive file limits that might cause DoS
      if (options.maxFiles && options.maxFiles > 1000) {
        throw new Error('Maximum file limit too high - potential DoS attack');
      }

      // Check for suspicious analysis parameters
      if (options.analysisDepth && options.analysisDepth === 'UNLIMITED') {
        console.warn('[CODE QUALITY SECURITY] Unlimited analysis depth requested - monitoring closely');
      }
    }
  }
}

// Coherence Security Wrapper
export class CoherenceSecurityWrapper extends BaseSecurityWrapper {
  constructor() {
    super(createCoherenceSecurityManager(), 'Coherence');
  }

  async performLayerSpecificSecurityChecks(request: AnalysisRequest): Promise<void> {
    await super.performLayerSpecificSecurityChecks(request);

    // Coherence specific checks
    if (request.options?.trackRequirements) {
      const requirements = JSON.stringify(request.options.trackRequirements);

      // Check for injection attempts in track requirements
      const injectionPatterns = [
        /<script/i,
        /javascript:/i,
        /eval\(/i,
        /function\(/i
      ];

      for (const pattern of injectionPatterns) {
        if (pattern.test(requirements)) {
          throw new Error('Script injection detected in track requirements');
        }
      }
    }
  }
}

// Hedera Security Wrapper
export class HederaSecurityWrapper extends BaseSecurityWrapper {
  constructor() {
    super(createHederaSecurityManager(), 'Hedera');
  }

  async performLayerSpecificSecurityChecks(request: AnalysisRequest): Promise<void> {
    await super.performLayerSpecificSecurityChecks(request);

    // Hedera specific checks
    if (request.options?.hederaNetworkConfig) {
      const networkConfig = request.options.hederaNetworkConfig;

      // Check for malicious network configurations
      if (typeof networkConfig === 'object') {
        const configString = JSON.stringify(networkConfig);

        // Prevent attempts to connect to unauthorized networks
        const unauthorizedNetworks = [
          'mainnet-private',
          'custom-network',
          'localhost',
          '127.0.0.1'
        ];

        for (const network of unauthorizedNetworks) {
          if (configString.includes(network)) {
            throw new Error(`Unauthorized Hedera network configuration detected: ${network}`);
          }
        }
      }
    }

    // Check for suspicious smart contract patterns
    if (request.options?.includeSmartContracts) {
      console.warn('[HEDERA SECURITY] Smart contract analysis requested - monitoring for malicious patterns');
    }
  }
}

// Factory function to create security wrappers
export const createSecurityWrapper = (layerType: 'CODE_QUALITY' | 'COHERENCE' | 'HEDERA' | 'INNOVATION') => {
  switch (layerType) {
    case 'CODE_QUALITY':
      return new CodeQualitySecurityWrapper();
    case 'COHERENCE':
      return new CoherenceSecurityWrapper();
    case 'HEDERA':
      return new HederaSecurityWrapper();
    default:
      throw new Error(`Unsupported layer type: ${layerType}`);
  }
};

// Unified security orchestrator for all layers
export class UnifiedSecurityOrchestrator {
  private wrappers: Map<string, BaseSecurityWrapper> = new Map();

  constructor() {
    this.wrappers.set('CODE_QUALITY', new CodeQualitySecurityWrapper());
    this.wrappers.set('COHERENCE', new CoherenceSecurityWrapper());
    this.wrappers.set('HEDERA', new HederaSecurityWrapper());
  }

  async validateAnalysisRequest(request: AnalysisRequest, layerType: string): Promise<SecureAnalysisContext> {
    const wrapper = this.wrappers.get(layerType);
    if (!wrapper) {
      throw new Error(`No security wrapper found for layer: ${layerType}`);
    }

    return await wrapper.validateInput(request);
  }

  async validateAnalysisResult(
    result: AnalysisResult,
    context: SecureAnalysisContext,
    layerType: string
  ) {
    const wrapper = this.wrappers.get(layerType);
    if (!wrapper) {
      throw new Error(`No security wrapper found for layer: ${layerType}`);
    }

    return await wrapper.validateOutput(result, context);
  }

  async getSecurityMetricsForAllLayers() {
    const metrics: Record<string, any> = {};

    for (const [layerType, wrapper] of this.wrappers) {
      metrics[layerType] = await wrapper.getSecurityMetrics();
    }

    return {
      layers: metrics,
      totalQuarantined: Object.values(metrics).reduce((sum: number, metric: any) => sum + metric.quarantinedRequestsCount, 0),
      averageSecurityScore: this.calculateAverageSecurityScore(metrics),
      lastUpdated: new Date().toISOString()
    };
  }

  private calculateAverageSecurityScore(metrics: Record<string, any>): number {
    const scores = Object.values(metrics).map((metric: any) =>
      100 - (metric.quarantinedRequestsCount * 10) // Simple scoring heuristic
    );

    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 100;
  }

  async performSystemWideSecurityAudit(): Promise<{
    overallHealthScore: number;
    layerStatus: Record<string, string>;
    recommendations: string[];
    criticalIssues: string[];
  }> {
    const metrics = await this.getSecurityMetricsForAllLayers();
    const recommendations: string[] = [];
    const criticalIssues: string[] = [];
    const layerStatus: Record<string, string> = {};

    let overallHealthScore = 100;

    for (const [layerType, metric] of Object.entries(metrics.layers)) {
      const layerScore = 100 - (metric.quarantinedRequestsCount * 10);

      if (layerScore < 50) {
        layerStatus[layerType] = 'CRITICAL';
        criticalIssues.push(`${layerType} layer has high quarantine rate`);
        overallHealthScore -= 20;
      } else if (layerScore < 80) {
        layerStatus[layerType] = 'WARNING';
        recommendations.push(`Review security configuration for ${layerType} layer`);
        overallHealthScore -= 10;
      } else {
        layerStatus[layerType] = 'HEALTHY';
      }
    }

    if (overallHealthScore < 70) {
      criticalIssues.push('Overall system security health is below acceptable threshold');
    }

    if (recommendations.length === 0 && criticalIssues.length === 0) {
      recommendations.push('Security system operating optimally');
    }

    return {
      overallHealthScore: Math.max(0, overallHealthScore),
      layerStatus,
      recommendations,
      criticalIssues
    };
  }
}

export const unifiedSecurityOrchestrator = new UnifiedSecurityOrchestrator();