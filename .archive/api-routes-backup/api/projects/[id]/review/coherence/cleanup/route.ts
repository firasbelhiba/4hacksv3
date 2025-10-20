import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

// POST /api/projects/[id]/review/coherence/cleanup - Clean up stuck coherence reports
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
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Find stuck reports (IN_PROGRESS or PENDING for more than 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);

    const stuckReports = await prisma.coherenceReport.findMany({
      where: {
        projectId,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
        createdAt: {
          lt: oneMinuteAgo
        }
      },
    });

    if (stuckReports.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck coherence reports found',
        data: { cleanedCount: 0 }
      });
    }

    // Mark all stuck reports as failed
    const updateResult = await prisma.coherenceReport.updateMany({
      where: {
        id: {
          in: stuckReports.map(r => r.id)
        }
      },
      data: {
        status: 'FAILED',
        progress: 0,
        currentStage: 'cleanup',
        errorMessage: 'Analysis was stuck and cleaned up manually',
        analysisCompletedAt: new Date(),
        analysisTimeMs: Date.now() - Math.min(...stuckReports.map(r => r.createdAt.getTime()))
      }
    });

    console.log(`Cleaned up ${updateResult.count} stuck coherence reports for project ${projectId}`);

    const response: ApiResponse = {
      success: true,
      message: `Successfully cleaned up ${updateResult.count} stuck coherence report(s)`,
      data: {
        cleanedCount: updateResult.count,
        reportIds: stuckReports.map(r => r.id)
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error cleaning up stuck coherence reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}