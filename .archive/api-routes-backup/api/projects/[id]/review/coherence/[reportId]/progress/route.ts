import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

// GET /api/projects/[id]/review/coherence/[reportId]/progress - Get coherence progress
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

    // Optimize caching for different states
    let cacheHeader = 'no-store, max-age=0'; // Default for in-progress

    // Get coherence report progress
    let report = await prisma.coherenceReport.findFirst({
      where: {
        id: reportId,
        projectId,
      },
      select: {
        id: true,
        status: true,
        progress: true,
        currentStage: true,
        stageProgress: true,
        analysisStartedAt: true,
        analysisCompletedAt: true,
        processingTime: true,
        score: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check if analysis is stuck and clean it up
    if (report.status === 'IN_PROGRESS' && report.analysisStartedAt) {
      const stuckThreshold = 10 * 60 * 1000; // 10 minutes
      const timeElapsed = Date.now() - new Date(report.analysisStartedAt).getTime();

      if (timeElapsed > stuckThreshold) {
        console.log(`🧹 Cleaning up stuck coherence analysis: ${reportId} (${Math.round(timeElapsed / 1000)}s elapsed)`);

        // Update the report to FAILED status
        const updatedReport = await prisma.coherenceReport.update({
          where: { id: reportId },
          data: {
            status: 'FAILED',
            progress: 0,
            currentStage: 'cleanup',
            errorMessage: `Analysis timed out after ${Math.round(timeElapsed / 1000)} seconds and was automatically cleaned up`,
            analysisCompletedAt: new Date(),
            analysisTimeMs: timeElapsed
          },
          select: {
            id: true,
            status: true,
            progress: true,
            currentStage: true,
            stageProgress: true,
            analysisStartedAt: true,
            analysisCompletedAt: true,
            processingTime: true,
            score: true,
            errorMessage: true,
            createdAt: true,
            updatedAt: true,
          }
        });

        report = updatedReport;
      }
    }

    // Set appropriate caching based on report status
    if (report.status === 'COMPLETED' || report.status === 'FAILED') {
      cacheHeader = 'public, max-age=60'; // Cache completed/failed reports for 1 minute
    }

    const apiResponse: ApiResponse = {
      success: true,
      data: report,
    };

    const response = NextResponse.json(apiResponse);
    response.headers.set('Cache-Control', cacheHeader);

    return response;
  } catch (error) {
    console.error('Error fetching coherence progress:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}