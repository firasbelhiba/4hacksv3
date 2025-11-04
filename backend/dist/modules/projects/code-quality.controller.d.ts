import { CodeQualityService } from './services/code-quality.service';
export declare class CodeQualityController {
    private readonly codeQualityService;
    constructor(codeQualityService: CodeQualityService);
    getAllReports(projectId: string, userId: string): Promise<{
        success: boolean;
        data: ({
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
            status: import(".prisma/client").$Enums.ReportStatus;
            projectId: string;
            progress: number;
            currentStage: string | null;
            stageProgress: import("@prisma/client/runtime/library").JsonValue;
            analysisStartedAt: Date | null;
            analysisCompletedAt: Date | null;
            analysisTimeMs: number | null;
            errorMessage: string | null;
            repositoryUrl: string;
            recommendations: import("@prisma/client/runtime/library").JsonValue;
            strengths: string[];
            improvements: string[];
            overallScore: number | null;
            technicalScore: number | null;
            securityScore: number | null;
            documentationScore: number | null;
            performanceScore: number | null;
            richnessScore: number | null;
            codeSmellsCount: number | null;
            bugsCount: number | null;
            vulnerabilitiesCount: number | null;
            duplicatedLinesCount: number | null;
            totalLinesAnalyzed: number | null;
            fileAnalysis: import("@prisma/client/runtime/library").JsonValue;
            analysisErrors: string[];
            partialAnalysis: boolean;
            aiModel: string | null;
            aiCost: number | null;
            estimatedTimeRemaining: number | null;
            processedFiles: number | null;
            totalFiles: number | null;
            scoreEvidence: import("@prisma/client/runtime/library").JsonValue;
            scoreJustifications: import("@prisma/client/runtime/library").JsonValue;
            repositoryStructure: import("@prisma/client/runtime/library").JsonValue;
            packageAnalysis: import("@prisma/client/runtime/library").JsonValue;
            configurationAnalysis: import("@prisma/client/runtime/library").JsonValue;
            architecturalPatterns: import("@prisma/client/runtime/library").JsonValue;
            frameworkUtilization: import("@prisma/client/runtime/library").JsonValue;
            structuralComplexity: import("@prisma/client/runtime/library").JsonValue;
        })[];
    }>;
    startAnalysis(projectId: string, userId: string): Promise<{
        success: boolean;
        data: {
            reportId: string;
            status: import(".prisma/client").$Enums.ReportStatus;
            message: string;
        };
    }>;
    getReport(reportId: string, userId: string): Promise<{
        success: boolean;
        data: {
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
            status: import(".prisma/client").$Enums.ReportStatus;
            projectId: string;
            progress: number;
            currentStage: string | null;
            stageProgress: import("@prisma/client/runtime/library").JsonValue;
            analysisStartedAt: Date | null;
            analysisCompletedAt: Date | null;
            analysisTimeMs: number | null;
            errorMessage: string | null;
            repositoryUrl: string;
            recommendations: import("@prisma/client/runtime/library").JsonValue;
            strengths: string[];
            improvements: string[];
            overallScore: number | null;
            technicalScore: number | null;
            securityScore: number | null;
            documentationScore: number | null;
            performanceScore: number | null;
            richnessScore: number | null;
            codeSmellsCount: number | null;
            bugsCount: number | null;
            vulnerabilitiesCount: number | null;
            duplicatedLinesCount: number | null;
            totalLinesAnalyzed: number | null;
            fileAnalysis: import("@prisma/client/runtime/library").JsonValue;
            analysisErrors: string[];
            partialAnalysis: boolean;
            aiModel: string | null;
            aiCost: number | null;
            estimatedTimeRemaining: number | null;
            processedFiles: number | null;
            totalFiles: number | null;
            scoreEvidence: import("@prisma/client/runtime/library").JsonValue;
            scoreJustifications: import("@prisma/client/runtime/library").JsonValue;
            repositoryStructure: import("@prisma/client/runtime/library").JsonValue;
            packageAnalysis: import("@prisma/client/runtime/library").JsonValue;
            configurationAnalysis: import("@prisma/client/runtime/library").JsonValue;
            architecturalPatterns: import("@prisma/client/runtime/library").JsonValue;
            frameworkUtilization: import("@prisma/client/runtime/library").JsonValue;
            structuralComplexity: import("@prisma/client/runtime/library").JsonValue;
        };
    }>;
    getProgress(reportId: string, userId: string): Promise<{
        success: boolean;
        data: {
            reportId: string;
            status: import(".prisma/client").$Enums.ReportStatus;
            progress: number;
            currentStage: string;
            updatedAt: Date;
        };
    }>;
    deleteReport(projectId: string, reportId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
