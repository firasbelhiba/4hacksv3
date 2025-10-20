// WebSocket Server
export {
  AnalysisWebSocketServer,
  analysisWebSocketServer,
  type WebSocketMessage,
  type ClientConnection,
  type AnalysisProgressUpdate
} from './websocket-server';

// WebSocket Client
export {
  AnalysisWebSocketClient,
  createGlobalWebSocketClient,
  createWebSocketHook,
  type WebSocketClientConfig,
  type AnalysisProgressData,
  type UseWebSocketAnalysis
} from './websocket-client';

// Realtime Integration
export {
  RealtimeAnalysisIntegration,
  realtimeIntegration,
  type RealtimeIntegrationConfig,
  type AnalysisSession
} from './realtime-integration';

// React Hooks
export {
  useAnalysisWebSocket,
  useProjectAnalysis,
  useSecurityMonitoring,
  WebSocketProvider,
  useWebSocketContext,
  type UseAnalysisWebSocketOptions,
  type UseAnalysisWebSocketReturn,
  type UseProjectAnalysisOptions,
  type UseProjectAnalysisReturn,
  type UseSecurityMonitoringReturn,
  type WebSocketProviderProps
} from './react-hooks';

// WebSocket utilities and helpers
export const WebSocketUtils = {
  /**
   * Create a WebSocket URL with proper protocol handling
   */
  createWebSocketUrl(baseUrl: string, secure: boolean = false): string {
    const protocol = secure ? 'wss:' : 'ws:';
    return baseUrl.replace(/^https?:/, protocol);
  },

  /**
   * Validate WebSocket message format
   */
  isValidMessage(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.type === 'string' &&
      typeof data.timestamp === 'string' &&
      typeof data.sessionId === 'string' &&
      data.data !== undefined
    );
  },

  /**
   * Create a standardized WebSocket message
   */
  createMessage(
    type: string,
    data: any,
    projectId?: string,
    userId?: string
  ): WebSocketMessage {
    return {
      type: type as any,
      data,
      timestamp: new Date().toISOString(),
      projectId,
      userId,
      sessionId: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  },

  /**
   * Get connection state as human-readable string
   */
  getReadableConnectionState(state: number): string {
    switch (state) {
      case WebSocket.CONNECTING: return 'Connecting';
      case WebSocket.OPEN: return 'Connected';
      case WebSocket.CLOSING: return 'Closing';
      case WebSocket.CLOSED: return 'Disconnected';
      default: return 'Unknown';
    }
  },

  /**
   * Check if WebSocket is supported
   */
  isWebSocketSupported(): boolean {
    return typeof WebSocket !== 'undefined';
  },

  /**
   * Estimate message size in bytes
   */
  estimateMessageSize(message: any): number {
    return new Blob([JSON.stringify(message)]).size;
  }
};

// WebSocket constants
export const WEBSOCKET_CONSTANTS = {
  MESSAGE_TYPES: [
    'ANALYSIS_UPDATE',
    'SECURITY_ALERT',
    'PROGRESS_UPDATE',
    'ANALYSIS_COMPLETE',
    'ANALYSIS_FAILED',
    'SUBSCRIBE',
    'UNSUBSCRIBE',
    'HEARTBEAT'
  ] as const,

  CONNECTION_STATES: [
    'CONNECTING',
    'CONNECTED',
    'CLOSING',
    'DISCONNECTED'
  ] as const,

  ANALYSIS_STATUSES: [
    'QUEUED',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED'
  ] as const,

  DEFAULT_CONFIG: {
    SERVER: {
      port: 8080,
      heartbeatInterval: 30000,
      connectionTimeout: 60000,
      maxConnections: 1000,
      enableAuth: true
    },
    CLIENT: {
      autoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000
    },
    REALTIME: {
      enableWebSocket: true,
      websocketPort: 8080,
      enableSecurityAlerts: true,
      progressUpdateInterval: 2000,
      enableDetailedLogging: true,
      maxConcurrentConnections: 1000
    }
  },

  CHANNELS: {
    ANALYSIS: 'analysis',
    SECURITY: 'security',
    SYSTEM: 'system'
  },

  ERROR_CODES: {
    NORMAL_CLOSURE: 1000,
    GOING_AWAY: 1001,
    PROTOCOL_ERROR: 1002,
    UNSUPPORTED_DATA: 1003,
    NO_STATUS_RECEIVED: 1005,
    ABNORMAL_CLOSURE: 1006,
    INVALID_FRAME_PAYLOAD_DATA: 1007,
    POLICY_VIOLATION: 1008,
    MESSAGE_TOO_BIG: 1009,
    MISSING_EXTENSION: 1010,
    INTERNAL_ERROR: 1011,
    SERVICE_RESTART: 1012,
    TRY_AGAIN_LATER: 1013,
    BAD_GATEWAY: 1014,
    TLS_HANDSHAKE: 1015
  }
} as const;

