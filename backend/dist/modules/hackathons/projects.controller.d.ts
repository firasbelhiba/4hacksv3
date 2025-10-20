import { ProjectsService } from '../projects/projects.service';
export declare class HackathonProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    findAll(hackathonId: string, userId: string, page?: number, pageSize?: number): Promise<{
        data: ({
            codeQualityReports: {
                id: string;
                status: import(".prisma/client").$Enums.ReportStatus;
                overallScore: number;
            }[];
            coherenceReports: {
                id: string;
                status: import(".prisma/client").$Enums.ReportStatus;
                score: number;
            }[];
            innovationReports: {
                id: string;
                status: import(".prisma/client").$Enums.ReportStatus;
                score: number;
            }[];
            hederaReports: {
                id: string;
                status: import(".prisma/client").$Enums.ReportStatus;
                hederaUsageScore: number;
            }[];
            hackathon: {
                name: string;
                id: string;
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
        })[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
        success: boolean;
    }>;
}
