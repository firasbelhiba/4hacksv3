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
var EligibilityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EligibilityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
let EligibilityService = EligibilityService_1 = class EligibilityService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EligibilityService_1.name);
    }
    async checkEligibility(projectId, userId) {
        const project = await this.prisma.projects.findFirst({
            where: {
                id: projectId,
                hackathon: {
                    createdById: userId,
                },
            },
            include: {
                track: {
                    select: {
                        name: true,
                        eligibilityCriteria: true,
                    },
                },
                hackathon: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found or access denied');
        }
        const checks = {
            hasGithubUrl: !!project.githubUrl,
            hasDescription: !!project.description && project.description.length > 10,
            hasTeamMembers: Array.isArray(project.teamMembers) && project.teamMembers.length > 0,
            trackEligibility: this.checkTrackEligibility(project.track.eligibilityCriteria),
        };
        const isEligible = Object.values(checks).every((check) => typeof check === 'boolean' ? check : check.eligible);
        this.logger.log(`Eligibility check for project ${projectId}: ${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
        return {
            projectId,
            projectName: project.name,
            trackName: project.name,
            hackathonName: project.name,
            isEligible,
            checks,
            message: isEligible
                ? 'Project meets all eligibility requirements'
                : 'Project does not meet all eligibility requirements',
        };
    }
    checkTrackEligibility(eligibilityCriteria) {
        if (!eligibilityCriteria || typeof eligibilityCriteria !== 'object') {
            return {
                eligible: true,
                message: 'No specific track eligibility criteria',
            };
        }
        return {
            eligible: true,
            message: 'Track eligibility criteria met',
            criteria: eligibilityCriteria,
        };
    }
};
exports.EligibilityService = EligibilityService;
exports.EligibilityService = EligibilityService = EligibilityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EligibilityService);
//# sourceMappingURL=eligibility.service.js.map