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
var AIJurySessionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIJurySessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
let AIJurySessionsService = AIJurySessionsService_1 = class AIJurySessionsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AIJurySessionsService_1.name);
    }
    async getSession(hackathonId, userId) {
        const hackathon = await this.prisma.hackathons.findFirst({
            where: {
                id: hackathonId,
                createdById: userId,
            },
        });
        if (!hackathon) {
            throw new common_1.NotFoundException('Hackathon not found or access denied');
        }
        const aiJurySession = await this.prisma.ai_jury_sessions.findFirst({
            where: {
                hackathonId: hackathonId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                ai_jury_layer_results: {
                    orderBy: {
                        layer: 'asc',
                    },
                },
            },
        });
        if (!aiJurySession) {
            throw new common_1.NotFoundException('No AI jury session found for this hackathon');
        }
        const layerResults = {};
        aiJurySession.ai_jury_layer_results.forEach(result => {
            if (!layerResults[result.layer]) {
                layerResults[result.layer] = [];
            }
            layerResults[result.layer].push({
                projectId: result.projectId,
                eliminated: result.eliminated,
                score: result.score,
                reason: result.reason,
                evidence: result.evidence,
                layer: result.layer,
                processedAt: result.processedAt,
            });
        });
        return {
            ...aiJurySession,
            layerResults: layerResults,
        };
    }
    async createSession(hackathonId, userId, eligibilityCriteria) {
        const hackathon = await this.prisma.hackathons.findFirst({
            where: {
                id: hackathonId,
                createdById: userId,
            },
            include: {
                projects: true,
            },
        });
        if (!hackathon) {
            throw new common_1.NotFoundException('Hackathon not found or access denied');
        }
        const existingSession = await this.prisma.ai_jury_sessions.findFirst({
            where: {
                hackathonId: hackathonId,
                status: {
                    not: 'COMPLETED',
                },
            },
        });
        if (existingSession) {
            throw new common_1.ConflictException('An AI jury session is already active for this hackathon');
        }
        const aiJurySession = await this.prisma.ai_jury_sessions.create({
            data: {
                hackathonId: hackathonId,
                eligibilityCriteria: eligibilityCriteria || {},
                status: 'PENDING',
                currentLayer: 1,
                totalLayers: 4,
                totalProjects: hackathon.projects.length,
                eliminatedProjects: 0,
                layerResults: {},
                finalResults: {},
            },
            include: {
                hackathon: {
                    select: {
                        name: true,
                        _count: {
                            select: {
                                projects: true,
                                tracks: true,
                            },
                        },
                    },
                },
            },
        });
        this.logger.log(`Created AI jury session ${aiJurySession.id} for hackathon ${hackathonId}`);
        return aiJurySession;
    }
    async getProgress(sessionId, userId) {
        const session = await this.prisma.ai_jury_sessions.findFirst({
            where: {
                id: sessionId,
                hackathon: {
                    createdById: userId,
                },
            },
            include: {
                ai_jury_layer_results: {
                    select: {
                        layer: true,
                        eliminated: true,
                    },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('AI jury session not found or access denied');
        }
        const layerProgress = {};
        for (let i = 1; i <= 4; i++) {
            const layerResults = session.ai_jury_layer_results.filter(r => r.layer === i);
            layerProgress[i] = {
                total: session.totalProjects,
                processed: layerResults.length,
                eliminated: layerResults.filter(r => r.eliminated).length,
            };
        }
        return {
            sessionId: session.id,
            status: session.status,
            currentLayer: session.currentLayer,
            totalLayers: session.totalLayers,
            totalProjects: session.totalProjects,
            eliminatedProjects: session.eliminatedProjects,
            layerProgress,
        };
    }
    async getResults(sessionId, userId) {
        const session = await this.prisma.ai_jury_sessions.findFirst({
            where: {
                id: sessionId,
                hackathon: {
                    createdById: userId,
                },
            },
            include: {
                ai_jury_layer_results: {
                    include: {
                        session: {
                            include: {
                                hackathon: {
                                    include: {
                                        projects: {
                                            include: {
                                                track: true,
                                            },
                                        },
                                        tracks: true,
                                    },
                                },
                            },
                        },
                    },
                    where: {
                        layer: 4,
                    },
                    orderBy: {
                        score: 'desc',
                    },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('AI jury session not found or access denied');
        }
        if (session.status !== 'COMPLETED') {
            throw new common_1.ConflictException('AI jury session is not yet completed');
        }
        return {
            sessionId: session.id,
            status: session.status,
            finalResults: session.finalResults,
            layerResults: session.layerResults,
        };
    }
    async resetSession(sessionId, userId) {
        const session = await this.prisma.ai_jury_sessions.findFirst({
            where: {
                id: sessionId,
                hackathon: {
                    createdById: userId,
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('AI jury session not found or access denied');
        }
        await this.prisma.$transaction([
            this.prisma.ai_jury_layer_results.deleteMany({
                where: { sessionId },
            }),
            this.prisma.ai_jury_sessions.update({
                where: { id: sessionId },
                data: {
                    status: 'PENDING',
                    currentLayer: 1,
                    eliminatedProjects: 0,
                    layerResults: {},
                    finalResults: {},
                },
            }),
        ]);
        this.logger.log(`Reset AI jury session ${sessionId}`);
        return { message: 'Session reset successfully' };
    }
};
exports.AIJurySessionsService = AIJurySessionsService;
exports.AIJurySessionsService = AIJurySessionsService = AIJurySessionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AIJurySessionsService);
//# sourceMappingURL=ai-jury-sessions.service.js.map