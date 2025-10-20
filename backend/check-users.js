const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });

  console.log('\n👥 Users in database:');
  console.log('='.repeat(60));
  if (users.length === 0) {
    console.log('  No users found!');
    console.log('  Run: npm run seed (to create admin user)');
  } else {
    users.forEach(u => {
      console.log(`  • ${u.email} (${u.role})`);
    });
    console.log('\n📝 Default login credentials:');
    console.log('  Email: admin@4hacks.com');
    console.log('  Password: admin123');
  }
  console.log('='.repeat(60) + '\n');

  await prisma.$disconnect();
}

checkUsers();
