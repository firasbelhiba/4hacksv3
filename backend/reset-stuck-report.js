/**
 * Reset Stuck Code Quality Report
 * Run this script to delete or reset stuck analysis reports
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetStuckReport() {
  try {
    const reportId = 'cmgy2dyjr0001f4o8ozm8axhs';

    console.log(`Looking for report: ${reportId}`);

    const report = await prisma.code_quality_reports.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      console.log('Report not found!');
      return;
    }

    console.log('Found report:', {
      id: report.id,
      projectId: report.projectId,
      status: report.status,
      createdAt: report.createdAt,
    });

    // Option 1: Delete the stuck report
    await prisma.code_quality_reports.delete({
      where: { id: reportId },
    });

    console.log('✅ Successfully deleted stuck report!');
    console.log('You can now start a new code quality analysis.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetStuckReport();
