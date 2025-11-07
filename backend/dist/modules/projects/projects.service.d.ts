import { PrismaService } from '@/database/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { GitHubService } from '../ai-agents/services/github.service';
export declare class ProjectsService {
    private prisma;
    private githubService;
    private readonly logger;
    constructor(prisma: PrismaService, githubService: GitHubService);
    private slugify;
    private verifyProjectAccess;
    findAll(userId: string): Promise<{
        projects: ({
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
        })[];
        count: number;
    }>;
    findOne(projectId: string, userId: string): Promise<{
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
    }>;
    create(userId: string, createDto: CreateProjectDto): Promise<{
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
    }>;
    update(projectId: string, userId: string, updateDto: UpdateProjectDto): Promise<{
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
    }>;
    remove(projectId: string, userId: string): Promise<{
        message: string;
    }>;
    findByHackathon(hackathonId: string, userId: string, page?: number, pageSize?: number): Promise<{
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
    }>;
    checkRepositoriesAccessibility(hackathonId: string, userId: string, projectIds: string[]): Promise<any[]>;
}
