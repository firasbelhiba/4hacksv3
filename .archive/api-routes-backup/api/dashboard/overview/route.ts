import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma, healthCheck } from '@/lib/db';
import type { ApiResponse } from '@/types/database';
import type { DashboardData } from '@/lib/services/dashboard-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get comprehensive dashboard data
    const [
      hackathonStats,
      projectStats,
      evaluationStats,
      reportStats,
      userStats,
      recentActivity,
      systemHealth,
      topProjects,
      upcomingDeadlines,
    ] = await Promise.all([
      getHackathonStats(),
      getProjectStats(),
      getEvaluationStats(),
      getReportStats(),
      getUserStats(),
      getRecentActivity(),
      getSystemHealthData(),
      getTopPerformingProjects(),
      getUpcomingDeadlines(),
    ]);

    const dashboardData: DashboardData = {
      stats: {
        hackathons: hackathonStats,
        projects: projectStats,
        evaluations: evaluationStats,
        reports: reportStats,
        users: userStats,
      },
      recentActivity,
      systemHealth,
      topPerformingProjects: topProjects,
      upcomingDeadlines,
    };

    const response: ApiResponse<DashboardData> = {
      success: true,
      data: dashboardData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for fetching dashboard data

async function getHackathonStats() {
  const now = new Date();

  const [total, active, upcoming, completed] = await Promise.all([
    prisma.hackathon.count({
      where: { createdById: (await getServerSession(authOptions))?.user?.id },
    }),
    prisma.hackathon.count({
      where: {
        createdById: (await getServerSession(authOptions))?.user?.id,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    }),
    prisma.hackathon.count({
      where: {
        createdById: (await getServerSession(authOptions))?.user?.id,
        startDate: { gt: now },
      },
    }),
    prisma.hackathon.count({
      where: {
        createdById: (await getServerSession(authOptions))?.user?.id,
        endDate: { lt: now },
      },
    }),
  ]);

  return { total, active, upcoming, completed };
}

async function getProjectStats() {
  const userId = (await getServerSession(authOptions))?.user?.id;

  const [total, submitted, evaluating, evaluated] = await Promise.all([
    prisma.project.count({
      where: {
        hackathon: { createdById: userId },
      },
    }),
    prisma.project.count({
      where: {
        hackathon: { createdById: userId },
        status: 'SUBMITTED',
      },
    }),
    prisma.project.count({
      where: {
        hackathon: { createdById: userId },
        status: 'EVALUATING',
      },
    }),
    prisma.project.count({
      where: {
        hackathon: { createdById: userId },
        status: 'EVALUATED',
      },
    }),
  ]);

  return { total, submitted, evaluating, evaluated };
}

async function getEvaluationStats() {
  const userId = (await getServerSession(authOptions))?.user?.id;

  const [total, completed, pending, inProgress] = await Promise.all([
    prisma.evaluation.count({
      where: {
        project: {
          hackathon: { createdById: userId },
        },
      },
    }),
    prisma.evaluation.count({
      where: {
        project: {
          hackathon: { createdById: userId },
        },
        status: 'COMPLETED',
      },
    }),
    prisma.evaluation.count({
      where: {
        project: {
          hackathon: { createdById: userId },
        },
        status: 'PENDING',
      },
    }),
    prisma.evaluation.count({
      where: {
        project: {
          hackathon: { createdById: userId },
        },
        status: 'IN_PROGRESS',
      },
    }),
  ]);

  return { total, completed, pending, inProgress };
}

async function getReportStats() {
  const userId = (await getServerSession(authOptions))?.user?.id;

  const [codeQuality, coherence, innovation, hedera] = await Promise.all([
    prisma.codeQualityReport.count({
      where: {
        project: {
          hackathon: { createdById: userId },
        },
        status: 'COMPLETED',
      },
    }),
    prisma.coherenceReport.count({
      where: {
        project: {
          hackathon: { createdById: userId },
        },
        status: 'COMPLETED',
      },
    }),
    prisma.innovationReport.count({
      where: {
        project: {
          hackathon: { createdById: userId },
        },
        status: 'COMPLETED',
      },
    }),
    prisma.hederaAnalysisReport.count({
      where: {
        project: {
          hackathon: { createdById: userId },
        },
        status: 'COMPLETED',
      },
    }),
  ]);

  return { codeQuality, coherence, innovation, hedera };
}

async function getUserStats() {
  const [total, activeSessions] = await Promise.all([
    prisma.user.count(),
    prisma.session.count({
      where: {
        expires: { gt: new Date() },
      },
    }),
  ]);

  return { total, activeSessions };
}

async function getRecentActivity() {
  const userId = (await getServerSession(authOptions))?.user?.id;

  // Get recent activities from activity logs
  const activities = await prisma.activityLog.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
    include: {
      user: {
        select: { name: true },
      },
    },
  });

  return activities.map(activity => ({
    id: activity.id,
    type: activity.entityType as any,
    title: activity.action,
    description: `${activity.action} on ${activity.entityType}`,
    time: activity.createdAt.toISOString(),
    status: 'completed' as const,
    entityId: activity.entityId,
    metadata: activity.metadata as any,
  }));
}

async function getSystemHealthData() {
  const dbHealth = await healthCheck();

  return {
    database: {
      status: dbHealth.healthy ? 'healthy' as const : 'down' as const,
      latency: dbHealth.latency || 0,
      lastChecked: new Date().toISOString(),
    },
    ai: {
      status: 'healthy' as const, // This would be checked via AI service
      responseTime: 250,
      lastChecked: new Date().toISOString(),
    },
    storage: {
      status: 'healthy' as const,
      usage: 75,
      available: 25,
    },
  };
}

async function getTopPerformingProjects() {
  const userId = (await getServerSession(authOptions))?.user?.id;

  const topProjects = await prisma.project.findMany({
    where: {
      hackathon: { createdById: userId },
      evaluation: {
        status: 'COMPLETED',
        overallScore: { gt: 0 },
      },
    },
    include: {
      hackathon: {
        select: { name: true },
      },
      track: {
        select: { name: true },
      },
      evaluation: {
        select: { overallScore: true },
      },
    },
    orderBy: {
      evaluation: {
        overallScore: 'desc',
      },
    },
    take: 5,
  });

  return topProjects.map(project => ({
    id: project.id,
    name: project.name,
    teamName: project.teamName,
    hackathon: project.hackathon.name,
    overallScore: project.evaluation?.overallScore || 0,
    track: project.track.name,
  }));
}

async function getUpcomingDeadlines() {
  const userId = (await getServerSession(authOptions))?.user?.id;
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const upcomingHackathons = await prisma.hackathon.findMany({
    where: {
      createdById: userId,
      OR: [
        {
          startDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
        {
          endDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
    orderBy: {
      startDate: 'asc',
    },
    take: 5,
  });

  const deadlines = [];

  for (const hackathon of upcomingHackathons) {
    if (hackathon.startDate > now) {
      const daysRemaining = Math.ceil(
        (hackathon.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      deadlines.push({
        id: hackathon.id,
        name: hackathon.name,
        type: 'hackathon_start' as const,
        date: hackathon.startDate.toISOString(),
        daysRemaining,
      });
    }

    if (hackathon.endDate > now) {
      const daysRemaining = Math.ceil(
        (hackathon.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      deadlines.push({
        id: hackathon.id,
        name: hackathon.name,
        type: 'hackathon_end' as const,
        date: hackathon.endDate.toISOString(),
        daysRemaining,
      });
    }
  }

  return deadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);
}