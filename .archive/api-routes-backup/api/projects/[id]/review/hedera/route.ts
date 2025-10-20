import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hederaAgent } from '@/lib/ai-agents/hedera-agent';
import { processManager } from '@/lib/process-manager';
import type { ApiResponse } from '@/types/database';

// POST /api/projects/[id]/review/hedera - Start Hedera technology analysis
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

    const projectId = params.id;

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: session.user.id,
        },
      },
      include: {
        hackathon: {
          select: { id: true, name: true },
        },
        track: {
          select: { id: true, name: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // First, clean up any stuck IN_PROGRESS records older than 30 minutes
    const stuckRecordsTimeout = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    const cleanedStuckRecords = await prisma.hederaAnalysisReport.updateMany({
      where: {
        projectId,
        status: 'IN_PROGRESS',
        updatedAt: {
          lt: stuckRecordsTimeout
        }
      },
      data: {
        status: 'FAILED',
        errorMessage: 'Analysis timed out - automatically cleaned up after 30 minutes',
        processingTime: 1800 // 30 minutes in seconds
      }
    });

    if (cleanedStuckRecords.count > 0) {
      console.log(`🧹 Auto-cleaned ${cleanedStuckRecords.count} stuck IN_PROGRESS records for project ${projectId}`);
    }

    // Check if there's already a pending or in-progress analysis (after cleanup)
    const existingReport = await prisma.hederaAnalysisReport.findFirst({
      where: {
        projectId,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
    });

    if (existingReport) {
      console.log(`❌ Found existing analysis for ${projectId}:`, {
        reportId: existingReport.id,
        status: existingReport.status,
        updatedAt: existingReport.updatedAt
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Hedera technology analysis is already in progress for this project',
          data: { reportId: existingReport.id, status: existingReport.status }
        },
        { status: 409 }
      );
    }

    // Check if we can start a new process (limit concurrent analyses)
    const processId = `hedera-${projectId}`;
    console.log(`🔍 Process check for ${processId}:`, processManager.getStatus());

    if (!processManager.canStartProcess(processId)) {
      const debugInfo = {
        processId,
        serverPid: process.pid,
        serverPort: process.env.PORT || '3000',
        processManagerStatus: processManager.getStatus(),
        timestamp: new Date().toISOString()
      };

      console.log(`❌ Cannot start process ${processId}. Server PID: ${process.pid}, Current status:`, debugInfo);

      // Check if this specific process is already running (race condition)
      if (processManager.isProcessRunning(processId)) {
        return NextResponse.json(
          {
            success: false,
            error: `Hedera analysis is already running for this project. Please wait for it to complete.`,
            data: {
              status: 'IN_PROGRESS',
              processId: processId
            }
          },
          { status: 409 } // Conflict instead of Service Unavailable
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Cannot start analysis. System is currently running ${processManager.getProcessCount()} analyses. Please try again in a few minutes.`,
          data: {
            debug: debugInfo,
            runningProcesses: processManager.getRunningProcesses(),
            processManagerStatus: processManager.getStatus()
          }
        },
        { status: 503 }
      );
    }

    console.log(`✅ Can start process ${processId}`);

    // Parse request body for options
    let options = {};
    try {
      const body = await request.json();
      options = body.options || {};
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Trigger background analysis (do not await - let it run asynchronously)
    hederaAgent.analyzeProjectHedera(projectId, options).catch(error => {
      console.error('Background Hedera analysis failed:', error);
    });

    const response: ApiResponse = {
      success: true,
      data: {
        projectId,
        status: 'IN_PROGRESS',
        message: 'Hedera technology analysis started'
      },
      message: 'Hedera technology analysis started successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error starting Hedera analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/review/hedera - Get Hedera analysis reports or progress for project
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

    const projectId = params.id;
    const { searchParams } = new URL(request.url);
    const progressMode = searchParams.get('progress') === 'true';

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: session.user.id,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    if (progressMode) {
      // Return current progress of most recent analysis
      const currentReport = await prisma.hederaAnalysisReport.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      });

      if (!currentReport) {
        return NextResponse.json({
          success: true,
          data: {
            status: 'NOT_STARTED',
            progress: 0,
            currentStage: null,
            isComplete: false
          }
        });
      }

      // Use raw SQL to get progress fields that might not be in Prisma client
      let progressData;
      try {
        const rawResult = await prisma.$queryRaw`
          SELECT
            "status",
            "progress",
            "currentStage",
            "analysisStartedAt",
            "analysisCompletedAt",
            "updatedAt",
            "errorMessage"
          FROM "hedera_analysis_reports"
          WHERE "id" = ${currentReport.id}
        ` as any[];

        const row = rawResult[0];
        progressData = {
          status: currentReport.status,
          progress: row?.progress || 0,
          currentStage: row?.currentStage || 'unknown',
          analysisStartedAt: row?.analysisStartedAt,
          analysisCompletedAt: row?.analysisCompletedAt,
          isComplete: currentReport.status === 'COMPLETED',
          hasError: currentReport.status === 'FAILED',
          errorMessage: currentReport.errorMessage,
          reportId: currentReport.id
        };
      } catch (rawError) {
        console.warn('Failed to get progress via raw SQL, using basic data:', rawError);
        progressData = {
          status: currentReport.status,
          progress: 0,
          currentStage: 'unknown',
          isComplete: currentReport.status === 'COMPLETED',
          hasError: currentReport.status === 'FAILED',
          errorMessage: currentReport.errorMessage,
          reportId: currentReport.id
        };
      }

      return NextResponse.json({
        success: true,
        data: progressData
      });
    } else {
      // Get all Hedera analysis reports for this project (original behavior)
      const reports = await hederaAgent.getProjectHederaReports(projectId);

      const response: ApiResponse = {
        success: true,
        data: reports,
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('Error fetching Hedera analysis data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/review/hedera - Delete all Hedera reports for a project
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

    const projectId = params.id;

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: session.user.id,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Clean up any stuck process in the process manager
    const processId = `hedera-${projectId}`;
    if (processManager.isProcessRunning(processId)) {
      processManager.endProcess(processId);
      console.log(`🧹 Cleaned up stuck process: ${processId}`);
    }

    // First, clean up any stuck IN_PROGRESS records by marking them as FAILED
    const stuckRecordsTimeout = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    const stuckRecords = await prisma.hederaAnalysisReport.updateMany({
      where: {
        projectId,
        status: 'IN_PROGRESS',
        updatedAt: {
          lt: stuckRecordsTimeout
        }
      },
      data: {
        status: 'FAILED',
        errorMessage: 'Analysis timed out - cleaned up by reset operation',
        processingTime: 1800 // 30 minutes in seconds
      }
    });

    if (stuckRecords.count > 0) {
      console.log(`🧹 Cleaned up ${stuckRecords.count} stuck IN_PROGRESS records for project ${projectId}`);
    }

    // Also clean up any recent IN_PROGRESS records (within 30 minutes) - these might be genuinely stuck
    const recentStuckRecords = await prisma.hederaAnalysisReport.updateMany({
      where: {
        projectId,
        status: 'IN_PROGRESS'
      },
      data: {
        status: 'FAILED',
        errorMessage: 'Analysis interrupted by manual reset',
        processingTime: Math.round((Date.now() - Date.now()) / 1000)
      }
    });

    if (recentStuckRecords.count > 0) {
      console.log(`🧹 Force cleaned ${recentStuckRecords.count} recent IN_PROGRESS records for project ${projectId}`);
    }

    // Delete all Hedera analysis reports for this project
    const deletedReports = await prisma.hederaAnalysisReport.deleteMany({
      where: { projectId },
    });

    console.log(`Deleted ${deletedReports.count} Hedera analysis reports for project ${projectId}`);

    const response: ApiResponse = {
      success: true,
      data: { deletedCount: deletedReports.count },
      message: `Successfully deleted ${deletedReports.count} Hedera analysis report${deletedReports.count !== 1 ? 's' : ''}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting Hedera analysis reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}