import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

// GET /api/projects/[id]/review/hedera/[reportId] - Get specific Hedera analysis report
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

    // Get the specific Hedera analysis report
    const report = await prisma.hederaAnalysisReport.findFirst({
      where: {
        id: reportId,
        projectId: projectId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            githubUrl: true,
            technologies: true
          }
        }
      }
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Hedera analysis report not found' },
        { status: 404 }
      );
    }

    const response: ApiResponse = {
      success: true,
      data: report
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching Hedera analysis report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/review/hedera/[reportId] - Delete specific Hedera analysis report
export async function DELETE(
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

    // Check if the report exists and belongs to this project
    const report = await prisma.hederaAnalysisReport.findFirst({
      where: {
        id: reportId,
        projectId: projectId
      }
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Hedera analysis report not found' },
        { status: 404 }
      );
    }

    // Don't allow deletion of in-progress reports
    if (report.status === 'IN_PROGRESS') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete report that is currently in progress' },
        { status: 400 }
      );
    }

    // Delete the report
    await prisma.hederaAnalysisReport.delete({
      where: { id: reportId }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Hedera analysis report deleted successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting Hedera analysis report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}