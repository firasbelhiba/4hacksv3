import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { githubService } from '@/lib/services/github-service';

// POST /api/projects/[id]/eligibility-check - Run eligibility check on a project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = params.id;
    const body = await request.json();
    const criteria = body.criteria || {
      repositoryAccess: true,
      repositoryPublic: false,
      submissionDeadline: false
    };

    // Get project with hackathon access check
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: session.user.id,
        },
      },
      include: {
        hackathon: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        track: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Run eligibility checks
    let eligible = true;
    let reason = '';
    let evidence: any = {};

    // Check submission deadline
    if (criteria.submissionDeadline && eligible) {
      evidence.submittedAt = project.submittedAt;
      if (!project.submittedAt) {
        eligible = false;
        reason = 'Project was not properly submitted';
      }
    }

    // Check repository accessibility and visibility
    if ((criteria.repositoryAccess || criteria.repositoryPublic) && eligible) {
      evidence.githubUrl = project.githubUrl;

      if (!project.githubUrl || !project.githubUrl.trim()) {
        eligible = false;
        reason = 'No GitHub repository URL provided';
      } else {
        try {
          // Parse GitHub URL
          const repoInfo = githubService.parseGitHubUrl(project.githubUrl);

          // Check repository accessibility
          const accessibilityCheck = await githubService.checkRepositoryAccessibility(
            repoInfo.owner,
            repoInfo.repo
          );

          evidence.repositoryAccessibility = {
            accessible: accessibilityCheck.accessible,
            isPublic: accessibilityCheck.isPublic,
            error: accessibilityCheck.error,
            metadata: accessibilityCheck.metadata,
            checkedAt: new Date().toISOString(),
          };

          // Check repository access requirement
          if (criteria.repositoryAccess && !accessibilityCheck.accessible) {
            eligible = false;
            reason = `Repository not accessible: ${accessibilityCheck.error}`;
          }

          // Check repository public requirement
          if (criteria.repositoryPublic && eligible && !accessibilityCheck.isPublic) {
            eligible = false;
            reason = accessibilityCheck.error
              ? `Repository accessibility issue: ${accessibilityCheck.error}`
              : 'Repository must be public but appears to be private';
          }

        } catch (error) {
          eligible = false;
          reason = `Invalid GitHub repository URL: ${error instanceof Error ? error.message : 'Unknown error'}`;
          evidence.repositoryError = error instanceof Error ? error.message : 'Unknown error';
        }
      }
    }

    // Save eligibility report to database
    const processingTime = Date.now() - Date.now(); // Will be updated below
    const startTime = Date.now();

    const eligibilityReport = await prisma.eligibilityReport.create({
      data: {
        projectId: project.id,
        repositoryUrl: project.githubUrl || '',
        status: 'COMPLETED',
        eligible,
        overallScore: eligible ? 100 : 0,
        reason: eligible ? 'Project meets all eligibility criteria' : reason,
        evidence,
        criteria,
        repositoryStatus: evidence.repositoryAccessibility ?
          `${evidence.repositoryAccessibility.accessible ? 'Accessible' : 'Not Accessible'} - ${evidence.repositoryAccessibility.isPublic ? 'Public' : 'Private'}` :
          'Not Checked',
        accessibilityCheck: evidence.repositoryAccessibility || {},
        processingTime: Date.now() - startTime,
        agentModel: 'eligibility-check-system'
      }
    });

    // Prepare result
    const result = {
      projectId: project.id,
      projectName: project.name,
      reportId: eligibilityReport.id,
      eligible,
      reason: eligible ? 'Project meets all eligibility criteria' : reason,
      repositoryStatus: evidence.repositoryAccessibility ?
        `${evidence.repositoryAccessibility.accessible ? 'Accessible' : 'Not Accessible'} - ${evidence.repositoryAccessibility.isPublic ? 'Public' : 'Private'}` :
        'Not Checked',
      evidence,
      checkedAt: new Date().toISOString(),
      criteria: criteria,
      overallScore: eligible ? 100 : 0
    };

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error('Error running eligibility check:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}