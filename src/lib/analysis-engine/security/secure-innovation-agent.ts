import { innovationAgent, InnovationAnalysisOptions } from '@/lib/ai-agents/innovation-agent';
import { createInnovationSecurityManager, LayerSecurityManager, SecureAnalysisContext } from './layer-security';
import { AnalysisRequest, AnalysisResult } from '../types';

export interface SecureInnovationResult extends AnalysisResult {
  securityMetadata: {
    inputValidated: boolean;
    outputValidated: boolean;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    sanitizationApplied: boolean;
    quarantined: boolean;
    securityScanId: string;
  };
}

export class SecureInnovationAgent {
  private securityManager: LayerSecurityManager;
  private scanCounter: number = 0;

  constructor() {
    this.securityManager = createInnovationSecurityManager({
      enableContentValidation: true,
      enableResultValidation: true,
      quarantineThreshold: 'HIGH',
      threatThreshold: 'MEDIUM',
      maxContentLength: 100000, // Allow larger content for innovation analysis
    });

    this.setupSecurityEventHandlers();
  }

  private setupSecurityEventHandlers(): void {
    this.securityManager['securityEngine'].on('threatDetected', (event) => {
      console.warn('[INNOVATION SECURITY] Threat detected during innovation analysis:', {
        projectId: event.context?.split('-')[1] || 'unknown',
        threatLevel: event.result.threatLevel,
        threats: event.result.detectedThreats.map(t => t.type),
        timestamp: event.timestamp
      });
    });
  }

