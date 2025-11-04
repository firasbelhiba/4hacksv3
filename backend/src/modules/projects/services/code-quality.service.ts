import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class CodeQualityService {
  private readonly logger = new Logger(CodeQualityService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('code-quality') private codeQualityQueue: Queue,
  ) {}

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

    // Queue the background analysis job
    await this.codeQualityQueue.add(
      {
        reportId: report.id,
        projectId: project.id,
        githubUrl: project.githubUrl,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      }
    );

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

  async getAllReports(projectId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);

    const reports = await this.prisma.code_quality_reports.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
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

    this.logger.log(`Retrieved ${reports.length} reports for project ${projectId}`);

    return reports;
  }

  async deleteReport(reportId: string, projectId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);

    const report = await this.prisma.code_quality_reports.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.projectId !== projectId) {
      throw new NotFoundException('Report does not belong to this project');
    }

    await this.prisma.code_quality_reports.delete({
      where: { id: reportId },
    });

    this.logger.log(`Deleted code quality report ${reportId} from project ${projectId}`);
  }
}
