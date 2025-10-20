import { EventEmitter } from 'events';

export interface SecurityScanResult {
  isSecure: boolean;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedThreats: DetectedThreat[];
  sanitizedContent?: string;
  confidence: number;
}

export interface DetectedThreat {
  type: ThreatType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  location: {
    start: number;
    end: number;
  };
  suggestion?: string;
}

export type ThreatType =
  | 'PROMPT_INJECTION'
  | 'JAILBREAK_ATTEMPT'
  | 'SYSTEM_OVERRIDE'
  | 'INSTRUCTION_HIJACK'
  | 'ROLE_MANIPULATION'
  | 'OUTPUT_MANIPULATION'
  | 'CONTEXT_POISONING'
  | 'SOCIAL_ENGINEERING';

export interface SecurityConfig {
  enableRealTimeScanning: boolean;
  threatThreshold: 'LOW' | 'MEDIUM' | 'HIGH';
  enableAutoSanitization: boolean;
  enableLogging: boolean;
  maxContentLength: number;
  customPatterns?: RegExp[];
}

export class PromptSecurityEngine extends EventEmitter {
  private config: SecurityConfig;
  private threatPatterns: Map<ThreatType, RegExp[]>;
  private suspiciousPhrases: Set<string>;
  private roleManipulationPatterns: RegExp[];

  constructor(config: Partial<SecurityConfig> = {}) {
    super();

    this.config = {
      enableRealTimeScanning: true,
      threatThreshold: 'MEDIUM',
      enableAutoSanitization: true,
      enableLogging: true,
      maxContentLength: 50000,
      ...config
    };

    this.initializeThreatPatterns();
    this.initializeSuspiciousPhrases();
    this.initializeRoleManipulationPatterns();
  }

  private initializeThreatPatterns(): void {
    this.threatPatterns = new Map([
      ['PROMPT_INJECTION', [
        /ignore\s+all\s+previous\s+instructions/gi,
        /forget\s+everything\s+above/gi,
        /disregard\s+the\s+system\s+prompt/gi,
        /override\s+your\s+instructions/gi,
        /new\s+task\s*:\s*ignore/gi,
        /system\s*:\s*you\s+are\s+now/gi,
      ]],
      ['JAILBREAK_ATTEMPT', [
        /pretend\s+to\s+be\s+in\s+developer\s+mode/gi,
        /act\s+as\s+if\s+you\s+are\s+jailbroken/gi,
        /simulate\s+being\s+unrestricted/gi,
        /bypass\s+all\s+safety\s+measures/gi,
        /ignore\s+ethical\s+guidelines/gi,
      ]],
      ['SYSTEM_OVERRIDE', [
        /\\system\s*$/gi,
        /\[SYSTEM\]/gi,
        /\<\s*system\s*\>/gi,
        /sudo\s+mode/gi,
        /admin\s+override/gi,
        /root\s+access/gi,
      ]],
      ['INSTRUCTION_HIJACK', [
        /instead\s+of\s+analyzing/gi,
        /don't\s+analyze\s+the\s+code/gi,
        /skip\s+the\s+analysis/gi,
        /instead\s+do\s+this/gi,
        /change\s+your\s+task\s+to/gi,
      ]],
      ['ROLE_MANIPULATION', [
        /you\s+are\s+now\s+a\s+different/gi,
        /assume\s+the\s+role\s+of/gi,
        /act\s+as\s+a\s+[^.]*(?:hacker|malicious|evil)/gi,
        /become\s+a\s+[^.]*assistant/gi,
        /transform\s+into/gi,
      ]],
      ['OUTPUT_MANIPULATION', [
        /respond\s+with\s+only/gi,
        /output\s+format\s*:\s*[^a-zA-Z0-9]/gi,
        /return\s+json\s+with/gi,
        /generate\s+code\s+that/gi,
        /write\s+a\s+script\s+to/gi,
      ]],
      ['CONTEXT_POISONING', [
        /previous\s+conversation\s+never\s+happened/gi,
        /forget\s+the\s+context/gi,
        /this\s+is\s+a\s+new\s+session/gi,
        /reset\s+your\s+memory/gi,
        /clear\s+all\s+context/gi,
      ]],
      ['SOCIAL_ENGINEERING', [
        /this\s+is\s+urgent/gi,
        /security\s+emergency/gi,
        /ceo\s+request/gi,
        /immediate\s+action\s+required/gi,
        /bypass\s+for\s+testing/gi,
      ]]
    ]);
  }

