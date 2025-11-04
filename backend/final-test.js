require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const Queue = require('bull').default || require('bull');
const Redis = require('ioredis');

const prisma = new PrismaClient();

async function finalTest() {
  console.log('🚀 FINAL END-TO-END TEST\n');

  try {
    // Update first project to have valid GitHub URL
    const project = await prisma.projects.findFirst();

    const updated = await prisma.projects.update({
      where: { id: project.id },
      data: { githubUrl: 'https://github.com/vercel/next.js' }
    });

    console.log('✅ Updated project:', updated.name);
    console.log('   GitHub URL:', updated.githubUrl);
    console.log('');

    // Create queue
    const codeQualityQueue = new Queue('code-quality', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      }
    });

    // Create report
    const report = await prisma.code_quality_reports.create({
      data: {
        projectId: updated.id,
        repositoryUrl: updated.githubUrl,
        status: 'PENDING',
      }
    });

    console.log(`✅ Created report: ${report.id}\n`);

    // Queue the job
    const job = await codeQualityQueue.add({
      reportId: report.id,
      projectId: updated.id,
      githubUrl: updated.githubUrl,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });

    console.log(`✅ Job queued: ${job.id}\n`);
    console.log('⏳ Monitoring progress (30 seconds max)...\n');

    // Monitor for 30 seconds
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedReport = await prisma.code_quality_reports.findUnique({
        where: { id: report.id }
      });

      const status = updatedReport.status.padEnd(12);
      const progress = (updatedReport.progress || 0).toString().padStart(3);
      const stage = (updatedReport.currentStage || 'Waiting').substring(0, 50);

      process.stdout.write(`\r[${(i + 1).toString().padStart(2)}s] ${status} | ${progress}% | ${stage}${' '.repeat(Math.max(0, 50 - stage.length))}`);

      if (updatedReport.status === 'COMPLETED') {
        console.log('\n\n🎉 SUCCESS! Analysis completed!\n');
        console.log('📊 RESULTS:');
        console.log(`   Overall Score:     ${updatedReport.overallScore}/100`);
        console.log(`   Technical:         ${updatedReport.technicalScore}/100`);
        console.log(`   Security:          ${updatedReport.securityScore}/100`);
        console.log(`   Documentation:     ${updatedReport.documentationScore}/100`);
        console.log(`   Performance:       ${updatedReport.performanceScore}/100`);
        console.log(`   Richness:          ${updatedReport.richnessScore}/100`);
        console.log(`   Issues Found:      ${updatedReport.issuesFound?.length || 0}`);
        console.log(`   Suggestions:       ${updatedReport.suggestions?.length || 0}`);

        const duration = Math.round((new Date(updatedReport.analysisCompletedAt) - new Date(updatedReport.analysisStartedAt)) / 1000);
        console.log(`   Analysis Time:     ${duration}s`);
        console.log('\n✅ THE CODE QUALITY ANALYSIS SYSTEM IS FULLY WORKING!\n');
        break;
      } else if (updatedReport.status === 'FAILED') {
        console.log('\n\n❌ Analysis FAILED:');
        console.log(`   Error: ${updatedReport.errorMessage}\n`);
        break;
      }
    }

    await codeQualityQueue.close();

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

finalTest();
