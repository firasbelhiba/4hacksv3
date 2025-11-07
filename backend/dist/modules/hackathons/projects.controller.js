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
exports.HackathonProjectsController = void 0;
const common_1 = require("@nestjs/common");
const projects_service_1 = require("../projects/projects.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let HackathonProjectsController = class HackathonProjectsController {
    constructor(projectsService) {
        this.projectsService = projectsService;
    }
    async findAll(hackathonId, userId, page, pageSize) {
        const pageNum = page ? Number(page) : 1;
        const pageSizeNum = pageSize ? Number(pageSize) : 20;
        const result = await this.projectsService.findByHackathon(hackathonId, userId, pageNum, pageSizeNum);
        return {
            success: true,
            ...result,
        };
    }
    async checkRepositories(hackathonId, userId, projectIds) {
        const results = await this.projectsService.checkRepositoriesAccessibility(hackathonId, userId, projectIds);
        return {
            success: true,
            results,
        };
    }
};
exports.HackathonProjectsController = HackathonProjectsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('hackathonId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], HackathonProjectsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('check-repositories'),
    __param(0, (0, common_1.Param)('hackathonId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)('projectIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array]),
    __metadata("design:returntype", Promise)
], HackathonProjectsController.prototype, "checkRepositories", null);
exports.HackathonProjectsController = HackathonProjectsController = __decorate([
    (0, common_1.Controller)('hackathons/:hackathonId/projects'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService])
], HackathonProjectsController);
//# sourceMappingURL=projects.controller.js.map