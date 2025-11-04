require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countInvalidUrls() {
  const count = await prisma.projects.count({
    where: { githubUrl: 'https://github.com' }
  });

  console.log('Projects with invalid GitHub URL (https://github.com):', count);

  const sample = await prisma.projects.findMany({
    where: { githubUrl: 'https://github.com' },
    take: 5,
    select: { name: true, githubUrl: true }
  });

  console.log('\nSample projects:');
  sample.forEach(p => console.log(`  - ${p.name}: ${p.githubUrl}`));
}

countInvalidUrls()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
