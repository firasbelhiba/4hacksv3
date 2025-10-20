import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; reportId: string } }
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
    const reportId = params.reportId;

    if (!projectId || !reportId) {
      return NextResponse.json(
        { success: false, error: 'Project ID and Report ID are required' },
        { status: 400 }
      );
    }

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        hackathon: {
          select: {
            createdById: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has access (must be hackathon creator for now)
    if (project.hackathon.createdById !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get the code quality report with progress data
    const report = await prisma.codeQualityReport.findUnique({
      where: {
        id: reportId,
        projectId: projectId
      },
      select: {
        id: true,
        status: true,
        progress: true,
        currentStage: true,
        totalFiles: true,
        processedFiles: true,
        stageProgress: true,
        estimatedTimeRemaining: true,
        analysisStartedAt: true,
        analysisCompletedAt: true,
        errorMessage: true,
        updatedAt: true
      }
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}