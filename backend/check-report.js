const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkReport() {
  const reportId = 'cmhdiht7l0001f46cl6k582xk';

  console.log('🔍 Fetching report:', reportId);
  console.log('');

  try {
    const report = await prisma.code_quality_reports.findUnique({
      where: { id: reportId },
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

    if (!report) {
      console.log('❌ Report not found!');
      return;
    }

    console.log('📊 REPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Project: ${report.project.name}`);
    console.log(`GitHub: ${report.repositoryUrl}`);
    console.log(`Status: ${report.status}`);
    console.log(`Progress: ${report.progress}%`);
    console.log('');

    console.log('📈 SCORES');
    console.log('='.repeat(60));
    console.log(`Overall Score:        ${report.overallScore || 'N/A'}`);
    console.log(`Technical Score:      ${report.technicalScore || 'N/A'}`);
    console.log(`Security Score:       ${report.securityScore || 'N/A'}`);
    console.log(`Documentation Score:  ${report.documentationScore || 'N/A'}`);
    console.log(`Performance Score:    ${report.performanceScore || 'N/A'}`);
    console.log(`Richness Score:       ${report.richnessScore || 'N/A'}`);
    console.log('');

    console.log('🐛 ISSUES FOUND');
    console.log('='.repeat(60));
    console.log(`Code Smells:          ${report.codeSmellsCount || 0}`);
    console.log(`Bugs:                 ${report.bugsCount || 0}`);
    console.log(`Vulnerabilities:      ${report.vulnerabilitiesCount || 0}`);
    console.log(`Total Lines Analyzed: ${report.totalLinesAnalyzed || 0}`);
    console.log('');

    if (report.strengths && report.strengths.length > 0) {
      console.log('💪 STRENGTHS');
      console.log('='.repeat(60));
      report.strengths.forEach((strength, i) => {
        console.log(`${i + 1}. ${strength}`);
      });
      console.log('');
    }

    if (report.improvements && report.improvements.length > 0) {
      console.log('🔧 IMPROVEMENTS');
      console.log('='.repeat(60));
      report.improvements.forEach((improvement, i) => {
        console.log(`${i + 1}. ${improvement}`);
      });
      console.log('');
    }

    if (report.recommendations && Array.isArray(report.recommendations)) {
      console.log('💡 RECOMMENDATIONS');
      console.log('='.repeat(60));
      report.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.priority?.toUpperCase() || 'MEDIUM'}] ${rec.category}`);
        console.log(`   ${rec.description}`);
        if (rec.impact) {
          console.log(`   Impact: ${rec.impact}`);
        }
        console.log('');
      });
    }

    console.log('⏱️  TIMING');
    console.log('='.repeat(60));
    console.log(`Started:   ${report.analysisStartedAt}`);
    console.log(`Completed: ${report.analysisCompletedAt}`);
    console.log(`Duration:  ${report.analysisTimeMs}ms (${(report.analysisTimeMs / 1000).toFixed(2)}s)`);
    console.log(`AI Model:  ${report.aiModel || 'N/A'}`);
    console.log('');

    console.log('🏗️  ARCHITECTURE');
    console.log('='.repeat(60));
    if (report.architecturalPatterns) {
      console.log('Patterns:', JSON.stringify(report.architecturalPatterns, null, 2));
    }
    if (report.frameworkUtilization) {
      console.log('Frameworks:', JSON.stringify(report.frameworkUtilization, null, 2));
    }
    console.log('');

    console.log('✅ Report fetched successfully!');
    console.log('');
    console.log('You can view this report in Swagger at:');
    console.log(`GET /api/projects/${report.projectId}/code-quality/${reportId}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReport();
