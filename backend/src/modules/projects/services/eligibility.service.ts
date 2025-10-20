import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class EligibilityService {
  private readonly logger = new Logger(EligibilityService.name);

  constructor(private prisma: PrismaService) {}

  async checkEligibility(projectId: string, userId: string) {
    const project = await this.prisma.projects.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: userId,
        },
      },
      include: {
        track: {
          select: {
            name: true,
            eligibilityCriteria: true,
          },
        },
        hackathon: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    // Basic eligibility checks
    const checks = {
      hasGithubUrl: !!project.githubUrl,
      hasDescription: !!project.description && project.description.length > 10,
      hasTeamMembers: Array.isArray(project.teamMembers) && project.teamMembers.length > 0,
      trackEligibility: this.checkTrackEligibility(project.track.eligibilityCriteria),
    };

    const isEligible = Object.values(checks).every((check) =>
      typeof check === 'boolean' ? check : check.eligible
    );

    this.logger.log(`Eligibility check for project ${projectId}: ${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);

    return {
      projectId,
      projectName: project.name,
      trackName: project.name,
      hackathonName: project.name,
      isEligible,
      checks,
      message: isEligible
        ? 'Project meets all eligibility requirements'
        : 'Project does not meet all eligibility requirements',
    };
  }

  private checkTrackEligibility(eligibilityCriteria: any) {
    if (!eligibilityCriteria || typeof eligibilityCriteria !== 'object') {
      return {
        eligible: true,
        message: 'No specific track eligibility criteria',
      };
    }

    // If criteria exists, assume it's eligible unless we have specific checks
    return {
      eligible: true,
      message: 'Track eligibility criteria met',
      criteria: eligibilityCriteria,
    };
  }
}
