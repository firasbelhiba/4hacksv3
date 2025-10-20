import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';
import type { RecentActivity } from '@/lib/services/dashboard-service';

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
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const userId = session.user.id;

    // Get recent activities from multiple sources
    const [
      recentLogs,
      recentHackathons,
      recentProjects,
      recentEvaluations,
      recentReports,
    ] = await Promise.all([
      getActivityLogs(userId, limit),
      getRecentHackathons(userId),
      getRecentProjects(userId),
      getRecentEvaluations(userId),
      getRecentReports(userId),
    ]);

    // Combine and sort activities
    const allActivities: RecentActivity[] = [
      ...recentLogs,
      ...recentHackathons,
      ...recentProjects,
      ...recentEvaluations,
      ...recentReports,
    ];

    // Sort by time (most recent first) and limit
    const sortedActivities = allActivities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, limit);

    const response: ApiResponse<RecentActivity[]> = {
      success: true,
      data: sortedActivities,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

async function getActivityLogs(userId: string, limit: number): Promise<RecentActivity[]> {
  const logs = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: Math.floor(limit / 2), // Take half of limit for logs
  });

  return logs.map(log => ({
    id: log.id,
    type: (log.entityType.toLowerCase() as any) || 'activity',
    title: log.action,
    description: `${log.action} on ${log.entityType}`,
    time: log.createdAt.toISOString(),
    status: 'completed' as const,
    entityId: log.entityId,
    metadata: log.metadata as any,
  }));
}

async function getRecentHackathons(userId: string): Promise<RecentActivity[]> {
  const hackathons = await prisma.hackathon.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      name: true,
      createdAt: true,
      startDate: true,
      endDate: true,
    },
  });

  const now = new Date();

  return hackathons.map(hackathon => {
    const isActive = hackathon.startDate <= now && hackathon.endDate >= now;
    const isUpcoming = hackathon.startDate > now;

    return {
      id: hackathon.id,
      type: 'hackathon',
      title: hackathon.name,
      description: isActive ? 'Hackathon is currently active' :
                  isUpcoming ? 'Hackathon starting soon' :
                  'Hackathon created',
      time: hackathon.createdAt.toISOString(),
      status: isActive ? 'active' : isUpcoming ? 'pending' : 'completed',
      entityId: hackathon.id,
    };
  });
}

async function getRecentProjects(userId: string): Promise<RecentActivity[]> {
  const projects = await prisma.project.findMany({
    where: {
      hackathon: { createdById: userId },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      teamName: true,
      status: true,
      createdAt: true,
      submittedAt: true,
      hackathon: {
        select: { name: true },
      },
    },
  });

  return projects.map(project => ({
    id: project.id,
    type: 'project',
    title: project.name,
    description: `Project ${project.submittedAt ? 'submitted' : 'created'} by ${project.teamName}`,
    time: (project.submittedAt || project.createdAt).toISOString(),
    status: project.status === 'SUBMITTED' ? 'completed' :
            project.status === 'EVALUATING' ? 'pending' :
            project.status === 'EVALUATED' ? 'completed' : 'active',
    entityId: project.id,
    metadata: { hackathon: project.hackathon.name },
  }));
}

async function getRecentEvaluations(userId: string): Promise<RecentActivity[]> {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      project: {
        hackathon: { createdById: userId },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      status: true,
      overallScore: true,
      createdAt: true,
      completedAt: true,
      project: {
        select: { name: true, teamName: true },
      },
    },
  });

  return evaluations.map(evaluation => ({
    id: evaluation.id,
    type: 'evaluation',
    title: `Evaluation for ${evaluation.project.name}`,
    description: evaluation.status === 'COMPLETED'
      ? `Evaluation completed (Score: ${Math.round((evaluation.overallScore || 0) * 10) / 10}/100)`
      : evaluation.status === 'IN_PROGRESS'
      ? 'Evaluation in progress'
      : 'Evaluation pending',
    time: (evaluation.completedAt || evaluation.createdAt).toISOString(),
    status: evaluation.status === 'COMPLETED' ? 'completed' :
            evaluation.status === 'IN_PROGRESS' ? 'pending' :
            evaluation.status === 'FAILED' ? 'failed' : 'pending',
    entityId: evaluation.id,
    metadata: { projectName: evaluation.project.name, teamName: evaluation.project.teamName },
  }));
}

async function getRecentReports(userId: string): Promise<RecentActivity[]> {
  const [codeReports, coherenceReports, innovationReports, hederaReports] = await Promise.all([
    // Code Quality Reports
    prisma.codeQualityReport.findMany({
      where: {
        project: { hackathon: { createdById: userId } },
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: {
        id: true,
        overallScore: true,
        createdAt: true,
        project: { select: { name: true } },
      },
    }),
    // Coherence Reports
    prisma.coherenceReport.findMany({
      where: {
        project: { hackathon: { createdById: userId } },
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: {
        id: true,
        score: true,
        createdAt: true,
        project: { select: { name: true } },
      },
    }),
    // Innovation Reports
    prisma.innovationReport.findMany({
      where: {
        project: { hackathon: { createdById: userId } },
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: {
        id: true,
        score: true,
        createdAt: true,
        project: { select: { name: true } },
      },
    }),
    // Hedera Reports
    prisma.hederaAnalysisReport.findMany({
      where: {
        project: { hackathon: { createdById: userId } },
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: {
        id: true,
        confidence: true,
        technologyCategory: true,
        createdAt: true,
        project: { select: { name: true } },
      },
    }),
  ]);

  const activities: RecentActivity[] = [];

  // Add code quality reports
  codeReports.forEach(report => {
    activities.push({
      id: report.id,
      type: 'report',
      title: `Code Quality Report for ${report.project.name}`,
      description: `Analysis completed (Score: ${Math.round((report.overallScore || 0) * 10) / 10}/100)`,
      time: report.createdAt.toISOString(),
      status: 'completed',
      entityId: report.id,
      metadata: { reportType: 'code_quality', projectName: report.project.name },
    });
  });

  // Add coherence reports
  coherenceReports.forEach(report => {
    activities.push({
      id: report.id,
      type: 'report',
      title: `Coherence Analysis for ${report.project.name}`,
      description: `Analysis completed (Score: ${Math.round(report.score * 10) / 10}/100)`,
      time: report.createdAt.toISOString(),
      status: 'completed',
      entityId: report.id,
      metadata: { reportType: 'coherence', projectName: report.project.name },
    });
  });

  // Add innovation reports
  innovationReports.forEach(report => {
    activities.push({
      id: report.id,
      type: 'report',
      title: `Innovation Analysis for ${report.project.name}`,
      description: `Analysis completed (Score: ${Math.round(report.score * 10) / 10}/100)`,
      time: report.createdAt.toISOString(),
      status: 'completed',
      entityId: report.id,
      metadata: { reportType: 'innovation', projectName: report.project.name },
    });
  });

  // Add hedera reports
  hederaReports.forEach(report => {
    activities.push({
      id: report.id,
      type: 'report',
      title: `Hedera Analysis for ${report.project.name}`,
      description: `Technology analysis completed (${report.technologyCategory}, ${report.confidence}% confidence)`,
      time: report.createdAt.toISOString(),
      status: 'completed',
      entityId: report.id,
      metadata: { reportType: 'hedera', projectName: report.project.name },
    });
  });

  return activities;
}