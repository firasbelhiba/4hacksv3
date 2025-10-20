import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';
import type { AdvancedAnalytics, TimeSeriesData, CategoryData, ComparisonData } from '@/lib/services/analytics-service';

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
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const hackathonIds = url.searchParams.getAll('hackathonIds');
    const trackIds = url.searchParams.getAll('trackIds');

    const userId = session.user.id;

    // Date range filters
    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };

    const baseProjectFilter = {
      hackathon: {
        createdById: userId,
        ...(hackathonIds.length > 0 && { id: { in: hackathonIds } }),
      },
      ...(trackIds.length > 0 && { trackId: { in: trackIds } }),
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    };

    // Get comprehensive analytics data in parallel
    const [
      performanceMetrics,
      technologyInsights,
      evaluationAnalytics,
      systemPerformance,
      timeSeriesData,
      categoryData,
      comparisonData,
    ] = await Promise.all([
      getPerformanceMetrics(userId, baseProjectFilter),
      getTechnologyInsights(userId, baseProjectFilter),
      getEvaluationAnalytics(userId, baseProjectFilter),
      getSystemPerformanceAnalytics(),
      getTimeSeriesAnalytics(userId, baseProjectFilter),
      getCategoryAnalytics(userId, baseProjectFilter),
      getComparisonAnalytics(userId, baseProjectFilter),
    ]);

    const analyticsData: AdvancedAnalytics = {
      performanceMetrics,
      technologyInsights,
      evaluationAnalytics,
      systemPerformance,
      timeSeriesData,
      categoryData,
      comparisonData,
    };

    const response: ApiResponse<AdvancedAnalytics> = {
      success: true,
      data: analyticsData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Advanced analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

async function getPerformanceMetrics(userId: string, projectFilter: any) {
  // Get user's hackathon IDs and project IDs first
  const userHackathons = await prisma.hackathon.findMany({
    where: { createdById: userId },
    select: { id: true },
  });

  const userHackathonIds = userHackathons.map(h => h.id);

  const userProjects = await prisma.project.findMany({
    where: {
      hackathonId: { in: userHackathonIds },
    },
    select: { id: true },
  });

  const userProjectIds = userProjects.map(p => p.id);

  const [totalProjects, completedEvaluations, averageScoreResult, recentProjects] = await Promise.all([
    prisma.project.count({ where: { hackathonId: { in: userHackathonIds } } }),
    prisma.evaluation.count({
      where: {
        projectId: { in: userProjectIds },
        status: 'COMPLETED',
      },
    }),
    prisma.evaluation.aggregate({
      where: {
        projectId: { in: userProjectIds },
        status: 'COMPLETED',
      },
      _avg: { overallScore: true },
    }),
    prisma.project.count({
      where: {
        hackathonId: { in: userHackathonIds },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
  ]);

  const previousProjects = await prisma.project.count({
    where: {
      hackathonId: { in: userHackathonIds },
      createdAt: {
        gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 30-60 days ago
        lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  const topTrack = await prisma.project.groupBy({
    by: ['trackId'],
    where: { hackathonId: { in: userHackathonIds } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 1,
  });

  const topTrackInfo = topTrack.length > 0
    ? await prisma.track.findUnique({
        where: { id: topTrack[0].trackId },
        select: { name: true },
      })
    : null;

  const participationGrowth = previousProjects > 0
    ? ((recentProjects - previousProjects) / previousProjects) * 100
    : 0;

  return {
    totalProjects,
    averageScore: averageScoreResult._avg.overallScore || 0,
    completionRate: totalProjects > 0 ? (completedEvaluations / totalProjects) * 100 : 0,
    participationGrowth,
    topPerformingTrack: topTrackInfo?.name || 'N/A',
    trendDirection: participationGrowth > 5 ? 'up' as const : participationGrowth < -5 ? 'down' as const : 'stable' as const,
  };
}

async function getTechnologyInsights(userId: string, projectFilter: any) {
  // Get user's hackathon IDs first
  const userHackathons = await prisma.hackathon.findMany({
    where: { createdById: userId },
    select: { id: true },
  });

  const userHackathonIds = userHackathons.map(h => h.id);

  // Get all project IDs for this user's hackathons first
  const userProjects = await prisma.project.findMany({
    where: {
      hackathonId: { in: userHackathonIds },
    },
    select: { id: true },
  });

  const userProjectIds = userProjects.map(p => p.id);

  // Get Hedera analysis results
  const hederaResults = await prisma.hederaAnalysisReport.groupBy({
    by: ['technologyCategory'],
    where: {
      projectId: { in: userProjectIds },
      status: 'COMPLETED',
    },
    _count: { id: true },
  });

  const blockchainAdoption = {
    hedera: hederaResults.find(r => r.technologyCategory === 'HEDERA')?._count.id || 0,
    otherBlockchain: hederaResults.find(r => r.technologyCategory === 'OTHER_BLOCKCHAIN')?._count.id || 0,
    noBlockchain: hederaResults.find(r => r.technologyCategory === 'NO_BLOCKCHAIN')?._count.id || 0,
  };

  // Mock technology data (in real implementation, extract from project repositories)
  const mostUsedTechnologies = [
    { name: 'JavaScript', value: Math.floor(Math.random() * 50) + 20, color: '#f7df1e' },
    { name: 'Python', value: Math.floor(Math.random() * 40) + 15, color: '#3776ab' },
    { name: 'React', value: Math.floor(Math.random() * 35) + 10, color: '#61dafb' },
    { name: 'Node.js', value: Math.floor(Math.random() * 30) + 8, color: '#339933' },
    { name: 'Solidity', value: Math.floor(Math.random() * 25) + 5, color: '#363636' },
  ];

  return {
    mostUsedTechnologies,
    blockchainAdoption,
    frameworkPopularity: mostUsedTechnologies.slice(0, 3),
    languageDistribution: mostUsedTechnologies,
  };
}

async function getEvaluationAnalytics(userId: string, projectFilter: any) {
  // Get user's hackathon IDs and project IDs first
  const userHackathons = await prisma.hackathon.findMany({
    where: { createdById: userId },
    select: { id: true },
  });

  const userHackathonIds = userHackathons.map(h => h.id);

  const userProjects = await prisma.project.findMany({
    where: {
      hackathonId: { in: userHackathonIds },
    },
    select: { id: true },
  });

  const userProjectIds = userProjects.map(p => p.id);

  const evaluations = await prisma.evaluation.findMany({
    where: {
      projectId: { in: userProjectIds },
      status: 'COMPLETED',
    },
    include: {
      project: { select: { createdAt: true } },
    },
  });

  const processingTimes = evaluations
    .filter(e => e.startedAt && e.completedAt)
    .map(e => e.completedAt!.getTime() - e.startedAt!.getTime());

  const averageProcessingTime = processingTimes.length > 0
    ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length / (1000 * 60) // minutes
    : 0;

  const totalEvaluations = await prisma.evaluation.count({
    where: { projectId: { in: userProjectIds } },
  });

  const successRate = totalEvaluations > 0 ? (evaluations.length / totalEvaluations) * 100 : 0;

  // Score distribution
  const scoreRanges = [
    { name: '0-20', value: 0 },
    { name: '21-40', value: 0 },
    { name: '41-60', value: 0 },
    { name: '61-80', value: 0 },
    { name: '81-100', value: 0 },
  ];

  evaluations.forEach(e => {
    const score = e.overallScore * 100;
    if (score <= 20) scoreRanges[0].value++;
    else if (score <= 40) scoreRanges[1].value++;
    else if (score <= 60) scoreRanges[2].value++;
    else if (score <= 80) scoreRanges[3].value++;
    else scoreRanges[4].value++;
  });

  const criteriaBreakdown = {
    codeQuality: evaluations.reduce((sum, e) => sum + e.technicalScore, 0) / evaluations.length || 0,
    innovation: evaluations.reduce((sum, e) => sum + e.innovationScore, 0) / evaluations.length || 0,
    coherence: evaluations.reduce((sum, e) => sum + e.documentationScore, 0) / evaluations.length || 0,
    hedera: evaluations.reduce((sum, e) => sum + (e.businessScore || 0), 0) / evaluations.length || 0,
  };

  // Monthly trends (simplified)
  const monthlyTrends: TimeSeriesData[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleString('default', { month: 'short' });

    monthlyTrends.push({
      name: monthName,
      date: date.toISOString(),
      evaluations: Math.floor(Math.random() * 20) + 5,
      avgScore: Math.floor(Math.random() * 30) + 60,
    });
  }

  return {
    averageProcessingTime,
    successRate,
    scoreDistribution: scoreRanges,
    criteriaBreakdown,
    monthlyTrends,
  };
}

async function getSystemPerformanceAnalytics() {
  // Generate mock health metrics (in real implementation, collect from monitoring)
  const healthMetrics: TimeSeriesData[] = [];
  for (let i = 23; i >= 0; i--) {
    const date = new Date();
    date.setHours(date.getHours() - i);

    healthMetrics.push({
      name: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: date.toISOString(),
      dbLatency: Math.floor(Math.random() * 50) + 10,
      apiResponse: Math.floor(Math.random() * 100) + 50,
      aiResponse: Math.floor(Math.random() * 500) + 200,
    });
  }

  return {
    healthMetrics,
    apiPerformance: {
      averageResponseTime: 85,
      errorRate: 0.5,
      throughput: 150,
    },
    resourceUtilization: {
      database: { connections: 12, queryTime: 45 },
      storage: { used: 75, available: 25 },
      ai: { requestsPerMinute: 25, averageTime: 250 },
    },
  };
}

async function getTimeSeriesAnalytics(userId: string, projectFilter: any) {
  const submissions: TimeSeriesData[] = [];
  const scores: TimeSeriesData[] = [];
  const systemHealth: TimeSeriesData[] = [];

  // Generate time series for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    submissions.push({
      name: dayName,
      date: date.toISOString(),
      submissions: Math.floor(Math.random() * 10) + 1,
      evaluations: Math.floor(Math.random() * 8) + 1,
    });

    scores.push({
      name: dayName,
      date: date.toISOString(),
      codeQuality: Math.floor(Math.random() * 20) + 70,
      innovation: Math.floor(Math.random() * 25) + 65,
      coherence: Math.floor(Math.random() * 30) + 60,
      overall: Math.floor(Math.random() * 25) + 65,
    });

    systemHealth.push({
      name: dayName,
      date: date.toISOString(),
      dbLatency: Math.floor(Math.random() * 30) + 10,
      apiResponse: Math.floor(Math.random() * 50) + 30,
      aiResponse: Math.floor(Math.random() * 200) + 150,
    });
  }

  return { submissions, scores, systemHealth };
}

async function getCategoryAnalytics(userId: string, projectFilter: any) {
  // Get user's hackathon IDs first
  const userHackathons = await prisma.hackathon.findMany({
    where: { createdById: userId },
    select: { id: true },
  });

  const userHackathonIds = userHackathons.map(h => h.id);

  const projectsByStatus = await prisma.project.groupBy({
    by: ['status'],
    where: { hackathonId: { in: userHackathonIds } },
    _count: { id: true },
  });

  const projectStatus = projectsByStatus.map(item => ({
    name: item.status.replace('_', ' '),
    value: item._count.id,
    color: getStatusColor(item.status),
  }));

  const hackathonParticipation = await prisma.project.groupBy({
    by: ['hackathonId'],
    where: { hackathonId: { in: userHackathonIds } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  const hackathonNames = await prisma.hackathon.findMany({
    where: { id: { in: hackathonParticipation.map(h => h.hackathonId) } },
    select: { id: true, name: true },
  });

  const hackathonParticipationData = hackathonParticipation.map(item => {
    const hackathon = hackathonNames.find(h => h.id === item.hackathonId);
    return {
      name: hackathon?.name || 'Unknown',
      value: item._count.id,
    };
  });

  const trackDistribution = await prisma.project.groupBy({
    by: ['trackId'],
    where: { hackathonId: { in: userHackathonIds } },
    _count: { id: true },
  });

  const trackNames = await prisma.track.findMany({
    where: { id: { in: trackDistribution.map(t => t.trackId) } },
    select: { id: true, name: true },
  });

  const trackDistributionData = trackDistribution.map(item => {
    const track = trackNames.find(t => t.id === item.trackId);
    return {
      name: track?.name || 'Unknown',
      value: item._count.id,
    };
  });

  return {
    projectStatus,
    hackathonParticipation: hackathonParticipationData,
    trackDistribution: trackDistributionData,
  };
}

async function getComparisonAnalytics(userId: string, projectFilter: any) {
  // Hackathon comparison
  const hackathons = await prisma.hackathon.findMany({
    where: { createdById: userId },
    include: {
      projects: {
        include: { evaluation: true },
      },
    },
    take: 10,
  });

  const hackathonComparison = hackathons.map(hackathon => {
    const projects = hackathon.projects.length;
    const completedEvaluations = hackathon.projects.filter(p => p.evaluation?.status === 'COMPLETED').length;
    const avgScore = hackathon.projects
      .filter(p => p.evaluation?.overallScore)
      .reduce((sum, p) => sum + (p.evaluation!.overallScore * 100), 0) /
      (hackathon.projects.filter(p => p.evaluation?.overallScore).length || 1);

    return {
      name: hackathon.name.length > 15 ? hackathon.name.substring(0, 15) + '...' : hackathon.name,
      projects,
      evaluations: completedEvaluations,
      avgScore: Math.round(avgScore * 10) / 10,
    };
  });

  // Track performance (mock data for now)
  const trackPerformance = [
    { name: 'AI/ML', submissions: 25, completed: 20, avgScore: 78 },
    { name: 'Blockchain', submissions: 18, completed: 15, avgScore: 82 },
    { name: 'Web Dev', submissions: 30, completed: 25, avgScore: 75 },
    { name: 'Mobile', submissions: 12, completed: 10, avgScore: 80 },
  ];

  // Monthly activity
  const monthlyActivity: ComparisonData[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleString('default', { month: 'short' });

    monthlyActivity.push({
      name: monthName,
      hackathons: Math.floor(Math.random() * 3) + 1,
      projects: Math.floor(Math.random() * 20) + 10,
      evaluations: Math.floor(Math.random() * 15) + 8,
    });
  }

  return {
    hackathonComparison,
    trackPerformance,
    monthlyActivity,
  };
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'SUBMITTED': return '#22c55e';
    case 'EVALUATING': return '#3b82f6';
    case 'EVALUATED': return '#10b981';
    case 'DISQUALIFIED': return '#ef4444';
    default: return '#6b7280';
  }
}