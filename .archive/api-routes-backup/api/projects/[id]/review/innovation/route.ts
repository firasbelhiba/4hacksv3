import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { innovationAgent } from '@/lib/ai-agents/innovation-agent';
import type { ApiResponse } from '@/types/database';

// POST /api/projects/[id]/review/innovation - Start innovation analysis
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
    let existingReport = null;
    try {
      existingReport = await prisma.innovationReport.findFirst({
        where: {
          projectId,
          status: {
            in: ['PENDING', 'IN_PROGRESS'],
          },
        },
      });
    } catch (error) {
      // Handle case where InnovationReport model doesn't exist yet
      console.log('InnovationReport model not available yet, proceeding with migration needed response');
      return NextResponse.json(
        {
          success: false,
          error: 'Database migration required. Please run: npm run db:generate && npm run db:push',
          code: 'MIGRATION_REQUIRED'
        },
        { status: 503 }
      );
    }

    if (existingReport) {
      return NextResponse.json(
        {
          success: false,
          error: 'Innovation analysis is already in progress for this project',
          data: { reportId: existingReport.id, status: existingReport.status }
        },
        { status: 409 }
      );
    }

    // Parse request body for options
    let options = {};
    try {
      const body = await request.json();
      options = body.options || {};
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Trigger background analysis (do not await - let it run asynchronously)
    innovationAgent.analyzeProjectInnovation(projectId, options).catch(error => {
      console.error('Background innovation analysis failed:', error);
    });

    const response: ApiResponse = {
      success: true,
      data: {
        projectId,
        status: 'IN_PROGRESS',
        message: 'Innovation analysis started'
      },
      message: 'Innovation analysis started successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error starting innovation analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/review/innovation - Get innovation reports for project
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

    // Get all innovation reports for this project
    const reports = await innovationAgent.getProjectInnovationReports(projectId);

    const response: ApiResponse = {
      success: true,
      data: reports,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching innovation reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}