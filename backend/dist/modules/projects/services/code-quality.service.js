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
var CodeQualityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeQualityService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../../database/prisma.service");
let CodeQualityService = CodeQualityService_1 = class CodeQualityService {
    constructor(prisma, codeQualityQueue) {
        this.prisma = prisma;
        this.codeQualityQueue = codeQualityQueue;
        this.logger = new common_1.Logger(CodeQualityService_1.name);
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
                    select: { id: true, name: true },
                },
                track: {
                    select: { id: true, name: true },
                },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found or access denied');
        }
        return project;
    }
    async startAnalysis(projectId, userId) {
        const project = await this.verifyProjectAccess(projectId, userId);
        const existingReport = await this.prisma.code_quality_reports.findFirst({
            where: {
                projectId,
                status: {
                    in: ['PENDING', 'IN_PROGRESS'],
                },
            },
        });
        if (existingReport) {
            throw new common_1.ConflictException({
                message: 'Code quality analysis is already in progress for this project',
                reportId: existingReport.id,
                status: existingReport.status,
            });
        }
        const report = await this.prisma.code_quality_reports.create({
            data: {
                projectId,
                repositoryUrl: project.githubUrl,
                status: 'PENDING',
            },
        });
        this.logger.log(`Code quality analysis started for project ${projectId}: report ${report.id}`);
        await this.codeQualityQueue.add({
            reportId: report.id,
            projectId: project.id,
            githubUrl: project.githubUrl,
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
        });
        return {
            reportId: report.id,
            status: report.status,
            message: 'Code quality analysis started',
        };
    }
    async getReport(reportId, userId) {
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
            throw new common_1.NotFoundException('Code quality report not found');
        }
        if (report.project.hackathon.createdById !== userId) {
            throw new common_1.NotFoundException('Access denied');
        }
        return report;
    }
    async getProgress(reportId, userId) {
        const report = await this.getReport(reportId, userId);
        return {
            reportId: report.id,
            status: report.status,
            progress: report.progress || 0,
            currentStage: report.currentStage,
            updatedAt: report.updatedAt,
        };
    }
    async getAllReports(projectId, userId) {
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
    async deleteReport(reportId, projectId, userId) {
        await this.verifyProjectAccess(projectId, userId);
        const report = await this.prisma.code_quality_reports.findUnique({
            where: { id: reportId },
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        if (report.projectId !== projectId) {
            throw new common_1.NotFoundException('Report does not belong to this project');
        }
        await this.prisma.code_quality_reports.delete({
            where: { id: reportId },
        });
        this.logger.log(`Deleted code quality report ${reportId} from project ${projectId}`);
    }
};
exports.CodeQualityService = CodeQualityService;
exports.CodeQualityService = CodeQualityService = CodeQualityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('code-quality')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], CodeQualityService);
//# sourceMappingURL=code-quality.service.js.map