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
var ProjectsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const github_service_1 = require("../ai-agents/services/github.service");
let ProjectsService = ProjectsService_1 = class ProjectsService {
    constructor(prisma, githubService) {
        this.prisma = prisma;
        this.githubService = githubService;
        this.logger = new common_1.Logger(ProjectsService_1.name);
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
    async verifyProjectAccess(projectId, userId) {
        const project = await this.prisma.projects.findFirst({
            where: {
                id: projectId,
                hackathon: {
                    createdById: userId,
                },
            },
            include: {
                hackathon: {
                    select: {
                        id: true,
                        name: true,
                        createdById: true,
                    },
                },
                track: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found or access denied');
        }
        return project;
    }
    async findAll(userId) {
        this.logger.log(`Fetching all projects for user ${userId}`);
        const projects = await this.prisma.projects.findMany({
            where: {
                hackathon: {
                    createdById: userId,
                },
            },
            include: {
                hackathon: {
                    select: {
                        id: true,
                        name: true,
                        createdById: true,
                    },
                },
                track: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        this.logger.log(`Found ${projects.length} projects for user ${userId}`);
        return {
            projects,
            count: projects.length,
        };
    }
    async findOne(projectId, userId) {
        const project = await this.prisma.projects.findFirst({
            where: {
                id: projectId,
                hackathon: {
                    createdById: userId,
                },
            },
            include: {
                hackathon: {
                    select: { id: true, name: true, createdById: true },
                },
                track: {
                    select: { id: true, name: true },
                },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found or access denied');
        }
        return project;
    }
    async create(userId, createDto) {
        const { hackathonId, trackId, teamMembers, ...projectData } = createDto;
        const hackathon = await this.prisma.hackathons.findFirst({
            where: {
                id: hackathonId,
                createdById: userId,
            },
        });
        if (!hackathon) {
            throw new common_1.ForbiddenException('Hackathon not found or access denied');
        }
        const track = await this.prisma.tracks.findFirst({
            where: {
                id: trackId,
                hackathonId,
            },
        });
        if (!track) {
            throw new common_1.NotFoundException('Track not found in this hackathon');
        }
        let slug = this.slugify(projectData.name);
        let slugSuffix = 0;
        let uniqueSlug = slug;
        while (await this.prisma.projects.findFirst({ where: { slug: uniqueSlug } })) {
            slugSuffix++;
            uniqueSlug = `${slug}-${slugSuffix}`;
        }
        slug = uniqueSlug;
        const project = await this.prisma.projects.create({
            data: {
                ...projectData,
                slug,
                teamMembers: teamMembers || [],
                hackathon: {
                    connect: { id: hackathonId },
                },
                track: {
                    connect: { id: trackId },
                },
            },
            include: {
                hackathon: {
                    select: { id: true, name: true },
                },
                track: {
                    select: { id: true, name: true },
                },
            },
        });
        this.logger.log(`Project created: ${project.name} by user ${userId}`);
        return project;
    }
    async update(projectId, userId, updateDto) {
        await this.verifyProjectAccess(projectId, userId);
        const { hackathonId, trackId, ...safeUpdateDto } = updateDto;
        const updated = await this.prisma.projects.update({
            where: { id: projectId },
            data: safeUpdateDto,
            include: {
                hackathon: {
                    select: { id: true, name: true },
                },
                track: {
                    select: { id: true, name: true },
                },
            },
        });
        this.logger.log(`Project updated: ${projectId} by user ${userId}`);
        return updated;
    }
    async remove(projectId, userId) {
        await this.verifyProjectAccess(projectId, userId);
        await this.prisma.projects.delete({
            where: { id: projectId },
        });
        this.logger.log(`Project deleted: ${projectId} by user ${userId}`);
        return { message: 'Project deleted successfully' };
    }
    async findByHackathon(hackathonId, userId, page = 1, pageSize = 20) {
        const hackathon = await this.prisma.hackathons.findFirst({
            where: {
                id: hackathonId,
                createdById: userId,
            },
        });
        if (!hackathon) {
            throw new common_1.ForbiddenException('Hackathon not found or access denied');
        }
        const skip = (page - 1) * pageSize;
        const [projects, totalCount] = await Promise.all([
            this.prisma.projects.findMany({
                where: { hackathonId },
                skip,
                take: pageSize,
                include: {
                    hackathon: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    track: {
                        select: { id: true, name: true },
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
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.projects.count({
                where: { hackathonId },
            }),
        ]);
        const totalPages = Math.ceil(totalCount / pageSize);
        return {
            data: projects,
            pagination: {
                page,
                pageSize,
                total: totalCount,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }
    async checkRepositoriesAccessibility(hackathonId, userId, projectIds) {
        const hackathon = await this.prisma.hackathons.findFirst({
            where: {
                id: hackathonId,
                createdById: userId,
            },
        });
        if (!hackathon) {
            throw new common_1.ForbiddenException('Hackathon not found or access denied');
        }
        const projects = await this.prisma.projects.findMany({
            where: {
                id: { in: projectIds },
                hackathonId,
            },
            select: {
                id: true,
                name: true,
                githubUrl: true,
            },
        });
        this.logger.log(`Checking repository accessibility for ${projects.length} projects`);
        const results = [];
        for (const project of projects) {
            try {
                if (!project.githubUrl || project.githubUrl === 'N/A') {
                    results.push({
                        projectId: project.id,
                        projectName: project.name,
                        githubUrl: project.githubUrl,
                        accessible: false,
                        isPublic: false,
                        error: 'No GitHub URL provided',
                    });
                    continue;
                }
                const repoInfo = this.githubService.parseGitHubUrl(project.githubUrl);
                if (!repoInfo) {
                    results.push({
                        projectId: project.id,
                        projectName: project.name,
                        githubUrl: project.githubUrl,
                        accessible: false,
                        isPublic: false,
                        error: 'Invalid GitHub URL format',
                    });
                    continue;
                }
                const check = await this.githubService.checkRepositoryAccessibility(repoInfo.owner, repoInfo.repo);
                results.push({
                    projectId: project.id,
                    projectName: project.name,
                    githubUrl: project.githubUrl,
                    accessible: check.accessible,
                    isPublic: check.isPublic,
                    error: check.error,
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (error) {
                this.logger.error(`Error checking repository for project ${project.id}: ${error.message}`);
                results.push({
                    projectId: project.id,
                    projectName: project.name,
                    githubUrl: project.githubUrl,
                    accessible: false,
                    isPublic: false,
                    error: error.message,
                });
            }
        }
        this.logger.log(`Repository accessibility check completed for ${results.length} projects`);
        return results;
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = ProjectsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        github_service_1.GitHubService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map