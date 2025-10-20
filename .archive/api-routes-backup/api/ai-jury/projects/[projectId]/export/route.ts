import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/ai-jury/projects/[projectId]/export - Export comprehensive project analysis report
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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // 'json' or 'csv'
    const projectId = params.projectId;

    // Get comprehensive project data
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: session.user.id,
        },
      },
      include: {
        hackathon: {
          select: {
            id: true,
            name: true,
            slug: true,
            startDate: true,
            endDate: true,
          },
        },
        track: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        // All analysis reports with complete data
        codeQualityReports: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        hederaReports: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        coherenceReports: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        innovationReports: {
          orderBy: {
            createdAt: 'desc',
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

    // Get AI jury results
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
            eligibilityCriteria: true,
          },
        },
      },
      orderBy: [
        { session: { createdAt: 'desc' } },
        { layer: 'asc' },
      ],
    });

    // Prepare comprehensive export data
    const exportData = {
      exportMetadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: session.user.email,
        format: format,
        version: '1.0',
      },
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
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        hackathon: project.hackathon,
        track: project.track,
      },
      analysisReports: {
        codeQuality: project.codeQualityReports,
        hedera: project.hederaReports,
        coherence: project.coherenceReports,
        innovation: project.innovationReports,
      },
      aiJuryEvaluations: aiJuryResults.map(result => ({
        sessionId: result.sessionId,
        sessionInfo: result.session,
        layer: result.layer,
        layerName: getLayerName(result.layer),
        eliminated: result.eliminated,
        score: result.score,
        reason: result.reason,
        evidence: result.evidence,
        processedAt: result.processedAt,
      })),
      summary: {
        totalReports: project.codeQualityReports.length +
                     project.hederaReports.length +
                     project.coherenceReports.length +
                     project.innovationReports.length,
        aiJuryParticipations: aiJuryResults.length,
        latestScores: {
          codeQuality: project.codeQualityReports[0]?.overallScore || null,
          hedera: project.hederaReports[0]?.hederaUsageScore || null,
          coherence: project.coherenceReports[0]?.score || null,
          innovation: project.innovationReports[0]?.score || null,
        },
        reportStatuses: {
          codeQuality: project.codeQualityReports[0]?.status || 'PENDING',
          hedera: project.hederaReports[0]?.status || 'PENDING',
          coherence: project.coherenceReports[0]?.status || 'PENDING',
          innovation: project.innovationReports[0]?.status || 'PENDING',
        },
      },
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvData = generateCSV(exportData);
      return new Response(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_analysis.csv"`,
        },
      });
    } else {
      // Default JSON format
      return new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_analysis.json"`,
        },
      });
    }

  } catch (error) {
    console.error('Error exporting project analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getLayerName(layer: number): string {
  const layerNames = {
    1: 'Eligibility',
    2: 'Hedera Technology',
    3: 'Code Quality',
    4: 'Final Analysis',
  };
  return layerNames[layer as keyof typeof layerNames] || 'Unknown';
}

function generateCSV(data: any): string {
  const rows = [];

  // Headers
  rows.push([
    'Report Type',
    'Report ID',
    'Status',
    'Score',
    'Created At',
    'Summary',
    'Details',
  ]);

  // Code Quality Reports
  data.analysisReports.codeQuality.forEach((report: any) => {
    rows.push([
      'Code Quality',
      report.id,
      report.status,
      report.overallScore || '',
      report.createdAt,
      report.summary || '',
      `Technical: ${report.technicalScore || 0}, Security: ${report.securityScore || 0}, Richness: ${report.richnessScore || 0}`,
    ]);
  });

  // Hedera Reports
  data.analysisReports.hedera.forEach((report: any) => {
    rows.push([
      'Hedera Analysis',
      report.id,
      report.status,
      report.hederaUsageScore || '',
      report.createdAt,
      report.summary || '',
      `Category: ${report.technologyCategory}, Confidence: ${report.confidence || 0}`,
    ]);
  });

  // Coherence Reports
  data.analysisReports.coherence.forEach((report: any) => {
    rows.push([
      'Coherence',
      report.id,
      report.status,
      report.score || '',
      report.createdAt,
      report.summary || '',
      `Track Alignment: ${report.trackAlignment || 0}, README Quality: ${report.readmeQuality || 0}`,
    ]);
  });

  // Innovation Reports
  data.analysisReports.innovation.forEach((report: any) => {
    rows.push([
      'Innovation',
      report.id,
      report.status,
      report.score || '',
      report.createdAt,
      report.summary || '',
      `Novelty: ${report.noveltyScore || 0}, Creativity: ${report.creativityScore || 0}, Technical: ${report.technicalInnovation || 0}`,
    ]);
  });

  // Convert to CSV
  return rows.map(row =>
    row.map(cell =>
      typeof cell === 'string' && cell.includes(',')
        ? `"${cell.replace(/"/g, '""')}"`
        : cell
    ).join(',')
  ).join('\n');
}