import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/debug/coherence-stuck - Debug stuck coherence reports (NO AUTH for debugging)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging stuck coherence reports...');

    // Find all coherence reports (not just stuck ones)
    const allReports = await prisma.coherenceReport.findMany({
      include: {
        project: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Latest 10 reports
    });

    // Also find specifically stuck reports
    const stuckReports = allReports.filter(report =>
      report.status === 'PENDING' || report.status === 'IN_PROGRESS'
    );

    console.log(`Found ${allReports.length} total reports, ${stuckReports.length} with IN_PROGRESS/PENDING status`);

    // Calculate ages for all reports
    const now = new Date();
    const reportsWithAge = allReports.map(report => ({
      id: report.id,
      projectId: report.projectId,
      projectName: report.project.name,
      status: report.status,
      progress: report.progress,
      currentStage: report.currentStage,
      createdAt: report.createdAt,
      ageInMinutes: Math.floor((now.getTime() - report.createdAt.getTime()) / (1000 * 60)),
      ageInSeconds: Math.floor((now.getTime() - report.createdAt.getTime()) / 1000)
    }));

    // Also check the total count of all coherence reports
    const totalReports = await prisma.coherenceReport.count();

    return NextResponse.json({
      success: true,
      data: {
        totalCoherenceReports: totalReports,
        stuckReportsCount: stuckReports.length,
        stuckReports: reportsWithAge,
        debugInfo: {
          currentTime: now.toISOString(),
          thirtySecondsAgo: new Date(now.getTime() - 30 * 1000).toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error debugging coherence reports:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/debug/coherence-stuck - Force cleanup ALL stuck reports (NO AUTH for debugging)
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Force cleaning up ALL stuck coherence reports...');

    // Get all stuck reports first
    const stuckReports = await prisma.coherenceReport.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        }
      },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (stuckReports.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck reports found',
        data: { cleanedCount: 0 }
      });
    }

    // Force cleanup ALL stuck reports regardless of age
    const updateResult = await prisma.coherenceReport.updateMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        }
      },
      data: {
        status: 'FAILED',
        progress: 0,
        currentStage: 'force-cleanup',
        errorMessage: 'Force cleaned up by debug endpoint',
        analysisCompletedAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`🧹 Force cleaned up ${updateResult.count} stuck coherence reports`);

    // Log details
    stuckReports.forEach(report => {
      console.log(`  - Cleaned report ${report.id} for project "${report.project.name}"`);
    });

    return NextResponse.json({
      success: true,
      message: `Force cleaned up ${updateResult.count} stuck coherence reports`,
      data: {
        cleanedCount: updateResult.count,
        cleanedReports: stuckReports.map(r => ({
          id: r.id,
          projectName: r.project.name,
          oldStatus: r.status
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error force cleaning up coherence reports:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}