import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class CodeQualityService {
  private readonly logger = new Logger(CodeQualityService.name);

  constructor(private prisma: PrismaService) {}

  private async verifyProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.projects.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: userId,
        },
      },
      include: {
        hackathon: {
          select: { id: true, name: true },
        },
        track: {
          select: { id: true, name: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return project;
  }

  async startAnalysis(projectId: string, userId: string) {
    const project = await this.verifyProjectAccess(projectId, userId);

    // Check if there's already a pending or in-progress analysis
    const existingReport = await this.prisma.code_quality_reports.findFirst({
      where: {
        projectId,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
    });

    if (existingReport) {
      throw new ConflictException({
        message: 'Code quality analysis is already in progress for this project',
        reportId: existingReport.id,
        status: existingReport.status,
      });
    }

    // Create new code quality report
    const report = await this.prisma.code_quality_reports.create({
      data: {
        projectId,
        repositoryUrl: project.githubUrl,
        status: 'PENDING',
      },
    });

    this.logger.log(`Code quality analysis started for project ${projectId}: report ${report.id}`);

    // Note: Actual background analysis would be triggered here
    // For now, we just return the report

    return {
      reportId: report.id,
      status: report.status,
      message: 'Code quality analysis started',
    };
  }

  async getReport(reportId: string, userId: string) {
    const report = await this.prisma.code_quality_reports.findUnique({
      where: { id: reportId },
      include: {
        project: {
          include: {
            hackathon: {
              select: {
                id: true,
                name: true,
                createdById: true,
              },
            },
            track: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Code quality report not found');
    }

    // Verify access
    if (report.project.hackathon.createdById !== userId) {
      throw new NotFoundException('Access denied');
    }

    return report;
  }

  async getProgress(reportId: string, userId: string) {
    const report = await this.getReport(reportId, userId);

    return {
      reportId: report.id,
      status: report.status,
      progress: report.progress || 0,
      currentStage: report.currentStage,
      updatedAt: report.updatedAt,
    };
  }
}
