import { EventEmitter } from 'events';
import { PromptSecurityEngine, SecurityConfig } from './prompt-security';
import { unifiedSecurityOrchestrator, UnifiedSecurityOrchestrator } from './secure-analysis-wrapper';
import { secureInnovationAgent } from './secure-innovation-agent';
import { AnalysisRequest, AnalysisResult } from '../types';

export interface SecurityIntegrationConfig {
  enabled: boolean;
  globalThreatThreshold: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoQuarantine: boolean;
  logSecurityEvents: boolean;
  alertOnCriticalThreats: boolean;
  maxQuarantineTime: number; // milliseconds
  emergencyShutdownThreshold: number; // number of critical threats
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: 'THREAT_DETECTED' | 'QUARANTINE_APPLIED' | 'ANALYSIS_BLOCKED' | 'EMERGENCY_SHUTDOWN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  layerName: string;
  projectId?: string;
  threatDetails: any;
  actionTaken: string;
}

export interface SecurityDashboard {
  overallStatus: 'SECURE' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  activeThreats: number;
  quarantinedProjects: number;
  securityScore: number;
  layerStatuses: Record<string, {
    status: string;
    threatsDetected: number;
    lastScanTime: string;
  }>;
  recentEvents: SecurityEvent[];
  systemRecommendations: string[];
}

export class SecurityIntegration extends EventEmitter {
  private config: SecurityIntegrationConfig;
  private orchestrator: UnifiedSecurityOrchestrator;
  private globalSecurityEngine: PromptSecurityEngine;
  private eventLog: SecurityEvent[] = [];
  private emergencyShutdown: boolean = false;
  private criticalThreatCounter: number = 0;

  constructor(config: Partial<SecurityIntegrationConfig> = {}) {
    super();

    this.config = {
      enabled: true,
      globalThreatThreshold: 'MEDIUM',
      autoQuarantine: true,
      logSecurityEvents: true,
      alertOnCriticalThreats: true,
      maxQuarantineTime: 24 * 60 * 60 * 1000, // 24 hours
      emergencyShutdownThreshold: 10,
      ...config
    };

    this.orchestrator = unifiedSecurityOrchestrator;
    this.globalSecurityEngine = new PromptSecurityEngine({
      enableRealTimeScanning: true,
      threatThreshold: this.config.globalThreatThreshold,
      enableAutoSanitization: true,
      enableLogging: this.config.logSecurityEvents,
      maxContentLength: 100000
    });

    this.setupEventHandlers();
    this.startSecurityMonitoring();
  }

  private setupEventHandlers(): void {
    this.globalSecurityEngine.on('threatDetected', (event) => {
      this.handleThreatDetection(event);
    });

    // Monitor for emergency shutdown conditions
    this.on('criticalThreat', () => {
      this.criticalThreatCounter++;
      if (this.criticalThreatCounter >= this.config.emergencyShutdownThreshold) {
        this.triggerEmergencyShutdown();
      }
    });
  }

  private startSecurityMonitoring(): void {
    // Start background monitoring tasks
    setInterval(() => {
      this.performSecurityHealthCheck();
    }, 5 * 60 * 1000); // Every 5 minutes

    setInterval(() => {
      this.cleanupExpiredQuarantines();
    }, 60 * 60 * 1000); // Every hour

    setInterval(() => {
      this.criticalThreatCounter = Math.max(0, this.criticalThreatCounter - 1);
    }, 60 * 1000); // Decay critical threat counter every minute
  }

