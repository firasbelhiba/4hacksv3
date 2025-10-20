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
const code_quality_service_1 = require("./services/code-quality.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CodeQualityController = class CodeQualityController {
    constructor(codeQualityService) {
        this.codeQualityService = codeQualityService;
    }
    async startAnalysis(projectId, userId) {
        const data = await this.codeQualityService.startAnalysis(projectId, userId);
        return {
            success: true,
            data,
        };
    }
    async getReport(reportId, userId) {
        const data = await this.codeQualityService.getReport(reportId, userId);
        return {
            success: true,
            data,
        };
    }
    async getProgress(reportId, userId) {
        const data = await this.codeQualityService.getProgress(reportId, userId);
        return {
            success: true,
            data,
        };
    }
};
exports.CodeQualityController = CodeQualityController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CodeQualityController.prototype, "startAnalysis", null);
__decorate([
    (0, common_1.Get)(':reportId'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CodeQualityController.prototype, "getReport", null);
__decorate([
    (0, common_1.Get)(':reportId/progress'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CodeQualityController.prototype, "getProgress", null);
exports.CodeQualityController = CodeQualityController = __decorate([
    (0, common_1.Controller)('projects/:projectId/code-quality'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [code_quality_service_1.CodeQualityService])
], CodeQualityController);
//# sourceMappingURL=code-quality.controller.js.map