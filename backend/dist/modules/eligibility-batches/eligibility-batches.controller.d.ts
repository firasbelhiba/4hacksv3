import { EligibilityBatchesService } from './eligibility-batches.service';
import { CreateBatchDto } from './dto';
export declare class EligibilityBatchesController {
    private readonly batchesService;
    constructor(batchesService: EligibilityBatchesService);
    create(hackathonId: string, userId: string, createDto: CreateBatchDto): Promise<{
        success: boolean;
        data: {
            batchProjects: ({
                project: {
                    name: string;
                    id: string;
                    teamName: string;
                    githubUrl: string;
                    track: {
                        name: string;
                        id: string;
                    };
                };
            } & {
                id: string;
                projectId: string;
                addedAt: Date;
                batchId: string;
            })[];
        } & {
            description: string | null;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            hackathonId: string;
            createdById: string;
            criteria: import("@prisma/client/runtime/library").JsonValue;
            totalProjects: number;
        };
    }>;
    findAll(hackathonId: string, userId: string): Promise<{
        success: boolean;
        data: ({
            _count: {
                batchProjects: number;
            };
        } & {
            description: string | null;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            hackathonId: string;
            createdById: string;
            criteria: import("@prisma/client/runtime/library").JsonValue;
            totalProjects: number;
        })[];
    }>;
    findOne(hackathonId: string, batchId: string, userId: string): Promise<{
        success: boolean;
        data: {
            batchProjects: ({
                project: {
                    hederaReports: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        summary: string | null;
                        status: import(".prisma/client").$Enums.ReportStatus;
                        projectId: string;
                        agentModel: string | null;
                        processingTime: number | null;
                        progress: number;
                        currentStage: string | null;
                        analysisStartedAt: Date | null;
                        analysisCompletedAt: Date | null;
                        errorMessage: string | null;
                        repositoryUrl: string;
                        technologyCategory: import(".prisma/client").$Enums.TechnologyCategory;
                        confidence: number;
                        detectedTechnologies: string[];
                        hederaUsageScore: number | null;
                        hederaPresenceDetected: boolean;
                        complexityLevel: import(".prisma/client").$Enums.HederaComplexityLevel | null;
                        presenceEvidence: import("@prisma/client/runtime/library").JsonValue;
                        evidenceFiles: import("@prisma/client/runtime/library").JsonValue;
                        detectedPatterns: import("@prisma/client/runtime/library").JsonValue;
                        libraryUsage: import("@prisma/client/runtime/library").JsonValue;
                        recommendations: import("@prisma/client/runtime/library").JsonValue;
                        strengths: string[];
                        improvements: string[];
                    }[];
                    eligibilityReports: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        status: import(".prisma/client").$Enums.ReportStatus;
                        projectId: string;
                        agentModel: string | null;
                        processingTime: number | null;
                        evidence: import("@prisma/client/runtime/library").JsonValue;
                        errorMessage: string | null;
                        repositoryUrl: string;
                        overallScore: number;
                        criteria: import("@prisma/client/runtime/library").JsonValue;
                        reason: string | null;
                        eligible: boolean;
                        repositoryStatus: string | null;
                        accessibilityCheck: import("@prisma/client/runtime/library").JsonValue;
                    }[];
                    track: {
                        description: string;
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        hackathonId: string;
                        order: number;
                        prize: string | null;
                        eligibilityCriteria: import("@prisma/client/runtime/library").JsonValue | null;
                    };
                } & {
                    description: string;
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    teamName: string;
                    teamMembers: import("@prisma/client/runtime/library").JsonValue;
                    githubUrl: string;
                    demoUrl: string | null;
                    videoUrl: string | null;
                    presentationUrl: string | null;
                    hackathonId: string;
                    trackId: string;
                    status: import(".prisma/client").$Enums.ProjectStatus;
                    slug: string;
                    technologies: string[];
                    submittedAt: Date | null;
                };
            } & {
                id: string;
                projectId: string;
                addedAt: Date;
                batchId: string;
            })[];
        } & {
            description: string | null;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            hackathonId: string;
            createdById: string;
            criteria: import("@prisma/client/runtime/library").JsonValue;
            totalProjects: number;
        };
    }>;
    delete(hackathonId: string, batchId: string, userId: string): Promise<{
        message: string;
        success: boolean;
    }>;
}
