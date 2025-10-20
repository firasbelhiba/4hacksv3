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
var HackathonsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HackathonsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let HackathonsService = HackathonsService_1 = class HackathonsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(HackathonsService_1.name);
    }
    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    }
    async findAll(userId, filters) {
        const { page, pageSize, sortBy, sortOrder, ...whereFilters } = filters;
        const where = {
            createdById: userId,
        };
        if (whereFilters.query) {
            where.OR = [
                { name: { contains: whereFilters.query, mode: 'insensitive' } },
                { description: { contains: whereFilters.query, mode: 'insensitive' } },
                { organizationName: { contains: whereFilters.query, mode: 'insensitive' } },
            ];
        }
        if (whereFilters.status) {
            where.status = whereFilters.status;
        }
        if (whereFilters.organizationName) {
            where.organizationName = {
                contains: whereFilters.organizationName,
                mode: 'insensitive',
            };
        }
        if (whereFilters.startDateFrom || whereFilters.startDateTo) {
            where.startDate = {};
            if (whereFilters.startDateFrom) {
                where.startDate.gte = new Date(whereFilters.startDateFrom);
            }
            if (whereFilters.startDateTo) {
                where.startDate.lte = new Date(whereFilters.startDateTo);
            }
        }
        if (whereFilters.endDateFrom || whereFilters.endDateTo) {
            where.endDate = {};
            if (whereFilters.endDateFrom) {
                where.endDate.gte = new Date(whereFilters.endDateFrom);
            }
            if (whereFilters.endDateTo) {
                where.endDate.lte = new Date(whereFilters.endDateTo);
            }
        }
        const skip = (page - 1) * pageSize;
        const totalCount = await this.prisma.hackathons.count({ where });
        const hackathons = await this.prisma.hackathons.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: pageSize,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                tracks: {
                    select: {
                        id: true,
                        name: true,
                        _count: {
                            select: {
                                projects: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        projects: true,
                        tracks: true,
                    },
                },
            },
        });
        const totalPages = Math.ceil(totalCount / pageSize);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;
        return {
            data: hackathons,
            pagination: {
                currentPage: page,
                pageSize,
                totalCount,
                totalPages,
                hasNextPage,
                hasPreviousPage,
            },
        };
    }
    async findOne(id, userId, projectsPage = 1, projectsPageSize = 20) {
        const hackathon = await this.prisma.hackathons.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                tracks: {
                    orderBy: { order: 'asc' },
                    include: {
                        _count: {
                            select: {
                                projects: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        projects: true,
                        tracks: true,
                    },
                },
            },
        });
        if (!hackathon) {
            throw new common_1.NotFoundException('Hackathon not found');
        }
        if (hackathon.createdById !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to access this hackathon');
        }
        const skip = (projectsPage - 1) * projectsPageSize;
        const [projects, totalProjects] = await Promise.all([
            this.prisma.projects.findMany({
                where: { hackathonId: id },
                skip,
                take: projectsPageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    track: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    innovationReports: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            status: true,
                            score: true,
                        },
                    },
                    coherenceReports: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            status: true,
                            score: true,
                        },
                    },
                    hederaReports: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            status: true,
                            hederaUsageScore: true,
                        },
                    },
                    codeQualityReports: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            status: true,
                            overallScore: true,
                        },
                    },
                },
            }),
            this.prisma.projects.count({
                where: { hackathonId: id },
            }),
        ]);
        const totalPages = Math.ceil(totalProjects / projectsPageSize);
        return {
            ...hackathon,
            project: {
                data: projects,
                pagination: {
                    page: projectsPage,
                    pageSize: projectsPageSize,
                    total: totalProjects,
                    totalPages,
                    hasNextPage: projectsPage < totalPages,
                    hasPreviousPage: projectsPage > 1,
                },
            },
        };
    }
    async create(userId, createDto) {
        const { basicInfo, schedule, tracks, settings } = createDto;
        let slug = basicInfo.slug || this.slugify(basicInfo.name);
        let slugSuffix = 0;
        let uniqueSlug = slug;
        while (await this.prisma.hackathons.findFirst({ where: { slug: uniqueSlug } })) {
            slugSuffix++;
            uniqueSlug = `${slug}-${slugSuffix}`;
        }
        slug = uniqueSlug;
        const result = await this.prisma.$transaction(async (tx) => {
            const hackathon = await tx.hackathons.create({
                data: {
                    name: basicInfo.name,
                    slug,
                    description: basicInfo.description,
                    organizationName: basicInfo.organizationName,
                    prizePool: basicInfo.prizePool,
                    bannerImage: basicInfo.bannerImage,
                    startDate: new Date(schedule.startDate),
                    endDate: new Date(schedule.endDate),
                    settings: {
                        ...settings,
                        registrationDeadline: schedule.registrationDeadline,
                        evaluationPeriodEnd: schedule.evaluationPeriodEnd,
                        resultAnnouncementDate: schedule.resultAnnouncementDate,
                        timezone: schedule.timezone,
                    },
                    createdById: userId,
                },
            });
            if (tracks?.tracks?.length > 0) {
                const trackData = tracks.tracks.map((track, index) => ({
                    name: track.name,
                    description: track.description,
                    prize: track.prize || null,
                    order: track.order ?? index,
                    eligibilityCriteria: track.eligibilityCriteria && track.eligibilityCriteria.length > 0
                        ? { criteria: track.eligibilityCriteria }
                        : null,
                    hackathonId: hackathon.id,
                }));
                await tx.tracks.createMany({ data: trackData });
            }
            const createdTracks = await tx.tracks.findMany({
                where: { hackathonId: hackathon.id },
                orderBy: { order: 'asc' },
            });
            return {
                ...hackathon,
                tracks: createdTracks,
            };
        }, { timeout: 15000 });
        await this.prisma.activity_logs.create({
            data: {
                userId,
                action: 'CREATE_HACKATHON',
                entityType: 'Hackathon',
                entityId: result.id,
                metadata: {
                    hackathonName: result.name,
                    tracksCount: tracks?.tracks?.length || 0,
                },
            },
        });
        this.logger.log(`Hackathon created: ${result.name} by user ${userId}`);
        return result;
    }
    async update(id, userId, updateDto) {
        const existing = await this.findOne(id, userId);
        const { basicInfo, schedule, tracks, settings } = updateDto;
        const updateData = {};
        if (basicInfo) {
            if (basicInfo.name)
                updateData.name = basicInfo.name;
            if (basicInfo.description)
                updateData.description = basicInfo.description;
            if (basicInfo.organizationName)
                updateData.organizationName = basicInfo.organizationName;
            if (basicInfo.prizePool !== undefined)
                updateData.prizePool = basicInfo.prizePool;
            if (basicInfo.bannerImage !== undefined)
                updateData.bannerImage = basicInfo.bannerImage;
        }
        if (schedule) {
            if (schedule.startDate)
                updateData.startDate = new Date(schedule.startDate);
            if (schedule.endDate)
                updateData.endDate = new Date(schedule.endDate);
            if (schedule.registrationDeadline || schedule.evaluationPeriodEnd || schedule.resultAnnouncementDate || schedule.timezone) {
                updateData.settings = {
                    ...existing.settings,
                    ...settings,
                    ...(schedule.registrationDeadline && { registrationDeadline: schedule.registrationDeadline }),
                    ...(schedule.evaluationPeriodEnd && { evaluationPeriodEnd: schedule.evaluationPeriodEnd }),
                    ...(schedule.resultAnnouncementDate && { resultAnnouncementDate: schedule.resultAnnouncementDate }),
                    ...(schedule.timezone && { timezone: schedule.timezone }),
                };
            }
        }
        const updated = await this.prisma.hackathons.update({
            where: { id },
            data: updateData,
            include: {
                tracks: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        this.logger.log(`Hackathon updated: ${id} by user ${userId}`);
        return updated;
    }
    async remove(id, userId) {
        await this.findOne(id, userId);
        await this.prisma.hackathons.delete({
            where: { id },
        });
        this.logger.log(`Hackathon deleted: ${id} by user ${userId}`);
        return { message: 'Hackathon deleted successfully' };
    }
};
exports.HackathonsService = HackathonsService;
exports.HackathonsService = HackathonsService = HackathonsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HackathonsService);
//# sourceMappingURL=hackathons.service.js.map