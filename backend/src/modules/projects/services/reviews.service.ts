import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('innovation') private innovationQueue: Queue,
    @InjectQueue('coherence') private coherenceQueue: Queue,
    @InjectQueue('hedera') private hederaQueue: Queue,
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
            eligibilityCriteria: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return project;
  }

  // Get overall review status for a project
  async getReviewStatus(projectId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);

    const [innovationReport, coherenceReport, hederaReport, codeQualityReport] = await Promise.all([
      this.prisma.innovation_reports.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coherence_reports.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.hedera_analysis_reports.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.code_quality_reports.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      codeQuality: codeQualityReport
        ? {
            status: codeQualityReport.status,
            reportId: codeQualityReport.id,
            score: codeQualityReport.overallScore,
          }
        : {
            status: 'not_started',
            reportId: null,
            score: null,
          },
      innovation: innovationReport
        ? {
            status: innovationReport.status,
            reportId: innovationReport.id,
            score: innovationReport.score,
          }
        : {
            status: 'not_started',
            reportId: null,
            score: null,
          },
      coherence: coherenceReport
        ? {
            status: coherenceReport.status,
            reportId: coherenceReport.id,
            score: coherenceReport.score,
          }
        : {
            status: 'not_started',
            reportId: null,
            score: null,
          },
      hedera: hederaReport
        ? {
            status: hederaReport.status,
            reportId: hederaReport.id,
            score: hederaReport.hederaUsageScore || 0,
          }
        : {
            status: 'not_started',
            reportId: null,
            score: null,
          },
    };
  }

  // Get review status for multiple projects in batch
  async getBatchReviewStatus(projectIds: string[], userId: string) {
    // Verify user has access to all projects
    const projects = await this.prisma.projects.findMany({
      where: {
        id: { in: projectIds },
        hackathon: {
          createdById: userId,
        },
      },
      select: { id: true },
    });

    const accessibleProjectIds = projects.map(p => p.id);

    // Fetch all reports in parallel
    const [innovationReports, coherenceReports, hederaReports, codeQualityReports] = await Promise.all([
      this.prisma.innovation_reports.findMany({
        where: { projectId: { in: accessibleProjectIds } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          projectId: true,
          status: true,
          score: true,
        },
      }),
      this.prisma.coherence_reports.findMany({
        where: { projectId: { in: accessibleProjectIds } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          projectId: true,
          status: true,
          score: true,
        },
      }),
      this.prisma.hedera_analysis_reports.findMany({
        where: { projectId: { in: accessibleProjectIds } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          projectId: true,
          status: true,
          hederaUsageScore: true,
        },
      }),
      this.prisma.code_quality_reports.findMany({
        where: { projectId: { in: accessibleProjectIds } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          projectId: true,
          status: true,
          overallScore: true,
        },
      }),
    ]);

    // Group reports by projectId (take most recent for each type)
    const result = {};

    for (const projectId of accessibleProjectIds) {
      const innovationReport = innovationReports.find(r => r.projectId === projectId);
      const coherenceReport = coherenceReports.find(r => r.projectId === projectId);
      const hederaReport = hederaReports.find(r => r.projectId === projectId);
      const codeQualityReport = codeQualityReports.find(r => r.projectId === projectId);

      result[projectId] = {
        codeQuality: codeQualityReport
          ? {
              status: codeQualityReport.status,
              reportId: codeQualityReport.id,
              score: codeQualityReport.overallScore,
            }
          : {
              status: 'not_started',
              reportId: null,
              score: null,
            },
        innovation: innovationReport
          ? {
              status: innovationReport.status,
              reportId: innovationReport.id,
              score: innovationReport.score,
            }
          : {
              status: 'not_started',
              reportId: null,
              score: null,
            },
        coherence: coherenceReport
          ? {
              status: coherenceReport.status,
              reportId: coherenceReport.id,
              score: coherenceReport.score,
            }
          : {
              status: 'not_started',
              reportId: null,
              score: null,
            },
        hedera: hederaReport
          ? {
              status: hederaReport.status,
              reportId: hederaReport.id,
              score: hederaReport.hederaUsageScore || 0,
            }
          : {
              status: 'not_started',
              reportId: null,
              score: null,
            },
      };
    }

    return result;
  }

  // Innovation Review
  async startInnovationReview(projectId: string, userId: string) {
    const project = await this.verifyProjectAccess(projectId, userId);

    const existingReport = await this.prisma.innovation_reports.findFirst({
      where: {
        projectId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (existingReport) {
      return {
        reportId: existingReport.id,
        status: existingReport.status,
        message: 'Innovation review is already in progress',
      };
    }

    const report = await this.prisma.innovation_reports.create({
      data: {
        projectId,
        status: 'PENDING',
        score: 0,
        summary: '',
        noveltyScore: 0,
        creativityScore: 0,
        technicalInnovation: 0,
        marketInnovation: 0,
        implementationInnovation: 0,
        similarProjects: {},
        uniqueAspects: {},
        innovationEvidence: {},
        potentialImpact: '',
        patentPotential: false,
        suggestions: {},
        agentModel: 'pending',
        processingTime: 0,
      },
    });

    // Queue the analysis job
    await this.innovationQueue.add({
      reportId: report.id,
      projectId,
      githubUrl: project.githubUrl,
    });

    this.logger.log(`Innovation review queued for project ${projectId}`);

    return {
      reportId: report.id,
      status: report.status,
      message: 'Innovation review started',
    };
  }

  async getInnovationReport(reportId: string, userId: string) {
    const report = await this.prisma.innovation_reports.findUnique({
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
      throw new NotFoundException('Innovation report not found');
    }

    if (report.project.hackathon.createdById !== userId) {
      throw new NotFoundException('Access denied');
    }

    return report;
  }

  // Coherence Review
  async startCoherenceReview(projectId: string, userId: string) {
    const project = await this.verifyProjectAccess(projectId, userId);

    const existingReport = await this.prisma.coherence_reports.findFirst({
      where: {
        projectId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (existingReport) {
      return {
        reportId: existingReport.id,
        status: existingReport.status,
        message: 'Coherence review is already in progress',
      };
    }

    // Get track information for coherence analysis
    const projectWithTrack = await this.prisma.projects.findUnique({
      where: { id: projectId },
      include: {
        track: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    });

    const report = await this.prisma.coherence_reports.create({
      data: {
        projectId,
        status: 'PENDING',
        score: 0,
        summary: '',
        trackAlignment: 0,
        readmeExists: false,
        readmeQuality: 0,
        projectPurpose: '',
        trackJustification: '',
        inconsistencies: {},
        suggestions: {},
        evidence: {},
        agentModel: 'pending',
        processingTime: 0,
      },
    });

    // Queue the coherence analysis job
    await this.coherenceQueue.add({
      reportId: report.id,
      projectId,
      githubUrl: project.githubUrl,
      trackName: projectWithTrack.track.name,
      trackDescription: projectWithTrack.track.description,
    });

    this.logger.log(`Coherence review queued for project ${projectId}`);

    return {
      reportId: report.id,
      status: report.status,
      message: 'Coherence review started',
    };
  }

  async getCoherenceReport(reportId: string, userId: string) {
    const report = await this.prisma.coherence_reports.findUnique({
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
      throw new NotFoundException('Coherence report not found');
    }

    if (report.project.hackathon.createdById !== userId) {
      throw new NotFoundException('Access denied');
    }

    return report;
  }

  // Hedera Review
  async startHederaReview(projectId: string, userId: string) {
    const project = await this.verifyProjectAccess(projectId, userId);

    const existingReport = await this.prisma.hedera_analysis_reports.findFirst({
      where: {
        projectId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (existingReport) {
      return {
        reportId: existingReport.id,
        status: existingReport.status,
        message: 'Hedera review is already in progress',
      };
    }

    const report = await this.prisma.hedera_analysis_reports.create({
      data: {
        projectId,
        repositoryUrl: project.githubUrl,
        status: 'PENDING',
      },
    });

    // Queue the Hedera analysis job
    await this.hederaQueue.add({
      reportId: report.id,
      projectId,
      githubUrl: project.githubUrl,
    });

    this.logger.log(`Hedera review queued for project ${projectId}`);

    return {
      reportId: report.id,
      status: report.status,
      message: 'Hedera review started',
    };
  }

  async getHederaReport(reportId: string, userId: string) {
    const report = await this.prisma.hedera_analysis_reports.findUnique({
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
      throw new NotFoundException('Hedera report not found');
    }

    if (report.project.hackathon.createdById !== userId) {
      throw new NotFoundException('Access denied');
    }

    return report;
  }

  // Delete coherence report (cleanup)
  async deleteCoherenceReport(reportId: string, userId: string) {
    await this.getCoherenceReport(reportId, userId);

    await this.prisma.coherence_reports.delete({
      where: { id: reportId },
    });

    this.logger.log(`Coherence report deleted: ${reportId}`);

    return { message: 'Report deleted successfully' };
  }
}
