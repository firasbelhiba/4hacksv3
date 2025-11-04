const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

// Generate slug from name
function generateSlug(name, index) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${slug}-${index}`;
}

// Parse CSV manually (simple parser)
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const projects = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (handles basic cases)
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const project = {};
    headers.forEach((header, index) => {
      project[header] = values[index] || '';
    });

    projects.push(project);
  }

  return projects;
}

async function importProjects() {
  try {
    console.log('\n🚀 Starting Project Import...\n');

    // Get the hackathon
    const hackathon = await prisma.hackathons.findUnique({
      where: { slug: 'hedera-africa-hackathon-2025' },
      include: { tracks: true }
    });

    if (!hackathon) {
      console.error('❌ Hackathon not found!');
      return;
    }

    console.log(`✓ Found hackathon: ${hackathon.name}`);
    console.log(`✓ Tracks: ${hackathon.tracks.length}\n`);

    // Create track mapping
    const trackMap = new Map();
    hackathon.tracks.forEach(track => {
      trackMap.set(track.name, track.id);
      // Also map variations
      if (track.name.includes('Onchain Finance')) {
        trackMap.set('Onchain Finance & Real-World Assets (RWA)', track.id);
      }
      if (track.name.includes('DLT for Operations')) {
        trackMap.set('DLT for Operations', track.id);
      }
      if (track.name.includes('Immersive Experience')) {
        trackMap.set('Immersive Experience', track.id);
      }
      if (track.name.includes('AI & DePIN')) {
        trackMap.set('AI & DePIN', track.id);
      }
    });

    // Get admin user
    const adminUser = await prisma.users.findUnique({
      where: { email: 'firasbenhiba49@gmail.com' }
    });

    // Read and parse CSV
    const csvPath = path.join(__dirname, 'projects_complete_with_tracks.csv');
    console.log(`📂 Reading CSV from: ${csvPath}\n`);

    const projectsData = parseCSV(csvPath);
    console.log(`📊 Found ${projectsData.length} projects in CSV\n`);

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const [index, row] of projectsData.entries()) {
      try {
        // Skip if no project name or it's a header-like row
        if (!row.project_name || row.project_name === 'project_name' || row.project_name.length < 2) {
          skipped++;
          continue;
        }

        // Find track
        const trackName = row.track_name?.trim();
        const trackId = trackName ? trackMap.get(trackName) : null;

        if (trackName && !trackId) {
          console.log(`⚠️  Unknown track "${trackName}" for project "${row.project_name}"`);
        }

        // Create project
        const project = await prisma.projects.create({
          data: {
            slug: generateSlug(row.project_name, index),
            name: row.project_name.trim(),
            description: row.description?.trim() || 'No description provided',
            teamName: row.team_name?.trim() || 'Anonymous Team',
            githubUrl: row.github_url?.trim() || 'https://github.com',
            demoUrl: row.demo_url?.trim() || null,
            videoUrl: row.video_url?.trim() || null,
            hackathonId: hackathon.id,
            trackId: trackId || hackathon.tracks[0].id,
            submittedById: adminUser.id,
            status: 'SUBMITTED',
            metadata: {
              technologies: row.technologies?.trim() || null,
              teamMembers: row.team_members?.trim() || null,
              importedFrom: 'CSV',
              importDate: new Date().toISOString()
            }
          }
        });

        imported++;
        if ((imported + skipped) % 50 === 0) {
          console.log(`   Processed ${imported + skipped}/${projectsData.length} projects...`);
        }

      } catch (error) {
        errors.push({
          project: row.project_name,
          error: error.message
        });
        skipped++;
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 Import Complete!');
    console.log('═'.repeat(60));
    console.log(`✅ Successfully imported: ${imported} projects`);
    console.log(`⏭️  Skipped: ${skipped} projects`);

    if (errors.length > 0) {
      console.log(`\n❌ Errors (${errors.length}):`);
      errors.slice(0, 10).forEach(err => {
        console.log(`   - ${err.project}: ${err.error}`);
      });
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`);
      }
    }

    // Show track distribution
    console.log('\n📊 Projects by Track:');
    for (const track of hackathon.tracks) {
      const count = await prisma.projects.count({
        where: {
          hackathonId: hackathon.id,
          trackId: track.id
        }
      });
      console.log(`   ${track.name}: ${count} projects`);
    }

    const noTrack = await prisma.projects.count({
      where: {
        hackathonId: hackathon.id,
        trackId: null
      }
    });
    if (noTrack > 0) {
      console.log(`   No Track Assigned: ${noTrack} projects`);
    }

    console.log('\n✨ All done!\n');

  } catch (error) {
    console.error('\n❌ Error during import:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

importProjects();
