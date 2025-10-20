import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { aiJuryProgressManager } from '@/lib/ai-jury-progress';

// DELETE /api/ai-jury/sessions/[id]/reset - Reset AI jury session and delete all data
export async function DELETE(
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

    const sessionId = params.id;

    // Verify session exists and user has access
    const aiJurySession = await prisma.aIJurySession.findFirst({
      where: {
        id: sessionId,
        hackathon: {
          createdById: session.user.id,
        },
      },
      include: {
        hackathon: {
          select: {
            name: true,
            _count: {
              select: {
                projects: true,
              },
            },
          },
        },
      },
    });

    if (!aiJurySession) {
      return NextResponse.json(
        { success: false, error: 'AI jury session not found or access denied' },
        { status: 404 }
      );
    }

    // Prevent deletion of running sessions for safety
    if (['LAYER_1_ELIGIBILITY', 'LAYER_2_HEDERA', 'LAYER_3_CODE_QUALITY', 'LAYER_4_FINAL_ANALYSIS'].includes(aiJurySession.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot reset a session that is currently processing. Please wait for completion or stop the session first.' },
        { status: 409 }
      );
    }

    // Delete all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all layer results for this session
      await tx.aIJuryLayerResult.deleteMany({
        where: {
          sessionId: sessionId,
        },
      });

      // Delete the AI jury session itself
      await tx.aIJurySession.delete({
        where: {
          id: sessionId,
        },
      });
    });

    // Clean up in-memory progress data
    aiJuryProgressManager.cleanupSession(sessionId);

    console.log(`AI Jury session ${sessionId} reset successfully by user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'AI jury session and all associated data has been deleted successfully',
      data: {
        sessionId: sessionId,
        hackathonName: aiJurySession.hackathon.name,
        deletedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error resetting AI jury session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ai-jury/sessions/[id]/reset - Reset session data but keep the session (soft reset)
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

    const sessionId = params.id;

    // Verify session exists and user has access
    const aiJurySession = await prisma.aIJurySession.findFirst({
      where: {
        id: sessionId,
        hackathon: {
          createdById: session.user.id,
        },
      },
      include: {
        hackathon: {
          select: {
            name: true,
            _count: {
              select: {
                projects: true,
              },
            },
          },
        },
      },
    });

    if (!aiJurySession) {
      return NextResponse.json(
        { success: false, error: 'AI jury session not found or access denied' },
        { status: 404 }
      );
    }

    // Prevent reset of running sessions for safety
    if (['LAYER_1_ELIGIBILITY', 'LAYER_2_HEDERA', 'LAYER_3_CODE_QUALITY', 'LAYER_4_FINAL_ANALYSIS'].includes(aiJurySession.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot reset a session that is currently processing. Please wait for completion or stop the session first.' },
        { status: 409 }
      );
    }

    // Reset session data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all layer results for this session
      await tx.aIJuryLayerResult.deleteMany({
        where: {
          sessionId: sessionId,
        },
      });

      // Reset session to initial state
      await tx.aIJurySession.update({
        where: {
          id: sessionId,
        },
        data: {
          status: 'PENDING',
          currentLayer: 1,
          eliminatedProjects: 0,
          layerResults: {},
          finalResults: {},
          updatedAt: new Date(),
        },
      });
    });

    // Clean up in-memory progress data
    aiJuryProgressManager.cleanupSession(sessionId);

    // Get the updated session
    const updatedSession = await prisma.aIJurySession.findUnique({
      where: { id: sessionId },
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

    console.log(`AI Jury session ${sessionId} data reset successfully by user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'AI jury session has been reset to initial state',
      data: updatedSession,
    });

  } catch (error) {
    console.error('Error resetting AI jury session data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}