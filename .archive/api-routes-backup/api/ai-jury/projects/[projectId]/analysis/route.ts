import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/ai-jury/projects/[projectId]/analysis - Get comprehensive project analysis report
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = params.projectId;

    // Get project with all analysis reports
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: session.user.id, // Ensure user owns the hackathon
        },
      },
      include: {
        hackathon: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        track: {
          select: {
            id: true,
            name: true,
          },
        },
        // All analysis reports
        codeQualityReports: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            status: true,
            overallScore: true,
            technicalScore: true,
            securityScore: true,
            documentationScore: true,
            performanceScore: true,
            maintainabilityScore: true,
            richnessScore: true,
            complexityScore: true,
            testCoverageScore: true,
            dependencyScore: true,
            summary: true,
            recommendations: true,
            technicalDebt: true,
            codeSmells: true,
            securityVulnerabilities: true,
            performanceBottlenecks: true,
            createdAt: true,
          },
        },
        hederaReports: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            status: true,
            technologyCategory: true,
            confidence: true,
            detectedTechnologies: true,
            hederaUsageScore: true,
            summary: true,
            hederaFeatures: true,
            smartContracts: true,
            apiUsage: true,
            bestPractices: true,
            recommendations: true,
            createdAt: true,
          },
        },
        coherenceReports: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            status: true,
            score: true,
            summary: true,
            trackAlignment: true,
            readmeQuality: true,
            architecturalCoherence: true,
            functionalConsistency: true,
            userExperienceFlow: true,
            inconsistencies: true,
            suggestions: true,
            evidence: true,
            createdAt: true,
          },
        },
        innovationReports: {
          orderBy: {
            createdAt: 'desc',
          },
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
            similarProjects: true,
            uniqueAspects: true,
            innovationEvidence: true,
            potentialImpact: true,
            patentPotential: true,
            suggestions: true,
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Get AI jury layer results for this project
    const aiJuryResults = await prisma.aIJuryLayerResult.findMany({
      where: {
        projectId: projectId,
        session: {
          hackathon: {
            createdById: session.user.id,
          },
        },
      },
      include: {
        session: {
          select: {
            id: true,
            createdAt: true,
            status: true,
            hackathon: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { session: { createdAt: 'desc' } },
        { layer: 'asc' },
      ],
    });

    // Group AI jury results by session
    const aiJuryBySession = aiJuryResults.reduce((acc, result) => {
      const sessionId = result.sessionId;
      if (!acc[sessionId]) {
        acc[sessionId] = {
          session: result.session,
          layers: {},
        };
      }
      acc[sessionId].layers[result.layer] = {
        layer: result.layer,
        eliminated: result.eliminated,
        score: result.score,
        reason: result.reason,
        evidence: result.evidence,
        processedAt: result.processedAt,
      };
      return acc;
    }, {} as Record<string, any>);

    // Calculate comprehensive scores and status
    const latestReports = {
      codeQuality: project.codeQualityReports[0] || null,
      hedera: project.hederaReports[0] || null,
      coherence: project.coherenceReports[0] || null,
      innovation: project.innovationReports[0] || null,
    };

    const reportStatus = {
      codeQuality: latestReports.codeQuality?.status || 'PENDING',
      hedera: latestReports.hedera?.status || 'PENDING',
      coherence: latestReports.coherence?.status || 'PENDING',
      innovation: latestReports.innovation?.status || 'PENDING',
    };

    const completedReports = Object.values(reportStatus).filter(status => status === 'COMPLETED').length;
    const analysisProgress = Math.round((completedReports / 4) * 100);

    // Calculate overall project score (if all reports are available)
    let overallScore = null;
    if (completedReports === 4) {
      const codeScore = latestReports.codeQuality?.overallScore || 0;
      const hederaScore = latestReports.hedera?.hederaUsageScore || 0;
      const coherenceScore = latestReports.coherence?.score || 0;
      const innovationScore = latestReports.innovation?.score || 0;

      // Weighted average: Code Quality 25%, Hedera 25%, Coherence 25%, Innovation 25%
      overallScore = Math.round(
        (codeScore * 0.25) +
        (hederaScore * 0.25) +
        (coherenceScore * 0.25) +
        (innovationScore * 0.25)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          teamName: project.teamName,
          githubUrl: project.githubUrl,
          demoUrl: project.demoUrl,
          videoUrl: project.videoUrl,
          presentationUrl: project.presentationUrl,
          technologies: project.technologies,
          status: project.status,
          submittedAt: project.submittedAt,
          hackathon: project.hackathon,
          track: project.track,
        },
        analysisReports: latestReports,
        allReports: {
          codeQuality: project.codeQualityReports,
          hedera: project.hederaReports,
          coherence: project.coherenceReports,
          innovation: project.innovationReports,
        },
        aiJuryHistory: Object.values(aiJuryBySession),
        summary: {
          analysisProgress,
          overallScore,
          reportStatus,
          totalReports: project.codeQualityReports.length +
                       project.hederaReports.length +
                       project.coherenceReports.length +
                       project.innovationReports.length,
          lastAnalyzed: latestReports.codeQuality?.createdAt ||
                       latestReports.hedera?.createdAt ||
                       latestReports.coherence?.createdAt ||
                       latestReports.innovation?.createdAt ||
                       null,
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          aiJurySessions: Object.keys(aiJuryBySession).length,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching project analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}