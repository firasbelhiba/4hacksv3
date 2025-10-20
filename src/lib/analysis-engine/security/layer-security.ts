import { PromptSecurityEngine, SecurityScanResult, SecurityConfig } from './prompt-security';
import { AnalysisRequest, AnalysisResult } from '../types';

export interface LayerSecurityConfig extends Partial<SecurityConfig> {
  layerName: string;
  enableContentValidation: boolean;
  enableResultValidation: boolean;
  quarantineThreshold: 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SecureAnalysisContext {
  originalRequest: AnalysisRequest;
  sanitizedRequest?: AnalysisRequest;
  securityScan: SecurityScanResult;
  isQuarantined: boolean;
  securityMetadata: {
    scanTimestamp: string;
    layerName: string;
    securityVersion: string;
  };
}

export class LayerSecurityManager {
  private securityEngine: PromptSecurityEngine;
  private config: LayerSecurityConfig;
  private quarantinedRequests: Set<string> = new Set();

  constructor(config: LayerSecurityConfig) {
    this.config = {
      enableContentValidation: true,
      enableResultValidation: true,
      quarantineThreshold: 'HIGH',
      ...config
    };

    this.securityEngine = new PromptSecurityEngine({
      enableRealTimeScanning: true,
      threatThreshold: this.config.quarantineThreshold,
      enableAutoSanitization: true,
      enableLogging: true,
      maxContentLength: 50000,
      ...config
    });

    this.setupSecurityEventHandlers();
  }

  private setupSecurityEventHandlers(): void {
    this.securityEngine.on('threatDetected', (event) => {
      console.warn(`[${this.config.layerName}] Security threat detected:`, event);

      if (event.result.threatLevel === 'CRITICAL') {
        this.escalateSecurityIncident(event);
      }
    });
  }

  async validateAnalysisRequest(request: AnalysisRequest): Promise<SecureAnalysisContext> {
    const context: SecureAnalysisContext = {
      originalRequest: request,
      securityScan: {
        isSecure: true,
        threatLevel: 'LOW',
        detectedThreats: [],
        confidence: 1.0
      },
      isQuarantined: false,
      securityMetadata: {
        scanTimestamp: new Date().toISOString(),
        layerName: this.config.layerName,
        securityVersion: '1.0.0'
      }
    };

    if (!this.config.enableContentValidation) {
      return context;
    }

    // Scan repository URL for malicious patterns
    if (request.repositoryUrl) {
      const urlScan = await this.securityEngine.scanContent(
        request.repositoryUrl,
        `${this.config.layerName}-repository-url`
      );

      if (!urlScan.isSecure) {
        context.securityScan = this.mergeScanResults(context.securityScan, urlScan);
      }
    }

    // Scan analysis options for injection attempts
    if (request.options) {
      const optionsContent = JSON.stringify(request.options);
      const optionsScan = await this.securityEngine.scanContent(
        optionsContent,
        `${this.config.layerName}-options`
      );

      if (!optionsScan.isSecure) {
        context.securityScan = this.mergeScanResults(context.securityScan, optionsScan);
      }
    }

    // Check if request should be quarantined
    if (this.shouldQuarantineRequest(context.securityScan)) {
      context.isQuarantined = true;
      this.quarantinedRequests.add(request.projectId);

      console.error(`[${this.config.layerName}] Request quarantined:`, {
        projectId: request.projectId,
        threatLevel: context.securityScan.threatLevel,
        threatsCount: context.securityScan.detectedThreats.length
      });
    }

    // Create sanitized request if auto-sanitization is enabled
    if (!context.securityScan.isSecure && context.securityScan.sanitizedContent) {
      context.sanitizedRequest = this.createSanitizedRequest(request, context.securityScan);
    }

    return context;
  }

