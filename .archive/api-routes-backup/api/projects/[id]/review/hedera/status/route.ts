import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

// GET /api/projects/[id]/review/hedera/status - Get current status of Hedera analysis
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

    // Get the latest Hedera analysis report
    const latestReport = await prisma.hederaAnalysisReport.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        technologyCategory: true,
        confidence: true,
        detectedTechnologies: true,
        hederaUsageScore: true,
        summary: true,
        processingTime: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        hasReport: !!latestReport,
        report: latestReport,
        projectId
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching Hedera analysis status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}