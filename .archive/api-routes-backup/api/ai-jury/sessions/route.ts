import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

// GET /api/ai-jury/sessions - Get AI jury session for hackathon
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const hackathonId = url.searchParams.get('hackathonId');

    if (!hackathonId) {
      return NextResponse.json(
        { success: false, error: 'Hackathon ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to the hackathon
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: hackathonId,
        createdById: session.user.id,
      },
    });

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: 'Hackathon not found or access denied' },
        { status: 404 }
      );
    }

    // Get the latest AI jury session for this hackathon
    const aiJurySession = await prisma.aIJurySession.findFirst({
      where: {
        hackathonId: hackathonId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        layerResults_rel: {
          orderBy: {
            layer: 'asc',
          },
        },
      },
    });

    if (!aiJurySession) {
      return NextResponse.json(
        { success: false, error: 'No AI jury session found for this hackathon' },
        { status: 404 }
      );
    }

    // Transform layer results into the format expected by the frontend
    const layerResults: Record<number, any[]> = {};
    aiJurySession.layerResults_rel.forEach(result => {
      if (!layerResults[result.layer]) {
        layerResults[result.layer] = [];
      }
      layerResults[result.layer].push({
        projectId: result.projectId,
        eliminated: result.eliminated,
        score: result.score,
        reason: result.reason,
        evidence: result.evidence,
        layer: result.layer,
        processedAt: result.processedAt,
      });
    });

    // Include the formatted layer results in the response
    const sessionWithFormattedResults = {
      ...aiJurySession,
      layerResults: layerResults,
    };

    return NextResponse.json({
      success: true,
      data: sessionWithFormattedResults,
    });
  } catch (error) {
    console.error('Error fetching AI jury session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ai-jury/sessions - Create new AI jury session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { hackathonId, eligibilityCriteria } = body;

    if (!hackathonId) {
      return NextResponse.json(
        { success: false, error: 'Hackathon ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to the hackathon
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: hackathonId,
        createdById: session.user.id,
      },
      include: {
        projects: true,
      },
    });

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: 'Hackathon not found or access denied' },
        { status: 404 }
      );
    }

    // Check if there's already an active session
    const existingSession = await prisma.aIJurySession.findFirst({
      where: {
        hackathonId: hackathonId,
        status: {
          not: 'COMPLETED',
        },
      },
    });

    if (existingSession) {
      return NextResponse.json(
        { success: false, error: 'An AI jury session is already active for this hackathon' },
        { status: 409 }
      );
    }

    // Create new AI jury session
    const aiJurySession = await prisma.aIJurySession.create({
      data: {
        hackathonId: hackathonId,
        eligibilityCriteria: eligibilityCriteria || {},
        status: 'PENDING',
        currentLayer: 1,
        totalLayers: 4,
        totalProjects: hackathon.projects.length,
        eliminatedProjects: 0,
        layerResults: {},
        finalResults: {},
      },
      include: {
        hackathon: {
          select: {
            name: true,
            _count: {
              select: {
                projects: true,
                tracks: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: aiJurySession,
    });
  } catch (error) {
    console.error('Error creating AI jury session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}