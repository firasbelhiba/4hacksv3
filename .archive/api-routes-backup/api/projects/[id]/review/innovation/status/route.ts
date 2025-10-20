import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

// GET /api/projects/[id]/review/innovation/status - Get innovation analysis status
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

    // Get latest innovation report
    const latestReport = await prisma.innovationReport.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        score: true,
        noveltyScore: true,
        creativityScore: true,
        technicalInnovation: true,
        marketInnovation: true,
        implementationInnovation: true,
        patentPotential: true,
        createdAt: true,
        updatedAt: true,
        processingTime: true
      }
    });

    if (!latestReport) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'none',
          hasReport: false
        }
      });
    }

    const response: ApiResponse = {
      success: true,
      data: {
        ...latestReport,
        hasReport: true,
        isCompleted: latestReport.status === 'COMPLETED',
        isInProgress: latestReport.status === 'IN_PROGRESS',
        isFailed: latestReport.status === 'FAILED'
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching innovation analysis status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}