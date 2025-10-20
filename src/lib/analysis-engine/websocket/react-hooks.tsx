'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnalysisWebSocketClient, WebSocketMessage, AnalysisProgressData } from './websocket-client';

export interface UseAnalysisWebSocketOptions {
  url?: string;
  userId?: string;
  autoConnect?: boolean;
  reconnectOnMount?: boolean;
}

export interface UseAnalysisWebSocketReturn {
  // Connection state
  isConnected: boolean;
  connectionState: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'CLOSING';
  error: Error | null;

  // Data
  lastMessage: WebSocketMessage | null;
  analysisProgress: Record<string, AnalysisProgressData>; // projectId -> progress
  securityAlerts: any[];
  analysisResults: Record<string, any>; // projectId -> results

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeToProject: (projectId: string) => void;
  unsubscribeFromProject: (projectId: string) => void;
  subscribeToAnalysisUpdates: () => void;
  subscribeToSecurityAlerts: () => void;

  // Stats
  stats: {
    reconnectAttempts: number;
    subscribedProjects: number;
    messagesReceived: number;
    lastMessageTime: Date | null;
  };
}

export function useAnalysisWebSocket(options: UseAnalysisWebSocketOptions = {}): UseAnalysisWebSocketReturn {
  const {
    url = 'ws://localhost:8080',
    userId,
    autoConnect = true,
    reconnectOnMount = true
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'CLOSING'>('DISCONNECTED');
  const [error, setError] = useState<Error | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<Record<string, AnalysisProgressData>>({});
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({});
  const [messagesReceived, setMessagesReceived] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);

  // Refs
  const clientRef = useRef<AnalysisWebSocketClient | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const subscribedProjectsRef = useRef<Set<string>>(new Set());

  // Initialize client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new AnalysisWebSocketClient({
        url,
        userId,
        autoReconnect: reconnectOnMount,
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000
      });

      // Setup event listeners
      const client = clientRef.current;

      client.on('connected', () => {
        setIsConnected(true);
        setConnectionState('CONNECTED');
        setError(null);
        reconnectAttemptsRef.current = 0;
      });

      client.on('disconnected', (event) => {
        setIsConnected(false);
        setConnectionState('DISCONNECTED');
        if (event.code !== 1000) {
          setError(new Error(`Connection lost: ${event.reason}`));
        }
      });

      client.on('error', (err) => {
        setError(err as Error);
        setConnectionState('DISCONNECTED');
      });

      client.on('message', (message: WebSocketMessage) => {
        setLastMessage(message);
        setMessagesReceived(prev => prev + 1);
        setLastMessageTime(new Date());
      });

      client.on('analysisProgress', (progress: AnalysisProgressData) => {
        setAnalysisProgress(prev => ({
          ...prev,
          [progress.projectId]: progress
        }));
      });

      client.on('analysisComplete', (event) => {
        setAnalysisResults(prev => ({
          ...prev,
          [event.projectId]: event.results
        }));

        // Remove from progress when complete
        setAnalysisProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[event.projectId];
          return newProgress;
        });
      });

      client.on('analysisFailure', (event) => {
        setAnalysisResults(prev => ({
          ...prev,
          [event.projectId]: { error: event.error, failed: true }
        }));

        // Remove from progress when failed
        setAnalysisProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[event.projectId];
          return newProgress;
        });
      });

      client.on('securityAlert', (alert) => {
        setSecurityAlerts(prev => [...prev.slice(-19), alert]); // Keep last 20 alerts
      });

      client.on('maxReconnectAttemptsReached', () => {
        setError(new Error('Maximum reconnection attempts reached'));
      });
    }

    // Auto-connect if requested
    if (autoConnect && clientRef.current && !isConnected) {
      clientRef.current.connect().catch(err => {
        setError(err);
      });
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [url, userId, autoConnect, reconnectOnMount]);

  // Actions
  const connect = useCallback(async () => {
    if (clientRef.current) {
      setConnectionState('CONNECTING');
      setError(null);
      try {
        await clientRef.current.connect();
      } catch (err) {
        setError(err as Error);
        setConnectionState('DISCONNECTED');
        throw err;
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      setConnectionState('DISCONNECTED');
    }
  }, []);

  const subscribeToProject = useCallback((projectId: string) => {
    if (clientRef.current) {
      clientRef.current.subscribeToProject(projectId);
      subscribedProjectsRef.current.add(projectId);
    }
  }, []);

  const unsubscribeFromProject = useCallback((projectId: string) => {
    if (clientRef.current) {
      clientRef.current.unsubscribeFromProject(projectId);
      subscribedProjectsRef.current.delete(projectId);

      // Clean up local state for this project
      setAnalysisProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[projectId];
        return newProgress;
      });
    }
  }, []);

  const subscribeToAnalysisUpdates = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.subscribeToChannel('analysis');
    }
  }, []);

  const subscribeToSecurityAlerts = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.subscribeToChannel('security');
    }
  }, []);

  // Stats
  const stats = {
    reconnectAttempts: reconnectAttemptsRef.current,
    subscribedProjects: subscribedProjectsRef.current.size,
    messagesReceived,
    lastMessageTime
  };

  return {
    isConnected,
    connectionState,
    error,
    lastMessage,
    analysisProgress,
    securityAlerts,
    analysisResults,
    connect,
    disconnect,
    subscribeToProject,
    unsubscribeFromProject,
    subscribeToAnalysisUpdates,
    subscribeToSecurityAlerts,
    stats
  };
}

