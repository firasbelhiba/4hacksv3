import { NextResponse } from 'next/server';
import { processManager } from '@/lib/process-manager';
import { prisma } from '@/lib/db';

export async function GET() {
  const processManagerStatus = processManager.getStatus();

  // Get database state for Hedera analyses
  const databaseStats = await prisma.hederaAnalysisReport.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });

  // Get detailed info about IN_PROGRESS records
  const inProgressRecords = await prisma.hederaAnalysisReport.findMany({
    where: {
      status: 'IN_PROGRESS'
    },
    select: {
      id: true,
      projectId: true,
      updatedAt: true,
      createdAt: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  // Calculate age of IN_PROGRESS records
  const now = new Date();
  const inProgressWithAge = inProgressRecords.map(record => ({
    ...record,
    ageMinutes: Math.floor((now.getTime() - record.updatedAt.getTime()) / 1000 / 60),
    isStale: (now.getTime() - record.updatedAt.getTime()) > 30 * 60 * 1000 // older than 30 minutes
  }));

  const databaseState = {
    recordCountsByStatus: databaseStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>),
    inProgressRecords: inProgressWithAge,
    staleRecordsCount: inProgressWithAge.filter(r => r.isStale).length
  };

  return NextResponse.json({
    success: true,
    data: {
      serverInfo: {
        pid: process.pid,
        port: process.env.PORT || '3000',
        startTime: new Date().toISOString(),
        nodeVersion: process.version
      },
      processManager: processManagerStatus,
      database: databaseState,
      summary: {
        processManagerRunning: processManagerStatus.count,
        databaseInProgress: databaseState.recordCountsByStatus.IN_PROGRESS || 0,
        staleDbRecords: databaseState.staleRecordsCount,
        potentialIssue: (processManagerStatus.count === 0 && (databaseState.recordCountsByStatus.IN_PROGRESS || 0) > 0)
      }
    },
    message: `PID: ${process.pid} | Port: ${process.env.PORT || '3000'} | Process Manager: ${processManagerStatus.count}/${processManagerStatus.maxConcurrent} | Database IN_PROGRESS: ${databaseState.recordCountsByStatus.IN_PROGRESS || 0} | Stale: ${databaseState.staleRecordsCount}`
  });
}

export async function DELETE() {
  const previousProcessManagerStatus = processManager.getStatus();

  // Clear process manager
  processManager.clearAllProcesses();
  const newProcessManagerStatus = processManager.getStatus();

  // Clean up stale database records
  const stuckRecordsTimeout = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
  const cleanedStaleRecords = await prisma.hederaAnalysisReport.updateMany({
    where: {
      status: 'IN_PROGRESS',
      updatedAt: {
        lt: stuckRecordsTimeout
      }
    },
    data: {
      status: 'FAILED',
      errorMessage: 'Cleaned up by debug endpoint - analysis was stale',
      analysisCompletedAt: new Date(),
      processingTime: 1800 // 30 minutes
    }
  });

  // Also force clean any remaining IN_PROGRESS records (emergency cleanup)
  const emergencyCleanedRecords = await prisma.hederaAnalysisReport.updateMany({
    where: {
      status: 'IN_PROGRESS'
    },
    data: {
      status: 'FAILED',
      errorMessage: 'Force cleaned by debug endpoint',
      analysisCompletedAt: new Date()
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      processManager: {
        before: previousProcessManagerStatus,
        after: newProcessManagerStatus
      },
      database: {
        staleRecordsCleaned: cleanedStaleRecords.count,
        emergencyRecordsCleaned: emergencyCleanedRecords.count,
        totalCleanedRecords: cleanedStaleRecords.count + emergencyCleanedRecords.count
      }
    },
    message: `Cleared ${previousProcessManagerStatus.count} processes and ${cleanedStaleRecords.count + emergencyCleanedRecords.count} database records`
  });
}