import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { GitHubService } from '@/modules/ai-agents/services/github.service';
import { AIJuryProgressService } from './ai-jury-progress.service';

export interface LayerResult {
  projectId: string;
  eliminated: boolean;
  score?: number;
  reason?: string;
  evidence: any;
}

@Injectable()
export class AIJuryLayersService {
  private readonly logger = new Logger(AIJuryLayersService.name);

  constructor(
    private prisma: PrismaService,
    private github: GitHubService,
    private progressService: AIJuryProgressService,
  ) {}

  // Execute specific layer
  async executeLayer(sessionId: string, layer: number, userId: string) {
    if (!layer || layer < 1 || layer > 4) {
      throw new BadRequestException('Invalid layer. Must be between 1 and 4');
    }

    // Get AI jury session with comprehensive loading of ALL analysis reports
    const dbQueryStartTime = Date.now();

    const aiJurySession = await this.prisma.ai_jury_sessions.findFirst({
      where: {
        id: sessionId,
        hackathon: {
          createdById: userId,
        },
      },
      include: {
        hackathon: {
          select: {
            id: true,
            name: true,
            projects: {
              select: {
                id: true,
                name: true,
                githubUrl: true,
                submittedAt: true,
                trackId: true,
                track: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                codeQualityReports: {
                  select: {
                    id: true,
                    status: true,
                    richnessScore: true,
                    overallScore: true,
                    technicalScore: true,
                    securityScore: true,
                    documentationScore: true,
                    performanceScore: true,
                    codeSmellsCount: true,
                    bugsCount: true,
                    vulnerabilitiesCount: true,
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 1,
                },
                hederaReports: {
                  select: {
                    id: true,
                    status: true,
                    technologyCategory: true,
                    confidence: true,
                    detectedTechnologies: true,
                    hederaUsageScore: true,
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 1,
                },
                coherenceReports: {
                  select: {
                    id: true,
                    status: true,
                    score: true,
                    summary: true,
                    trackAlignment: true,
                    readmeExists: true,
                    readmeQuality: true,
                    projectPurpose: true,
                    trackJustification: true,
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 1,
                },
                innovationReports: {
                  select: {
                    id: true,
                    status: true,
                    score: true,
                    summary: true,
                    noveltyScore: true,
                    creativityScore: true,
                    technicalInnovation: true,
                    marketInnovation: true,
                    implementationInnovation: true,
                    potentialImpact: true,
                    patentPotential: true,
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 1,
                },
              },
            },
            tracks: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        ai_jury_layer_results: {
          select: {
            id: true,
            layer: true,
            projectId: true,
            eliminated: true,
          },
        },
      },
    });

    const dbQueryTime = Date.now() - dbQueryStartTime;
    this.logger.log(`💾 Comprehensive data loading completed in ${dbQueryTime}ms for session ${sessionId}`);

    if (!aiJurySession) {
      throw new NotFoundException('AI jury session not found or access denied');
    }

    if (aiJurySession.status === 'COMPLETED' || aiJurySession.status === 'FAILED') {
      throw new BadRequestException('AI jury session is already completed or failed');
    }

    // Determine which projects to process based on previous layers
    let projectsToProcess = aiJurySession.hackathon.projects;

    // Filter out projects eliminated in previous layers
    if (layer > 1) {
      const previousLayerResults = aiJurySession.ai_jury_layer_results.filter(r => r.layer < layer);
      const eliminatedProjectIds = new Set(
        previousLayerResults.filter(r => r.eliminated).map(r => r.projectId)
      );
      projectsToProcess = projectsToProcess.filter(p => !eliminatedProjectIds.has(p.id));
    }

    this.logger.log(`Layer ${layer}: Processing ${projectsToProcess.length} projects`);
    const layerStartTime = Date.now();

    // Initialize or update progress tracking
    if (layer === 1) {
      this.progressService.initializeSession(sessionId, aiJurySession.totalProjects);
    }
    this.progressService.startLayer(sessionId, layer, projectsToProcess.length);

    // Execute layer-specific logic
    let layerResults: LayerResult[] = [];

    this.logger.log(`⏱️  Layer ${layer} execution starting for ${projectsToProcess.length} projects...`);

    switch (layer) {
      case 1:
        layerResults = await this.executeLayer1Eligibility(
          sessionId,
          projectsToProcess,
          aiJurySession.eligibilityCriteria as any
        );
        await this.updateSessionStatus(sessionId, 'LAYER_1_ELIGIBILITY');
        break;

      case 2:
        layerResults = await this.executeLayer2Hedera(sessionId, projectsToProcess);
        await this.updateSessionStatus(sessionId, 'LAYER_2_HEDERA');
        break;

      case 3:
        layerResults = await this.executeLayer3CodeQuality(sessionId, projectsToProcess);
        await this.updateSessionStatus(sessionId, 'LAYER_3_CODE_QUALITY');
        break;

      case 4:
        layerResults = await this.executeLayer4FinalAnalysis(sessionId, projectsToProcess);
        await this.updateSessionStatus(sessionId, 'LAYER_4_FINAL_ANALYSIS');
        break;

      default:
        throw new Error(`Invalid layer: ${layer}`);
    }

    const processingTime = Date.now() - layerStartTime;

    this.logger.log(`✅ Layer ${layer} processing completed in ${processingTime}ms`);
    this.logger.log(`📊 Layer ${layer} results: ${layerResults.filter(r => r.eliminated).length} eliminated, ${layerResults.filter(r => !r.eliminated).length} advanced`);

    // Save layer results with optimized batch operations
    const dbStartTime = Date.now();
    await this.prisma.$transaction(
      async (tx) => {
        // Delete existing results for this layer (in case of retry)
        await tx.ai_jury_layer_results.deleteMany({
          where: {
            sessionId: sessionId,
            layer: layer,
          },
        });

        // Batch insert new results
        const CHUNK_SIZE = 1000;
        for (let i = 0; i < layerResults.length; i += CHUNK_SIZE) {
          const chunk = layerResults.slice(i, i + CHUNK_SIZE);
          await tx.ai_jury_layer_results.createMany({
            data: chunk.map(result => ({
              sessionId: sessionId,
              layer: layer,
              projectId: result.projectId,
              eliminated: result.eliminated,
              score: result.score,
              reason: result.reason,
              evidence: result.evidence,
            })),
            skipDuplicates: true,
          });
        }

        // Update session counters
        const totalEliminated = layerResults.filter(r => r.eliminated).length;
        await tx.ai_jury_sessions.update({
          where: { id: sessionId },
          data: {
            currentLayer: layer + 1,
            eliminatedProjects: {
              increment: totalEliminated,
            },
            updatedAt: new Date(),
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 60000,
      }
    );

    const dbTime = Date.now() - dbStartTime;
    this.logger.log(`💾 Layer ${layer} database operations completed in ${dbTime}ms`);

    // Complete layer and log progress
    const eliminated = layerResults.filter(r => r.eliminated).length;
    const advanced = layerResults.filter(r => !r.eliminated).length;
    this.progressService.completeLayer(sessionId, layer, eliminated, advanced);

    // If this was the final layer, mark as completed and generate final results
    if (layer === 4) {
      const finalResults = await this.generateFinalResults(sessionId);
      await this.prisma.ai_jury_sessions.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          finalResults: finalResults,
        },
      });

      this.progressService.completeSession(sessionId, finalResults);
    }

    const totalTime = Date.now() - layerStartTime;
    this.logger.log(`🎯 Layer ${layer} TOTAL execution time: ${totalTime}ms`);

    return {
      layer: layer,
      processed: layerResults.length,
      eliminated: layerResults.filter(r => r.eliminated).length,
      advanced: layerResults.filter(r => !r.eliminated).length,
      results: layerResults,
    };
  }

  // Layer 1: Eligibility Criteria
  private async executeLayer1Eligibility(
    sessionId: string,
    projects: any[],
    criteria: any
  ): Promise<LayerResult[]> {
    const BATCH_SIZE = 50;
    const results: LayerResult[] = [];

    for (let i = 0; i < projects.length; i += BATCH_SIZE) {
      const batch = projects.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (project) => {
        this.progressService.startProcessingProject(sessionId, 1, project.id, project.name);

        let eliminated = false;
        let reason = '';
        const evidence: any = {};

        // Check submission deadline
        if (criteria.submissionDeadline && !eliminated) {
          evidence.submittedAt = project.submittedAt;
          if (!project.submittedAt) {
            eliminated = true;
            reason = 'Project was not properly submitted';
          }
        }

        // Check repository access and visibility
        if ((criteria.repositoryAccess || criteria.repositoryPublic) && !eliminated) {
          evidence.githubUrl = project.githubUrl;

          if (!project.githubUrl || !project.githubUrl.trim()) {
            eliminated = true;
            reason = 'No GitHub repository URL provided';
          } else {
            try {
              const repoInfo = this.github.parseGitHubUrl(project.githubUrl);
              const accessibilityCheck = await this.github.checkRepositoryAccessibility(
                repoInfo.owner,
                repoInfo.repo
              );

              evidence.repositoryAccessibility = {
                accessible: accessibilityCheck.accessible,
                isPublic: accessibilityCheck.isPublic,
                error: accessibilityCheck.error,
                metadata: accessibilityCheck.metadata,
                checkedAt: new Date().toISOString(),
              };

              if (criteria.repositoryAccess && !accessibilityCheck.accessible) {
                eliminated = true;
                reason = `Repository not accessible: ${accessibilityCheck.error}`;
              }

              if (criteria.repositoryPublic && !eliminated && !accessibilityCheck.isPublic) {
                eliminated = true;
                reason = accessibilityCheck.error
                  ? `Repository accessibility issue: ${accessibilityCheck.error}`
                  : 'Repository must be public but appears to be private';
              }
            } catch (error) {
              eliminated = true;
              reason = `Invalid GitHub repository URL: ${error instanceof Error ? error.message : 'Unknown error'}`;
              evidence.repositoryError = error instanceof Error ? error.message : 'Unknown error';
            }
          }
        }

        const result = {
          projectId: project.id,
          eliminated,
          score: eliminated ? 0 : 100,
          reason: eliminated ? reason : 'Meets all eligibility criteria',
          evidence,
        };

        this.progressService.completeProject(
          sessionId,
          1,
          project.id,
          project.name,
          eliminated,
          result.score
        );

        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      if (i + BATCH_SIZE < projects.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  // Layer 2: Hedera Technology Check
  private async executeLayer2Hedera(sessionId: string, projects: any[]): Promise<LayerResult[]> {
    const BATCH_SIZE = 50;
    const results: LayerResult[] = [];

    for (let i = 0; i < projects.length; i += BATCH_SIZE) {
      const batch = projects.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (project) => {
        this.progressService.startProcessingProject(sessionId, 2, project.id, project.name);

        let eliminated = false;
        let score = 0;
        let reason = '';
        const evidence: any = {};

        const hederaReport = project.hederaReports?.[0];
        const hasValidReport = hederaReport && hederaReport.status === 'COMPLETED';

        evidence.hederaReport = hasValidReport
          ? {
              id: hederaReport.id,
              status: hederaReport.status,
              technologyCategory: hederaReport.technologyCategory,
              confidence: hederaReport.confidence,
              detectedTechnologies: hederaReport.detectedTechnologies,
              createdAt: hederaReport.createdAt,
            }
          : null;

        if (!hasValidReport) {
          eliminated = false;
          score = 70;
          reason = hederaReport
            ? `Hedera analysis incomplete (status: ${hederaReport.status}) - assigned default score`
            : 'No Hedera analysis report available - assigned default score';
          evidence.defaultScore = true;
          evidence.reportStatus = hederaReport?.status || 'MISSING';
        } else if (hederaReport.technologyCategory === 'NO_BLOCKCHAIN') {
          eliminated = true;
          reason = 'Project does not use blockchain technology';
        } else if (hederaReport.technologyCategory === 'OTHER_BLOCKCHAIN') {
          eliminated = false;
          const confidenceScore = hederaReport.confidence || 0;
          const usageScore = hederaReport.hederaUsageScore || 0;
          score = Math.max(confidenceScore, usageScore);
          reason = `Project uses blockchain technology (confidence: ${Math.round(confidenceScore)}%)`;
          evidence.blockchainTechnology = 'OTHER_BLOCKCHAIN';
        } else if (hederaReport.technologyCategory === 'HEDERA') {
          const confidenceScore = hederaReport.confidence || 0;
          const usageScore = hederaReport.hederaUsageScore || 0;
          score = Math.max(confidenceScore, usageScore);
          reason = `Project uses Hedera technology (confidence: ${Math.round(confidenceScore)}%, usage: ${Math.round(usageScore)}%)`;
          evidence.hederaUsageScore = hederaReport.hederaUsageScore;
          evidence.blockchainTechnology = 'HEDERA';
        } else {
          eliminated = false;
          score = 50;
          reason = 'Unable to determine technology category - assigned neutral score';
          evidence.defaultScore = true;
        }

        const result = {
          projectId: project.id,
          eliminated,
          score: eliminated ? 0 : score,
          reason,
          evidence,
        };

        this.progressService.completeProject(
          sessionId,
          2,
          project.id,
          project.name,
          eliminated,
          result.score
        );

        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      if (i + BATCH_SIZE < projects.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  // Layer 3: Code Quality Check
  private async executeLayer3CodeQuality(sessionId: string, projects: any[]): Promise<LayerResult[]> {
    const BATCH_SIZE = 50;
    const results: LayerResult[] = [];

    for (let i = 0; i < projects.length; i += BATCH_SIZE) {
      const batch = projects.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (project) => {
        this.progressService.startProcessingProject(sessionId, 3, project.id, project.name);

        let eliminated = false;
        let score = 0;
        let reason = '';
        const evidence: any = {};

        const codeQualityReport = project.codeQualityReports?.[0];
        const hasValidReport = codeQualityReport && codeQualityReport.status === 'COMPLETED';

        evidence.codeQualityReport = hasValidReport
          ? {
              id: codeQualityReport.id,
              status: codeQualityReport.status,
              richnessScore: codeQualityReport.richnessScore,
              overallScore: codeQualityReport.overallScore,
              technicalScore: codeQualityReport.technicalScore,
              securityScore: codeQualityReport.securityScore,
              createdAt: codeQualityReport.createdAt,
            }
          : null;

        if (!hasValidReport) {
          eliminated = false;
          score = 60;
          reason = codeQualityReport
            ? `Code quality analysis incomplete (status: ${codeQualityReport.status}) - assigned default score`
            : 'No code quality analysis report available - assigned default score';
          evidence.defaultScore = true;
          evidence.reportStatus = codeQualityReport?.status || 'MISSING';
        } else {
          const richnessScore = codeQualityReport.richnessScore || 0;
          const overallScore = codeQualityReport.overallScore || 0;

          evidence.richnessScore = richnessScore;
          evidence.overallScore = overallScore;
          evidence.technicalScore = codeQualityReport.technicalScore;
          evidence.securityScore = codeQualityReport.securityScore;

          if (richnessScore < 50) {
            eliminated = false;
            score = Math.max(30, overallScore * 0.5);
            reason = `Code richness score (${richnessScore}%) is below 50% threshold - penalized score applied`;
          } else {
            score = Math.max(0, overallScore);
            reason = `Code quality meets standards (richness: ${richnessScore}%, overall: ${Math.round(overallScore)}%)`;
          }
        }

        const result = {
          projectId: project.id,
          eliminated,
          score,
          reason,
          evidence,
        };

        this.progressService.completeProject(
          sessionId,
          3,
          project.id,
          project.name,
          eliminated,
          result.score
        );

        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      if (i + BATCH_SIZE < projects.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  // Layer 4: Final Analysis (Coherence + Innovation)
  private async executeLayer4FinalAnalysis(sessionId: string, projects: any[]): Promise<LayerResult[]> {
    const BATCH_SIZE = 50;
    const results: LayerResult[] = [];

    for (let i = 0; i < projects.length; i += BATCH_SIZE) {
      const batch = projects.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (project) => {
        this.progressService.startProcessingProject(sessionId, 4, project.id, project.name);

        let score = 0;
        let reason = '';
        const evidence: any = {};

        const coherenceReport = project.coherenceReports?.[0];
        const innovationReport = project.innovationReports?.[0];

        const hasValidCoherenceReport = coherenceReport && coherenceReport.status === 'COMPLETED';
        const hasValidInnovationReport = innovationReport && innovationReport.status === 'COMPLETED';

        evidence.coherenceReport = hasValidCoherenceReport
          ? {
              id: coherenceReport.id,
              status: coherenceReport.status,
              score: coherenceReport.score,
              summary: coherenceReport.summary,
              trackAlignment: coherenceReport.trackAlignment,
              readmeExists: coherenceReport.readmeExists,
              readmeQuality: coherenceReport.readmeQuality,
              createdAt: coherenceReport.createdAt,
            }
          : null;

        evidence.innovationReport = hasValidInnovationReport
          ? {
              id: innovationReport.id,
              status: innovationReport.status,
              score: innovationReport.score,
              summary: innovationReport.summary,
              noveltyScore: innovationReport.noveltyScore,
              creativityScore: innovationReport.creativityScore,
              technicalInnovation: innovationReport.technicalInnovation,
              marketInnovation: innovationReport.marketInnovation,
              implementationInnovation: innovationReport.implementationInnovation,
              potentialImpact: innovationReport.potentialImpact,
              createdAt: innovationReport.createdAt,
            }
          : null;

        // Calculate composite score with smart defaults
        let coherenceScore = hasValidCoherenceReport ? coherenceReport.score : 65;
        let innovationScore = hasValidInnovationReport ? innovationReport.score : 65;

        if (!hasValidCoherenceReport) {
          evidence.coherenceDefault = true;
          evidence.coherenceReportStatus = coherenceReport?.status || 'MISSING';
        }

        if (!hasValidInnovationReport) {
          evidence.innovationDefault = true;
          evidence.innovationReportStatus = innovationReport?.status || 'MISSING';
        }

        score = Math.round((coherenceScore * 0.4) + (innovationScore * 0.6));

        const coherenceText = hasValidCoherenceReport
          ? `${Math.round(coherenceScore)}/100`
          : `${Math.round(coherenceScore)}/100 (default)`;
        const innovationText = hasValidInnovationReport
          ? `${Math.round(innovationScore)}/100`
          : `${Math.round(innovationScore)}/100 (default)`;

        reason = `Final analysis: Coherence ${coherenceText}, Innovation ${innovationText}`;

        evidence.compositeScore = score;
        evidence.coherenceWeight = 0.4;
        evidence.innovationWeight = 0.6;

        const result = {
          projectId: project.id,
          eliminated: false,
          score,
          reason,
          evidence,
        };

        this.progressService.completeProject(
          sessionId,
          4,
          project.id,
          project.name,
          result.eliminated,
          result.score
        );

        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      if (i + BATCH_SIZE < projects.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  private async updateSessionStatus(sessionId: string, status: string) {
    await this.prisma.ai_jury_sessions.update({
      where: { id: sessionId },
      data: { status: status as any },
    });
  }

  private async generateFinalResults(sessionId: string) {
    const layer4Results = await this.prisma.ai_jury_layer_results.findMany({
      where: {
        sessionId: sessionId,
        layer: 4,
      },
      include: {
        session: {
          include: {
            hackathon: {
              include: {
                tracks: true,
                projects: {
                  include: {
                    track: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
    });

    if (layer4Results.length === 0) {
      return { topProjectsByTrack: {} };
    }

    const projectIds = layer4Results.map(r => r.projectId);
    const projects = await this.prisma.projects.findMany({
      where: {
        id: {
          in: projectIds,
        },
      },
      include: {
        track: true,
      },
    });

    const projectMap = projects.reduce((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {} as Record<string, typeof projects[0]>);

    const topProjectsByTrack: Record<string, string[]> = {};

    const session = layer4Results[0].session;
    for (const track of session.hackathon.tracks) {
      const trackResults = layer4Results
        .filter(r => {
          const project = projectMap[r.projectId];
          return project && project.trackId === track.id;
        })
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 5);

      topProjectsByTrack[track.id] = trackResults.map(r => r.projectId);
    }

    return {
      topProjectsByTrack,
      generatedAt: new Date().toISOString(),
      totalTracks: session.hackathon.tracks.length,
      totalWinners: Object.values(topProjectsByTrack).reduce(
        (sum, track) => sum + track.length,
        0
      ),
    };
  }
}