// Specialized hook for project analysis
export interface UseProjectAnalysisOptions {
  projectId: string;
  autoSubscribe?: boolean;
  websocketOptions?: UseAnalysisWebSocketOptions;
}

export interface UseProjectAnalysisReturn {
  // Analysis state
  isAnalyzing: boolean;
  progress: AnalysisProgressData | null;
  results: any | null;
  error: any | null;

  // Connection state
  isConnected: boolean;
  connectionError: Error | null;

  // Actions
  startWatching: () => void;
  stopWatching: () => void;
  reconnect: () => Promise<void>;
}

export function useProjectAnalysis(options: UseProjectAnalysisOptions): UseProjectAnalysisReturn {
  const { projectId, autoSubscribe = true, websocketOptions = {} } = options;

  const websocket = useAnalysisWebSocket({
    autoConnect: true,
    ...websocketOptions
  });

  const progress = websocket.analysisProgress[projectId] || null;
  const results = websocket.analysisResults[projectId] || null;
  const isAnalyzing = !!progress && progress.status === 'IN_PROGRESS';
  const error = results?.error || null;

  // Auto-subscribe to project updates
  useEffect(() => {
    if (autoSubscribe && websocket.isConnected && projectId) {
      websocket.subscribeToProject(projectId);

      return () => {
        websocket.unsubscribeFromProject(projectId);
      };
    }
  }, [autoSubscribe, websocket.isConnected, projectId, websocket.subscribeToProject, websocket.unsubscribeFromProject]);

  const startWatching = useCallback(() => {
    if (projectId) {
      websocket.subscribeToProject(projectId);
    }
  }, [projectId, websocket.subscribeToProject]);

  const stopWatching = useCallback(() => {
    if (projectId) {
      websocket.unsubscribeFromProject(projectId);
    }
  }, [projectId, websocket.unsubscribeFromProject]);

  const reconnect = useCallback(async () => {
    await websocket.connect();
    if (projectId) {
      websocket.subscribeToProject(projectId);
    }
  }, [websocket.connect, projectId, websocket.subscribeToProject]);

  return {
    isAnalyzing,
    progress,
    results,
    error,
    isConnected: websocket.isConnected,
    connectionError: websocket.error,
    startWatching,
    stopWatching,
    reconnect
  };
}

// Hook for security monitoring
export interface UseSecurityMonitoringReturn {
  alerts: any[];
  latestAlert: any | null;
  criticalAlertsCount: number;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearAlerts: () => void;
}

export function useSecurityMonitoring(websocketOptions: UseAnalysisWebSocketOptions = {}): UseSecurityMonitoringReturn {
  const websocket = useAnalysisWebSocket({
    autoConnect: true,
    ...websocketOptions
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  const alerts = websocket.securityAlerts;
  const latestAlert = alerts.length > 0 ? alerts[alerts.length - 1] : null;
  const criticalAlertsCount = alerts.filter(alert => alert.severity === 'CRITICAL').length;

  const startMonitoring = useCallback(() => {
    websocket.subscribeToSecurityAlerts();
    setIsMonitoring(true);
  }, [websocket.subscribeToSecurityAlerts]);

  const stopMonitoring = useCallback(() => {
    // Note: We don't actually unsubscribe from security channel
    // as that's a global concern, but we stop showing the monitoring state
    setIsMonitoring(false);
  }, []);

  const clearAlerts = useCallback(() => {
    // This would need to be implemented in the main hook
    // For now, it's a placeholder
  }, []);

  return {
    alerts,
    latestAlert,
    criticalAlertsCount,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearAlerts
  };
}

// Context provider for sharing WebSocket connection
import { createContext, useContext, ReactNode } from 'react';

interface WebSocketContextType {
  websocket: UseAnalysisWebSocketReturn;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export interface WebSocketProviderProps {
  children: ReactNode;
  websocketOptions?: UseAnalysisWebSocketOptions;
}

export function WebSocketProvider({ children, websocketOptions = {} }: WebSocketProviderProps) {
  const websocket = useAnalysisWebSocket({
    autoConnect: true,
    reconnectOnMount: true,
    ...websocketOptions
  });

  return (
    <WebSocketContext.Provider value={{ websocket }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): UseAnalysisWebSocketReturn {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context.websocket;
}