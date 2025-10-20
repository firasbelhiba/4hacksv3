import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/ai-jury/sessions/[id]/progress - Get real-time progress of AI jury session
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

    const sessionId = params.id;

    // Get AI jury session with progress details
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
                tracks: true,
              },
            },
          },
        },
        layerResults_rel: {
          where: {
            layer: {
              lte: 4, // Only get results for layers 1-4
            },
          },
          orderBy: [
            { layer: 'asc' },
            { processedAt: 'desc' },
          ],
        },
      },
    });

    if (!aiJurySession) {
      return NextResponse.json(
        { success: false, error: 'AI jury session not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate progress for each layer
    const layerProgress = {
      1: { completed: 0, total: 0, status: 'pending' },
      2: { completed: 0, total: 0, status: 'pending' },
      3: { completed: 0, total: 0, status: 'pending' },
      4: { completed: 0, total: 0, status: 'pending' },
    };

    // Count projects in each layer
    const layerResults = aiJurySession.layerResults_rel.reduce((acc, result) => {
      if (!acc[result.layer]) {
        acc[result.layer] = [];
      }
      acc[result.layer].push(result);
      return acc;
    }, {} as Record<number, typeof aiJurySession.layerResults_rel>);

    // Calculate progress based on session status
    const totalProjects = aiJurySession.totalProjects;
    let activeProjects = totalProjects;

    for (let layer = 1; layer <= 4; layer++) {
      const results = layerResults[layer] || [];
      const completed = results.length;

      if (layer <= aiJurySession.currentLayer) {
        layerProgress[layer as keyof typeof layerProgress] = {
          completed,
          total: activeProjects,
          status: layer < aiJurySession.currentLayer ? 'completed' :
                  (aiJurySession.status === `LAYER_${layer}_${getLayerName(layer)}`.toUpperCase() ? 'in_progress' : 'pending')
        };

        // Update active projects for next layer (subtract eliminated projects)
        const eliminated = results.filter(r => r.eliminated).length;
        activeProjects = activeProjects - eliminated;
      }
    }

    // Calculate overall progress percentage
    const currentLayerProgress = layerProgress[aiJurySession.currentLayer as keyof typeof layerProgress];
    const overallProgress = aiJurySession.currentLayer === 1 ? 0 :
      ((aiJurySession.currentLayer - 1) / 4) * 100 +
      (currentLayerProgress.total > 0 ? (currentLayerProgress.completed / currentLayerProgress.total) * 25 : 0);

    // Get elimination stats by layer
    const eliminationStats = Object.entries(layerResults).map(([layer, results]) => ({
      layer: parseInt(layer),
      layerName: getLayerName(parseInt(layer)),
      totalProcessed: results.length,
      eliminated: results.filter(r => r.eliminated).length,
      advanced: results.filter(r => !r.eliminated).length,
    }));

    // Estimated time remaining (simple calculation based on current progress)
    const estimatedTimeRemaining = aiJurySession.status === 'COMPLETED' ? 0 :
      Math.max(0, (4 - aiJurySession.currentLayer) * 2 * 60000); // 2 minutes per layer

    return NextResponse.json({
      success: true,
      data: {
        session: aiJurySession,
        progress: {
          overallProgress: Math.round(overallProgress),
          currentLayer: aiJurySession.currentLayer,
          totalLayers: aiJurySession.totalLayers,
          layerProgress,
          eliminationStats,
          estimatedTimeRemaining,
        },
        stats: {
          totalProjects: aiJurySession.totalProjects,
          eliminatedProjects: aiJurySession.eliminatedProjects,
          remainingProjects: aiJurySession.totalProjects - aiJurySession.eliminatedProjects,
          eliminationRate: aiJurySession.totalProjects > 0 ?
            Math.round((aiJurySession.eliminatedProjects / aiJurySession.totalProjects) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching AI jury progress:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getLayerName(layer: number): string {
  const layerNames = {
    1: 'ELIGIBILITY',
    2: 'HEDERA',
    3: 'CODE_QUALITY',
    4: 'FINAL_ANALYSIS',
  };
  return layerNames[layer as keyof typeof layerNames] || 'UNKNOWN';
}