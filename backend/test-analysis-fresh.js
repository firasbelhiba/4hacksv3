require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFresh() {
  console.log('🧪 Fresh Code Quality Analysis Test\n');

  // Find a project with valid GitHub URL
  const project = await prisma.projects.findFirst({
    where: {
      AND: [
        { githubUrl: { not: 'https://github.com' } },
        { githubUrl: { contains: 'github.com/' } }
      ]
    },
    include: {
      hackathon: {
        select: { id: true, createdById: true }
      },
      track: true
    }
  });

  if (!project) {
    console.log('❌ No project with valid GitHub URL found');
    return;
  }

  console.log('✅ Testing with project:');
  console.log(`   Name: ${project.name}`);
  console.log(`   GitHub: ${project.githubUrl}`);
  console.log(`   Track: ${project.track.name}`);
  console.log(`   Owner ID: ${project.hackathon.createdById}\n`);

  // Use fetch to call the actual API endpoint (this will trigger the Bull queue)
  const API_URL = 'http://localhost:4000/api';

  // First, login to get auth token
  console.log('🔐 Getting authentication token...');
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com', // This should be a valid user
      password: 'admin123'
    })
  });

  if (!loginResponse.ok) {
    console.log('❌ Failed to authenticate');
    console.log('Note: You may need to create a user first or use valid credentials');
    console.log('Trying with direct database approach instead...\n');

    // Create report directly
    const report = await prisma.code_quality_reports.create({
      data: {
        projectId: project.id,
        repositoryUrl: project.githubUrl,
        status: 'PENDING',
      }
    });

    console.log(`✅ Report created directly: ${report.id}`);
    console.log('⚠️  Note: This will not trigger the Bull queue. The queue needs to be triggered via the NestJS service.');
    console.log('Run: node monitor-code-quality.js to monitor the report status\n');
    return;
  }

  const { access_token } = await loginResponse.json();
  console.log('✅ Authenticated\n');

  // Start code quality analysis
  console.log('🚀 Starting code quality analysis via API...');
  const analysisResponse = await fetch(`${API_URL}/projects/${project.id}/code-quality`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  });

  const analysisData = await analysisResponse.json();

  if (!analysisResponse.ok) {
    console.log('❌ Failed to start analysis:', analysisData);
    return;
  }

  console.log('✅ Analysis started successfully!');
  console.log(`   Report ID: ${analysisData.data.reportId}`);
  console.log(`   Status: ${analysisData.data.status}\n`);
  console.log('📊 Run "node monitor-code-quality.js" to watch progress');
}

testFresh()
  .catch((error) => {
    console.error('\n💥 Test failed with error:');
    console.error(error);
  })
  .finally(() => prisma.$disconnect());
