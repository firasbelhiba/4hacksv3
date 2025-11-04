require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bull');
const Redis = require('ioredis');
const prisma = new PrismaClient();

async function runTest() {
  console.log('🧪 Code Quality Analysis Test\n');

  // Find a project with valid GitHub URL
  const project = await prisma.projects.findFirst({
    where: {
      AND: [
        { githubUrl: { not: 'https://github.com' } },
        { githubUrl: { contains: 'github.com/' } }
      ]
    },
    include: {
      hackathon: true,
      track: true
    }
  });

  if (!project) {
    console.log('❌ No project with valid GitHub URL found');
    console.log('Looking for projects with https://github.com...');
    const anyProject = await prisma.projects.findFirst({
      where: {
        githubUrl: 'https://github.com'
      }
    });
    if (anyProject) {
      console.log(`⚠️  Found project "${anyProject.name}" but it has invalid GitHub URL`);
      console.log('This will fail with validation error (expected behavior)\n');
    }
    return;
  }

  console.log('✅ Testing with project:');
  console.log(`   Name: ${project.name}`);
  console.log(`   GitHub: ${project.githubUrl}`);
  console.log(`   Track: ${project.track.name}\n`);

  // Create a code quality report
  console.log('📝 Creating code quality report...');
  const report = await prisma.code_quality_reports.create({
    data: {
      projectId: project.id,
      repositoryUrl: project.githubUrl,
      status: 'PENDING',
    }
  });

  console.log(`✅ Report created: ${report.id}\n`);

  // Queue the job using Bull
  console.log('🚀 Queueing Bull job...');
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  });

  const codeQualityQueue = new Queue('code-quality', {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    }
  });

  await codeQualityQueue.add(
    {
      reportId: report.id,
      projectId: project.id,
      githubUrl: project.githubUrl,
    },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    }
  );

  console.log('✅ Job queued successfully\n');
  console.log('📊 Monitoring progress (will update every 2 seconds)...\n');

  // Monitor progress
  let completed = false;
  let attempts = 0;
  const maxAttempts = 60; // 2 minutes

  while (!completed && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;

    const updatedReport = await prisma.code_quality_reports.findUnique({
      where: { id: report.id }
    });

    if (!updatedReport) {
      console.log('❌ Report not found');
      break;
    }

    // Progress bar
    const progress = updatedReport.progress || 0;
    const filled = Math.floor(progress / 5);
    const empty = 20 - filled;
    const progressBar = '█'.repeat(filled) + '░'.repeat(empty);

    // Status color (for terminal)
    const statusSymbol =
      updatedReport.status === 'COMPLETED' ? '✅' :
      updatedReport.status === 'FAILED' ? '❌' :
      updatedReport.status === 'IN_PROGRESS' ? '⏳' : '⏸️';

    console.log(`${statusSymbol} [${progressBar}] ${progress}% - ${updatedReport.currentStage || 'Waiting...'}`);

    if (updatedReport.status === 'COMPLETED') {
      completed = true;
      console.log('\n🎉 Analysis completed successfully!\n');
      console.log('═══════════════════════════════════════');
      console.log('📈 ANALYSIS RESULTS');
      console.log('═══════════════════════════════════════\n');

      console.log('📊 Scores:');
      console.log(`   ⭐ Overall Score:       ${updatedReport.overallScore}/100`);
      console.log(`   🔧 Technical:           ${updatedReport.technicalScore}/100`);
      console.log(`   🔒 Security:            ${updatedReport.securityScore}/100`);
      console.log(`   📝 Documentation:       ${updatedReport.documentationScore}/100`);
      console.log(`   ⚡ Performance:         ${updatedReport.performanceScore}/100`);
      console.log(`   ✨ Richness:            ${updatedReport.richnessScore}/100\n`);

      console.log('🐛 Issues Found:');
      console.log(`   ⚠️  Code Smells:        ${updatedReport.codeSmellsCount || 0}`);
      console.log(`   🐞 Bugs:                ${updatedReport.bugsCount || 0}`);
      console.log(`   🔓 Vulnerabilities:     ${updatedReport.vulnerabilitiesCount || 0}\n`);

      console.log('📏 Analysis Stats:');
      console.log(`   📄 Lines Analyzed:      ${updatedReport.totalLinesAnalyzed || 'N/A'}`);
      console.log(`   ⏱️  Time Taken:          ${updatedReport.analysisTimeMs ? (updatedReport.analysisTimeMs / 1000).toFixed(1) + 's' : 'N/A'}`);
      console.log(`   🤖 AI Model:            ${updatedReport.aiModel || 'N/A'}\n`);

      if (updatedReport.strengths && updatedReport.strengths.length > 0) {
        console.log('💪 Strengths:');
        updatedReport.strengths.slice(0, 3).forEach((s, i) => {
          console.log(`   ${i + 1}. ${s}`);
        });
        console.log('');
      }

      if (updatedReport.improvements && updatedReport.improvements.length > 0) {
        console.log('📈 Areas for Improvement:');
        updatedReport.improvements.slice(0, 3).forEach((imp, i) => {
          console.log(`   ${i + 1}. ${imp}`);
        });
        console.log('');
      }

      console.log('═══════════════════════════════════════\n');
    } else if (updatedReport.status === 'FAILED') {
      console.log(`\n❌ Analysis failed!`);
      console.log(`   Error: ${updatedReport.errorMessage || 'Unknown error'}\n`);
      break;
    }
  }

  if (attempts >= maxAttempts && !completed) {
    console.log('\n⏰ Timeout: Analysis is taking longer than expected');
    console.log('Check the backend logs for more details\n');
  }

  await codeQualityQueue.close();
  await redis.quit();
}

runTest()
  .catch((error) => {
    console.error('\n💥 Test failed with error:');
    console.error(error);
  })
  .finally(() => prisma.$disconnect());
