// Core Security Engine
export {
  PromptSecurityEngine,
  createSecurityEngine,
  type SecurityScanResult,
  type DetectedThreat,
  type ThreatType,
  type SecurityConfig
} from './prompt-security';

// Layer Security Management
export {
  LayerSecurityManager,
  type LayerSecurityConfig,
  type SecureAnalysisContext,
  createCodeQualitySecurityManager,
  createInnovationSecurityManager,
  createCoherenceSecurityManager,
  createHederaSecurityManager
} from './layer-security';

// Secure Analysis Wrappers
export {
  BaseSecurityWrapper,
  CodeQualitySecurityWrapper,
  CoherenceSecurityWrapper,
  HederaSecurityWrapper,
  UnifiedSecurityOrchestrator,
  createSecurityWrapper,
  unifiedSecurityOrchestrator,
  type SecureAnalysisResult,
  type SecurityWrapper
} from './secure-analysis-wrapper';

// Secure Innovation Agent
export {
  SecureInnovationAgent,
  secureInnovationAgent,
  type SecureInnovationResult
} from './secure-innovation-agent';

// Security Integration & Orchestration
export {
  SecurityIntegration,
  securityIntegration,
  type SecurityIntegrationConfig,
  type SecurityEvent,
  type SecurityDashboard
} from './security-integration';

// Security utilities and helpers
export const SecurityUtils = {
  /**
   * Quick security scan for basic threat detection
   */
  async quickScan(content: string): Promise<boolean> {
    const { createSecurityEngine } = await import('./prompt-security');
    const engine = createSecurityEngine({ threatThreshold: 'HIGH' });
    const result = await engine.scanContent(content);
    return result.isSecure;
  },

  /**
   * Sanitize content by removing detected threats
   */
  async sanitizeContent(content: string): Promise<string> {
    const { createSecurityEngine } = await import('./prompt-security');
    const engine = createSecurityEngine({
      threatThreshold: 'MEDIUM',
      enableAutoSanitization: true
    });
    const result = await engine.scanContent(content);
    return result.sanitizedContent || content;
  },

  /**
   * Check if a project is quarantined across all layers
   */
  async isProjectQuarantined(projectId: string): Promise<boolean> {
    const { unifiedSecurityOrchestrator } = await import('./secure-analysis-wrapper');
    // This is a simplified check - in production this would check all layers
    return false; // Placeholder implementation
  },

  /**
   * Get security metrics summary
   */
  async getSecuritySummary(): Promise<{
    totalThreats: number;
    quarantinedProjects: number;
    systemStatus: string;
  }> {
    const { securityIntegration } = await import('./security-integration');
    const dashboard = await securityIntegration.getSecurityDashboard();

    return {
      totalThreats: dashboard.activeThreats,
      quarantinedProjects: dashboard.quarantinedProjects,
      systemStatus: dashboard.overallStatus
    };
  }
};

// Security constants
export const SECURITY_CONSTANTS = {
  THREAT_LEVELS: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const,
  ANALYSIS_TYPES: ['CODE_QUALITY', 'INNOVATION', 'COHERENCE', 'HEDERA'] as const,

  DEFAULT_CONFIG: {
    threatThreshold: 'MEDIUM' as const,
    enableAutoSanitization: true,
    enableLogging: true,
    maxContentLength: 50000,
    quarantineThreshold: 'HIGH' as const
  },

  SECURITY_PATTERNS: {
    PROMPT_INJECTION: /ignore\s+all\s+previous\s+instructions/gi,
    JAILBREAK: /pretend\s+to\s+be\s+in\s+developer\s+mode/gi,
    SYSTEM_OVERRIDE: /\\system\s*$/gi,
    SCRIPT_INJECTION: /<script|javascript:|eval\(/gi
  }
} as const;

// Security middleware factory
export const createSecurityMiddleware = (config?: Partial<SecurityIntegrationConfig>) => {
  return {
    async validateRequest(request: any): Promise<{ allowed: boolean; reason?: string }> {
      const { securityIntegration } = await import('./security-integration');
      const result = await securityIntegration.validateAnalysisRequest(request);
      return {
        allowed: result.isAllowed,
        reason: result.blockReason
      };
    },

    async validateResult(result: any, layer: string): Promise<{ valid: boolean; sanitized?: any }> {
      const { securityIntegration } = await import('./security-integration');
      const validation = await securityIntegration.validateAnalysisResult(result, layer, {});
      return {
        valid: validation.isValid,
        sanitized: validation.sanitizedResult
      };
    }
  };
};

// Export type definitions for external use
export type {
  SecurityIntegrationConfig,
  SecurityEvent,
  SecurityDashboard,
  SecureAnalysisResult,
  SecureAnalysisContext,
  LayerSecurityConfig,
  SecurityScanResult,
  DetectedThreat,
  ThreatType,
  SecurityConfig
} from './security-integration';

// Version and metadata
export const SECURITY_VERSION = '1.0.0';
export const SECURITY_FEATURES = [
  'Prompt injection detection',
  'Jailbreak attempt prevention',
  'System override protection',
  'Output sanitization',
  'Multi-layer security validation',
  'Real-time threat monitoring',
  'Emergency shutdown capabilities',
  'Security audit trails',
  'Quarantine management',
  'Threat pattern learning'
] as const;