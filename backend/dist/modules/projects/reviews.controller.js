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
exports.BatchReviewsController = exports.ReviewsController = void 0;
const common_1 = require("@nestjs/common");
const reviews_service_1 = require("./services/reviews.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let ReviewsController = class ReviewsController {
    constructor(reviewsService) {
        this.reviewsService = reviewsService;
    }
    async getReviewStatus(projectId, userId) {
        const data = await this.reviewsService.getReviewStatus(projectId, userId);
        return {
            success: true,
            data,
        };
    }
    async startInnovationReview(projectId, userId) {
        const data = await this.reviewsService.startInnovationReview(projectId, userId);
        return {
            success: true,
            data,
        };
    }
    async getInnovationReport(reportId, userId) {
        const data = await this.reviewsService.getInnovationReport(reportId, userId);
        return {
            success: true,
            data,
        };
    }
    async startCoherenceReview(projectId, userId) {
        const data = await this.reviewsService.startCoherenceReview(projectId, userId);
        return {
            success: true,
            data,
        };
    }
    async getCoherenceReport(reportId, userId) {
        const data = await this.reviewsService.getCoherenceReport(reportId, userId);
        return {
            success: true,
            data,
        };
    }
    async deleteCoherenceReport(reportId, userId) {
        const result = await this.reviewsService.deleteCoherenceReport(reportId, userId);
        return {
            success: true,
            ...result,
        };
    }
    async startHederaReview(projectId, userId) {
        const data = await this.reviewsService.startHederaReview(projectId, userId);
        return {
            success: true,
            data,
        };
    }
    async getHederaReport(reportId, userId) {
        const data = await this.reviewsService.getHederaReport(reportId, userId);
        return {
            success: true,
            data,
        };
    }
};
exports.ReviewsController = ReviewsController;
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "getReviewStatus", null);
__decorate([
    (0, common_1.Post)('innovation'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "startInnovationReview", null);
__decorate([
    (0, common_1.Get)('innovation/:reportId'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "getInnovationReport", null);
__decorate([
    (0, common_1.Post)('coherence'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "startCoherenceReview", null);
__decorate([
    (0, common_1.Get)('coherence/:reportId'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "getCoherenceReport", null);
__decorate([
    (0, common_1.Delete)('coherence/:reportId/delete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "deleteCoherenceReport", null);
__decorate([
    (0, common_1.Post)('hedera'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "startHederaReview", null);
__decorate([
    (0, common_1.Get)('hedera/:reportId'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "getHederaReport", null);
exports.ReviewsController = ReviewsController = __decorate([
    (0, common_1.Controller)('projects/:projectId/review'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService])
], ReviewsController);
let BatchReviewsController = class BatchReviewsController {
    constructor(reviewsService) {
        this.reviewsService = reviewsService;
    }
    async getBatchReviewStatus(projectIds, userId) {
        const projectIdArray = projectIds.split(',').filter(id => id.trim());
        const data = await this.reviewsService.getBatchReviewStatus(projectIdArray, userId);
        return {
            success: true,
            data,
        };
    }
};
exports.BatchReviewsController = BatchReviewsController;
__decorate([
    (0, common_1.Get)('batch-status'),
    __param(0, (0, common_1.Query)('projectIds')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BatchReviewsController.prototype, "getBatchReviewStatus", null);
exports.BatchReviewsController = BatchReviewsController = __decorate([
    (0, common_1.Controller)('projects/reviews'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService])
], BatchReviewsController);
//# sourceMappingURL=reviews.controller.js.map