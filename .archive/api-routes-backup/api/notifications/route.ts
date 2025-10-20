import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';
import type { Notification } from '@/components/dashboard/notifications/notification-center';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const category = url.searchParams.get('category');
    const priority = url.searchParams.get('priority');
    const read = url.searchParams.get('read');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const userId = session.user.id;

    // Build filter conditions
    const whereConditions: any = {
      userId,
    };

    if (type && type !== 'all') {
      whereConditions.type = type;
    }

    if (category && category !== 'all') {
      whereConditions.category = category;
    }

    if (priority && priority !== 'all') {
      whereConditions.priority = priority;
    }

    if (read !== 'all' && read !== null) {
      whereConditions.read = read === 'true';
    }

    // Get notifications from database and generate system notifications
    const [dbNotifications, systemNotifications] = await Promise.all([
      prisma.notification.findMany({
        where: whereConditions,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      generateSystemNotifications(userId),
    ]);

    // Transform database notifications
    const transformedNotifications: Notification[] = dbNotifications.map(notification => ({
      id: notification.id,
      type: notification.type as 'success' | 'warning' | 'error' | 'info',
      category: notification.category as 'system' | 'evaluation' | 'hackathon' | 'project' | 'performance',
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt.toISOString(),
      read: notification.read,
      priority: notification.priority as 'low' | 'medium' | 'high' | 'urgent',
      actionable: notification.actionUrl ? {
        label: notification.actionLabel || 'View',
        href: notification.actionUrl,
      } : undefined,
      metadata: notification.metadata as Record<string, any> | undefined,
    }));

    // Combine and sort notifications
    const allNotifications = [...transformedNotifications, ...systemNotifications]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    const response: ApiResponse<Notification[]> = {
      success: true,
      data: allNotifications,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, category, title, message, priority, actionable, metadata } = body;

    const userId = session.user.id;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        category,
        title,
        message,
        priority: priority || 'medium',
        actionUrl: actionable?.href,
        actionLabel: actionable?.label,
        metadata: metadata || {},
        read: false,
      },
    });

    const transformedNotification: Notification = {
      id: notification.id,
      type: notification.type as 'success' | 'warning' | 'error' | 'info',
      category: notification.category as 'system' | 'evaluation' | 'hackathon' | 'project' | 'performance',
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt.toISOString(),
      read: notification.read,
      priority: notification.priority as 'low' | 'medium' | 'high' | 'urgent',
      actionable: notification.actionUrl ? {
        label: notification.actionLabel || 'View',
        href: notification.actionUrl,
      } : undefined,
      metadata: notification.metadata as Record<string, any> | undefined,
    };

    const response: ApiResponse<Notification> = {
      success: true,
      data: transformedNotification,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Notification creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate system notifications based on current data
async function generateSystemNotifications(userId: string): Promise<Notification[]> {
  const notifications: Notification[] = [];

  try {
    // Check for failed evaluations
    const failedEvaluations = await prisma.evaluation.count({
      where: {
        project: {
          hackathon: { createdById: userId },
        },
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (failedEvaluations > 0) {
      notifications.push({
        id: `failed-eval-${Date.now()}`,
        type: 'error',
        category: 'evaluation',
        title: 'Evaluation Failures Detected',
        message: `${failedEvaluations} evaluation${failedEvaluations > 1 ? 's' : ''} failed in the last 24 hours. Review and retry failed evaluations.`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'high',
        actionable: {
          label: 'View Evaluations',
          href: '/dashboard/evaluations?status=failed',
        },
      });
    }

    // Check for approaching hackathon deadlines
    const upcomingDeadlines = await prisma.hackathon.findMany({
      where: {
        createdById: userId,
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      },
      orderBy: { endDate: 'asc' },
      take: 3,
    });

    upcomingDeadlines.forEach(hackathon => {
      const daysUntil = Math.ceil((hackathon.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `deadline-${hackathon.id}`,
        type: 'warning',
        category: 'hackathon',
        title: 'Hackathon Deadline Approaching',
        message: `"${hackathon.name}" ends in ${daysUntil} day${daysUntil > 1 ? 's' : ''}. Ensure all evaluations are completed.`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: daysUntil <= 2 ? 'urgent' : 'high',
        actionable: {
          label: 'View Hackathon',
          href: `/dashboard/hackathons/${hackathon.id}`,
        },
      });
    });

    // Check for high-performing projects
    const highScoreProjects = await prisma.evaluation.count({
      where: {
        project: {
          hackathon: { createdById: userId },
        },
        status: 'COMPLETED',
        overallScore: { gte: 0.9 },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    if (highScoreProjects > 0) {
      notifications.push({
        id: `high-score-${Date.now()}`,
        type: 'success',
        category: 'evaluation',
        title: 'Exceptional Projects Identified',
        message: `${highScoreProjects} project${highScoreProjects > 1 ? 's' : ''} achieved outstanding scores (90%+) this week!`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'medium',
        actionable: {
          label: 'View Top Projects',
          href: '/dashboard/projects?score=high',
        },
      });
    }

    // Check for system performance issues
    const recentFailures = await prisma.evaluation.count({
      where: {
        project: {
          hackathon: { createdById: userId },
        },
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (recentFailures > 5) {
      notifications.push({
        id: `system-alert-${Date.now()}`,
        type: 'warning',
        category: 'system',
        title: 'High System Load Detected',
        message: `${recentFailures} evaluation failures in the last hour suggest system performance issues.`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'urgent',
        actionable: {
          label: 'System Health',
          href: '/dashboard/system-health',
        },
      });
    }

    return notifications;
  } catch (error) {
    console.error('Error generating system notifications:', error);
    return notifications;
  }
}