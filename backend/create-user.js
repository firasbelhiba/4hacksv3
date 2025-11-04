const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function createUser() {
  try {
    const email = 'firasbenhiba49@gmail.com';
    const password = 'Azerty12345';
    const name = 'Firas Ben Hiba';

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('\n⚠️  User already exists with this email!');
      console.log(`Email: ${existingUser.email}`);
      console.log(`Name: ${existingUser.name}`);
      console.log(`Role: ${existingUser.role}`);
      console.log(`Created: ${existingUser.createdAt}\n`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.users.create({
      data: {
        email: email,
        password: hashedPassword,
        name: name,
        role: 'ADMIN', // Making you an admin
      }
    });

    console.log('\n✅ User created successfully!\n');
    console.log('Login credentials:');
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`ID: ${user.id}\n`);

  } catch (error) {
    console.error('\n❌ Error creating user:');
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
