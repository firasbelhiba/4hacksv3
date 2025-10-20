import { Queue } from 'bull';
import { PrismaService } from '@/database/prisma.service';
export declare class ReviewsService {
    private prisma;
    private innovationQueue;
    private coherenceQueue;
    private hederaQueue;
    private readonly logger;
    constructor(prisma: PrismaService, innovationQueue: Queue, coherenceQueue: Queue, hederaQueue: Queue);
    private verifyProjectAccess;
    getReviewStatus(projectId: string, userId: string): Promise<{
        codeQuality: {
            status: import(".prisma/client").$Enums.ReportStatus;
            reportId: string;
            score: number;
        } | {
            status: string;
            reportId: any;
            score: any;
        };
        innovation: {
            status: import(".prisma/client").$Enums.ReportStatus;
            reportId: string;
            score: number;
        } | {
            status: string;
            reportId: any;
            score: any;
        };
        coherence: {
            status: import(".prisma/client").$Enums.ReportStatus;
            reportId: string;
            score: number;
        } | {
            status: string;
            reportId: any;
            score: any;
        };
        hedera: {
            status: import(".prisma/client").$Enums.ReportStatus;
            reportId: string;
            score: number;
        } | {
            status: string;
            reportId: any;
            score: any;
        };
    }>;
    getBatchReviewStatus(projectIds: string[], userId: string): Promise<{}>;
    startInnovationReview(projectId: string, userId: string): Promise<{
        reportId: string;
        status: import(".prisma/client").$Enums.ReportStatus;
        message: string;
    }>;
    getInnovationReport(reportId: string, userId: string): Promise<{
        project: {
            hackathon: {
                name: string;
                id: string;
                createdById: string;
            };
            track: {
                name: string;
                id: string;
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
        createdAt: Date;
        updatedAt: Date;
        summary: string;
        status: import(".prisma/client").$Enums.ReportStatus;
        projectId: string;
        score: number;
        noveltyScore: number;
        creativityScore: number;
        technicalInnovation: number;
        marketInnovation: number;
        implementationInnovation: number;
        similarProjects: import("@prisma/client/runtime/library").JsonValue;
        uniqueAspects: import("@prisma/client/runtime/library").JsonValue;
        innovationEvidence: import("@prisma/client/runtime/library").JsonValue;
        potentialImpact: string;
        patentPotential: boolean;
        patentabilityScore: number | null;
        patentAssessment: import("@prisma/client/runtime/library").JsonValue | null;
        suggestions: import("@prisma/client/runtime/library").JsonValue;
        agentModel: string;
        processingTime: number;
        isArchived: boolean;
    }>;
    startCoherenceReview(projectId: string, userId: string): Promise<{
        reportId: string;
        status: import(".prisma/client").$Enums.ReportStatus;
        message: string;
    }>;
    getCoherenceReport(reportId: string, userId: string): Promise<{
        project: {
            hackathon: {
                name: string;
                id: string;
                createdById: string;
            };
            track: {
                name: string;
                id: string;
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
        createdAt: Date;
        updatedAt: Date;
        summary: string;
        status: import(".prisma/client").$Enums.ReportStatus;
        projectId: string;
        score: number;
        suggestions: import("@prisma/client/runtime/library").JsonValue;
        agentModel: string;
        processingTime: number;
        trackAlignment: number;
        readmeExists: boolean;
        readmeQuality: number;
        projectPurpose: string;
        trackJustification: string;
        inconsistencies: import("@prisma/client/runtime/library").JsonValue;
        evidence: import("@prisma/client/runtime/library").JsonValue;
        progress: number;
        currentStage: string | null;
        stageProgress: import("@prisma/client/runtime/library").JsonValue;
        analysisStartedAt: Date | null;
        analysisCompletedAt: Date | null;
        analysisTimeMs: number | null;
        errorMessage: string | null;
    }>;
    startHederaReview(projectId: string, userId: string): Promise<{
        reportId: string;
        status: import(".prisma/client").$Enums.ReportStatus;
        message: string;
    }>;
    getHederaReport(reportId: string, userId: string): Promise<{
        project: {
            hackathon: {
                name: string;
                id: string;
                createdById: string;
            };
            track: {
                name: string;
                id: string;
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
    }>;
    deleteCoherenceReport(reportId: string, userId: string): Promise<{
        message: string;
    }>;
}
