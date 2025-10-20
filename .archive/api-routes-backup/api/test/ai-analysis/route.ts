import { NextRequest, NextResponse } from 'next/server';
import { codeQualityService } from '@/lib/services/code-quality-service';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Starting test AI analysis...');

    // Find or create project for testing
    let project = await prisma.project.findFirst({
      include: {
        hackathon: true,
        track: true
      }
    });

    if (!project) {
      // Create minimal test data
      const user = await prisma.user.findFirst() || await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMIN',
        }
      });

      const hackathon = await prisma.hackathon.create({
        data: {
          name: 'Test Hackathon',
          slug: `test-hackathon-${Date.now()}`,
          description: 'Test hackathon for AI analysis',
          startDate: new Date(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          organizationName: 'Test Org',
          createdById: user.id,
          tracks: {
            create: {
              name: 'Test Track',
              description: 'Test track for AI analysis',
            }
          }
        },
        include: {
          tracks: true
        }
      });

      project = await prisma.project.create({
        data: {
          name: 'Test Project',
          slug: `test-project-${Date.now()}`,
          description: 'Test project for AI analysis',
          teamName: 'Test Team',
          githubUrl: 'https://github.com/firascodes/test-repo',
          hackathonId: hackathon.id,
          trackId: hackathon.tracks[0].id,
        }
      });
    }

    console.log('✅ Created test project:', project.id);

    // Create a code quality report first
    const report = await prisma.codeQualityReport.create({
      data: {
        projectId: project.id,
        repositoryUrl: project.githubUrl,
        status: 'IN_PROGRESS',
      }
    });

    console.log('✅ Created report:', report.id);

    // Start the analysis
    const analysisResult = await codeQualityService.analyzeRepository(report.id, project.githubUrl);

    console.log('✅ Analysis completed with result:', analysisResult);

    return NextResponse.json({
      success: true,
      data: {
        projectId: project.id,
        reportId: report.id,
        analysisResult,
        message: 'Test analysis completed successfully'
      }
    });

  } catch (error) {
    console.error('❌ Test analysis failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}