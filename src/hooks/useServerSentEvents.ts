import { useState, useEffect, useRef, useCallback } from 'react';

export interface SSEMessage {
  id: string;
  type: 'connection' | 'status' | 'progress' | 'complete' | 'error';
  message: string;
  data?: any;
  timestamp: string;
  sessionId: string;
}

export interface UseServerSentEventsOptions {
  sessionId: string;
  enabled?: boolean;
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface UseServerSentEventsReturn {
  messages: SSEMessage[];
  lastMessage: SSEMessage | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  connect: () => void;
  disconnect: () => void;
  clearMessages: () => void;
}

export function useServerSentEvents({
  sessionId,
  enabled = true,
  onMessage,
  onError,
  onOpen,
  onClose,
}: UseServerSentEventsOptions): UseServerSentEventsReturn {
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    if (!sessionId) {
      console.error('Session ID is required for SSE connection');
      return;
    }

    setConnectionStatus('connecting');

    try {
      const eventSource = new EventSource(`/api/ai-jury/sessions/${sessionId}/live-progress`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setConnectionStatus('connected');
        onOpen?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);

          setMessages(prev => [...prev, message]);
          setLastMessage(message);
          onMessage?.(message);

          // Auto-disconnect on completion
          if (message.type === 'complete') {
            setTimeout(() => {
              disconnect();
            }, 2000);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setConnectionStatus('error');
        onError?.(error);

        // Attempt to reconnect after 3 seconds on error
        setTimeout(() => {
          if (enabled && eventSourceRef.current === eventSource) {
            connect();
          }
        }, 3000);
      };

      eventSource.addEventListener('close', () => {
        console.log('SSE connection closed');
        setConnectionStatus('disconnected');
        onClose?.();
      });

    } catch (error) {
      console.error('Error creating SSE connection:', error);
      setConnectionStatus('error');
    }
  }, [sessionId, enabled, onMessage, onError, onOpen, onClose]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastMessage(null);
  }, []);

  // Auto-connect when enabled and sessionId is available
  useEffect(() => {
    if (enabled && sessionId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, sessionId]); // Note: not including connect/disconnect to avoid infinite loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    messages,
    lastMessage,
    connectionStatus,
    connect,
    disconnect,
    clearMessages,
  };
}

// Helper hook for AI Jury specific SSE logic
export function useAIJuryProgress(sessionId: string, enabled = true) {
  const [sessionData, setSessionData] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<SSEMessage[]>([]);

  const sse = useServerSentEvents({
    sessionId,
    enabled,
    onMessage: (message) => {
      // Store recent activity messages
      if (message.type !== 'connection') {
        setRecentActivities(prev => [...prev.slice(-19), message]); // Keep last 20 activities
      }

      // Update session data from status messages
      if (message.type === 'status' && message.data) {
        setSessionData(message.data);
      }
    },
    onError: (error) => {
      console.error('AI Jury SSE error:', error);
    },
  });

  return {
    ...sse,
    sessionData,
    recentActivities,
  };
}