  async validateAnalysisResult(
    result: AnalysisResult,
    context: SecureAnalysisContext
  ): Promise<{ isValid: boolean; sanitizedResult?: AnalysisResult; issues: string[] }> {
    if (!this.config.enableResultValidation) {
      return { isValid: true, issues: [] };
    }

    const issues: string[] = [];

    // Validate result structure
    if (!this.isValidResultStructure(result)) {
      issues.push('Invalid result structure detected');
    }

    // Scan text fields for potential security issues
    const textFields = this.extractTextFields(result);
    for (const [fieldName, content] of textFields) {
      const scan = await this.securityEngine.scanContent(
        content,
        `${this.config.layerName}-result-${fieldName}`
      );

      if (!scan.isSecure) {
        issues.push(`Security threat in ${fieldName}: ${scan.detectedThreats.map(t => t.type).join(', ')}`);
      }
    }

    // Check for suspicious scoring patterns that might indicate manipulation
    if (this.hasAnomalousScoring(result)) {
      issues.push('Anomalous scoring pattern detected');
    }

    const isValid = issues.length === 0;
    let sanitizedResult: AnalysisResult | undefined;

    if (!isValid && this.securityEngine['config'].enableAutoSanitization) {
      sanitizedResult = await this.sanitizeAnalysisResult(result);
    }

    return { isValid, sanitizedResult, issues };
  }

  private mergeScanResults(base: SecurityScanResult, additional: SecurityScanResult): SecurityScanResult {
    const allThreats = [...base.detectedThreats, ...additional.detectedThreats];
    const maxThreatLevel = this.getMaxThreatLevel(base.threatLevel, additional.threatLevel);

    return {
      isSecure: base.isSecure && additional.isSecure,
      threatLevel: maxThreatLevel,
      detectedThreats: allThreats,
      confidence: Math.min(base.confidence, additional.confidence)
    };
  }

  private getMaxThreatLevel(a: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', b: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const levels = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
    const maxLevel = Math.max(levels[a], levels[b]);
    return Object.keys(levels).find(key => levels[key as keyof typeof levels] === maxLevel) as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }

  private shouldQuarantineRequest(scan: SecurityScanResult): boolean {
    const thresholds = { 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
    const scanLevel = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 }[scan.threatLevel];
    const threshold = thresholds[this.config.quarantineThreshold];

    return scanLevel >= threshold;
  }

  private createSanitizedRequest(original: AnalysisRequest, scan: SecurityScanResult): AnalysisRequest {
    const sanitized: AnalysisRequest = { ...original };

    if (scan.sanitizedContent && original.repositoryUrl) {
      // Only sanitize if the repository URL was the source of threats
      const urlThreats = scan.detectedThreats.filter(t =>
        t.location.start < original.repositoryUrl!.length
      );

      if (urlThreats.length > 0) {
        sanitized.repositoryUrl = scan.sanitizedContent;
      }
    }

    return sanitized;
  }

  private isValidResultStructure(result: AnalysisResult): boolean {
    return (
      typeof result === 'object' &&
      result !== null &&
      typeof result.status === 'string' &&
      typeof result.projectId === 'string' &&
      (!result.score || typeof result.score === 'number') &&
      (!result.metadata || typeof result.metadata === 'object')
    );
  }

  private extractTextFields(result: AnalysisResult): Array<[string, string]> {
    const textFields: Array<[string, string]> = [];

    // Extract common text fields that might contain user-controllable content
    if (result.summary && typeof result.summary === 'string') {
      textFields.push(['summary', result.summary]);
    }

    if (result.details && typeof result.details === 'string') {
      textFields.push(['details', result.details]);
    }

    if (result.recommendations) {
      if (typeof result.recommendations === 'string') {
        textFields.push(['recommendations', result.recommendations]);
      } else if (Array.isArray(result.recommendations)) {
        result.recommendations.forEach((rec, index) => {
          if (typeof rec === 'string') {
            textFields.push([`recommendations[${index}]`, rec]);
          }
        });
      }
    }

    if (result.metadata) {
      Object.entries(result.metadata).forEach(([key, value]) => {
        if (typeof value === 'string') {
          textFields.push([`metadata.${key}`, value]);
        }
      });
    }

    return textFields;
  }

