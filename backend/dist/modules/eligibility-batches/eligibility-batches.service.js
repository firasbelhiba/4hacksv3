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
var EligibilityBatchesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EligibilityBatchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let EligibilityBatchesService = EligibilityBatchesService_1 = class EligibilityBatchesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EligibilityBatchesService_1.name);
    }
    async create(hackathonId, userId, createDto) {
        const hackathon = await this.prisma.hackathons.findFirst({
            where: {
                id: hackathonId,
                createdById: userId,
            },
        });
        if (!hackathon) {
            throw new common_1.ForbiddenException('Hackathon not found or access denied');
        }
        const existingBatch = await this.prisma.eligibility_batches.findFirst({
            where: {
                hackathonId,
                name: createDto.name,
            },
        });
        if (existingBatch) {
            throw new common_1.ConflictException('A batch with this name already exists for this hackathon');
        }
        const projects = await this.prisma.projects.findMany({
            where: {
                id: { in: createDto.projectIds },
                hackathonId,
            },
            select: { id: true },
        });
        if (projects.length !== createDto.projectIds.length) {
            const foundIds = projects.map(p => p.id);
            const missingIds = createDto.projectIds.filter(id => !foundIds.includes(id));
            this.logger.error(`Project verification failed. Expected: ${createDto.projectIds.length}, Found: ${projects.length}`);
            this.logger.error(`Missing project IDs: ${missingIds.join(', ')}`);
            throw new common_1.NotFoundException(`Some projects not found or do not belong to this hackathon. Missing: ${missingIds.length} projects`);
        }
        const batch = await this.prisma.eligibility_batches.create({
            data: {
                hackathonId,
                name: createDto.name,
                description: createDto.description,
                criteria: createDto.criteria || {},
                totalProjects: createDto.projectIds.length,
                createdById: userId,
                batchProjects: {
                    create: createDto.projectIds.map(projectId => ({
                        projectId,
                    })),
                },
            },
            include: {
                batchProjects: {
                    include: {
                        project: {
                            select: {
                                id: true,
                                name: true,
                                teamName: true,
                                githubUrl: true,
                                track: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        this.logger.log(`Batch created: ${batch.name} with ${batch.totalProjects} projects by user ${userId}`);
        return batch;
    }
    async findAll(hackathonId, userId) {
        const hackathon = await this.prisma.hackathons.findFirst({
            where: {
                id: hackathonId,
                createdById: userId,
            },
        });
        if (!hackathon) {
            throw new common_1.ForbiddenException('Hackathon not found or access denied');
        }
        const batches = await this.prisma.eligibility_batches.findMany({
            where: { hackathonId },
            include: {
                _count: {
                    select: {
                        batchProjects: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return batches;
    }
    async findOne(hackathonId, batchId, userId) {
        const hackathon = await this.prisma.hackathons.findFirst({
            where: {
                id: hackathonId,
                createdById: userId,
            },
        });
        if (!hackathon) {
            throw new common_1.ForbiddenException('Hackathon not found or access denied');
        }
        const batch = await this.prisma.eligibility_batches.findFirst({
            where: {
                id: batchId,
                hackathonId,
            },
            include: {
                batchProjects: {
                    include: {
                        project: {
                            include: {
                                track: true,
                                hederaReports: {
                                    orderBy: { createdAt: 'desc' },
                                    take: 1,
                                },
                                eligibilityReports: {
                                    orderBy: { createdAt: 'desc' },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!batch) {
            throw new common_1.NotFoundException('Batch not found');
        }
        return batch;
    }
    async delete(hackathonId, batchId, userId) {
        const batch = await this.prisma.eligibility_batches.findFirst({
            where: {
                id: batchId,
                hackathonId,
                hackathon: {
                    createdById: userId,
                },
            },
        });
        if (!batch) {
            throw new common_1.NotFoundException('Batch not found or access denied');
        }
        await this.prisma.eligibility_batches.delete({
            where: { id: batchId },
        });
        this.logger.log(`Batch deleted: ${batchId} by user ${userId}`);
        return { message: 'Batch deleted successfully' };
    }
};
exports.EligibilityBatchesService = EligibilityBatchesService;
exports.EligibilityBatchesService = EligibilityBatchesService = EligibilityBatchesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EligibilityBatchesService);
//# sourceMappingURL=eligibility-batches.service.js.map