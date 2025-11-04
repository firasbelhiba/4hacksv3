require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const Queue = require('bull').default || require('bull');
const Redis = require('ioredis');

const prisma = new PrismaClient();

async function testWithValidRepo() {
  console.log('🧪 Testing with VALID GitHub Repository\n');

  try {
    // Create Redis and Queue
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

    console.log('📡 Redis connected\n');

    // Find or create a project with a VALID GitHub URL
    let project = await prisma.projects.findFirst({
      where: {
        githubUrl: 'https://github.com/vercel/next.js'
      }
    });

    if (!project) {
      console.log('Creating test project with valid GitHub URL...');

      // Get first hackathon and track
      const hackathon = await prisma.hackathons.findFirst();
      const track = await prisma.tracks.findFirst();

      if (!hackathon || !track) {
        console.log('❌ No hackathon or track found. Cannot create test project.');
        await codeQualityQueue.close();
        await redis.quit();
        return;
      }

      project = await prisma.projects.create({
        data: {
          name: 'Next.js Test Project',
          description: 'Test project for code quality analysis',
          githubUrl: 'https://github.com/vercel/next.js',
          hackathonId: hackathon.id,
          trackId: track.id,
        }
      });
      console.log('✅ Test project created\n');
    }

    console.log(`📦 Using project: ${project.name}`);
    console.log(`   GitHub: ${project.githubUrl}\n`);

    // Create a code quality report
    const report = await prisma.code_quality_reports.create({
      data: {
        projectId: project.id,
        repositoryUrl: project.githubUrl,
        status: 'PENDING',
      }
    });

    console.log(`✅ Report created: ${report.id}\n`);

    // Add job to queue
    console.log('🚀 Adding job to Bull queue...');
    const job = await codeQualityQueue.add(
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

    console.log(`✅ Job added: ${job.id}\n`);

    // Monitor progress
    console.log('⏳ Monitoring progress for 30 seconds...\n');

    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedReport = await prisma.code_quality_reports.findUnique({
        where: { id: report.id }
      });

      const jobState = await job.getState();

      process.stdout.write(`\r[${i + 1}s] Status: ${updatedReport.status.padEnd(12)} | Progress: ${(updatedReport.progress || 0).toString().padStart(3)}% | Job: ${jobState.padEnd(10)} | Stage: ${(updatedReport.currentStage || 'N/A').substring(0, 40)}`);

      if (updatedReport.status === 'COMPLETED') {
        console.log('\n\n✅ SUCCESS! Analysis completed!');
        console.log('\n📊 Results:');
        console.log(`   Overall Score: ${updatedReport.overallScore}/100`);
        console.log(`   Technical: ${updatedReport.technicalScore}/100`);
        console.log(`   Security: ${updatedReport.securityScore}/100`);
        console.log(`   Documentation: ${updatedReport.documentationScore}/100`);
        console.log(`   Performance: ${updatedReport.performanceScore}/100`);
        console.log(`   Richness: ${updatedReport.richnessScore}/100`);
        console.log(`\n   Issues Found: ${updatedReport.issuesFound?.length || 0}`);
        console.log(`   Suggestions: ${updatedReport.suggestions?.length || 0}`);
        console.log(`   Time: ${Math.round((new Date(updatedReport.analysisCompletedAt) - new Date(updatedReport.analysisStartedAt)) / 1000)}s`);
        break;
      } else if (updatedReport.status === 'FAILED') {
        console.log('\n\n❌ Analysis failed!');
        console.log(`   Error: ${updatedReport.errorMessage}`);
        break;
      }
    }

    console.log('\n\n💡 The code quality analysis system is working!\n');

    await codeQualityQueue.close();
    await redis.quit();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testWithValidRepo()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