  async validateAnalysisRequest(request: AnalysisRequest): Promise<{
    isAllowed: boolean;
    securityContext?: any;
    blockReason?: string;
  }> {
    if (!this.config.enabled) {
      return { isAllowed: true };
    }

    if (this.emergencyShutdown) {
      return {
        isAllowed: false,
        blockReason: 'System is in emergency shutdown mode due to critical security threats'
      };
    }

    try {
      // Global security scan
      const globalScan = await this.globalSecurityEngine.scanContent(
        JSON.stringify(request),
        `global-request-${request.projectId}`
      );

      if (!globalScan.isSecure) {
        this.logSecurityEvent({
          eventType: 'THREAT_DETECTED',
          severity: globalScan.threatLevel,
          layerName: 'GLOBAL',
          projectId: request.projectId,
          threatDetails: globalScan.detectedThreats,
          actionTaken: 'Request validation'
        });

        if (globalScan.threatLevel === 'CRITICAL') {
          this.emit('criticalThreat', globalScan);
          return {
            isAllowed: false,
            blockReason: 'Critical security threats detected in request'
          };
        }
      }

      // Layer-specific validation
      for (const analysisType of request.analysisTypes) {
        const layerContext = await this.orchestrator.validateAnalysisRequest(
          request,
          analysisType
        );

        if (layerContext.isQuarantined) {
          this.logSecurityEvent({
            eventType: 'QUARANTINE_APPLIED',
            severity: layerContext.securityScan.threatLevel,
            layerName: analysisType,
            projectId: request.projectId,
            threatDetails: layerContext.securityScan.detectedThreats,
            actionTaken: 'Project quarantined'
          });

          return {
            isAllowed: false,
            blockReason: `Analysis quarantined by ${analysisType} security layer`
          };
        }
      }

      return {
        isAllowed: true,
        securityContext: {
          globalScan,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('[SECURITY INTEGRATION] Validation error:', error);
      return {
        isAllowed: false,
        blockReason: 'Security validation failed'
      };
    }
  }

  async validateAnalysisResult(
    result: AnalysisResult,
    layerType: string,
    securityContext: any
  ): Promise<{
    isValid: boolean;
    sanitizedResult?: AnalysisResult;
    securityIssues: string[];
  }> {
    if (!this.config.enabled) {
      return { isValid: true, securityIssues: [] };
    }

    try {
      const validation = await this.orchestrator.validateAnalysisResult(
        result,
        securityContext,
        layerType
      );

      if (!validation.isValid) {
        this.logSecurityEvent({
          eventType: 'THREAT_DETECTED',
          severity: 'MEDIUM',
          layerName: layerType,
          projectId: result.projectId,
          threatDetails: validation.issues,
          actionTaken: 'Result validation and sanitization'
        });
      }

      return {
        isValid: validation.isValid,
        sanitizedResult: validation.sanitizedResult,
        securityIssues: validation.issues
      };

    } catch (error) {
      console.error('[SECURITY INTEGRATION] Result validation error:', error);
      return {
        isValid: false,
        securityIssues: ['Result validation failed']
      };
    }
  }

  private handleThreatDetection(event: any): void {
    if (event.result.threatLevel === 'CRITICAL') {
      this.emit('criticalThreat', event);

      if (this.config.alertOnCriticalThreats) {
        console.error('[SECURITY ALERT] Critical security threat detected:', {
          context: event.context,
          threats: event.result.detectedThreats,
          timestamp: event.timestamp
        });
      }
    }

    if (this.config.logSecurityEvents) {
      this.logSecurityEvent({
        eventType: 'THREAT_DETECTED',
        severity: event.result.threatLevel,
        layerName: 'GLOBAL',
        threatDetails: event.result.detectedThreats,
        actionTaken: 'Threat detection and logging'
      });
    }
  }

  private logSecurityEvent(eventData: Partial<SecurityEvent>): void {
    const event: SecurityEvent = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      eventType: eventData.eventType || 'THREAT_DETECTED',
      severity: eventData.severity || 'MEDIUM',
      layerName: eventData.layerName || 'UNKNOWN',
      projectId: eventData.projectId,
      threatDetails: eventData.threatDetails || {},
      actionTaken: eventData.actionTaken || 'Logged'
    };

    this.eventLog.push(event);

    // Keep only last 1000 events to prevent memory issues
    if (this.eventLog.length > 1000) {
      this.eventLog = this.eventLog.slice(-1000);
    }

    this.emit('securityEvent', event);
  }

  private async performSecurityHealthCheck(): Promise<void> {
    try {
      const audit = await this.orchestrator.performSystemWideSecurityAudit();

      if (audit.overallHealthScore < 50) {
        this.logSecurityEvent({
          eventType: 'ANALYSIS_BLOCKED',
          severity: 'CRITICAL',
          layerName: 'SYSTEM',
          threatDetails: {
            healthScore: audit.overallHealthScore,
            criticalIssues: audit.criticalIssues
          },
          actionTaken: 'System health check - critical issues detected'
        });
      }

      this.emit('healthCheck', audit);

    } catch (error) {
      console.error('[SECURITY INTEGRATION] Health check failed:', error);
    }
  }

  private async cleanupExpiredQuarantines(): Promise<void> {
    // This would clean up quarantined projects that have exceeded max quarantine time
    // In a production system, this would involve database cleanup
    console.log('[SECURITY INTEGRATION] Cleaning up expired quarantines...');
  }

  private triggerEmergencyShutdown(): void {
    this.emergencyShutdown = true;

    this.logSecurityEvent({
      eventType: 'EMERGENCY_SHUTDOWN',
      severity: 'CRITICAL',
      layerName: 'SYSTEM',
      threatDetails: {
        criticalThreatsCount: this.criticalThreatCounter,
        threshold: this.config.emergencyShutdownThreshold
      },
      actionTaken: 'Emergency shutdown activated'
    });

    console.error('[SECURITY EMERGENCY] System shutdown activated due to critical threat threshold exceeded');
    this.emit('emergencyShutdown', {
      reason: 'Critical threat threshold exceeded',
      threatCount: this.criticalThreatCounter
    });

    // Auto-recovery after 30 minutes (configurable)
    setTimeout(() => {
      this.emergencyShutdown = false;
      this.criticalThreatCounter = 0;
      console.log('[SECURITY INTEGRATION] Emergency shutdown lifted - system restored');
      this.emit('systemRestored');
    }, 30 * 60 * 1000);
  }

  async getSecurityDashboard(): Promise<SecurityDashboard> {
    const metrics = await this.orchestrator.getSecurityMetricsForAllLayers();
    const audit = await this.orchestrator.performSystemWideSecurityAudit();

    const activeThreats = this.eventLog.filter(
      event => event.eventType === 'THREAT_DETECTED' &&
               new Date(event.timestamp).getTime() > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    ).length;

    let overallStatus: 'SECURE' | 'WARNING' | 'CRITICAL' | 'EMERGENCY' = 'SECURE';
    if (this.emergencyShutdown) overallStatus = 'EMERGENCY';
    else if (audit.overallHealthScore < 50) overallStatus = 'CRITICAL';
    else if (audit.overallHealthScore < 80) overallStatus = 'WARNING';

    return {
      overallStatus,
      activeThreats,
      quarantinedProjects: metrics.totalQuarantined,
      securityScore: audit.overallHealthScore,
      layerStatuses: audit.layerStatus,
      recentEvents: this.eventLog.slice(-20).reverse(), // Last 20 events, newest first
      systemRecommendations: audit.recommendations
    };
  }

  async updateSecurityConfiguration(newConfig: Partial<SecurityIntegrationConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    // Update underlying security engines
    this.globalSecurityEngine.updateConfig({
      threatThreshold: this.config.globalThreatThreshold,
      enableAutoSanitization: this.config.autoQuarantine,
      enableLogging: this.config.logSecurityEvents
    });

    this.logSecurityEvent({
      eventType: 'THREAT_DETECTED', // Using this as closest match for config updates
      severity: 'LOW',
      layerName: 'SYSTEM',
      threatDetails: { configUpdate: newConfig },
      actionTaken: 'Security configuration updated'
    });
  }

  // Emergency controls
  async forceEmergencyShutdown(reason: string): Promise<void> {
    this.emergencyShutdown = true;
    this.logSecurityEvent({
      eventType: 'EMERGENCY_SHUTDOWN',
      severity: 'CRITICAL',
      layerName: 'SYSTEM',
      threatDetails: { manualTrigger: true, reason },
      actionTaken: 'Manual emergency shutdown'
    });
  }

  async liftEmergencyShutdown(): Promise<void> {
    this.emergencyShutdown = false;
    this.criticalThreatCounter = 0;
    console.log('[SECURITY INTEGRATION] Emergency shutdown manually lifted');
    this.emit('systemRestored');
  }

  // Security reporting
  async generateSecurityReport(timeRange: {
    start: Date;
    end: Date;
  }): Promise<{
    summary: any;
    events: SecurityEvent[];
    threats: any;
    recommendations: string[];
  }> {
    const filteredEvents = this.eventLog.filter(
      event => {
        const eventTime = new Date(event.timestamp);
        return eventTime >= timeRange.start && eventTime <= timeRange.end;
      }
    );

    const threatsByLayer = filteredEvents.reduce((acc, event) => {
      if (!acc[event.layerName]) acc[event.layerName] = [];
      acc[event.layerName].push(event);
      return acc;
    }, {} as Record<string, SecurityEvent[]>);

    const summary = {
      totalEvents: filteredEvents.length,
      threatsDetected: filteredEvents.filter(e => e.eventType === 'THREAT_DETECTED').length,
      quarantinesApplied: filteredEvents.filter(e => e.eventType === 'QUARANTINE_APPLIED').length,
      emergencyShutdowns: filteredEvents.filter(e => e.eventType === 'EMERGENCY_SHUTDOWN').length,
      mostActiveLayer: Object.entries(threatsByLayer).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'None',
      averageThreatSeverity: this.calculateAverageSeverity(filteredEvents)
    };

    return {
      summary,
      events: filteredEvents,
      threats: threatsByLayer,
      recommendations: await this.generateSecurityRecommendations(filteredEvents)
    };
  }

  private calculateAverageSeverity(events: SecurityEvent[]): string {
    if (events.length === 0) return 'NONE';

    const severityValues = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
    const average = events.reduce((sum, event) => sum + severityValues[event.severity], 0) / events.length;

    if (average >= 3.5) return 'CRITICAL';
    if (average >= 2.5) return 'HIGH';
    if (average >= 1.5) return 'MEDIUM';
    return 'LOW';
  }

  private async generateSecurityRecommendations(events: SecurityEvent[]): Promise<string[]> {
    const recommendations: string[] = [];

    const criticalEvents = events.filter(e => e.severity === 'CRITICAL');
    if (criticalEvents.length > 0) {
      recommendations.push('Review and strengthen security patterns for critical threat detection');
    }

    const frequentLayers = Object.entries(
      events.reduce((acc, event) => {
        acc[event.layerName] = (acc[event.layerName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).filter(([, count]) => count > 5);

    if (frequentLayers.length > 0) {
      recommendations.push(`Consider additional security measures for frequently targeted layers: ${frequentLayers.map(([layer]) => layer).join(', ')}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Security system operating within normal parameters');
    }

    return recommendations;
  }

  // Getters for status
  isEnabled(): boolean {
    return this.config.enabled;
  }

  isEmergencyShutdown(): boolean {
    return this.emergencyShutdown;
  }

  getCriticalThreatCount(): number {
    return this.criticalThreatCounter;
  }
}

// Global security integration instance
export const securityIntegration = new SecurityIntegration({
  enabled: true,
  globalThreatThreshold: 'MEDIUM',
  autoQuarantine: true,
  logSecurityEvents: true,
  alertOnCriticalThreats: true,
  maxQuarantineTime: 24 * 60 * 60 * 1000, // 24 hours
  emergencyShutdownThreshold: 10
});