  private hasAnomalousScoring(result: AnalysisResult): boolean {
    if (!result.score) return false;

    // Check for impossible scores
    if (result.score < 0 || result.score > 100) {
      return true;
    }

    // Check for suspicious perfect scores that might indicate manipulation
    if (result.score === 100 && result.status === 'COMPLETED') {
      // Perfect scores should be rare in legitimate analysis
      return true;
    }

    return false;
  }

  private async sanitizeAnalysisResult(result: AnalysisResult): Promise<AnalysisResult> {
    const sanitized: AnalysisResult = { ...result };

    // Sanitize text fields
    const textFields = this.extractTextFields(result);
    for (const [fieldPath, content] of textFields) {
      const scan = await this.securityEngine.scanContent(content, 'result-sanitization');
      if (scan.sanitizedContent) {
        this.setNestedProperty(sanitized, fieldPath, scan.sanitizedContent);
      }
    }

    // Normalize suspicious scores
    if (this.hasAnomalousScoring(result)) {
      sanitized.score = Math.max(0, Math.min(100, result.score || 0));
    }

    return sanitized;
  }

  private setNestedProperty(obj: any, path: string, value: string): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  private escalateSecurityIncident(event: any): void {
    // Log critical security incident
    console.error(`[CRITICAL SECURITY] ${this.config.layerName} layer security incident:`, {
      timestamp: event.timestamp,
      threatLevel: event.result.threatLevel,
      threats: event.result.detectedThreats,
      context: event.context
    });

    // In a production environment, this would:
    // 1. Send alerts to security team
    // 2. Update security dashboards
    // 3. Potentially block the requesting IP
    // 4. Generate incident reports
  }

  isRequestQuarantined(projectId: string): boolean {
    return this.quarantinedRequests.has(projectId);
  }

  releaseFromQuarantine(projectId: string): void {
    this.quarantinedRequests.delete(projectId);
  }

  getSecurityMetrics() {
    return {
      quarantinedRequestsCount: this.quarantinedRequests.size,
      engineMetrics: this.securityEngine.getSecurityMetrics(),
      layerName: this.config.layerName,
      configSnapshot: { ...this.config }
    };
  }

  updateSecurityConfig(newConfig: Partial<LayerSecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.securityEngine.updateConfig(newConfig);
  }
}

// Factory functions for each analysis layer
export const createCodeQualitySecurityManager = (config: Partial<LayerSecurityConfig> = {}) => {
  return new LayerSecurityManager({
    layerName: 'CodeQuality',
    enableContentValidation: true,
    enableResultValidation: true,
    quarantineThreshold: 'HIGH',
    threatThreshold: 'MEDIUM',
    ...config
  });
};

export const createInnovationSecurityManager = (config: Partial<LayerSecurityConfig> = {}) => {
  return new LayerSecurityManager({
    layerName: 'Innovation',
    enableContentValidation: true,
    enableResultValidation: true,
    quarantineThreshold: 'HIGH',
    threatThreshold: 'MEDIUM',
    ...config
  });
};

export const createCoherenceSecurityManager = (config: Partial<LayerSecurityConfig> = {}) => {
  return new LayerSecurityManager({
    layerName: 'Coherence',
    enableContentValidation: true,
    enableResultValidation: true,
    quarantineThreshold: 'HIGH',
    threatThreshold: 'MEDIUM',
    ...config
  });
};

export const createHederaSecurityManager = (config: Partial<LayerSecurityConfig> = {}) => {
  return new LayerSecurityManager({
    layerName: 'Hedera',
    enableContentValidation: true,
    enableResultValidation: true,
    quarantineThreshold: 'HIGH',
    threatThreshold: 'MEDIUM',
    ...config
  });
};