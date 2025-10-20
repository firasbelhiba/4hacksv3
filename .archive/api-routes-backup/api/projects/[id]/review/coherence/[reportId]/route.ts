import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { coherenceAgent } from '@/lib/ai-agents/coherence-agent';
import type { ApiResponse } from '@/types/database';

// GET /api/projects/[id]/review/coherence/[reportId] - Get detailed coherence report
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

    // Get the coherence report
    const report = await coherenceAgent.getCoherenceReport(reportId);

    if (!report || report.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const response: ApiResponse = {
      success: true,
      data: report,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching coherence report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/review/coherence/[reportId] - Delete coherence report
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
        projectId,
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // Delete the report
    await prisma.coherenceReport.delete({
      where: { id: reportId },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Coherence report deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting coherence report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}