const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test query
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful');

    // Test user count (to verify table access)
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible - Found ${userCount} users`);

    console.log('🎉 Database connection test completed successfully!');

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error details:', error.message);

    if (error.code) {
      console.error('Error code:', error.code);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { testConnection };