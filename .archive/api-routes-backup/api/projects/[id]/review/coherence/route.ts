import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { coherenceAgent } from '@/lib/ai-agents/coherence-agent';
import type { ApiResponse } from '@/types/database';

// POST /api/projects/[id]/review/coherence - Start coherence analysis
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
    const existingReport = await prisma.coherenceReport.findFirst({
      where: {
        projectId,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingReport) {
      // Check if the report is stuck (older than 30 seconds)
      const TIMEOUT_SECONDS = 30;
      const timeoutThreshold = new Date(Date.now() - TIMEOUT_SECONDS * 1000);
      const isStuck = existingReport.createdAt < timeoutThreshold;

      if (isStuck) {
        // Mark stuck report as failed and allow new analysis
        await prisma.coherenceReport.update({
          where: { id: existingReport.id },
          data: {
            status: 'FAILED',
            progress: 0,
            currentStage: 'timeout',
            errorMessage: `Analysis timed out after ${TIMEOUT_SECONDS} seconds`,
            analysisCompletedAt: new Date(),
            analysisTimeMs: Date.now() - existingReport.createdAt.getTime()
          }
        });
        console.log(`Marked stuck coherence report ${existingReport.id} as failed due to timeout`);
      } else {
        // Report is still active, block new requests
        return NextResponse.json(
          {
            success: false,
            error: 'Coherence analysis is already in progress for this project',
            data: { reportId: existingReport.id, status: existingReport.status }
          },
          { status: 409 }
        );
      }
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
    coherenceAgent.analyzeProjectCoherence(projectId, options).catch(error => {
      console.error('Background coherence analysis failed:', error);
    });

    const response: ApiResponse = {
      success: true,
      data: {
        projectId,
        status: 'IN_PROGRESS',
        message: 'Coherence analysis started'
      },
      message: 'Coherence analysis started successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error starting coherence analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/review/coherence - Get coherence reports for project
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

    // Get all coherence reports for this project
    const reports = await coherenceAgent.getProjectCoherenceReports(projectId);

    const response: ApiResponse = {
      success: true,
      data: reports,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching coherence reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}