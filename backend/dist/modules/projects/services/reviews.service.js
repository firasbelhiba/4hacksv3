"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ReviewsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../../database/prisma.service");
let ReviewsService = ReviewsService_1 = class ReviewsService {
    constructor(prisma, innovationQueue, coherenceQueue, hederaQueue) {
        this.prisma = prisma;
        this.innovationQueue = innovationQueue;
        this.coherenceQueue = coherenceQueue;
        this.hederaQueue = hederaQueue;
        this.logger = new common_1.Logger(ReviewsService_1.name);
    }
    async verifyProjectAccess(projectId, userId) {
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
            throw new common_1.NotFoundException('Project not found or access denied');
        }
        return project;
    }
    async getReviewStatus(projectId, userId) {
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
    async getBatchReviewStatus(projectIds, userId) {
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
    async startInnovationReview(projectId, userId) {
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
    async getInnovationReport(reportId, userId) {
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
            throw new common_1.NotFoundException('Innovation report not found');
        }
        if (report.project.hackathon.createdById !== userId) {
            throw new common_1.NotFoundException('Access denied');
        }
        return report;
    }
    async startCoherenceReview(projectId, userId) {
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
    async getCoherenceReport(reportId, userId) {
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
            throw new common_1.NotFoundException('Coherence report not found');
        }
        if (report.project.hackathon.createdById !== userId) {
            throw new common_1.NotFoundException('Access denied');
        }
        return report;
    }
    async startHederaReview(projectId, userId) {
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
    async getHederaReport(reportId, userId) {
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
            throw new common_1.NotFoundException('Hedera report not found');
        }
        if (report.project.hackathon.createdById !== userId) {
            throw new common_1.NotFoundException('Access denied');
        }
        return report;
    }
    async deleteCoherenceReport(reportId, userId) {
        await this.getCoherenceReport(reportId, userId);
        await this.prisma.coherence_reports.delete({
            where: { id: reportId },
        });
        this.logger.log(`Coherence report deleted: ${reportId}`);
        return { message: 'Report deleted successfully' };
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = ReviewsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('innovation')),
    __param(2, (0, bull_1.InjectQueue)('coherence')),
    __param(3, (0, bull_1.InjectQueue)('hedera')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, Object, Object])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map