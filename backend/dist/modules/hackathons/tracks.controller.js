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
exports.TracksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tracks_service_1 = require("./tracks.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let TracksController = class TracksController {
    constructor(tracksService) {
        this.tracksService = tracksService;
    }
    async findAll(hackathonId, userId, query) {
        const data = await this.tracksService.findAll(hackathonId, userId, query);
        return {
            success: true,
            data,
        };
    }
    async create(hackathonId, userId, trackDto) {
        const data = await this.tracksService.create(hackathonId, userId, trackDto);
        return {
            success: true,
            data,
            message: 'Track created successfully',
        };
    }
    async batchUpdate(hackathonId, userId, tracks) {
        const data = await this.tracksService.batchUpdate(hackathonId, userId, tracks);
        return {
            success: true,
            data,
            message: 'Tracks updated successfully',
        };
    }
};
exports.TracksController = TracksController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all tracks for a hackathon',
        description: 'Retrieve all tracks associated with a specific hackathon, with optional search query.'
    }),
    (0, swagger_1.ApiParam)({ name: 'hackathonId', description: 'Hackathon ID' }),
    (0, swagger_1.ApiQuery)({ name: 'query', required: false, type: String, description: 'Search query for track name' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tracks retrieved successfully',
        schema: {
            example: {
                success: true,
                data: [
                    {
                        id: 'track1',
                        name: 'DeFi Track',
                        description: 'Decentralized Finance applications',
                        prizes: ['$5000', '$3000', '$2000'],
                        _count: { projects: 10 }
                    }
                ]
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hackathon not found' }),
    __param(0, (0, common_1.Param)('hackathonId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TracksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Add a track to hackathon',
        description: 'Create a new track for a specific hackathon with name, description, and optional prizes.'
    }),
    (0, swagger_1.ApiParam)({ name: 'hackathonId', description: 'Hackathon ID' }),
    (0, swagger_1.ApiBody)({
        schema: {
            example: {
                name: 'NFT Track',
                description: 'Non-Fungible Token applications',
                prizes: ['$4000', '$2000', '$1000']
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Track created successfully',
        schema: {
            example: {
                success: true,
                data: {
                    id: 'track2',
                    name: 'NFT Track',
                    description: 'Non-Fungible Token applications',
                    prizes: ['$4000', '$2000', '$1000']
                },
                message: 'Track created successfully'
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hackathon not found' }),
    __param(0, (0, common_1.Param)('hackathonId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TracksController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Batch update tracks',
        description: 'Update multiple tracks at once. Used for reordering or bulk editing tracks.'
    }),
    (0, swagger_1.ApiParam)({ name: 'hackathonId', description: 'Hackathon ID' }),
    (0, swagger_1.ApiBody)({
        schema: {
            example: {
                tracks: [
                    {
                        id: 'track1',
                        name: 'DeFi Track - Updated',
                        description: 'Decentralized Finance applications',
                        prizes: ['$6000', '$4000', '$2000']
                    },
                    {
                        id: 'track2',
                        name: 'NFT Track',
                        description: 'Non-Fungible Token applications',
                        prizes: ['$4000', '$2000', '$1000']
                    }
                ]
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tracks updated successfully',
        schema: {
            example: {
                success: true,
                data: [
                    { id: 'track1', name: 'DeFi Track - Updated' },
                    { id: 'track2', name: 'NFT Track' }
                ],
                message: 'Tracks updated successfully'
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hackathon not found' }),
    __param(0, (0, common_1.Param)('hackathonId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)('tracks')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array]),
    __metadata("design:returntype", Promise)
], TracksController.prototype, "batchUpdate", null);
exports.TracksController = TracksController = __decorate([
    (0, swagger_1.ApiTags)('Tracks'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('hackathons/:hackathonId/tracks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [tracks_service_1.TracksService])
], TracksController);
//# sourceMappingURL=tracks.controller.js.map