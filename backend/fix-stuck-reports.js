const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixStuckReports() {
  console.log('🔍 Checking for stuck code quality reports...\n');

  try {
    // Find all reports stuck in PENDING or IN_PROGRESS for more than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const stuckReports = await prisma.code_quality_reports.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        },
        createdAt: {
          lt: tenMinutesAgo
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            githubUrl: true
          }
        }
      }
    });

    if (stuckReports.length === 0) {
      console.log('✅ No stuck reports found. All reports are healthy!\n');
      return;
    }

    console.log(`⚠️  Found ${stuckReports.length} stuck report(s):\n`);

    for (const report of stuckReports) {
      const ageMinutes = Math.floor((Date.now() - new Date(report.createdAt).getTime()) / 1000 / 60);

      console.log(`Report ID: ${report.id}`);
      console.log(`Project: ${report.project.name}`);
      console.log(`Status: ${report.status}`);
      console.log(`Progress: ${report.progress}%`);
      console.log(`Age: ${ageMinutes} minutes`);
      console.log(`Created: ${report.createdAt}`);
      console.log('---');
    }

    console.log('\n🔧 Fixing stuck reports...\n');

    // Update all stuck reports to FAILED status
    const result = await prisma.code_quality_reports.updateMany({
      where: {
        id: {
          in: stuckReports.map(r => r.id)
        }
      },
      data: {
        status: 'FAILED',
        progress: 0,
        currentStage: 'Analysis failed - timeout or queue issue',
        updatedAt: new Date()
      }
    });

    console.log(`✅ Successfully updated ${result.count} report(s) to FAILED status.\n`);
    console.log('You can now start a new analysis for these projects.\n');

    // Show which projects can now be re-analyzed
    console.log('Projects ready for re-analysis:');
    for (const report of stuckReports) {
      console.log(`  - ${report.project.name} (Project ID: ${report.project.id})`);
    }

  } catch (error) {
    console.error('❌ Error fixing stuck reports:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixStuckReports()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
