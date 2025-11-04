const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
require('dotenv').config();

const prisma = new PrismaClient();

async function testConnections() {
  console.log('\n🔍 Testing AWS Connections...\n');
  console.log('Configuration:');
  console.log(`- Redis Host: ${process.env.REDIS_HOST}`);
  console.log(`- Redis Port: ${process.env.REDIS_PORT}`);
  console.log(`- Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}\n`);

  let redisConnected = false;
  let postgresConnected = false;

  // Test Redis Connection
  console.log('📡 Testing Redis Connection...');
  try {
    const redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: () => null, // Don't retry on failure
      lazyConnect: true,
    });

    await redis.connect();

    // Test basic operations
    await redis.set('test_key', 'test_value');
    const value = await redis.get('test_key');
    await redis.del('test_key');

    if (value === 'test_value') {
      console.log('✅ Redis connection successful!');
      console.log('   - Read/Write operations working');
      redisConnected = true;
    }

    await redis.quit();
  } catch (error) {
    console.log('❌ Redis connection failed!');
    console.error(`   Error: ${error.message}`);
  }

  console.log('\n📡 Testing PostgreSQL Connection...');
  try {
    // Test connection
    await prisma.$connect();

    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;

    // Get database info
    const dbInfo = await prisma.$queryRaw`
      SELECT
        current_database() as database_name,
        current_user as user_name,
        version() as version
    `;

    console.log('✅ PostgreSQL connection successful!');
    console.log(`   - Database: ${dbInfo[0].database_name}`);
    console.log(`   - User: ${dbInfo[0].user_name}`);
    console.log(`   - Version: ${dbInfo[0].version.split(' ')[0]} ${dbInfo[0].version.split(' ')[1]}`);

    // Count tables
    const tables = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log(`   - Tables in database: ${tables[0].count}`);

    postgresConnected = true;
  } catch (error) {
    console.log('❌ PostgreSQL connection failed!');
    console.error(`   Error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Connection Test Summary');
  console.log('='.repeat(50));
  console.log(`Redis:      ${redisConnected ? '✅ Connected' : '❌ Failed'}`);
  console.log(`PostgreSQL: ${postgresConnected ? '✅ Connected' : '❌ Failed'}`);
  console.log('='.repeat(50) + '\n');

  if (redisConnected && postgresConnected) {
    console.log('🎉 All connections are working! Your backend is ready to go!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some connections failed. Please check the configuration.\n');
    process.exit(1);
  }
}

testConnections();
