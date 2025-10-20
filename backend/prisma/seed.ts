import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Create a super admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@4hacks.com' },
      update: {},
      create: {
        email: 'admin@4hacks.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      },
    });

    console.log('✅ Created admin user:', admin.email);

    // Create a sample hackathon
    const hackathon = await prisma.hackathon.upsert({
      where: { slug: 'demo-hackathon-2024' },
      update: {},
      create: {
        name: 'Demo Hackathon 2024',
        slug: 'demo-hackathon-2024',
        description: 'A demo hackathon to showcase the 4hacks platform capabilities.',
        startDate: new Date('2024-12-01T10:00:00Z'),
        endDate: new Date('2024-12-03T18:00:00Z'),
        prizePool: '$50,000',
        organizationName: '4hacks Demo Organization',
        createdById: admin.id,
        settings: {
          registrationOpen: true,
          maxTeamSize: 5,
          allowIndividualParticipation: true,
        },
      },
    });

    console.log('✅ Created hackathon:', hackathon.name);

    // Create tracks for the hackathon
    const tracks = await Promise.all([
      prisma.track.upsert({
        where: { id: 'demo-track-1' },
        update: {},
        create: {
          id: 'demo-track-1',
          name: 'AI & Machine Learning',
          description: 'Build innovative solutions using artificial intelligence and machine learning technologies.',
          prize: '$20,000',
          order: 1,
          hackathonId: hackathon.id,
          eligibilityCriteria: {
            requirements: ['Use of AI/ML technologies', 'Working prototype'],
            restrictions: ['No pre-existing codebases'],
          },
        },
      }),
      prisma.track.upsert({
        where: { id: 'demo-track-2' },
        update: {},
        create: {
          id: 'demo-track-2',
          name: 'Web Development',
          description: 'Create amazing web applications and platforms.',
          prize: '$15,000',
          order: 2,
          hackathonId: hackathon.id,
        },
      }),
      prisma.track.upsert({
        where: { id: 'demo-track-3' },
        update: {},
        create: {
          id: 'demo-track-3',
          name: 'Mobile Apps',
          description: 'Develop mobile applications for iOS, Android, or cross-platform.',
          prize: '$15,000',
          order: 3,
          hackathonId: hackathon.id,
        },
      }),
    ]);

    console.log('✅ Created tracks:', tracks.map(t => t.name).join(', '));

    // Create evaluation criteria
    const criteria = await Promise.all([
      prisma.evaluationCriterion.create({
        data: {
          name: 'Technical Implementation',
          description: 'Quality of code, architecture, and technical execution',
          weight: 30,
          category: 'Technical',
          order: 1,
          hackathonId: hackathon.id,
        },
      }),
      prisma.evaluationCriterion.create({
        data: {
          name: 'Innovation',
          description: 'Originality and creativity of the solution',
          weight: 25,
          category: 'Creativity',
          order: 2,
          hackathonId: hackathon.id,
        },
      }),
      prisma.evaluationCriterion.create({
        data: {
          name: 'Business Impact',
          description: 'Potential business value and market impact',
          weight: 25,
          category: 'Business',
          order: 3,
          hackathonId: hackathon.id,
        },
      }),
      prisma.evaluationCriterion.create({
        data: {
          name: 'Presentation',
          description: 'Quality of presentation and demonstration',
          weight: 20,
          category: 'Communication',
          order: 4,
          hackathonId: hackathon.id,
        },
      }),
    ]);

    console.log('✅ Created evaluation criteria:', criteria.map(c => c.name).join(', '));

    // Create a sample project
    const project = await prisma.project.create({
      data: {
        name: 'AI Code Assistant',
        slug: 'ai-code-assistant',
        description: 'An intelligent code assistant that helps developers write better code using AI.',
        teamName: 'Code Wizards',
        teamMembers: [
          {
            id: 'member-1',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            role: 'Team Lead',
          },
          {
            id: 'member-2',
            name: 'Bob Smith',
            email: 'bob@example.com',
            role: 'Developer',
          },
          {
            id: 'member-3',
            name: 'Carol Brown',
            email: 'carol@example.com',
            role: 'Designer',
          },
        ],
        githubUrl: 'https://github.com/demo/ai-code-assistant',
        demoUrl: 'https://demo.ai-code-assistant.com',
        videoUrl: 'https://youtube.com/watch?v=demo',
        technologies: ['TypeScript', 'React', 'OpenAI API', 'Node.js', 'PostgreSQL'],
        status: 'SUBMITTED',
        hackathonId: hackathon.id,
        trackId: tracks[0].id, // AI & ML track
        submittedAt: new Date(),
      },
    });

    console.log('✅ Created sample project:', project.name);

    // Create sample evaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        projectId: project.id,
        technicalScore: 85,
        innovationScore: 90,
        businessScore: 80,
        documentationScore: 75,
        presentationScore: 85,
        plagiarismScore: 95,
        overallScore: 85.5,
        status: 'COMPLETED',
        feedback: {
          summary: 'Excellent AI-powered solution with strong technical implementation.',
          technical: 'Well-structured code with good architecture patterns.',
          innovation: 'Highly innovative use of AI for code assistance.',
          business: 'Strong potential for commercial application.',
          presentation: 'Clear and engaging demonstration.',
        },
        strengths: [
          'Strong technical implementation',
          'Innovative AI integration',
          'Good user experience design',
          'Comprehensive documentation',
        ],
        improvements: [
          'Could improve error handling',
          'Add more test coverage',
          'Consider scalability optimizations',
        ],
        evaluationDetails: {
          aiModel: 'gpt-4',
          evaluationVersion: '1.0',
          evaluatedBy: 'AI Evaluation System',
        },
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        completedAt: new Date(),
        evaluationTime: 45, // 45 seconds
        aiModel: 'gpt-4',
        aiCost: 0.15,
      },
    });

    console.log('✅ Created sample evaluation for project:', project.name);

    // Create an API key for the admin
    const apiKey = await prisma.apiKey.create({
      data: {
        key: 'demo_' + Math.random().toString(36).substring(2, 15),
        name: 'Demo API Key',
        userId: admin.id,
        permissions: ['read:hackathons', 'read:projects', 'write:evaluations'],
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    console.log('✅ Created API key:', apiKey.name);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`\n📋 Summary:`);
    console.log(`- Admin user: ${admin.email} (password: admin123)`);
    console.log(`- Hackathon: ${hackathon.name}`);
    console.log(`- Tracks: ${tracks.length}`);
    console.log(`- Evaluation criteria: ${criteria.length}`);
    console.log(`- Sample project: ${project.name}`);
    console.log(`- Sample evaluation: ${evaluation.overallScore}/100`);
    console.log(`- API key: ${apiKey.key}`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });