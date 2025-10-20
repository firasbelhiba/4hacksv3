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
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const projects_service_1 = require("./projects.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let ProjectsController = class ProjectsController {
    constructor(projectsService) {
        this.projectsService = projectsService;
    }
    async findOne(id, userId) {
        const project = await this.projectsService.findOne(id, userId);
        return {
            success: true,
            data: { project },
        };
    }
    async create(userId, createDto) {
        const data = await this.projectsService.create(userId, createDto);
        return {
            success: true,
            data,
            message: 'Project created successfully',
        };
    }
    async update(id, userId, updateDto) {
        const data = await this.projectsService.update(id, userId, updateDto);
        return {
            success: true,
            data,
            message: 'Project updated successfully',
        };
    }
    async remove(id, userId) {
        const result = await this.projectsService.remove(id, userId);
        return {
            success: true,
            ...result,
        };
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get project by ID',
        description: 'Retrieve detailed information about a specific project including hackathon, track, team members, and all analysis reports.'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Project ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Project retrieved successfully',
        schema: {
            example: {
                success: true,
                data: {
                    projects: {
                        id: 'proj123',
                        name: 'DeFi Swap Platform',
                        description: 'A decentralized exchange built on Hedera',
                        githubUrl: 'https://github.com/user/defi-swap',
                        status: 'SUBMITTED',
                        hackathons: { id: 'hack123', name: 'Web3 Hackathon 2025' },
                        tracks: { id: 'track1', name: 'DeFi Track' },
                        teamMembers: [{ name: 'John Doe', email: 'john@example.com', role: 'Developer' }],
                        innovationReport: { id: 'report1', status: 'COMPLETED', score: 85 },
                        coherenceReport: { id: 'report2', status: 'COMPLETED', score: 90 },
                        hederaAnalysisReport: { id: 'report3', status: 'COMPLETED', score: 78 }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Project not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new project',
        description: 'Submit a new project to a hackathon. Requires hackathon ID, track ID, GitHub URL, and team member details.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Project created successfully',
        schema: {
            example: {
                success: true,
                data: {
                    id: 'proj123',
                    name: 'DeFi Swap Platform',
                    status: 'DRAFT',
                    hackathonId: 'hack123',
                    trackId: 'track1'
                },
                message: 'Project created successfully'
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data or GitHub repository not accessible' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hackathon or track not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateProjectDto]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update project',
        description: 'Update an existing project. All fields are optional. Can update project details, team members, URLs, etc.'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Project ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Project updated successfully',
        schema: {
            example: {
                success: true,
                data: {
                    id: 'proj123',
                    name: 'DeFi Swap Platform - Updated',
                    status: 'SUBMITTED'
                },
                message: 'Project updated successfully'
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Project not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions to update this project' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateProjectDto]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete project',
        description: 'Permanently delete a project and all associated analysis reports and data.'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Project ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Project deleted successfully',
        schema: {
            example: {
                success: true,
                message: 'Project deleted successfully'
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Project not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions to delete this project' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "remove", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, swagger_1.ApiTags)('Projects'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('projects'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map