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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let TracksService = class TracksService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async verifyHackathonAccess(hackathonId, userId) {
        const hackathon = await this.prisma.hackathons.findFirst({
            where: {
                id: hackathonId,
                createdById: userId,
            },
        });
        if (!hackathon) {
            throw new common_1.NotFoundException('Hackathon not found or access denied');
        }
        return hackathon;
    }
    async findAll(hackathonId, userId, query) {
        await this.verifyHackathonAccess(hackathonId, userId);
        const where = { hackathonId };
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ];
        }
        return this.prisma.tracks.findMany({
            where,
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: {
                        projects: true,
                    },
                },
            },
        });
    }
    async create(hackathonId, userId, trackDto) {
        const hackathon = await this.verifyHackathonAccess(hackathonId, userId);
        const existingTrack = await this.prisma.tracks.findFirst({
            where: {
                hackathonId,
                name: {
                    equals: trackDto.name,
                    mode: 'insensitive',
                },
            },
        });
        if (existingTrack) {
            throw new common_1.ForbiddenException('A track with this name already exists in this hackathon');
        }
        let order = trackDto.order;
        if (order === undefined || order === 0) {
            const maxOrder = await this.prisma.tracks.aggregate({
                where: { hackathonId },
                _max: { order: true },
            });
            order = (maxOrder._max.order || 0) + 1;
        }
        const track = await this.prisma.tracks.create({
            data: {
                name: trackDto.name,
                description: trackDto.description,
                prize: trackDto.prize,
                order,
                eligibilityCriteria: trackDto.eligibilityCriteria && trackDto.eligibilityCriteria.length > 0
                    ? { criteria: trackDto.eligibilityCriteria }
                    : null,
                hackathonId,
            },
            include: {
                _count: {
                    select: {
                        projects: true,
                    },
                },
            },
        });
        await this.prisma.activity_logs.create({
            data: {
                userId,
                action: 'CREATE_TRACK',
                entityType: 'Track',
                entityId: track.id,
                metadata: {
                    trackName: track.name,
                    hackathonId,
                    hackathonName: hackathon.name,
                },
            },
        });
        return track;
    }
    async batchUpdate(hackathonId, userId, tracks) {
        await this.verifyHackathonAccess(hackathonId, userId);
        const tracksToUpdate = tracks.filter((track) => track.id);
        const tracksToCreate = tracks.filter((track) => !track.id);
        if (tracksToUpdate.length > 0) {
            await Promise.all(tracksToUpdate.map((track) => this.prisma.tracks.update({
                where: { id: track.id },
                data: {
                    name: track.name,
                    description: track.description,
                    prize: track.prize,
                    order: track.order,
                    eligibilityCriteria: track.eligibilityCriteria && track.eligibilityCriteria.length > 0
                        ? { criteria: track.eligibilityCriteria }
                        : null,
                },
            })));
        }
        if (tracksToCreate.length > 0) {
            const newTrackData = tracksToCreate.map((track, index) => ({
                name: track.name,
                description: track.description,
                prize: track.prize,
                order: track.order ?? tracksToUpdate.length + index,
                eligibilityCriteria: track.eligibilityCriteria && track.eligibilityCriteria.length > 0
                    ? { criteria: track.eligibilityCriteria }
                    : null,
                hackathonId,
            }));
            await this.prisma.tracks.createMany({
                data: newTrackData,
            });
        }
        return this.prisma.tracks.findMany({
            where: { hackathonId },
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { projects: true },
                },
            },
        });
    }
};
exports.TracksService = TracksService;
exports.TracksService = TracksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TracksService);
//# sourceMappingURL=tracks.service.js.map