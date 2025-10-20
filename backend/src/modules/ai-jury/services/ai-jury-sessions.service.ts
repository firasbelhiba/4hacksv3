import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class AIJurySessionsService {
  private readonly logger = new Logger(AIJurySessionsService.name);

  constructor(private prisma: PrismaService) {}

  // Get AI jury session for hackathon
  async getSession(hackathonId: string, userId: string) {
    // Verify user has access to the hackathon
    const hackathon = await this.prisma.hackathons.findFirst({
      where: {
        id: hackathonId,
        createdById: userId,
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found or access denied');
    }

    // Get the latest AI jury session for this hackathon
    const aiJurySession = await this.prisma.ai_jury_sessions.findFirst({
      where: {
        hackathonId: hackathonId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        ai_jury_layer_results: {
          orderBy: {
            layer: 'asc',
          },
        },
      },
    });

    if (!aiJurySession) {
      throw new NotFoundException('No AI jury session found for this hackathon');
    }

    // Transform layer results into the format expected by the frontend
    const layerResults: Record<number, any[]> = {};
    aiJurySession.ai_jury_layer_results.forEach(result => {
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
    return {
      ...aiJurySession,
      layerResults: layerResults,
    };
  }

  // Create new AI jury session
  async createSession(
    hackathonId: string,
    userId: string,
    eligibilityCriteria?: any
  ) {
    // Verify user has access to the hackathon
    const hackathon = await this.prisma.hackathons.findFirst({
      where: {
        id: hackathonId,
        createdById: userId,
      },
      include: {
        projects: true,
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found or access denied');
    }

    // Check if there's already an active session
    const existingSession = await this.prisma.ai_jury_sessions.findFirst({
      where: {
        hackathonId: hackathonId,
        status: {
          not: 'COMPLETED',
        },
      },
    });

    if (existingSession) {
      throw new ConflictException('An AI jury session is already active for this hackathon');
    }

    // Create new AI jury session
    const aiJurySession = await this.prisma.ai_jury_sessions.create({
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

    this.logger.log(`Created AI jury session ${aiJurySession.id} for hackathon ${hackathonId}`);

    return aiJurySession;
  }

  // Get session progress
  async getProgress(sessionId: string, userId: string) {
    const session = await this.prisma.ai_jury_sessions.findFirst({
      where: {
        id: sessionId,
        hackathon: {
          createdById: userId,
        },
      },
      include: {
        ai_jury_layer_results: {
          select: {
            layer: true,
            eliminated: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('AI jury session not found or access denied');
    }

    // Calculate progress per layer
    const layerProgress: Record<number, { total: number; processed: number; eliminated: number }> = {};

    for (let i = 1; i <= 4; i++) {
      const layerResults = session.ai_jury_layer_results.filter(r => r.layer === i);
      layerProgress[i] = {
        total: session.totalProjects,
        processed: layerResults.length,
        eliminated: layerResults.filter(r => r.eliminated).length,
      };
    }

    return {
      sessionId: session.id,
      status: session.status,
      currentLayer: session.currentLayer,
      totalLayers: session.totalLayers,
      totalProjects: session.totalProjects,
      eliminatedProjects: session.eliminatedProjects,
      layerProgress,
    };
  }

  // Get session results
  async getResults(sessionId: string, userId: string) {
    const session = await this.prisma.ai_jury_sessions.findFirst({
      where: {
        id: sessionId,
        hackathon: {
          createdById: userId,
        },
      },
      include: {
        ai_jury_layer_results: {
          include: {
            session: {
              include: {
                hackathon: {
                  include: {
                    projects: {
                      include: {
                        track: true,
                      },
                    },
                    tracks: true,
                  },
                },
              },
            },
          },
          where: {
            layer: 4,
          },
          orderBy: {
            score: 'desc',
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('AI jury session not found or access denied');
    }

    if (session.status !== 'COMPLETED') {
      throw new ConflictException('AI jury session is not yet completed');
    }

    return {
      sessionId: session.id,
      status: session.status,
      finalResults: session.finalResults,
      layerResults: session.layerResults,
    };
  }

  // Reset session
  async resetSession(sessionId: string, userId: string) {
    const session = await this.prisma.ai_jury_sessions.findFirst({
      where: {
        id: sessionId,
        hackathon: {
          createdById: userId,
        },
      },
    });

    if (!session) {
      throw new NotFoundException('AI jury session not found or access denied');
    }

    // Delete all layer results and reset session
    await this.prisma.$transaction([
      this.prisma.ai_jury_layer_results.deleteMany({
        where: { sessionId },
      }),
      this.prisma.ai_jury_sessions.update({
        where: { id: sessionId },
        data: {
          status: 'PENDING',
          currentLayer: 1,
          eliminatedProjects: 0,
          layerResults: {},
          finalResults: {},
        },
      }),
    ]);

    this.logger.log(`Reset AI jury session ${sessionId}`);

    return { message: 'Session reset successfully' };
  }
}
