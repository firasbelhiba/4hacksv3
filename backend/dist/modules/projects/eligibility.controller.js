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
exports.EligibilityController = void 0;
const common_1 = require("@nestjs/common");
const eligibility_service_1 = require("./services/eligibility.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let EligibilityController = class EligibilityController {
    constructor(eligibilityService) {
        this.eligibilityService = eligibilityService;
    }
    async checkEligibility(projectId, userId) {
        const data = await this.eligibilityService.checkEligibility(projectId, userId);
        return {
            success: true,
            data,
        };
    }
};
exports.EligibilityController = EligibilityController;
__decorate([
    (0, common_1.Post)('eligibility-check'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EligibilityController.prototype, "checkEligibility", null);
exports.EligibilityController = EligibilityController = __decorate([
    (0, common_1.Controller)('projects/:projectId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [eligibility_service_1.EligibilityService])
], EligibilityController);
//# sourceMappingURL=eligibility.controller.js.map