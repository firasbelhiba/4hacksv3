import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { aiJuryProgressManager } from '@/lib/ai-jury-progress';
import { githubService } from '@/lib/services/github-service';

// POST /api/ai-jury/sessions/[id]/execute-layer - Execute specific layer of AI jury process
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
    const body = await request.json();
    const { layer } = body;

    if (!layer || layer < 1 || layer > 4) {
      return NextResponse.json(
        { success: false, error: 'Invalid layer. Must be between 1 and 4' },
        { status: 400 }
      );
    }

    // Get AI jury session with comprehensive loading of ALL analysis reports
    const dbQueryStartTime = Date.now();

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
                // Load ALL analysis reports for complete decision-making
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
        layerResults_rel: {
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
    console.log(`💾 Comprehensive data loading completed in ${dbQueryTime}ms for session ${sessionId}`);

    if (!aiJurySession) {
      return NextResponse.json(
        { success: false, error: 'AI jury session not found or access denied' },
        { status: 404 }
      );
    }

    if (aiJurySession.status === 'COMPLETED' || aiJurySession.status === 'FAILED') {
      return NextResponse.json(
        { success: false, error: 'AI jury session is already completed or failed' },
        { status: 400 }
      );
    }

    // Determine which projects to process based on previous layers
    let projectsToProcess = aiJurySession.hackathon.projects;

    // Filter out projects eliminated in previous layers
    if (layer > 1) {
      const previousLayerResults = aiJurySession.layerResults_rel.filter(r => r.layer < layer);
      const eliminatedProjectIds = new Set(
        previousLayerResults.filter(r => r.eliminated).map(r => r.projectId)
      );
      projectsToProcess = projectsToProcess.filter(p => !eliminatedProjectIds.has(p.id));
    }

    console.log(`Layer ${layer}: Processing ${projectsToProcess.length} projects`);
    const layerStartTime = Date.now();

    // Analyze available reports across all projects for transparency
    let reportStats = {
      codeQuality: 0,
      hedera: 0,
      coherence: 0,
      innovation: 0,
      total: projectsToProcess.length,
    };

    projectsToProcess.forEach(project => {
      if (project.codeQualityReports?.[0]?.status === 'COMPLETED') reportStats.codeQuality++;
      if (project.hederaReports?.[0]?.status === 'COMPLETED') reportStats.hedera++;
      if (project.coherenceReports?.[0]?.status === 'COMPLETED') reportStats.coherence++;
      if (project.innovationReports?.[0]?.status === 'COMPLETED') reportStats.innovation++;
    });

    console.log(`📊 Available analysis reports: Code Quality: ${reportStats.codeQuality}/${reportStats.total}, Hedera: ${reportStats.hedera}/${reportStats.total}, Coherence: ${reportStats.coherence}/${reportStats.total}, Innovation: ${reportStats.innovation}/${reportStats.total}`);

    // Initialize or update progress tracking
    if (layer === 1) {
      aiJuryProgressManager.initializeSession(sessionId, aiJurySession.totalProjects);
    }
    aiJuryProgressManager.startLayer(sessionId, layer, projectsToProcess.length);

    // Execute layer-specific logic
    let layerResults: Array<{
      projectId: string;
      eliminated: boolean;
      score?: number;
      reason?: string;
      evidence: any;
    }> = [];

    console.log(`⏱️ Layer ${layer} execution starting for ${projectsToProcess.length} projects...`);

    switch (layer) {
      case 1:
        layerResults = await executeLayer1Eligibility(sessionId, projectsToProcess, aiJurySession.eligibilityCriteria as any);
        await updateSessionStatus(sessionId, 'LAYER_1_ELIGIBILITY');
        break;

      case 2:
        layerResults = await executeLayer2Hedera(sessionId, projectsToProcess);
        await updateSessionStatus(sessionId, 'LAYER_2_HEDERA');
        break;

      case 3:
        layerResults = await executeLayer3CodeQuality(sessionId, projectsToProcess);
        await updateSessionStatus(sessionId, 'LAYER_3_CODE_QUALITY');
        break;

      case 4:
        layerResults = await executeLayer4FinalAnalysis(sessionId, projectsToProcess);
        await updateSessionStatus(sessionId, 'LAYER_4_FINAL_ANALYSIS');
        break;

      default:
        throw new Error(`Invalid layer: ${layer}`);
    }

    const processingTime = Date.now() - layerStartTime;

    // Analyze report utilization for transparency
    const utilizationStats = {
      existingReports: 0,
      defaultScores: 0,
      incompleteReports: 0,
    };

    layerResults.forEach(result => {
      if (result.evidence?.defaultScore) {
        if (result.evidence?.reportStatus && result.evidence.reportStatus !== 'MISSING') {
          utilizationStats.incompleteReports++;
        } else {
          utilizationStats.defaultScores++;
        }
      } else {
        utilizationStats.existingReports++;
      }
    });

    console.log(`✅ Layer ${layer} processing completed in ${processingTime}ms (${Math.round(processingTime / 1000)}s) for ${layerResults.length} projects`);
    console.log(`📊 Layer ${layer} results: ${layerResults.filter(r => r.eliminated).length} eliminated, ${layerResults.filter(r => !r.eliminated).length} advanced`);
    console.log(`📈 Layer ${layer} report utilization: ${utilizationStats.existingReports} used existing analysis, ${utilizationStats.incompleteReports} incomplete reports (defaults applied), ${utilizationStats.defaultScores} missing reports (defaults applied)`);

    // Save layer results with optimized batch operations
    const dbStartTime = Date.now();
    await prisma.$transaction(
      async (tx) => {
        // Delete existing results for this layer (in case of retry)
        await tx.aIJuryLayerResult.deleteMany({
          where: {
            sessionId: sessionId,
            layer: layer,
          },
        });

        // Batch insert new results (chunks of 1000 for very large datasets)
        const CHUNK_SIZE = 1000;
        for (let i = 0; i < layerResults.length; i += CHUNK_SIZE) {
          const chunk = layerResults.slice(i, i + CHUNK_SIZE);
          await tx.aIJuryLayerResult.createMany({
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
        await tx.aIJurySession.update({
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
        maxWait: 10000, // 10 seconds
        timeout: 60000, // 60 seconds for large datasets
      }
    );

    const dbTime = Date.now() - dbStartTime;
    console.log(`💾 Layer ${layer} database operations completed in ${dbTime}ms (${Math.round(dbTime / 1000)}s)`);

    // Complete layer and log progress
    const eliminated = layerResults.filter(r => r.eliminated).length;
    const advanced = layerResults.filter(r => !r.eliminated).length;
    aiJuryProgressManager.completeLayer(sessionId, layer, eliminated, advanced);

    // If this was the final layer, mark as completed and generate final results
    if (layer === 4) {
      const finalResults = await generateFinalResults(sessionId);
      await prisma.aIJurySession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          finalResults: finalResults,
        },
      });

      aiJuryProgressManager.completeSession(sessionId, finalResults);
    }

    const totalTime = Date.now() - layerStartTime;
    console.log(`🎯 Layer ${layer} TOTAL execution time: ${totalTime}ms (${Math.round(totalTime / 1000)}s) - Processing: ${processingTime}ms, Database: ${dbTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        layer: layer,
        processed: layerResults.length,
        eliminated: layerResults.filter(r => r.eliminated).length,
        advanced: layerResults.filter(r => !r.eliminated).length,
        results: layerResults,
      },
    });

  } catch (error) {
    const bodyData = await request.json().catch(() => ({}));
    console.error(`Error executing layer ${bodyData?.layer || 'unknown'}:`, error);

    // Mark session as failed
    if (params.id) {
      try {
        await prisma.aIJurySession.update({
          where: { id: params.id },
          data: { status: 'FAILED' },
        });
      } catch (updateError) {
        console.error('Error updating session status to FAILED:', updateError);
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Layer 1: Eligibility Criteria
async function executeLayer1Eligibility(
  sessionId: string,
  projects: any[],
  criteria: any
): Promise<Array<{ projectId: string; eliminated: boolean; score?: number; reason?: string; evidence: any }>> {
  const BATCH_SIZE = 50; // Process in batches to manage memory and progress
  const results: Array<{ projectId: string; eliminated: boolean; score?: number; reason?: string; evidence: any }> = [];

  // Process projects in parallel batches
  for (let i = 0; i < projects.length; i += BATCH_SIZE) {
    const batch = projects.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const batchPromises = batch.map(async (project) => {
      // Log project processing start
      aiJuryProgressManager.startProcessingProject(sessionId, 1, project.id, project.name);

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

        // First check if GitHub URL is provided
        if (!project.githubUrl || !project.githubUrl.trim()) {
          eliminated = true;
          reason = 'No GitHub repository URL provided';
        } else {
          try {
            // Parse GitHub URL to get owner and repo
            const repoInfo = githubService.parseGitHubUrl(project.githubUrl);

            // Check repository accessibility
            const accessibilityCheck = await githubService.checkRepositoryAccessibility(
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

            // Check repository access requirement
            if (criteria.repositoryAccess && !accessibilityCheck.accessible) {
              eliminated = true;
              reason = `Repository not accessible: ${accessibilityCheck.error}`;
            }

            // Check repository public requirement
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

      // Log project completion
      aiJuryProgressManager.completeProject(
        sessionId,
        1,
        project.id,
        project.name,
        eliminated,
        result.score
      );

      return result;
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add small delay between batches to prevent overwhelming the system
    if (i + BATCH_SIZE < projects.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

// Layer 2: Hedera Technology Check
async function executeLayer2Hedera(
  sessionId: string,
  projects: any[]
): Promise<Array<{ projectId: string; eliminated: boolean; score?: number; reason?: string; evidence: any }>> {
  const BATCH_SIZE = 50;
  const results: Array<{ projectId: string; eliminated: boolean; score?: number; reason?: string; evidence: any }> = [];

  // Process projects in parallel batches
  for (let i = 0; i < projects.length; i += BATCH_SIZE) {
    const batch = projects.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const batchPromises = batch.map(async (project) => {
      // Log project processing start
      aiJuryProgressManager.startProcessingProject(sessionId, 2, project.id, project.name);

      let eliminated = false;
      let score = 0;
      let reason = '';
      const evidence: any = {};

      // Check if project has Hedera analysis report
      const hederaReport = project.hederaReports?.[0];
      const hasValidReport = hederaReport && hederaReport.status === 'COMPLETED';

      evidence.hederaReport = hasValidReport ? {
        id: hederaReport.id,
        status: hederaReport.status,
        technologyCategory: hederaReport.technologyCategory,
        confidence: hederaReport.confidence,
        detectedTechnologies: hederaReport.detectedTechnologies,
        createdAt: hederaReport.createdAt,
      } : null;

      if (!hasValidReport) {
        // No valid Hedera report - assign default score assuming Hedera usage
        eliminated = false;
        score = 70; // Default score for projects without Hedera analysis
        reason = hederaReport
          ? `Hedera analysis incomplete (status: ${hederaReport.status}) - assigned default score`
          : 'No Hedera analysis report available - assigned default score';
        evidence.defaultScore = true;
        evidence.reportStatus = hederaReport?.status || 'MISSING';
        evidence.note = 'Project continues with default Hedera score due to missing/incomplete analysis';
      } else if (hederaReport.technologyCategory === 'NO_BLOCKCHAIN') {
        eliminated = true;
        reason = 'Project does not use blockchain technology';
      } else if (hederaReport.technologyCategory === 'OTHER_BLOCKCHAIN') {
        // Score based on blockchain technology implementation quality (fair evaluation)
        eliminated = false;
        const confidenceScore = hederaReport.confidence || 0;
        const usageScore = hederaReport.hederaUsageScore || 0;
        score = Math.max(confidenceScore, usageScore);
        reason = `Project uses blockchain technology (confidence: ${Math.round(confidenceScore)}%, implementation quality: ${Math.round(usageScore)}%)`;
        evidence.blockchainTechnology = 'OTHER_BLOCKCHAIN';
        evidence.qualityScore = score;
      } else if (hederaReport.technologyCategory === 'HEDERA') {
        // Project uses Hedera - calculate score based on usage quality
        const confidenceScore = hederaReport.confidence || 0;
        const usageScore = hederaReport.hederaUsageScore || 0;
        score = Math.max(confidenceScore, usageScore);
        reason = `Project uses Hedera technology (confidence: ${Math.round(confidenceScore)}%, usage: ${Math.round(usageScore)}%)`;
        evidence.hederaUsageScore = hederaReport.hederaUsageScore;
        evidence.blockchainTechnology = 'HEDERA';
      } else {
        // Unknown category - don't eliminate, give benefit of doubt
        eliminated = false;
        score = 50; // Neutral score for unclear technology category
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

      // Log project completion
      aiJuryProgressManager.completeProject(
        sessionId,
        2,
        project.id,
        project.name,
        eliminated,
        result.score
      );

      return result;
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add small delay between batches to prevent overwhelming the system
    if (i + BATCH_SIZE < projects.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

// Layer 3: Code Quality Check
async function executeLayer3CodeQuality(
  sessionId: string,
  projects: any[]
): Promise<Array<{ projectId: string; eliminated: boolean; score?: number; reason?: string; evidence: any }>> {
  const BATCH_SIZE = 50;
  const results: Array<{ projectId: string; eliminated: boolean; score?: number; reason?: string; evidence: any }> = [];

  // Process projects in parallel batches
  for (let i = 0; i < projects.length; i += BATCH_SIZE) {
    const batch = projects.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const batchPromises = batch.map(async (project) => {
      // Log project processing start
      aiJuryProgressManager.startProcessingProject(sessionId, 3, project.id, project.name);

      let eliminated = false;
      let score = 0;
      let reason = '';
      const evidence: any = {};

      // Check if project has code quality report
      const codeQualityReport = project.codeQualityReports?.[0];
      const hasValidReport = codeQualityReport && codeQualityReport.status === 'COMPLETED';

      evidence.codeQualityReport = hasValidReport ? {
        id: codeQualityReport.id,
        status: codeQualityReport.status,
        richnessScore: codeQualityReport.richnessScore,
        overallScore: codeQualityReport.overallScore,
        technicalScore: codeQualityReport.technicalScore,
        securityScore: codeQualityReport.securityScore,
        createdAt: codeQualityReport.createdAt,
      } : null;

      if (!hasValidReport) {
        // No valid existing report - assign a neutral score and continue (don't eliminate)
        eliminated = false;
        score = 60; // Default passing score for projects without code quality analysis
        reason = codeQualityReport
          ? `Code quality analysis incomplete (status: ${codeQualityReport.status}) - assigned default score`
          : 'No code quality analysis report available - assigned default score';
        evidence.defaultScore = true;
        evidence.reportStatus = codeQualityReport?.status || 'MISSING';
        evidence.note = 'Project continues with default code quality score due to missing/incomplete analysis';
      } else {
        // Use existing code quality report
        const richnessScore = codeQualityReport.richnessScore || 0;
        const overallScore = codeQualityReport.overallScore || 0;

        evidence.richnessScore = richnessScore;
        evidence.overallScore = overallScore;
        evidence.technicalScore = codeQualityReport.technicalScore;
        evidence.securityScore = codeQualityReport.securityScore;

        if (richnessScore < 50) {
          // Below richness threshold - assign low score but don't eliminate
          eliminated = false;
          score = Math.max(30, overallScore * 0.5); // Penalized score but not zero
          reason = `Code richness score (${richnessScore}%) is below 50% threshold - penalized score applied`;
        } else {
          // Above threshold - use full overall score
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

      // Log project completion
      aiJuryProgressManager.completeProject(
        sessionId,
        3,
        project.id,
        project.name,
        eliminated,
        result.score
      );

      return result;
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add small delay between batches to prevent overwhelming the system
    if (i + BATCH_SIZE < projects.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

// Layer 4: Final Analysis (Coherence + Innovation)
async function executeLayer4FinalAnalysis(
  sessionId: string,
  projects: any[]
): Promise<Array<{ projectId: string; eliminated: boolean; score?: number; reason?: string; evidence: any }>> {
  const BATCH_SIZE = 50;
  const results: Array<{ projectId: string; eliminated: boolean; score?: number; reason?: string; evidence: any }> = [];

  // Process projects in parallel batches
  for (let i = 0; i < projects.length; i += BATCH_SIZE) {
    const batch = projects.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const batchPromises = batch.map(async (project) => {
      // Log project processing start
      aiJuryProgressManager.startProcessingProject(sessionId, 4, project.id, project.name);

      let score = 0;
      let reason = '';
      const evidence: any = {};

      const coherenceReport = project.coherenceReports?.[0];
      const innovationReport = project.innovationReports?.[0];

      const hasValidCoherenceReport = coherenceReport && coherenceReport.status === 'COMPLETED';
      const hasValidInnovationReport = innovationReport && innovationReport.status === 'COMPLETED';

      evidence.coherenceReport = hasValidCoherenceReport ? {
        id: coherenceReport.id,
        status: coherenceReport.status,
        score: coherenceReport.score,
        summary: coherenceReport.summary,
        trackAlignment: coherenceReport.trackAlignment,
        readmeExists: coherenceReport.readmeExists,
        readmeQuality: coherenceReport.readmeQuality,
        createdAt: coherenceReport.createdAt,
      } : null;

      evidence.innovationReport = hasValidInnovationReport ? {
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
      } : null;

      // Calculate composite score with smart defaults for missing/incomplete reports
      let coherenceScore = hasValidCoherenceReport ? coherenceReport.score : 65; // Default coherence score
      let innovationScore = hasValidInnovationReport ? innovationReport.score : 65; // Default innovation score
      let hasDefaults = false;

      // Track which reports are missing/incomplete for transparency
      if (!hasValidCoherenceReport) {
        evidence.coherenceDefault = true;
        evidence.coherenceReportStatus = coherenceReport?.status || 'MISSING';
        evidence.coherenceNote = coherenceReport
          ? `Used default coherence score (report status: ${coherenceReport.status})`
          : 'Used default coherence score (no report available)';
        hasDefaults = true;
      }

      if (!hasValidInnovationReport) {
        evidence.innovationDefault = true;
        evidence.innovationReportStatus = innovationReport?.status || 'MISSING';
        evidence.innovationNote = innovationReport
          ? `Used default innovation score (report status: ${innovationReport.status})`
          : 'Used default innovation score (no report available)';
        hasDefaults = true;
      }

      // Calculate composite score (coherence 40% + innovation 60%)
      score = Math.round((coherenceScore * 0.4) + (innovationScore * 0.6));

      // Create informative reason message
      const coherenceText = coherenceReport ? `${Math.round(coherenceScore)}/100` : `${Math.round(coherenceScore)}/100 (default)`;
      const innovationText = innovationReport ? `${Math.round(innovationScore)}/100` : `${Math.round(innovationScore)}/100 (default)`;

      reason = `Final analysis: Coherence ${coherenceText}, Innovation ${innovationText}`;
      if (hasDefaults) {
        reason += ' - Some default scores applied for missing reports';
      }

      evidence.compositeScore = score;
      evidence.coherenceWeight = 0.4;
      evidence.innovationWeight = 0.6;

      const result = {
        projectId: project.id,
        eliminated: false, // No eliminations in final layer, just scoring
        score,
        reason,
        evidence,
      };

      // Log project completion
      aiJuryProgressManager.completeProject(
        sessionId,
        4,
        project.id,
        project.name,
        result.eliminated,
        result.score
      );

      return result;
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add small delay between batches to prevent overwhelming the system
    if (i + BATCH_SIZE < projects.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

async function updateSessionStatus(sessionId: string, status: string) {
  await prisma.aIJurySession.update({
    where: { id: sessionId },
    data: { status: status as any },
  });
}

async function generateFinalResults(sessionId: string) {
  // Get all layer 4 results (final scores)
  const layer4Results = await prisma.aIJuryLayerResult.findMany({
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

  // Get project details
  const projectIds = layer4Results.map(r => r.projectId);
  const projects = await prisma.project.findMany({
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

  // Group by track and get top 5 for each track
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
    totalWinners: Object.values(topProjectsByTrack).reduce((sum, track) => sum + track.length, 0),
  };
}