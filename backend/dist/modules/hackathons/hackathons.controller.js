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
exports.HackathonsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const hackathons_service_1 = require("./hackathons.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let HackathonsController = class HackathonsController {
    constructor(hackathonsService) {
        this.hackathonsService = hackathonsService;
    }
    async findAll(userId, filters) {
        const result = await this.hackathonsService.findAll(userId, filters);
        return {
            success: true,
            ...result,
        };
    }
    async findOne(id, userId, projectsPage, projectsPageSize) {
        const page = projectsPage ? Number(projectsPage) : 1;
        const pageSize = projectsPageSize ? Number(projectsPageSize) : 20;
        const data = await this.hackathonsService.findOne(id, userId, page, pageSize);
        return {
            success: true,
            data,
        };
    }
    async create(userId, createDto) {
        const data = await this.hackathonsService.create(userId, createDto);
        return {
            success: true,
            data,
            message: 'Hackathon created successfully',
        };
    }
    async update(id, userId, updateDto) {
        const data = await this.hackathonsService.update(id, userId, updateDto);
        return {
            success: true,
            data,
            message: 'Hackathon updated successfully',
        };
    }
    async remove(id, userId) {
        const result = await this.hackathonsService.remove(id, userId);
        return {
            success: true,
            ...result,
        };
    }
};
exports.HackathonsController = HackathonsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all hackathons',
        description: 'Retrieve a paginated list of hackathons with optional filtering by status and search query.'
    }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'], description: 'Filter by hackathon status' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, description: 'Search in name and description' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Hackathons retrieved successfully',
        schema: {
            example: {
                success: true,
                data: [
                    {
                        id: 'hack123',
                        name: 'Web3 Hackathon 2025',
                        slug: 'web3-hackathon-2025',
                        description: 'Build the future of decentralized web',
                        status: 'PUBLISHED',
                        startDate: '2025-11-01T00:00:00.000Z',
                        endDate: '2025-11-03T23:59:59.000Z',
                        _count: { tracks: 3, projects: 25 }
                    }
                ],
                pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
            }
        }
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.HackathonFilterDto]),
    __metadata("design:returntype", Promise)
], HackathonsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get hackathon by ID',
        description: 'Retrieve detailed information about a specific hackathon including tracks, evaluation criteria, and settings. Supports pagination for projects list.'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Hackathon ID' }),
    (0, swagger_1.ApiQuery)({ name: 'projectsPage', required: false, type: Number, description: 'Projects page number (default: 1)' }),
    (0, swagger_1.ApiQuery)({ name: 'projectsPageSize', required: false, type: Number, description: 'Projects per page (default: 20)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Hackathon retrieved successfully',
        schema: {
            example: {
                success: true,
                data: {
                    id: 'hack123',
                    name: 'Web3 Hackathon 2025',
                    slug: 'web3-hackathon-2025',
                    description: 'Build the future of decentralized web',
                    status: 'PUBLISHED',
                    startDate: '2025-11-01T00:00:00.000Z',
                    endDate: '2025-11-03T23:59:59.000Z',
                    tracks: [{ id: 'track1', name: 'DeFi Track', description: 'Decentralized Finance applications' }],
                    evaluationCriteria: [{ id: 'criteria1', name: 'Innovation', weight: 30 }],
                    settings: { maxTeamSize: 5, allowSoloParticipants: true },
                    projects: { data: [], pagination: { page: 1, pageSize: 20, total: 0 } }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hackathon not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Query)('projectsPage')),
    __param(3, (0, common_1.Query)('projectsPageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], HackathonsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new hackathon',
        description: 'Create a new hackathon with basic info, schedule, tracks, evaluation criteria, and settings. Slug is auto-generated from the name.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Hackathon created successfully',
        schema: {
            example: {
                success: true,
                data: {
                    id: 'hack123',
                    name: 'Web3 Hackathon 2025',
                    slug: 'web3-hackathon-2025',
                    status: 'DRAFT'
                },
                message: 'Hackathon created successfully'
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateHackathonDto]),
    __metadata("design:returntype", Promise)
], HackathonsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update hackathon',
        description: 'Update an existing hackathon. All fields are optional. Only provided fields will be updated.'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Hackathon ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Hackathon updated successfully',
        schema: {
            example: {
                success: true,
                data: {
                    id: 'hack123',
                    name: 'Web3 Hackathon 2025 - Updated',
                    slug: 'web3-hackathon-2025'
                },
                message: 'Hackathon updated successfully'
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hackathon not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateHackathonDto]),
    __metadata("design:returntype", Promise)
], HackathonsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete hackathon',
        description: 'Permanently delete a hackathon. This will also delete all associated tracks, projects, and evaluation criteria.'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Hackathon ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Hackathon deleted successfully',
        schema: {
            example: {
                success: true,
                message: 'Hackathon deleted successfully'
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hackathon not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HackathonsController.prototype, "remove", null);
exports.HackathonsController = HackathonsController = __decorate([
    (0, swagger_1.ApiTags)('Hackathons'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('hackathons'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [hackathons_service_1.HackathonsService])
], HackathonsController);
//# sourceMappingURL=hackathons.controller.js.map