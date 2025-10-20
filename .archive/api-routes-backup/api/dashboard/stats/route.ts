import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';
import type { DashboardStats } from '@/lib/services/dashboard-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get comprehensive statistics
    const [
      hackathonStats,
      projectStats,
      evaluationStats,
      reportStats,
      userStats,
    ] = await Promise.all([
      getHackathonStats(userId),
      getProjectStats(userId),
      getEvaluationStats(userId),
      getReportStats(userId),
      getUserStats(),
    ]);

    const stats: DashboardStats = {
      hackathons: hackathonStats,
      projects: projectStats,
      evaluations: evaluationStats,
      reports: reportStats,
      users: userStats,
    };

    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

async function getHackathonStats(userId: string) {
  const now = new Date();

  const [total, active, upcoming, completed] = await Promise.all([
    prisma.hackathon.count({
      where: { createdById: userId },
    }),
    prisma.hackathon.count({
      where: {
        createdById: userId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    }),
    prisma.hackathon.count({
      where: {
        createdById: userId,
        startDate: { gt: now },
      },
    }),
    prisma.hackathon.count({
      where: {
        createdById: userId,
        endDate: { lt: now },
      },
    }),
  ]);

  return { total, active, upcoming, completed };
}

async function getProjectStats(userId: string) {
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

async function getEvaluationStats(userId: string) {
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

async function getReportStats(userId: string) {
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