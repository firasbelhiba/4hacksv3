import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/ai-jury/sessions/[id]/results - Get final results of AI jury session
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

    // Get AI jury session with full results
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
            tracks: {
              select: {
                id: true,
                name: true,
                _count: {
                  select: {
                    projects: true,
                  },
                },
              },
            },
          },
        },
        layerResults_rel: {
          include: {
            // We'll need to get project details via a separate query
          },
          orderBy: [
            { layer: 'asc' },
            { score: 'desc' },
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

    if (aiJurySession.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'AI jury session is not completed yet' },
        { status: 400 }
      );
    }

    // Get all project IDs from layer results
    const projectIds = Array.from(new Set(aiJurySession.layerResults_rel.map(r => r.projectId)));

    // Get project details
    const projects = await prisma.project.findMany({
      where: {
        id: {
          in: projectIds,
        },
      },
      include: {
        track: {
          select: {
            id: true,
            name: true,
          },
        },
        hackathon: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create project lookup map
    const projectMap = projects.reduce((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {} as Record<string, typeof projects[0]>);

    // Process results by layer
    const layerResults = aiJurySession.layerResults_rel.reduce((acc, result) => {
      if (!acc[result.layer]) {
        acc[result.layer] = [];
      }

      const project = projectMap[result.projectId];
      if (project) {
        acc[result.layer].push({
          ...result,
          project,
        });
      }

      return acc;
    }, {} as Record<number, Array<typeof aiJurySession.layerResults_rel[0] & { project: typeof projects[0] }>>);

    // Get final top 5 results per track
    const finalResults = aiJurySession.finalResults as any;
    const topProjects: Record<string, Array<any>> = {};

    if (finalResults && finalResults.topProjectsByTrack) {
      for (const [trackId, projectIds] of Object.entries(finalResults.topProjectsByTrack as Record<string, string[]>)) {
        const trackProjects = projectIds.slice(0, 5).map((projectId: string) => {
          const project = projectMap[projectId];
          const layer4Result = layerResults[4]?.find(r => r.projectId === projectId);

          return {
            project,
            finalScore: layer4Result?.score || 0,
            eliminationJourney: [1, 2, 3, 4].map(layer => {
              const result = layerResults[layer]?.find(r => r.projectId === projectId);
              return {
                layer,
                eliminated: result?.eliminated || false,
                score: result?.score,
                reason: result?.reason,
              };
            }),
          };
        }).filter(item => item.project);

        if (trackProjects.length > 0) {
          topProjects[trackId] = trackProjects;
        }
      }
    }

    // Calculate statistics
    const stats = {
      totalProjects: aiJurySession.totalProjects,
      eliminatedProjects: aiJurySession.eliminatedProjects,
      finalWinners: Object.values(topProjects).reduce((sum, track) => sum + track.length, 0),
      eliminationByLayer: [1, 2, 3, 4].map(layer => ({
        layer,
        layerName: getLayerName(layer),
        eliminated: layerResults[layer]?.filter(r => r.eliminated).length || 0,
        advanced: layerResults[layer]?.filter(r => !r.eliminated).length || 0,
        total: layerResults[layer]?.length || 0,
      })),
      trackBreakdown: Object.entries(topProjects).map(([trackId, winners]) => {
        const track = aiJurySession.hackathon.tracks.find(t => t.id === trackId);
        return {
          trackId,
          trackName: track?.name || 'Unknown Track',
          totalProjects: track?._count.projects || 0,
          winners: winners.length,
          winRate: track?._count.projects ? Math.round((winners.length / track._count.projects) * 100) : 0,
        };
      }),
    };

    return NextResponse.json({
      success: true,
      data: {
        session: aiJurySession,
        topProjectsByTrack: topProjects,
        layerResults: {
          layer1: layerResults[1] || [],
          layer2: layerResults[2] || [],
          layer3: layerResults[3] || [],
          layer4: layerResults[4] || [],
        },
        statistics: stats,
        metadata: {
          processedAt: aiJurySession.updatedAt,
          totalProcessingTime: aiJurySession.updatedAt.getTime() - aiJurySession.createdAt.getTime(),
          eligibilityCriteria: aiJurySession.eligibilityCriteria,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching AI jury results:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getLayerName(layer: number): string {
  const layerNames = {
    1: 'Eligibility',
    2: 'Hedera',
    3: 'Code Quality',
    4: 'Final Analysis',
  };
  return layerNames[layer as keyof typeof layerNames] || 'Unknown';
}