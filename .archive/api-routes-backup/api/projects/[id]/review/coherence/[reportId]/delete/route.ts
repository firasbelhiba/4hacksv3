import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

// DELETE /api/projects/[id]/review/coherence/[reportId]/delete - Delete a coherence report
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

    // Verify report exists and belongs to this project
    const report = await prisma.coherenceReport.findFirst({
      where: {
        id: reportId,
        projectId: projectId,
      },
      select: {
        id: true,
        status: true,
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Coherence report not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of reports that are still in progress
    if (report.status === 'IN_PROGRESS' || report.status === 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete report while analysis is in progress. Please wait for completion or cancel the analysis first.'
        },
        { status: 409 }
      );
    }

    // Delete the report
    await prisma.coherenceReport.delete({
      where: {
        id: reportId,
      },
    });

    console.log(`Deleted coherence report ${reportId} for project "${report.project.name}" by user ${session.user.id}`);

    const response: ApiResponse = {
      success: true,
      message: 'Coherence report deleted successfully',
      data: {
        reportId: reportId,
        projectId: projectId
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting coherence report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete coherence report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}