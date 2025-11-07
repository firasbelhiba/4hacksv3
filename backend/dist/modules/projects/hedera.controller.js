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
var HederaController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HederaController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const hedera_service_1 = require("./services/hedera.service");
const prisma_service_1 = require("../../database/prisma.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
class AnalyzeBatchDto {
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AnalyzeBatchDto.prototype, "projectIds", void 0);
let HederaController = HederaController_1 = class HederaController {
    constructor(hederaService, prisma) {
        this.hederaService = hederaService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(HederaController_1.name);
    }
    async analyzeBatch(hackathonId, userId, dto) {
        this.logger.log(`Starting Hedera batch analysis for ${dto.projectIds.length} projects`);
        this.hederaService.analyzeBatch(hackathonId, dto.projectIds, userId).catch(error => {
            this.logger.error(`Batch analysis failed: ${error.message}`);
        });
        return {
            success: true,
            data: {
                queued: dto.projectIds.length,
                status: 'processing',
            },
            message: `Started analysis for ${dto.projectIds.length} projects`,
        };
    }
    async getHederaReport(projectId, userId) {
        const project = await this.prisma.projects.findFirst({
            where: {
                id: projectId,
                hackathon: {
                    createdById: userId,
                },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found or access denied');
        }
        const report = await this.prisma.hedera_analysis_reports.findFirst({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            data: report,
        };
    }
    async getAllHederaReports(hackathonId, userId) {
        const hackathon = await this.prisma.hackathons.findFirst({
            where: {
                id: hackathonId,
                createdById: userId,
            },
        });
        if (!hackathon) {
            throw new common_1.NotFoundException('Hackathon not found or access denied');
        }
        const projects = await this.prisma.projects.findMany({
            where: {
                hackathonId,
            },
            include: {
                hederaReports: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        const results = projects.map(project => ({
            project: {
                id: project.id,
                name: project.name,
                teamName: project.teamName,
                githubUrl: project.githubUrl,
            },
            report: project.hederaReports[0] || null,
        }));
        return {
            success: true,
            data: results,
        };
    }
};
exports.HederaController = HederaController;
__decorate([
    (0, common_1.Post)('hackathons/:hackathonId/hedera-analysis/batch'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('hackathonId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, AnalyzeBatchDto]),
    __metadata("design:returntype", Promise)
], HederaController.prototype, "analyzeBatch", null);
__decorate([
    (0, common_1.Get)('projects/:projectId/hedera-report'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HederaController.prototype, "getHederaReport", null);
__decorate([
    (0, common_1.Get)('hackathons/:hackathonId/hedera-reports'),
    __param(0, (0, common_1.Param)('hackathonId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HederaController.prototype, "getAllHederaReports", null);
exports.HederaController = HederaController = HederaController_1 = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [hedera_service_1.HederaService,
        prisma_service_1.PrismaService])
], HederaController);
//# sourceMappingURL=hedera.controller.js.map