const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createHederaHackathon() {
  try {
    console.log('\n🚀 Creating Hedera Africa Hackathon 2025...\n');

    // First, check if user exists or get the first admin user
    const adminUser = await prisma.users.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }

    console.log('✅ Found admin user:', adminUser.email);

    // Check if hackathon already exists
    const existingHackathon = await prisma.hackathons.findUnique({
      where: { slug: 'hedera-africa-hackathon-2025' }
    });

    if (existingHackathon) {
      console.log('⚠️  Hackathon already exists with this slug.');
      console.log('   ID:', existingHackathon.id);
      console.log('   Name:', existingHackathon.name);
      return;
    }

    // Create the hackathon with tracks
    const hackathon = await prisma.hackathons.create({
      data: {
        name: "Hedera Africa Hackathon 2025",
        slug: "hedera-africa-hackathon-2025",
        description: "The Hedera Africa Hackathon 2025 is a continent-wide innovation program co-organized by Exponential Science and The Hashgraph Association. Designed to mobilize Africa's growing tech talent, the hackathon invites developers, students, startups, and innovators from around the globe to build impactful decentralized applications (dApps) on the Hedera network. With $1 million in prizes, the hackathon aims to engage 10,000+ participants across 20+ African cities and online, driving real-world adoption of Web3 technologies.",
        startDate: new Date("2025-08-01T00:00:00Z"),
        endDate: new Date("2025-10-31T23:59:59Z"),
        prizePool: "$1,000,000",
        organizationName: "Exponential Science & The Hashgraph Association",
        bannerImage: "https://cdn.dorahacks.io/static/files/19874cef5ee249b36d160f4410ba5932.png",
        createdById: adminUser.id,
        settings: {
          timeline: {
            preparation: {
              start: "2025-06-01",
              end: "2025-07-31",
              activities: [
                "Onboarding",
                "Training & educational sessions",
                "Community engagement activities"
              ]
            },
            hacking: {
              start: "2025-08-01",
              end: "2025-10-31",
              activities: [
                "Project development",
                "Mentor support",
                "20+ On site hacking stations in 20+ african cities"
              ]
            },
            evaluation: {
              date: "2025-11-03",
              activities: [
                "Judging and winner announcements during the closing ceremony"
              ]
            }
          },
          eligibility: [
            "Developers",
            "Students",
            "Startups",
            "Innovators across Africa and the world"
          ],
          targetParticipants: "10,000+",
          cities: "20+ African cities",
          crossTrackPrizes: {
            champions: {
              totalPrize: "$300,000",
              description: "These prizes are for the absolute best-of-the-best projects, selected based on innovation, execution, and potential impact.",
              prizes: [
                { place: "1st", amount: "$100,000" },
                { place: "2nd", amount: "$70,000" },
                { place: "3rd", amount: "$60,000" },
                { place: "4th", amount: "$40,000" },
                { place: "5th", amount: "$30,000" }
              ]
            },
            exceptional: {
              totalPrize: "$60,000",
              description: "A special $60,000 prize reserved for a team that demonstrates truly exceptional and groundbreaking work that pushes the boundaries of what's possible."
            }
          }
        },
        tracks: {
          create: [
            {
              name: "Onchain Finance & RWA",
              description: "This track is about creating better financial tools using Hedera DLT. Participants can build apps for lending, borrowing, or sending fiat & crypto, especially for people who don't have access to banks. They can also tokenize real world assets like houses, farms or rare material, so people can invest in them more easily. The goal is to make finance more open and fair for everyone in Africa.",
              prize: "$160,000",
              order: 1,
              eligibilityCriteria: {
                focus: [
                  "DeFi applications",
                  "Lending/Borrowing platforms",
                  "Fiat & crypto transfers",
                  "Asset tokenization (houses, farms, rare materials)",
                  "Financial inclusion"
                ],
                prizes: [
                  { place: "1st", amount: "$50,000" },
                  { place: "2nd", amount: "$35,000" },
                  { place: "3rd", amount: "$30,000" },
                  { place: "4th", amount: "$25,000" },
                  { place: "5th", amount: "$20,000" }
                ]
              }
            },
            {
              name: "DLT for Operations",
              description: "This track focuses on using Hedera DLT to improve how things work in areas like healthcare, farming, and supply chains. For example, it can help keep patient records safe, track where food comes from, or make sure farmers get paid on time. It also supports eco-friendly ideas. The aim is to make these systems more transparent, secure, and efficient.",
              prize: "$160,000",
              order: 2,
              eligibilityCriteria: {
                focus: [
                  "Healthcare record management",
                  "Agricultural tracking",
                  "Supply chain transparency",
                  "Payment systems for farmers",
                  "Eco-friendly solutions",
                  "Operational efficiency"
                ],
                prizes: [
                  { place: "1st", amount: "$50,000" },
                  { place: "2nd", amount: "$35,000" },
                  { place: "3rd", amount: "$30,000" },
                  { place: "4th", amount: "$25,000" },
                  { place: "5th", amount: "$20,000" }
                ]
              }
            },
            {
              name: "Immersive Experience",
              description: "This track is for people who want to build fun and creative digital experiences. Developers can make games where players earn rewards, create virtual worlds, or design digital collectibles using NFTs. It's also a space for community-driven tokens and online economies. The goal is to give users more control and ownership of their digital content.",
              prize: "$160,000",
              order: 3,
              eligibilityCriteria: {
                focus: [
                  "Play-to-earn games",
                  "Virtual worlds/Metaverse",
                  "NFT digital collectibles",
                  "Community-driven tokens",
                  "Online economies",
                  "User ownership of digital content"
                ],
                prizes: [
                  { place: "1st", amount: "$50,000" },
                  { place: "2nd", amount: "$35,000" },
                  { place: "3rd", amount: "$30,000" },
                  { place: "4th", amount: "$25,000" },
                  { place: "5th", amount: "$20,000" }
                ]
              }
            },
            {
              name: "AI & DePIN",
              description: "This track combines artificial intelligence with decentralized systems. Participants can build smart apps that learn and improve over time, or create systems for things like energy, transport, or internet services that don't rely on a central authority. The focus is on building smart, community-powered solutions that solve real-world problems.",
              prize: "$160,000",
              order: 4,
              eligibilityCriteria: {
                focus: [
                  "AI-powered applications",
                  "Machine learning solutions",
                  "Decentralized Physical Infrastructure (DePIN)",
                  "Energy systems",
                  "Transport systems",
                  "Internet services",
                  "Community-powered infrastructure"
                ],
                prizes: [
                  { place: "1st", amount: "$50,000" },
                  { place: "2nd", amount: "$35,000" },
                  { place: "3rd", amount: "$30,000" },
                  { place: "4th", amount: "$25,000" },
                  { place: "5th", amount: "$20,000" }
                ]
              }
            }
          ]
        }
      },
      include: {
        tracks: true
      }
    });

    console.log('✅ Successfully created hackathon!');
    console.log('\n📋 Hackathon Details:');
    console.log('   ID:', hackathon.id);
    console.log('   Name:', hackathon.name);
    console.log('   Slug:', hackathon.slug);
    console.log('   Prize Pool:', hackathon.prizePool);
    console.log('   Start Date:', hackathon.startDate.toISOString());
    console.log('   End Date:', hackathon.endDate.toISOString());
    console.log('   Banner:', hackathon.bannerImage);
    console.log('\n🎯 Tracks Created:');
    hackathon.tracks.forEach((track, index) => {
      console.log(`   ${index + 1}. ${track.name} - ${track.prize}`);
    });
    console.log('\n🎉 Hackathon setup complete!\n');

  } catch (error) {
    console.error('❌ Error creating hackathon:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createHederaHackathon();