  async analyzeProjectInnovation(
    projectId: string,
    repositoryUrl: string,
    options: InnovationAnalysisOptions = {}
  ): Promise<SecureInnovationResult> {
    const scanId = `innovation-${projectId}-${++this.scanCounter}`;
    const startTime = Date.now();

    // Create analysis request for security validation
    const analysisRequest: AnalysisRequest = {
      projectId,
      repositoryUrl,
      analysisTypes: ['INNOVATION'],
      priority: 'NORMAL',
      options: {
        maxFiles: options.maxFiles,
        includeCodeAnalysis: options.includeCodeAnalysis,
        includePriorArtSearch: options.includePriorArtSearch,
        includePatentAnalysis: options.includePatentAnalysis
      }
    };

    try {
      console.log(`[INNOVATION SECURITY] Starting secure analysis for project ${projectId}`);

      // Step 1: Security validation of input
      const securityContext = await this.securityManager.validateAnalysisRequest(analysisRequest);

      if (securityContext.isQuarantined) {
        console.error(`[INNOVATION SECURITY] Request quarantined for project ${projectId}`);
        return this.createQuarantinedResponse(projectId, securityContext, scanId);
      }

      // Step 2: Use sanitized request if available
      const requestToProcess = securityContext.sanitizedRequest || analysisRequest;

      // Step 3: Additional security checks for innovation-specific content
      await this.performInnovationSpecificSecurityChecks(requestToProcess);

      // Step 4: Execute analysis with security monitoring
      console.log(`[INNOVATION SECURITY] Executing innovation analysis for project ${projectId}`);
      const reportId = await this.executeSecureAnalysis(requestToProcess, options);

      // Step 5: Retrieve and validate results
      const rawResult = await innovationAgent.getInnovationReport(reportId);
      if (!rawResult) {
        throw new Error('Innovation analysis completed but report not found');
      }

      // Step 6: Security validation of output
      const outputValidation = await this.securityManager.validateAnalysisResult(
        this.convertToAnalysisResult(rawResult),
        securityContext
      );

      // Step 7: Create secure result
      const secureResult = this.createSecureResult(
        rawResult,
        securityContext,
        outputValidation,
        scanId,
        Date.now() - startTime
      );

      console.log(`[INNOVATION SECURITY] Secure innovation analysis completed for project ${projectId} in ${Date.now() - startTime}ms`);
      return secureResult;

    } catch (error) {
      console.error(`[INNOVATION SECURITY] Secure analysis failed for project ${projectId}:`, error);

      return {
        status: 'FAILED',
        projectId,
        type: 'INNOVATION',
        score: 0,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown security error',
          processingTime: Date.now() - startTime,
          securityEnabled: true
        },
        securityMetadata: {
          inputValidated: false,
          outputValidated: false,
          threatLevel: 'HIGH',
          sanitizationApplied: false,
          quarantined: false,
          securityScanId: scanId
        }
      };
    }
  }

  private async performInnovationSpecificSecurityChecks(request: AnalysisRequest): Promise<void> {
    // Check for malicious repository URLs that might contain IP injection
    if (request.repositoryUrl.includes('localhost') ||
        request.repositoryUrl.includes('127.0.0.1') ||
        request.repositoryUrl.includes('internal') ||
        request.repositoryUrl.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)) {

      console.warn('[INNOVATION SECURITY] Suspicious repository URL detected:', request.repositoryUrl);
    }

    // Validate analysis options for potential injection
    if (request.options) {
      const optionsString = JSON.stringify(request.options);
      if (optionsString.length > 10000) {
        throw new Error('Analysis options too large - potential security threat');
      }

      // Check for script injection in options
      if (optionsString.includes('<script') ||
          optionsString.includes('javascript:') ||
          optionsString.includes('data:text/html')) {
        throw new Error('Script injection detected in analysis options');
      }
    }
  }

  private async executeSecureAnalysis(
    request: AnalysisRequest,
    options: InnovationAnalysisOptions
  ): Promise<string> {
    // Wrap the original analysis with additional monitoring
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    // Monitor for suspicious console output during analysis
    let suspiciousActivity = false;

    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('eval(') ||
          message.includes('Function(') ||
          message.includes('setTimeout(') ||
          message.includes('setInterval(')) {
        suspiciousActivity = true;
        console.warn('[INNOVATION SECURITY] Suspicious activity detected in analysis logs');
      }
      originalConsoleLog.apply(console, args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('RCE') ||
          message.includes('injection') ||
          message.includes('exploit')) {
        suspiciousActivity = true;
        console.warn('[INNOVATION SECURITY] Potential security threat detected in error logs');
      }
      originalConsoleError.apply(console, args);
    };

    try {
      const reportId = await innovationAgent.analyzeProjectInnovation(request.projectId, options);

      if (suspiciousActivity) {
        console.warn('[INNOVATION SECURITY] Suspicious activity detected during analysis - flagging for review');
      }

      return reportId;
    } finally {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    }
  }

  private convertToAnalysisResult(rawResult: any): AnalysisResult {
    return {
      status: rawResult.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
      projectId: rawResult.projectId,
      type: 'INNOVATION',
      score: rawResult.score || 0,
      summary: rawResult.summary,
      details: JSON.stringify({
        noveltyScore: rawResult.noveltyScore,
        creativityScore: rawResult.creativityScore,
        technicalInnovation: rawResult.technicalInnovation,
        marketInnovation: rawResult.marketInnovation,
        implementationInnovation: rawResult.implementationInnovation,
        patentPotential: rawResult.patentPotential,
        patentabilityScore: rawResult.patentabilityScore
      }),
      recommendations: Array.isArray(rawResult.suggestions) ? rawResult.suggestions : [],
      metadata: {
        processingTime: rawResult.processingTime,
        agentModel: rawResult.agentModel,
        patentAssessment: rawResult.patentAssessment,
        similarProjects: rawResult.similarProjects,
        uniqueAspects: rawResult.uniqueAspects,
        innovationEvidence: rawResult.innovationEvidence
      }
    };
  }

  private createSecureResult(
    rawResult: any,
    securityContext: SecureAnalysisContext,
    outputValidation: { isValid: boolean; sanitizedResult?: AnalysisResult; issues: string[] },
    scanId: string,
    processingTime: number
  ): SecureInnovationResult {
    const baseResult = outputValidation.sanitizedResult || this.convertToAnalysisResult(rawResult);

    return {
      ...baseResult,
      securityMetadata: {
        inputValidated: true,
        outputValidated: outputValidation.isValid,
        threatLevel: securityContext.securityScan.threatLevel,
        sanitizationApplied: !!outputValidation.sanitizedResult,
        quarantined: securityContext.isQuarantined,
        securityScanId: scanId
      },
      metadata: {
        ...baseResult.metadata,
        securityScanResults: {
          inputThreats: securityContext.securityScan.detectedThreats.length,
          outputIssues: outputValidation.issues.length,
          overallSecurityScore: this.calculateSecurityScore(securityContext, outputValidation),
          securityVersion: '1.0.0'
        },
        processingTime
      }
    };
  }

  private createQuarantinedResponse(
    projectId: string,
    securityContext: SecureAnalysisContext,
    scanId: string
  ): SecureInnovationResult {
    return {
      status: 'FAILED',
      projectId,
      type: 'INNOVATION',
      score: 0,
      summary: 'Analysis blocked due to security threats',
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
        securityScanId: scanId
      }
    };
  }

  private calculateSecurityScore(
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

  // Security management methods
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

  // Audit trail methods
  async generateSecurityReport(projectId: string): Promise<{
    scanHistory: any[];
    threatSummary: any;
    recommendations: string[];
  }> {
    const metrics = await this.getSecurityMetrics();

    return {
      scanHistory: [], // Would track historical scans in production
      threatSummary: {
        totalScans: metrics.engineMetrics.totalScans,
        threatsDetected: metrics.engineMetrics.threatsDetected,
        averageConfidence: metrics.engineMetrics.averageConfidence,
        quarantinedCount: metrics.quarantinedRequestsCount
      },
      recommendations: [
        'Continue monitoring for security threats',
        'Regular security configuration updates',
        'Implement threat pattern training'
      ]
    };
  }
}

export const secureInnovationAgent = new SecureInnovationAgent();