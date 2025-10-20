import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

const prisma = new PrismaClient();

interface CSVProject {
  project_name: string;
  team_name: string;
  description: string;
  github_url: string;
  track_name: string;
  technologies: string;
  team_members: string;
  demo_url: string;
  video_url: string;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function parseTechnologies(techString: string): string[] {
  if (!techString || techString.trim() === '') return [];

  // Split by common delimiters
  return techString
    .split(/[,\/]/)
    .map(t => t.trim())
    .filter(t => t && t !== 'N/A' && t !== 'N/ A');
}

function parseTeamMembers(membersString: string, teamName: string): any[] {
  if (!membersString || membersString.trim() === '') {
    return [{ name: teamName, email: '', role: 'Team Lead' }];
  }

  // Try to parse as JSON first (in case it's already structured)
  try {
    const parsed = JSON.parse(membersString);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // Not JSON, continue with other parsing
  }

  // Split by comma and create team members
  const members = membersString
    .split(',')
    .map(m => m.trim())
    .filter(m => m && m !== 'N/A');

  if (members.length === 0) {
    return [{ name: teamName, email: '', role: 'Team Lead' }];
  }

  return members.map((member, index) => ({
    name: `Member ${member}`,
    email: '',
    role: index === 0 ? 'Team Lead' : 'Team Member'
  }));
}

async function seedProjects() {
  console.log('🌱 Starting project seeding...\n');

  try {
    // 1. Fetch all hackathons
    console.log('📊 Fetching hackathons from database...');
    const hackathons = await prisma.hackathon.findMany({
      include: {
        tracks: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (hackathons.length === 0) {
      console.error('❌ No hackathons found in database!');
      console.log('Please create at least one hackathon first.');
      return;
    }

    console.log(`✅ Found ${hackathons.length} hackathon(s)\n`);

    // 2. Read and parse CSV file
    console.log('📄 Reading CSV file...');
    const csvFilePath = path.join(__dirname, 'projects_complete_with_tracks.csv');
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');

    const records: CSVProject[] = csv.parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`✅ Found ${records.length} projects in CSV\n`);

    // 3. Seed projects for each hackathon
    let totalCreated = 0;
    let totalSkipped = 0;

    for (const hackathon of hackathons) {
      console.log(`\n🎯 Processing hackathon: ${hackathon.name}`);
      console.log(`   Tracks available: ${hackathon.tracks.length}`);

      let createdInHackathon = 0;
      let skippedInHackathon = 0;

      for (const record of records) {
        try {
          // Skip empty or invalid records
          if (!record.project_name || !record.team_name || record.project_name.trim() === '') {
            skippedInHackathon++;
            continue;
          }

          // Find matching track or use first track as default
          let track = hackathon.tracks.find(t =>
            t.name.toLowerCase().includes(record.track_name?.toLowerCase() || '') ||
            record.track_name?.toLowerCase().includes(t.name.toLowerCase())
          );

          if (!track && hackathon.tracks.length > 0) {
            track = hackathon.tracks[0]; // Use first track as fallback
          }

          if (!track) {
            console.warn(`   ⚠️  No track available for project: ${record.project_name}`);
            skippedInHackathon++;
            continue;
          }

          // Generate unique slug
          let slug = slugify(record.project_name);
          let slugSuffix = 0;
          let uniqueSlug = slug;

          while (await prisma.project.findFirst({
            where: {
              hackathonId: hackathon.id,
              slug: uniqueSlug
            }
          })) {
            slugSuffix++;
            uniqueSlug = `${slug}-${slugSuffix}`;
          }

          // Parse technologies and team members
          const technologies = parseTechnologies(record.technologies);
          const teamMembers = parseTeamMembers(record.team_members, record.team_name);

          // Create project
          await prisma.project.create({
            data: {
              name: record.project_name,
              slug: uniqueSlug,
              description: record.description || 'No description provided',
              teamName: record.team_name,
              teamMembers: teamMembers,
              githubUrl: record.github_url || 'https://github.com/placeholder',
              demoUrl: record.demo_url || null,
              videoUrl: record.video_url || null,
              presentationUrl: null,
              technologies: technologies,
              status: 'SUBMITTED',
              hackathonId: hackathon.id,
              trackId: track.id,
              submittedAt: new Date()
            }
          });

          createdInHackathon++;
          totalCreated++;

        } catch (error) {
          console.error(`   ❌ Error creating project "${record.project_name}":`, error.message);
          skippedInHackathon++;
          totalSkipped++;
        }
      }

      console.log(`   ✅ Created ${createdInHackathon} projects`);
      console.log(`   ⚠️  Skipped ${skippedInHackathon} projects`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Seeding Complete!');
    console.log('='.repeat(60));
    console.log(`📊 Total Statistics:`);
    console.log(`   • Hackathons processed: ${hackathons.length}`);
    console.log(`   • Projects created: ${totalCreated}`);
    console.log(`   • Projects skipped: ${totalSkipped}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedProjects()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