// Performance monitoring utilities
export const WebSocketPerformance = {
  /**
   * Monitor connection latency
   */
  async measureLatency(client: AnalysisWebSocketClient): Promise<number> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const handleMessage = (message: WebSocketMessage) => {
        if (message.type === 'HEARTBEAT' && message.data.pong) {
          client.removeListener('message', handleMessage);
          resolve(Date.now() - startTime);
        }
      };

      client.on('message', handleMessage);

      // Send ping
      (client as any).send({
        type: 'HEARTBEAT',
        data: { ping: true, clientTime: startTime },
        timestamp: new Date().toISOString(),
        sessionId: 'latency-test'
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        client.removeListener('message', handleMessage);
        resolve(-1); // Indicates timeout
      }, 10000);
    });
  },

  /**
   * Calculate message throughput
   */
  calculateThroughput(messageCount: number, timeWindowMs: number): number {
    return (messageCount / timeWindowMs) * 1000; // messages per second
  },

  /**
   * Monitor memory usage of WebSocket connections
   */
  getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        used: usage.heapUsed,
        total: usage.heapTotal,
        percentage: (usage.heapUsed / usage.heapTotal) * 100
      };
    }
    return { used: 0, total: 0, percentage: 0 };
  }
};

// Error handling utilities
export const WebSocketErrorHandler = {
  /**
   * Handle connection errors gracefully
   */
  handleConnectionError(error: Error, retryCallback?: () => void): void {
    console.error('[WEBSOCKET ERROR]', error.message);

    // Specific error handling
    if (error.message.includes('ECONNREFUSED')) {
      console.error('WebSocket server is not running or unreachable');
    } else if (error.message.includes('timeout')) {
      console.error('WebSocket connection timed out');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.error('WebSocket authentication failed');
    }

    // Retry if callback provided
    if (retryCallback) {
      setTimeout(retryCallback, 5000);
    }
  },

  /**
   * Create user-friendly error messages
   */
  getUserFriendlyErrorMessage(error: Error): string {
    if (error.message.includes('ECONNREFUSED')) {
      return 'Unable to connect to real-time updates. Please check your connection.';
    } else if (error.message.includes('timeout')) {
      return 'Connection timed out. Attempting to reconnect...';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      return 'Authentication failed. Please refresh the page.';
    } else if (error.message.includes('1008')) {
      return 'Connection rejected due to policy violation.';
    } else if (error.message.includes('1009')) {
      return 'Message too large to send.';
    }
    return 'Connection error occurred. Attempting to reconnect...';
  }
};

// Export types for external use
export type {
  WebSocketMessage,
  ClientConnection,
  AnalysisProgressUpdate,
  WebSocketClientConfig,
  AnalysisProgressData,
  RealtimeIntegrationConfig,
  AnalysisSession
} from './websocket-server';

// Version information
export const WEBSOCKET_VERSION = '1.0.0';
export const WEBSOCKET_FEATURES = [
  'Real-time analysis progress updates',
  'Bidirectional communication',
  'Auto-reconnection with exponential backoff',
  'Project-specific subscriptions',
  'Channel-based broadcasting',
  'Security alert integration',
  'React hooks for easy integration',
  'Connection state management',
  'Performance monitoring',
  'Error handling and recovery'
] as const;