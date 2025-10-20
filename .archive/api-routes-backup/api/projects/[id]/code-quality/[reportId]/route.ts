import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

// GET /api/projects/[id]/code-quality/[reportId] - Get detailed code quality report
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

    const { id: projectId, reportId } = params;

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

    // Get the specific code quality report
    const report = await prisma.codeQualityReport.findFirst({
      where: {
        id: reportId,
        projectId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            teamName: true,
            githubUrl: true,
            hackathon: {
              select: { id: true, name: true },
            },
            track: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Code quality report not found' },
        { status: 404 }
      );
    }

    const response: ApiResponse = {
      success: true,
      data: report,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching code quality report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/code-quality/[reportId] - Delete code quality report
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

    const { id: projectId, reportId } = params;

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
    const report = await prisma.codeQualityReport.findFirst({
      where: {
        id: reportId,
        projectId,
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Code quality report not found' },
        { status: 404 }
      );
    }

    // Delete the report
    await prisma.codeQualityReport.delete({
      where: { id: reportId },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Code quality report deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting code quality report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}