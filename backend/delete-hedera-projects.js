const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const HACKATHON_SLUG = 'hedera-africa-hackathon-2025';

async function checkHederaData() {
  console.log('\n🔍 Checking Hedera Africa Hackathon data...\n');

  try {
    // Find the hackathon
    const hackathon = await prisma.hackathons.findUnique({
      where: { slug: HACKATHON_SLUG },
      include: {
        projects: {
          include: {
            codeQualityReports: true,
            coherenceReports: true,
            innovationReports: true,
            hederaReports: true,
            eligibilityReports: true,
            evaluation: true,
          }
        },
        tracks: true,
        tournament: {
          include: {
            matches: true
          }
        },
        aiJurySessions: {
          include: {
            ai_jury_layer_results: true
          }
        }
      }
    });

    if (!hackathon) {
      console.log('❌ No hackathon found with slug:', HACKATHON_SLUG);
      return null;
    }

    console.log('✅ Found hackathon:', hackathon.name);
    console.log('   ID:', hackathon.id);
    console.log('   Created:', hackathon.createdAt);
    console.log('\n📊 Data Summary:');
    console.log('   - Projects:', hackathon.projects.length);
    console.log('   - Tracks:', hackathon.tracks.length);

    // Count reports
    let totalCodeQualityReports = 0;
    let totalCoherenceReports = 0;
    let totalInnovationReports = 0;
    let totalHederaReports = 0;
    let totalEligibilityReports = 0;
    let totalEvaluations = 0;

    hackathon.projects.forEach(project => {
      totalCodeQualityReports += project.codeQualityReports.length;
      totalCoherenceReports += project.coherenceReports.length;
      totalInnovationReports += project.innovationReports.length;
      totalHederaReports += project.hederaReports.length;
      totalEligibilityReports += project.eligibilityReports.length;
      if (project.evaluation) totalEvaluations++;
    });

    console.log('   - Code Quality Reports:', totalCodeQualityReports);
    console.log('   - Coherence Reports:', totalCoherenceReports);
    console.log('   - Innovation Reports:', totalInnovationReports);
    console.log('   - Hedera Analysis Reports:', totalHederaReports);
    console.log('   - Eligibility Reports:', totalEligibilityReports);
    console.log('   - Evaluations:', totalEvaluations);

    if (hackathon.tournament) {
      console.log('   - Tournament Matches:', hackathon.tournament.matches.length);
    }

    if (hackathon.aiJurySessions.length > 0) {
      const totalLayerResults = hackathon.aiJurySessions.reduce(
        (sum, session) => sum + session.ai_jury_layer_results.length, 0
      );
      console.log('   - AI Jury Sessions:', hackathon.aiJurySessions.length);
      console.log('   - AI Jury Layer Results:', totalLayerResults);
    }

    console.log('\n📋 Project List:');
    hackathon.projects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name} (${project.slug})`);
      console.log(`      - Team: ${project.teamName}`);
      console.log(`      - GitHub: ${project.githubUrl}`);
      console.log(`      - Status: ${project.status}`);
    });

    return hackathon;
  } catch (error) {
    console.error('❌ Error checking data:', error);
    return null;
  }
}

async function deleteHederaProjects() {
  console.log('\n🗑️  Starting deletion process...\n');

  try {
    const hackathon = await prisma.hackathons.findUnique({
      where: { slug: HACKATHON_SLUG },
      select: { id: true, name: true }
    });

    if (!hackathon) {
      console.log('❌ No hackathon found to delete.');
      return;
    }

    console.log('⚠️  DELETING:', hackathon.name);
    console.log('   ID:', hackathon.id);
    console.log('\n⏳ This will delete the hackathon and ALL related data due to cascade rules...\n');

    // Delete the hackathon (cascade will handle everything else)
    // The cascade rules in schema.prisma will automatically delete:
    // - All projects
    // - All tracks
    // - All tournament and matches
    // - All AI jury sessions and layer results
    // - All reports (code quality, coherence, innovation, hedera, eligibility)
    // - All evaluations

    await prisma.hackathons.delete({
      where: { id: hackathon.id }
    });

    console.log('✅ Successfully deleted hackathon and all related data!\n');
    console.log('🎉 Cleanup complete!\n');

  } catch (error) {
    console.error('❌ Error during deletion:', error);
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const action = args[0];

    if (action === 'delete' || action === '--delete') {
      console.log('\n⚠️  ========================================');
      console.log('⚠️  WARNING: PERMANENT DELETION');
      console.log('⚠️  ========================================\n');
      console.log('This will permanently delete:');
      console.log('- The Hedera Africa Hackathon 2025');
      console.log('- ALL projects in this hackathon');
      console.log('- ALL tracks');
      console.log('- ALL reports (code quality, coherence, innovation, etc.)');
      console.log('- ALL evaluations');
      console.log('- ALL tournament data');
      console.log('- ALL AI jury session data');
      console.log('\n❌ THIS CANNOT BE UNDONE!\n');

      // Wait 3 seconds to let user read the warning
      await new Promise(resolve => setTimeout(resolve, 3000));

      await deleteHederaProjects();
    } else {
      // Default: just check and display data
      await checkHederaData();
      console.log('\n💡 To delete this data, run:');
      console.log('   node delete-hedera-projects.js delete\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
