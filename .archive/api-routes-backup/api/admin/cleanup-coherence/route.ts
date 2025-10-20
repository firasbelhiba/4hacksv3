import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/admin/cleanup-coherence - Clean up ALL stuck coherence reports
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔍 Starting cleanup of stuck coherence reports...');

    // Find stuck reports (IN_PROGRESS or PENDING for more than 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

    const stuckReports = await prisma.coherenceReport.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
        createdAt: {
          lt: thirtySecondsAgo
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

    console.log(`Found ${stuckReports.length} stuck coherence reports`);

    if (stuckReports.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck coherence reports found',
        data: { cleanedCount: 0 }
      });
    }

    // Mark all stuck reports as failed
    const updateResult = await prisma.coherenceReport.updateMany({
      where: {
        id: {
          in: stuckReports.map(r => r.id)
        }
      },
      data: {
        status: 'FAILED',
        progress: 0,
        currentStage: 'cleanup',
        errorMessage: 'Analysis was stuck and cleaned up by admin cleanup',
        analysisCompletedAt: new Date(),
        analysisTimeMs: Date.now() - Math.min(...stuckReports.map(r => r.createdAt.getTime()))
      }
    });

    console.log(`🧹 Successfully cleaned up ${updateResult.count} stuck coherence reports`);

    // Log which projects were affected
    stuckReports.forEach(report => {
      console.log(`  - Cleaned report ${report.id} for project "${report.project.name}"`);
    });

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${updateResult.count} stuck coherence report(s)`,
      data: {
        cleanedCount: updateResult.count,
        reportIds: stuckReports.map(r => r.id),
        projectNames: stuckReports.map(r => r.project.name)
      }
    });

  } catch (error) {
    console.error('❌ Error cleaning up stuck coherence reports:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}