import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { codeQualityService } from '@/lib/services/code-quality-service';
import type { ApiResponse } from '@/types/database';

// POST /api/projects/[id]/code-quality - Trigger code quality analysis
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = params.id;

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: session.user.id,
        },
      },
      include: {
        hackathon: {
          select: { id: true, name: true },
        },
        track: {
          select: { id: true, name: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Check if there's already a pending or in-progress analysis
    const existingReport = await prisma.codeQualityReport.findFirst({
      where: {
        projectId,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        {
          success: false,
          error: 'Code quality analysis is already in progress for this project',
          data: { reportId: existingReport.id, status: existingReport.status }
        },
        { status: 409 }
      );
    }

    // Create new code quality report
    const report = await prisma.codeQualityReport.create({
      data: {
        projectId,
        repositoryUrl: project.githubUrl,
        status: 'PENDING',
      },
    });

    // Trigger background analysis (do not await - let it run asynchronously)
    codeQualityService.analyzeRepository(report.id, project.githubUrl).catch(error => {
      console.error('Background analysis failed:', error);
    });

    const response: ApiResponse = {
      success: true,
      data: {
        reportId: report.id,
        status: report.status,
        projectId,
        repositoryUrl: project.githubUrl,
      },
      message: 'Code quality analysis started successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error starting code quality analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/code-quality - Get code quality reports for project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = params.id;

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: session.user.id,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Get all code quality reports for this project
    const reports = await prisma.codeQualityReport.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        overallScore: true,
        technicalScore: true,
        securityScore: true,
        documentationScore: true,
        performanceScore: true,
        codeSmellsCount: true,
        bugsCount: true,
        vulnerabilitiesCount: true,
        duplicatedLinesCount: true,
        totalLinesAnalyzed: true,
        strengths: true,
        improvements: true,
        errorMessage: true,
        analysisStartedAt: true,
        analysisCompletedAt: true,
        analysisTimeMs: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: reports,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching code quality reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}