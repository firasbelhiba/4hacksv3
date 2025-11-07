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
exports.EligibilityBatchesController = void 0;
const common_1 = require("@nestjs/common");
const eligibility_batches_service_1 = require("./eligibility-batches.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const dto_1 = require("./dto");
let EligibilityBatchesController = class EligibilityBatchesController {
    constructor(batchesService) {
        this.batchesService = batchesService;
    }
    async create(hackathonId, userId, createDto) {
        const batch = await this.batchesService.create(hackathonId, userId, createDto);
        return {
            success: true,
            data: batch,
        };
    }
    async findAll(hackathonId, userId) {
        const batches = await this.batchesService.findAll(hackathonId, userId);
        return {
            success: true,
            data: batches,
        };
    }
    async findOne(hackathonId, batchId, userId) {
        const batch = await this.batchesService.findOne(hackathonId, batchId, userId);
        return {
            success: true,
            data: batch,
        };
    }
    async delete(hackathonId, batchId, userId) {
        const result = await this.batchesService.delete(hackathonId, batchId, userId);
        return {
            success: true,
            ...result,
        };
    }
};
exports.EligibilityBatchesController = EligibilityBatchesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('hackathonId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.CreateBatchDto]),
    __metadata("design:returntype", Promise)
], EligibilityBatchesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('hackathonId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EligibilityBatchesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':batchId'),
    __param(0, (0, common_1.Param)('hackathonId')),
    __param(1, (0, common_1.Param)('batchId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], EligibilityBatchesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':batchId'),
    __param(0, (0, common_1.Param)('hackathonId')),
    __param(1, (0, common_1.Param)('batchId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], EligibilityBatchesController.prototype, "delete", null);
exports.EligibilityBatchesController = EligibilityBatchesController = __decorate([
    (0, common_1.Controller)('hackathons/:hackathonId/eligibility-batches'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [eligibility_batches_service_1.EligibilityBatchesService])
], EligibilityBatchesController);
//# sourceMappingURL=eligibility-batches.controller.js.map