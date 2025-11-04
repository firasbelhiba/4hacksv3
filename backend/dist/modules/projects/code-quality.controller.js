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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeQualityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const code_quality_service_1 = require("./services/code-quality.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CodeQualityController = class CodeQualityController {
    constructor(codeQualityService) {
        this.codeQualityService = codeQualityService;
    }
    async getAllReports(projectId, userId) {
        try {
            const data = await this.codeQualityService.getAllReports(projectId, userId);
            return {
                success: true,
                data,
            };
        }
        catch (error) {
            throw error;
        }
    }
    async startAnalysis(projectId, userId) {
        try {
            const data = await this.codeQualityService.startAnalysis(projectId, userId);
            return {
                success: true,
                data,
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getReport(reportId, userId) {
        try {
            const data = await this.codeQualityService.getReport(reportId, userId);
            return {
                success: true,
                data,
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getProgress(reportId, userId) {
        try {
            const data = await this.codeQualityService.getProgress(reportId, userId);
            return {
                success: true,
                data,
            };
        }
        catch (error) {
            throw error;
        }
    }
    async deleteReport(projectId, reportId, userId) {
        try {
            await this.codeQualityService.deleteReport(reportId, projectId, userId);
            return {
                success: true,
                message: 'Report deleted successfully',
            };
        }
        catch (error) {
            throw error;
        }
    }
};
exports.CodeQualityController = CodeQualityController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all code quality reports for a project',
        description: 'Retrieve a list of all code quality analysis reports for the specified project. Returns reports with status, scores, and timestamps. Reports are sorted by creation date (newest first).'
    }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: 'Project ID', example: 'cm2abc123xyz' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Reports retrieved successfully',
        schema: {
            example: {
                success: true,
                data: [
                    {
                        id: 'cm3report123',
                        projectId: 'cm2abc123xyz',
                        repositoryUrl: 'https://github.com/user/repo',
                        status: 'COMPLETED',
                        progress: 100,
                        overallScore: 85,
                        technicalScore: 88,
                        securityScore: 82,
                        documentationScore: 90,
                        performanceScore: 84,
                        richnessScore: 86,
                        createdAt: '2025-10-30T10:00:00.000Z',
                        analysisCompletedAt: '2025-10-30T10:03:00.000Z',
                        project: {
                            id: 'cm2abc123xyz',
                            name: 'DeFi Swap',
                            hackathon: { id: 'hack1', name: 'Web3 Hackathon' },
                            track: { id: 'track1', name: 'DeFi Track' }
                        }
                    }
                ]
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Project not found or access denied' }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CodeQualityController.prototype, "getAllReports", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Start code quality analysis',
        description: 'Initiate a comprehensive AI-powered code quality analysis for the project. The analysis runs in the background and examines code structure, security, documentation, performance, and richness. Returns a report ID to track progress.'
    }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: 'Project ID', example: 'cm2abc123xyz' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Analysis started successfully',
        schema: {
            example: {
                success: true,
                data: {
                    reportId: 'cm3report123',
                    status: 'PENDING',
                    message: 'Code quality analysis started'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request - Invalid GitHub URL or repository not accessible' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Project not found or access denied' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Conflict - Analysis already in progress for this project',
        schema: {
            example: {
                statusCode: 409,
                message: 'Code quality analysis is already in progress for this project',
                reportId: 'cm3report123',
                status: 'IN_PROGRESS'
            }
        }
    }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CodeQualityController.prototype, "startAnalysis", null);
__decorate([
    (0, common_1.Get)(':reportId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get detailed code quality report',
        description: 'Retrieve the complete code quality analysis report with detailed scores, file-by-file analysis, issues found (code smells, bugs, vulnerabilities), recommendations, strengths, and areas for improvement. Only available for completed reports.'
    }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: 'Project ID', example: 'cm2abc123xyz' }),
    (0, swagger_1.ApiParam)({ name: 'reportId', description: 'Report ID', example: 'cm3report123' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Report retrieved successfully',
        schema: {
            example: {
                success: true,
                data: {
                    id: 'cm3report123',
                    projectId: 'cm2abc123xyz',
                    status: 'COMPLETED',
                    progress: 100,
                    overallScore: 85,
                    technicalScore: 88,
                    securityScore: 82,
                    documentationScore: 90,
                    performanceScore: 84,
                    richnessScore: 86,
                    codeSmellsCount: 5,
                    bugsCount: 2,
                    vulnerabilitiesCount: 1,
                    totalLinesAnalyzed: 1200,
                    fileAnalysis: {
                        files: [
                            {
                                filename: 'index.ts',
                                path: 'src/index.ts',
                                language: 'TypeScript',
                                linesOfCode: 150,
                                complexity: 7,
                                qualityScore: 85,
                                richnessScore: 90,
                                issues: {
                                    codeSmells: ['Consider breaking down this function'],
                                    bugs: [],
                                    vulnerabilities: [],
                                    suggestions: ['Add input validation']
                                }
                            }
                        ],
                        summary: {
                            totalFiles: 15,
                            totalLines: 1200,
                            codeSmellsCount: 5,
                            bugsCount: 2,
                            vulnerabilitiesCount: 1
                        }
                    },
                    recommendations: [
                        {
                            priority: 'high',
                            category: 'Security',
                            description: 'Add input validation for user data',
                            impact: 'Prevents potential security vulnerabilities'
                        }
                    ],
                    strengths: ['Well-structured codebase', 'Good test coverage'],
                    improvements: ['Add more documentation', 'Optimize database queries'],
                    createdAt: '2025-10-30T10:00:00.000Z',
                    analysisCompletedAt: '2025-10-30T10:03:00.000Z',
                    analysisTimeMs: 180000
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found or access denied' }),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CodeQualityController.prototype, "getReport", null);
__decorate([
    (0, common_1.Get)(':reportId/progress'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get analysis progress',
        description: 'Track the real-time progress of an ongoing code quality analysis. Returns progress percentage (0-100), current stage, and status. Poll this endpoint every 2-5 seconds during analysis.'
    }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: 'Project ID', example: 'cm2abc123xyz' }),
    (0, swagger_1.ApiParam)({ name: 'reportId', description: 'Report ID', example: 'cm3report123' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Progress retrieved successfully',
        schema: {
            example: {
                success: true,
                data: {
                    reportId: 'cm3report123',
                    status: 'IN_PROGRESS',
                    progress: 50,
                    currentStage: 'Running AI analysis',
                    updatedAt: '2025-10-30T10:01:30.000Z'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found or access denied' }),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CodeQualityController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Delete)(':reportId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete code quality report',
        description: 'Permanently delete a code quality analysis report. This action cannot be undone. Only reports belonging to your projects can be deleted.'
    }),
    (0, swagger_1.ApiParam)({ name: 'projectId', description: 'Project ID', example: 'cm2abc123xyz' }),
    (0, swagger_1.ApiParam)({ name: 'reportId', description: 'Report ID to delete', example: 'cm3report123' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Report deleted successfully',
        schema: {
            example: {
                success: true,
                message: 'Report deleted successfully'
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found or does not belong to this project' }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('reportId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CodeQualityController.prototype, "deleteReport", null);
exports.CodeQualityController = CodeQualityController = __decorate([
    (0, swagger_1.ApiTags)('Code Quality'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('projects/:projectId/code-quality'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [code_quality_service_1.CodeQualityService])
], CodeQualityController);
//# sourceMappingURL=code-quality.controller.js.map