  private initializeSuspiciousPhrases(): void {
    this.suspiciousPhrases = new Set([
      'ignore previous',
      'forget instructions',
      'system override',
      'jailbreak mode',
      'developer mode',
      'unrestricted mode',
      'bypass safety',
      'disable filters',
      'admin access',
      'root privileges',
      'security bypass',
      'emergency override',
      'testing mode',
      'debug mode',
      'maintenance mode'
    ]);
  }

  private initializeRoleManipulationPatterns(): void {
    this.roleManipulationPatterns = [
      /you\s+are\s+(?:now\s+)?(?:a\s+)?(?:different|new|another)/gi,
      /from\s+now\s+on\s+you\s+are/gi,
      /your\s+new\s+role\s+is/gi,
      /switch\s+to\s+being/gi,
      /transform\s+yourself\s+into/gi,
      /roleplay\s+as/gi,
      /simulate\s+being/gi,
      /act\s+like\s+you\s+are/gi,
    ];
  }

  async scanContent(content: string, context: string = 'analysis'): Promise<SecurityScanResult> {
    if (!this.config.enableRealTimeScanning) {
      return {
        isSecure: true,
        threatLevel: 'LOW',
        detectedThreats: [],
        confidence: 1.0
      };
    }

    if (content.length > this.config.maxContentLength) {
      return {
        isSecure: false,
        threatLevel: 'HIGH',
        detectedThreats: [{
          type: 'SYSTEM_OVERRIDE',
          severity: 'HIGH',
          description: `Content exceeds maximum length (${this.config.maxContentLength} chars)`,
          location: { start: 0, end: content.length },
          suggestion: 'Truncate content to acceptable length'
        }],
        confidence: 1.0
      };
    }

    const detectedThreats: DetectedThreat[] = [];

    // Pattern-based threat detection
    for (const [threatType, patterns] of this.threatPatterns) {
      for (const pattern of patterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          if (match.index !== undefined) {
            detectedThreats.push({
              type: threatType,
              severity: this.calculateSeverity(threatType, match[0]),
              description: `Detected ${threatType.toLowerCase().replace('_', ' ')}: "${match[0]}"`,
              location: {
                start: match.index,
                end: match.index + match[0].length
              },
              suggestion: this.getSuggestion(threatType)
            });
          }
        }
      }
    }

    // Suspicious phrase detection
    const contentLower = content.toLowerCase();
    for (const phrase of this.suspiciousPhrases) {
      const index = contentLower.indexOf(phrase);
      if (index !== -1) {
        detectedThreats.push({
          type: 'PROMPT_INJECTION',
          severity: 'MEDIUM',
          description: `Suspicious phrase detected: "${phrase}"`,
          location: {
            start: index,
            end: index + phrase.length
          },
          suggestion: 'Remove or rephrase suspicious content'
        });
      }
    }

