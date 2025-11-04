require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCodeQuality() {
  console.log('🔍 Finding a project with valid GitHub URL...\n');

  // Find a project with valid GitHub URL (not just "https://github.com")
  const project = await prisma.projects.findFirst({
    where: {
      AND: [
        { githubUrl: { not: 'https://github.com' } },
        { githubUrl: { contains: 'github.com/' } }
      ]
    },
    include: {
      hackathon: {
        select: {
          id: true,
          name: true,
          createdById: true
        }
      },
      track: true
    }
  });

  if (!project) {
    console.log('❌ No project with valid GitHub URL found');
    return;
  }

  console.log('✅ Found project:');
  console.log(`   Name: ${project.name}`);
  console.log(`   GitHub: ${project.githubUrl}`);
  console.log(`   Hackathon: ${project.hackathon.name}`);
  console.log(`   Track: ${project.track.name}\n`);

  const userId = project.hackathon.createdById;

  console.log('🚀 Starting code quality analysis...\n');

  // Call the backend API to start analysis
  const startResponse = await fetch(`http://localhost:4000/api/projects/${project.id}/code-quality`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IiR7dXNlcklkfSIsImlhdCI6MTYzMDAwMDAwMH0.fake` // Placeholder
    }
  });

  if (!startResponse.ok) {
    console.log('❌ Failed to start analysis:', await startResponse.text());
    return;
  }

  const startData = await startResponse.json();
  const reportId = startData.data.reportId;

  console.log(`✅ Analysis started! Report ID: ${reportId}\n`);
  console.log('📊 Monitoring progress...\n');

  // Poll for progress
  let completed = false;
  let attempts = 0;
  const maxAttempts = 60; // 2 minutes max

  while (!completed && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    attempts++;

    const report = await prisma.code_quality_reports.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      console.log('❌ Report not found');
      break;
    }

    const progressBar = '█'.repeat(Math.floor(report.progress / 5)) + '░'.repeat(20 - Math.floor(report.progress / 5));
    console.log(`   [${progressBar}] ${report.progress}% - ${report.currentStage || 'Processing...'} (Status: ${report.status})`);

    if (report.status === 'COMPLETED') {
      completed = true;
      console.log('\n🎉 Analysis completed!\n');
      console.log('📈 Results:');
      console.log(`   Overall Score: ${report.overallScore}/100`);
      console.log(`   Technical Score: ${report.technicalScore}/100`);
      console.log(`   Security Score: ${report.securityScore}/100`);
      console.log(`   Documentation Score: ${report.documentationScore}/100`);
      console.log(`   Performance Score: ${report.performanceScore}/100`);
      console.log(`   Richness Score: ${report.richnessScore}/100\n`);
      console.log('🐛 Issues Found:');
      console.log(`   Code Smells: ${report.codeSmellsCount || 0}`);
      console.log(`   Bugs: ${report.bugsCount || 0}`);
      console.log(`   Vulnerabilities: ${report.vulnerabilitiesCount || 0}\n`);
      console.log(`⏱️  Analysis Time: ${report.analysisTimeMs ? (report.analysisTimeMs / 1000).toFixed(1) + 's' : 'N/A'}`);
    } else if (report.status === 'FAILED') {
      console.log(`\n❌ Analysis failed: ${report.errorMessage}`);
      break;
    }
  }

  if (attempts >= maxAttempts) {
    console.log('\n⏰ Timeout: Analysis took too long');
  }
}

testCodeQuality()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
