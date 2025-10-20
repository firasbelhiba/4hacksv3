'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  BellOff,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle,
  Clock,
  Zap,
  TrendingUp,
  Settings,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/lib/api/client';

// Types
export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  category: 'system' | 'evaluation' | 'hackathon' | 'project' | 'performance';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionable?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  className?: string;
  maxHeight?: number;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationCenter({
  className,
  maxHeight = 400,
  onNotificationClick,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high-priority'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await apiClient.notifications.list();
        setNotifications(data || []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.notifications.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => ['high', 'urgent'].includes(n.priority)).length;

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'high-priority':
        return ['high', 'urgent'].includes(notification.priority);
      default:
        return true;
    }
  });

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleRemoveNotification = (id: string) => {
    deleteNotification(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-500 bg-green-50 border-green-200';
      case 'warning': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'error': return 'text-red-500 bg-red-50 border-red-200';
      default: return 'text-blue-500 bg-blue-50 border-blue-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return Settings;
      case 'evaluation': return Zap;
      case 'hackathon': return Clock;
      case 'performance': return TrendingUp;
      default: return Info;
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-12 right-0 z-50 w-96"
          >
            <Card className="border-border/50 bg-background/95 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="text-xs"
                      >
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{unreadCount} unread</span>
                  <span>{highPriorityCount} high priority</span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 mt-2">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'unread', label: 'Unread' },
                    { key: 'high-priority', label: 'Priority' },
                  ].map(({ key, label }) => (
                    <Button
                      key={key}
                      variant={filter === key ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter(key as any)}
                      className="text-xs"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div
                  className="overflow-y-auto"
                  style={{ maxHeight: `${maxHeight}px` }}
                >
                  {loading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <BellOff className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {filter === 'all' ? 'No notifications' : `No ${filter.replace('-', ' ')} notifications`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredNotifications.map((notification, index) => {
                        const Icon = getNotificationIcon(notification.type);
                        const CategoryIcon = getCategoryIcon(notification.category);

                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              'border-l-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer relative',
                              !notification.read && 'bg-muted/30',
                              getNotificationColor(notification.type)
                            )}
                            onClick={() => {
                              if (!notification.read) {
                                handleMarkAsRead(notification.id);
                              }
                              if (onNotificationClick) {
                                onNotificationClick(notification);
                              }
                            }}
                          >
                            {/* Priority Indicator */}
                            <div
                              className={cn(
                                'absolute top-2 left-2 w-2 h-2 rounded-full',
                                getPriorityColor(notification.priority)
                              )}
                            />

                            <div className="flex items-start gap-3 ml-2">
                              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm line-clamp-1">
                                    {notification.title}
                                  </p>
                                  <CategoryIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                  )}
                                </div>

                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {notification.message}
                                </p>

                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                  </span>

                                  {notification.actionable && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-6 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (notification.actionable!.onClick) {
                                          notification.actionable!.onClick();
                                        } else if (notification.actionable!.href) {
                                          window.location.href = notification.actionable!.href;
                                        }
                                      }}
                                    >
                                      {notification.actionable.label}
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveNotification(notification.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {filteredNotifications.length > 0 && (
                  <div className="p-3 border-t bg-muted/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        // Navigate to full notifications page
                        window.location.href = '/dashboard/notifications';
                      }}
                    >
                      View All Notifications
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}