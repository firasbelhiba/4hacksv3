const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

function generateSlug(name, index) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${slug}-${index}`;
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const projects = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let current = '';
    let inQuotes = false;

    for (let char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else current += char;
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

    const trackMap = new Map([
      ['Onchain Finance & Real-World Assets (RWA)', hackathon.tracks.find(t => t.name.includes('Onchain'))?.id],
      ['DLT for Operations', hackathon.tracks.find(t => t.name.includes('DLT'))?.id],
      ['Immersive Experience', hackathon.tracks.find(t => t.name.includes('Immersive'))?.id],
      ['AI & DePIN', hackathon.tracks.find(t => t.name.includes('AI'))?.id],
    ]);

    const csvPath = path.join(__dirname, 'seed/projects_complete_with_tracks.csv');
    const projectsData = parseCSV(csvPath);
    console.log(`📊 Found ${projectsData.length} projects in CSV\n`);

    let imported = 0, skipped = 0;

    for (const [index, row] of projectsData.entries()) {
      try {
        if (!row.project_name || row.project_name.length < 2) {
          skipped++;
          continue;
        }

        const trackId = trackMap.get(row.track_name?.trim()) || hackathon.tracks[0].id;

        await prisma.projects.create({
          data: {
            name: row.project_name.trim(),
            slug: generateSlug(row.project_name, index),
            description: row.description?.trim() || 'No description provided',
            teamName: row.team_name?.trim() || 'Anonymous Team',
            githubUrl: row.github_url?.trim() || 'https://github.com',
            demoUrl: row.demo_url?.trim() || null,
            videoUrl: row.video_url?.trim() || null,
            hackathonId: hackathon.id,
            trackId: trackId,
            technologies: row.technologies?.trim() ? [row.technologies.trim()] : [],
            teamMembers: []
          }
        });

        imported++;
        if (imported % 100 === 0) console.log(`   ✓ Imported ${imported} projects...`);

      } catch (error) {
        if (imported === 0) {
          console.error('First error:', error.message);
        }
        skipped++;
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 Import Complete!');
    console.log('═'.repeat(60));
    console.log(`✅ Successfully imported: ${imported} projects`);
    console.log(`⏭️  Skipped: ${skipped} projects\n`);

    for (const track of hackathon.tracks) {
      const count = await prisma.projects.count({
        where: { hackathonId: hackathon.id, trackId: track.id }
      });
      console.log(`   ${track.name}: ${count} projects`);
    }

    console.log('\n✨ All done!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

importProjects();
