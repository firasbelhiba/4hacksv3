import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProjects() {
  const projectCount = await prisma.project.count();
  const hackathons = await prisma.hackathon.findMany({
    include: {
      _count: {
        select: { projects: true }
      }
    }
  });

  console.log('\n📊 Project Statistics:');
  console.log('='.repeat(60));
  console.log(`Total projects in database: ${projectCount}`);
  console.log('\nProjects per hackathon:');
  hackathons.forEach(h => {
    console.log(`  • ${h.name}: ${h._count.projects} projects`);
  });
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

checkProjects();
