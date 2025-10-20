'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  ChevronLeft,
  Activity,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Trash2,
  Play,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIJuryProgress, SSEMessage } from '@/hooks/useServerSentEvents';

interface LiveLogsSidebarProps {
  sessionId: string;
  enabled: boolean;
  className?: string;
  defaultOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

interface LogEntryProps {
  message: SSEMessage;
  index: number;
}

const LogEntry: React.FC<LogEntryProps> = ({ message, index }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'connection':
        return <Wifi className="w-4 h-4" />;
      case 'status':
        return <Activity className="w-4 h-4" />;
      case 'progress':
        return <Zap className="w-4 h-4" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'connection':
        return 'text-blue-400';
      case 'status':
        return 'text-purple-400';
      case 'progress':
        return 'text-yellow-400';
      case 'complete':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'connection':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'status':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'progress':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'complete':
        return 'bg-green-500/10 border-green-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.9 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05, // Stagger animation
        ease: 'easeOut',
      }}
      className={cn(
        'p-3 rounded-lg border mb-2 backdrop-blur-sm',
        getBgColor(message.type)
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn('mt-0.5 flex-shrink-0', getColor(message.type))}>
          {getIcon(message.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <Badge variant="outline" className="text-xs px-1 py-0">
              {message.type.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed break-words">
            {message.message}
          </p>

          {/* Show additional data for status messages */}
          {message.type === 'status' && message.data && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Layer:</span>
                  <span className="ml-1 font-medium">{message.data.currentLayer}/4</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="ml-1 font-medium">{message.data.remainingProjects}</span>
                </div>
              </div>
              {message.data.eliminatedProjects > 0 && (
                <div className="mt-1 text-xs">
                  <span className="text-red-400">
                    {message.data.eliminatedProjects} eliminated
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const LiveLogsSidebar: React.FC<LiveLogsSidebarProps> = ({
  sessionId,
  enabled,
  className,
  defaultOpen = true,
  onToggle,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [autoScroll, setAutoScroll] = useState(true);

  // Sync with defaultOpen prop changes
  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    recentActivities,
    sessionData,
    connectionStatus,
    connect,
    disconnect,
    clearMessages,
  } = useAIJuryProgress(sessionId, enabled);

  // Handle toggle state changes
  const handleToggle = (newState: boolean) => {
    setIsOpen(newState);
    onToggle?.(newState);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && lastMessageRef.current && isOpen) {
      lastMessageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages, autoScroll, isOpen]);

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'connecting':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Activity className="w-4 h-4 text-yellow-400" />
          </motion.div>
        );
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Disconnected';
      default:
        return 'Offline';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(
            'fixed right-0 top-0 h-full z-50 bg-background/95 backdrop-blur-md border-l border-border shadow-2xl',
            'flex flex-col w-[400px]',
            className
          )}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggle(false)}
            className={cn(
              'absolute left-0 top-4 -translate-x-1/2',
              'w-8 h-8 rounded-full bg-background border border-border shadow-lg',
              'hover:bg-accent transition-all duration-200',
              'z-10'
            )}
            title="Close Live Progress"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <Card className="m-4 mb-2 border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Live Progress
                  </span>
                  <div className="flex items-center gap-1 text-sm">
                    {getConnectionStatusIcon()}
                    <span className={cn(
                      'text-xs',
                      connectionStatus === 'connected' && 'text-green-400',
                      connectionStatus === 'connecting' && 'text-yellow-400',
                      connectionStatus === 'error' && 'text-red-400',
                      connectionStatus === 'disconnected' && 'text-gray-400'
                    )}>
                      {getConnectionStatusText()}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Session Stats */}
            {sessionData && (
              <Card className="mx-4 mb-2 border-border/50 bg-card/50">
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-400">
                        {sessionData.currentLayer}
                      </div>
                      <div className="text-xs text-muted-foreground">Current Layer</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">
                        {sessionData.remainingProjects}
                      </div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Controls */}
            <div className="flex gap-1 mx-4 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoScroll(!autoScroll)}
                className={cn(
                  'text-xs',
                  autoScroll && 'bg-green-500/20 border-green-500/50'
                )}
              >
                {autoScroll ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {autoScroll ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearMessages}
                className="text-xs"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </Button>
            </div>

            {/* Logs Area */}
            <div
              className="flex-1 px-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-300"
              ref={scrollAreaRef}
            >
              <div className="space-y-1 pb-4">
                <AnimatePresence mode="popLayout">
                  {recentActivities.map((message, index) => (
                    <LogEntry
                      key={message.id}
                      message={message}
                      index={index}
                    />
                  ))}
                </AnimatePresence>

                {/* Empty state */}
                {recentActivities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {connectionStatus === 'connected'
                        ? 'Waiting for updates...'
                        : 'No connection to progress feed'
                      }
                    </p>
                  </div>
                )}

                {/* Auto-scroll anchor */}
                <div ref={lastMessageRef} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};