    // Role manipulation detection
    for (const pattern of this.roleManipulationPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          detectedThreats.push({
            type: 'ROLE_MANIPULATION',
            severity: 'HIGH',
            description: `Role manipulation attempt: "${match[0]}"`,
            location: {
              start: match.index,
              end: match.index + match[0].length
            },
            suggestion: 'Remove role manipulation attempts'
          });
        }
      }
    }

    // Calculate overall threat level and confidence
    const { threatLevel, confidence } = this.calculateOverallThreat(detectedThreats);
    const isSecure = this.isContentSecure(threatLevel);

    let sanitizedContent: string | undefined;
    if (!isSecure && this.config.enableAutoSanitization) {
      sanitizedContent = this.sanitizeContent(content, detectedThreats);
    }

    const result: SecurityScanResult = {
      isSecure,
      threatLevel,
      detectedThreats,
      sanitizedContent,
      confidence
    };

    // Emit security events
    if (!isSecure) {
      this.emit('threatDetected', {
        context,
        result,
        timestamp: new Date().toISOString()
      });
    }

    if (this.config.enableLogging) {
      this.logSecurityEvent(context, result);
    }

    return result;
  }

  private calculateSeverity(threatType: ThreatType, matchedText: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const severityMap: Record<ThreatType, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
      'PROMPT_INJECTION': 'HIGH',
      'JAILBREAK_ATTEMPT': 'CRITICAL',
      'SYSTEM_OVERRIDE': 'CRITICAL',
      'INSTRUCTION_HIJACK': 'HIGH',
      'ROLE_MANIPULATION': 'HIGH',
      'OUTPUT_MANIPULATION': 'MEDIUM',
      'CONTEXT_POISONING': 'HIGH',
      'SOCIAL_ENGINEERING': 'MEDIUM'
    };

    let baseSeverity = severityMap[threatType];

    // Adjust severity based on content characteristics
    if (matchedText.includes('immediate') || matchedText.includes('urgent') || matchedText.includes('emergency')) {
      baseSeverity = this.escalateSeverity(baseSeverity);
    }

    return baseSeverity;
  }

  private escalateSeverity(current: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const escalationMap = {
      'LOW': 'MEDIUM' as const,
      'MEDIUM': 'HIGH' as const,
      'HIGH': 'CRITICAL' as const,
      'CRITICAL': 'CRITICAL' as const
    };
    return escalationMap[current];
  }

  private getSuggestion(threatType: ThreatType): string {
    const suggestions: Record<ThreatType, string> = {
      'PROMPT_INJECTION': 'Remove instruction override attempts and focus on legitimate analysis requests',
      'JAILBREAK_ATTEMPT': 'Remove attempts to bypass safety measures',
      'SYSTEM_OVERRIDE': 'Remove system-level commands and administrative requests',
      'INSTRUCTION_HIJACK': 'Keep analysis requests focused on the intended task',
      'ROLE_MANIPULATION': 'Maintain appropriate assistant role without unauthorized changes',
      'OUTPUT_MANIPULATION': 'Request analysis results in standard format',
      'CONTEXT_POISONING': 'Avoid attempts to manipulate conversation context',
      'SOCIAL_ENGINEERING': 'Remove urgent/emergency language intended to bypass security'
    };
    return suggestions[threatType];
  }

  private calculateOverallThreat(threats: DetectedThreat[]): { threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', confidence: number } {
    if (threats.length === 0) {
      return { threatLevel: 'LOW', confidence: 1.0 };
    }

    const severityScores = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
    const maxSeverity = Math.max(...threats.map(t => severityScores[t.severity]));
    const avgSeverity = threats.reduce((sum, t) => sum + severityScores[t.severity], 0) / threats.length;

    let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (maxSeverity >= 4) threatLevel = 'CRITICAL';
    else if (maxSeverity >= 3 || avgSeverity >= 2.5) threatLevel = 'HIGH';
    else if (maxSeverity >= 2 || avgSeverity >= 1.5) threatLevel = 'MEDIUM';
    else threatLevel = 'LOW';

    // Calculate confidence based on pattern matching precision
    const confidence = Math.min(1.0, 0.7 + (threats.length * 0.1));

    return { threatLevel, confidence };
  }

  private isContentSecure(threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): boolean {
    const thresholds = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
    const configThreshold = thresholds[this.config.threatThreshold];
    const currentLevel = thresholds[threatLevel];

    return currentLevel < configThreshold;
  }

  private sanitizeContent(content: string, threats: DetectedThreat[]): string {
    let sanitized = content;

    // Sort threats by position (end to start to maintain indices)
    const sortedThreats = threats
      .filter(t => t.severity === 'HIGH' || t.severity === 'CRITICAL')
      .sort((a, b) => b.location.start - a.location.start);

    for (const threat of sortedThreats) {
      const before = sanitized.substring(0, threat.location.start);
      const after = sanitized.substring(threat.location.end);
      const replacement = `[REMOVED: ${threat.type}]`;

      sanitized = before + replacement + after;
    }

    return sanitized;
  }

  private logSecurityEvent(context: string, result: SecurityScanResult): void {
    if (!result.isSecure) {
      console.warn(`[SECURITY] Threat detected in ${context}:`, {
        threatLevel: result.threatLevel,
        threatsCount: result.detectedThreats.length,
        threats: result.detectedThreats.map(t => ({
          type: t.type,
          severity: t.severity,
          description: t.description
        })),
        timestamp: new Date().toISOString()
      });
    }
  }

  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  addCustomPattern(threatType: ThreatType, pattern: RegExp): void {
    if (!this.threatPatterns.has(threatType)) {
      this.threatPatterns.set(threatType, []);
    }
    this.threatPatterns.get(threatType)!.push(pattern);
    this.emit('patternAdded', { threatType, pattern: pattern.source });
  }

  getSecurityMetrics(): {
    totalScans: number;
    threatsDetected: number;
    averageConfidence: number;
    mostCommonThreats: Array<{ type: ThreatType; count: number }>;
  } {
    // Implementation would track metrics over time
    // For now, return placeholder metrics
    return {
      totalScans: 0,
      threatsDetected: 0,
      averageConfidence: 0,
      mostCommonThreats: []
    };
  }
}

export const createSecurityEngine = (config?: Partial<SecurityConfig>) => {
  return new PromptSecurityEngine(config);
};