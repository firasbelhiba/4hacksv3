'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useBreadcrumbs } from '@/contexts/layout-context';
// Dashboard service removed - backend endpoint not yet implemented
// import { useDashboard } from '@/lib/services/dashboard-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { GradientText } from '@/components/shared/gradient-bg';
import {
  Trophy,
  FolderOpen,
  Brain,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Plus,
  Activity,
  Database,
  Zap,
  Calendar,
  Award,
  RefreshCw
} from 'lucide-react';
import { staggerContainerVariants, staggerItemVariants, cardHoverVariants } from '@/lib/page-transitions';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { NotificationCenter } from '@/components/dashboard/notifications/notification-center';

export default function DashboardPage() {
  const { user, isSuperAdmin } = useAuth();

  // TODO: Implement dashboard data fetching from backend
  const dashboardData = null;
  const loading = false;
  const error = null;
  const refresh = () => {};

  // Cache the isSuperAdmin result to prevent re-renders
  const isUserSuperAdmin = React.useMemo(() => isSuperAdmin(), [user?.role]);

  // Set breadcrumbs for this page
  useBreadcrumbs([]);

  // Transform dashboard data into stats format for PageHeader
  const stats = React.useMemo(() => {
    // TODO: Get real data from backend
    return [
      {
        label: 'Active Hackathons',
        value: '0',
        trend: 'up' as const
      },
      {
        label: 'Total Projects',
        value: '0',
        trend: 'up' as const
      },
      {
        label: 'Pending Evaluations',
        value: '0',
        trend: 'neutral' as const
      },
      {
        label: 'Reports Generated',
        value: '0',
        trend: 'up' as const
      }
    ];
  }, [dashboardData]);

  const quickActions = [
    {
      title: 'Create Hackathon',
      description: 'Start a new hackathon event',
      icon: Trophy,
      href: '/dashboard/hackathons/new',
      color: 'text-purple-400'
    },
    {
      title: 'Review Projects',
      description: 'Evaluate submitted projects',
      icon: Brain,
      href: '/dashboard/evaluations',
      color: 'text-blue-400'
    },
    {
      title: 'View Analytics',
      description: 'Check platform metrics',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'text-green-400'
    },
    {
      title: 'Manage Users',
      description: 'User administration',
      icon: Users,
      href: '/dashboard/users',
      color: 'text-orange-400'
    }
  ];

  // Format recent activity with relative time
  const recentActivity = React.useMemo(() => {
    if (!dashboardData?.recentActivity) return [];

    return dashboardData.recentActivity.map(activity => ({
      ...activity,
      time: formatDistanceToNow(new Date(activity.time), { addSuffix: true })
    }));
  }, [dashboardData]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'hackathon': return Trophy;
      case 'project': return FolderOpen;
      case 'evaluation': return Brain;
      case 'report': return BarChart3;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'completed': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'degraded': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'down': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Dashboard Error</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={staggerItemVariants}>
        <PageHeader
          title={
            <span>
              Welcome back, <GradientText>{user?.name?.split(' ')[0]}</GradientText>!
            </span>
          }
          description="Monitor your hackathon platform and manage events efficiently."
          badge={{
            text: user?.role || 'Admin',
            variant: isUserSuperAdmin ? 'default' : 'secondary'
          }}
          stats={stats}
        >
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <Link href="/dashboard/hackathons/new">
              <Button className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Hackathon
              </Button>
            </Link>
          </div>
        </PageHeader>
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div variants={staggerItemVariants}>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.title}
                variants={cardHoverVariants}
                whileHover="hover"
                initial="initial"
              >
                <Link href={action.href}>
                  <Card className="cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-200 h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-background/50 ${action.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {action.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div variants={staggerItemVariants} className="lg:col-span-2">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-400" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates across your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-background/30 border border-border/30">
                        <div className="h-4 w-4 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-background/30 border border-border/30 hover:bg-background/50 transition-colors"
                    >
                      <div className="mt-1">
                        <Icon className={`h-4 w-4 ${getStatusColor(activity.status)}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                      <Badge
                        variant={
                          activity.status === 'active' ? 'default' :
                          activity.status === 'pending' ? 'secondary' : 'outline'
                        }
                        className="text-xs capitalize"
                      >
                        {activity.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* System Status */}
        <motion.div variants={staggerItemVariants}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                System Status
              </CardTitle>
              <CardDescription>
                Platform health overview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-6 bg-muted rounded w-20" />
                    </div>
                  ))}
                </div>
              ) : dashboardData?.systemHealth ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        <span className="text-sm">Database</span>
                      </div>
                      <Badge className={getHealthStatusColor(dashboardData.systemHealth.database.status)}>
                        {dashboardData.systemHealth.database.status}
                        <span className="ml-1 text-xs">({dashboardData.systemHealth.database.latency}ms)</span>
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm">AI Services</span>
                      </div>
                      <Badge className={getHealthStatusColor(dashboardData.systemHealth.ai.status)}>
                        {dashboardData.systemHealth.ai.status}
                        <span className="ml-1 text-xs">({dashboardData.systemHealth.ai.responseTime}ms)</span>
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-sm">Storage</span>
                      </div>
                      <Badge className={getHealthStatusColor(dashboardData.systemHealth.storage.status)}>
                        {dashboardData.systemHealth.storage.usage}% used
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-sm font-medium mb-2">Platform Stats</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Users</span>
                        <span>{dashboardData.stats.users.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Sessions</span>
                        <span>{dashboardData.stats.users.activeSessions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Hackathons</span>
                        <span>{dashboardData.stats.hackathons.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Projects</span>
                        <span>{dashboardData.stats.projects.total}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">System health unavailable</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Dashboard Sections */}
      {dashboardData && (
        <>
          {/* Top Performing Projects */}
          {dashboardData.topPerformingProjects.length > 0 && (
            <motion.div variants={staggerItemVariants} className="mt-8">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-400" />
                    Top Performing Projects
                  </CardTitle>
                  <CardDescription>
                    Highest scoring projects across all hackathons
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    {dashboardData.topPerformingProjects.map((project, index) => (
                      <div key={project.id} className="flex items-center space-x-3 p-3 rounded-lg bg-background/30 border border-border/30">
                        <div className="text-center min-w-[2rem]">
                          <Badge variant={index === 0 ? 'default' : 'secondary'} className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{project.name}</h4>
                          <p className="text-xs text-muted-foreground">Team: {project.teamName}</p>
                          <p className="text-xs text-muted-foreground">{project.hackathon} • {project.track}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-green-600">{Math.round(project.overallScore * 10) / 10}/100</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Upcoming Deadlines */}
          {dashboardData.upcomingDeadlines.length > 0 && (
            <motion.div variants={staggerItemVariants} className="mt-8">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-400" />
                    Upcoming Deadlines
                  </CardTitle>
                  <CardDescription>
                    Important dates for your hackathons
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    {dashboardData.upcomingDeadlines.map((deadline) => (
                      <div key={`${deadline.id}-${deadline.type}`} className="flex items-center space-x-3 p-3 rounded-lg bg-background/30 border border-border/30">
                        <div className="text-center min-w-[3rem]">
                          <Badge
                            variant={deadline.daysRemaining <= 3 ? 'destructive' : deadline.daysRemaining <= 7 ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {deadline.daysRemaining}d
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{deadline.name}</h4>
                          <p className="text-xs text-muted-foreground capitalize">
                            {deadline.type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(deadline.date), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}