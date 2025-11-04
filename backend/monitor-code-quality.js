require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

async function monitorAnalysis() {
  console.log(`${colors.bright}${colors.cyan}=== Code Quality Analysis Monitor ===${colors.reset}\n`);

  // Find most recent report
  const latestReport = await prisma.code_quality_reports.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      project: {
        select: {
          name: true,
          githubUrl: true,
        },
      },
    },
  });

  if (!latestReport) {
    console.log(`${colors.yellow}No reports found in database${colors.reset}`);
    return;
  }

  console.log(`${colors.bright}Latest Report:${colors.reset}`);
  console.log(`  ID: ${colors.cyan}${latestReport.id}${colors.reset}`);
  console.log(`  Project: ${colors.green}${latestReport.project.name}${colors.reset}`);
  console.log(`  GitHub URL: ${latestReport.repositoryUrl}`);
  console.log(`  Created: ${latestReport.createdAt.toLocaleString()}`);
  console.log('');

  // Status indicator
  const statusColor =
    latestReport.status === 'COMPLETED'
      ? colors.green
      : latestReport.status === 'FAILED'
      ? colors.red
      : latestReport.status === 'IN_PROGRESS'
      ? colors.yellow
      : colors.blue;

  console.log(`${colors.bright}Status:${colors.reset} ${statusColor}${latestReport.status}${colors.reset}`);

  // Progress
  if (latestReport.progress !== null) {
    const progressBar = '█'.repeat(Math.floor(latestReport.progress / 5)) + '░'.repeat(20 - Math.floor(latestReport.progress / 5));
    console.log(`${colors.bright}Progress:${colors.reset} ${colors.cyan}${latestReport.progress}%${colors.reset} [${progressBar}]`);
  }

  if (latestReport.currentStage) {
    console.log(`${colors.bright}Stage:${colors.reset} ${latestReport.currentStage}`);
  }

  console.log('');

  // Scores (if completed)
  if (latestReport.status === 'COMPLETED') {
    console.log(`${colors.bright}${colors.green}✓ Analysis Completed${colors.reset}`);
    console.log(`${colors.bright}Scores:${colors.reset}`);
    console.log(`  Overall: ${colors.magenta}${latestReport.overallScore}/100${colors.reset}`);
    console.log(`  Technical: ${latestReport.technicalScore}/100`);
    console.log(`  Security: ${latestReport.securityScore}/100`);
    console.log(`  Documentation: ${latestReport.documentationScore}/100`);
    console.log(`  Performance: ${latestReport.performanceScore}/100`);
    console.log(`  Richness: ${latestReport.richnessScore}/100`);
    console.log('');
    console.log(`${colors.bright}Issues Found:${colors.reset}`);
    console.log(`  Code Smells: ${latestReport.codeSmellsCount || 0}`);
    console.log(`  Bugs: ${latestReport.bugsCount || 0}`);
    console.log(`  Vulnerabilities: ${latestReport.vulnerabilitiesCount || 0}`);
    console.log('');
    console.log(`${colors.bright}Analysis Time:${colors.reset} ${latestReport.analysisTimeMs ? `${(latestReport.analysisTimeMs / 1000).toFixed(1)}s` : 'N/A'}`);
  }

  // Error message (if failed)
  if (latestReport.status === 'FAILED' && latestReport.errorMessage) {
    console.log(`${colors.bright}${colors.red}✗ Analysis Failed${colors.reset}`);
    console.log(`${colors.red}Error: ${latestReport.errorMessage}${colors.reset}`);
  }

  console.log('');
  console.log(`${colors.dim}Monitoring... (Updated every 2 seconds)${colors.reset}`);
}

async function main() {
  console.clear();
  await monitorAnalysis();

  // Poll every 2 seconds
  setInterval(async () => {
    console.clear();
    await monitorAnalysis();
  }, 2000);
}

main().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(`\n${colors.yellow}Shutting down...${colors.reset}`);
  await prisma.$disconnect();
  process.exit(0);
});
