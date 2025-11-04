require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const Queue = require('bull').default ||  require('bull');
const Redis = require('ioredis');

const prisma = new PrismaClient();

async function testBullQueue() {
  console.log('🧪 Testing Bull Queue Configuration\n');

  try {
    // Create Redis client
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });

    console.log('📡 Testing Redis connection...');
    await redis.ping();
    console.log('✅ Redis connection successful\n');

    // Create Bull queue
    const codeQualityQueue = new Queue('code-quality', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      }
    });

    console.log('📋 Checking queue jobs...');
    const waiting = await codeQualityQueue.getWaiting();
    const active = await codeQualityQueue.getActive();
    const completed = await codeQualityQueue.getCompleted();
    const failed = await codeQualityQueue.getFailed();

    console.log(`   Waiting: ${waiting.length}`);
    console.log(`   Active: ${active.length}`);
    console.log(`   Completed: ${completed.length}`);
    console.log(`   Failed: ${failed.length}\n`);

    // Find a project
    const project = await prisma.projects.findFirst({
      where: {
        AND: [
          { githubUrl: { not: 'https://github.com' } },
          { githubUrl: { contains: 'github.com/' } }
        ]
      }
    });

    if (!project) {
      console.log('❌ No project found');
      await codeQualityQueue.close();
      await redis.quit();
      return;
    }

    console.log(`📦 Found project: ${project.name}`);
    console.log(`   GitHub: ${project.githubUrl}\n`);

    // Create a code quality report
    const report = await prisma.code_quality_reports.create({
      data: {
        projectId: project.id,
        repositoryUrl: project.githubUrl,
        status: 'PENDING',
      }
    });

    console.log(`✅ Created report: ${report.id}\n`);

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

    console.log(`✅ Job added to queue: ${job.id}\n`);
    console.log('📊 Job status:');
    console.log(`   ID: ${job.id}`);
    console.log(`   Queue: ${job.queue.name}`);
    console.log(`   Data:`, JSON.stringify(job.data, null, 2));
    console.log('');

    // Wait a bit and check job status
    console.log('⏳ Waiting 5 seconds for processor to pick up job...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const jobStatus = await job.getState();
    console.log(`📌 Job state after 5s: ${jobStatus}`);

    // Check report status in database
    const updatedReport = await prisma.code_quality_reports.findUnique({
      where: { id: report.id }
    });

    console.log(`📌 Report status in DB: ${updatedReport.status}`);
    console.log(`📌 Report progress: ${updatedReport.progress || 0}%`);
    console.log(`📌 Current stage: ${updatedReport.currentStage || 'N/A'}\n`);

    if (updatedReport.status === 'PENDING' && jobStatus === 'waiting') {
      console.log('⚠️  WARNING: Job is still waiting, processor may not be registered!');
      console.log('   This suggests the CodeQualityProcessor is not running.');
    } else if (updatedReport.status === 'IN_PROGRESS' || updatedReport.progress > 0) {
      console.log('✅ SUCCESS: Processor is working! Analysis has started.');
    }

    console.log('\n💡 Run "node monitor-code-quality.js" to watch full progress\n');

    await codeQualityQueue.close();
    await redis.quit();

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

testBullQueue()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
