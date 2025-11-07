import { HackathonsService } from './hackathons.service';
import { CreateHackathonDto, UpdateHackathonDto, HackathonFilterDto } from './dto';
export declare class HackathonsController {
    private readonly hackathonsService;
    constructor(hackathonsService: HackathonsService);
    findAll(userId: string, filters: HackathonFilterDto): Promise<{
        data: ({
            tracks: {
                name: string;
                id: string;
                _count: {
                    projects: number;
                };
            }[];
            _count: {
                tracks: number;
                projects: number;
            };
            createdBy: {
                name: string;
                email: string;
                id: string;
            };
        } & {
            description: string;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            startDate: Date;
            endDate: Date;
            prizePool: string | null;
            organizationName: string;
            bannerImage: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue;
            createdById: string;
        })[];
        pagination: {
            currentPage: number;
            pageSize: number;
            totalCount: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
        success: boolean;
    }>;
    findOne(id: string, userId: string, projectsPage?: number, projectsPageSize?: number): Promise<{
        success: boolean;
        data: {
            project: {
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
            };
            tracks: ({
                _count: {
                    projects: number;
                };
            } & {
                description: string;
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                hackathonId: string;
                order: number;
                prize: string | null;
                eligibilityCriteria: import("@prisma/client/runtime/library").JsonValue | null;
            })[];
            _count: {
                tracks: number;
                projects: number;
            };
            createdBy: {
                name: string;
                email: string;
                id: string;
            };
            description: string;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            startDate: Date;
            endDate: Date;
            prizePool: string | null;
            organizationName: string;
            bannerImage: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue;
            createdById: string;
        };
    }>;
    create(userId: string, createDto: CreateHackathonDto): Promise<{
        success: boolean;
        data: {
            tracks: {
                description: string;
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                hackathonId: string;
                order: number;
                prize: string | null;
                eligibilityCriteria: import("@prisma/client/runtime/library").JsonValue | null;
            }[];
            description: string;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            startDate: Date;
            endDate: Date;
            prizePool: string | null;
            organizationName: string;
            bannerImage: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue;
            createdById: string;
        };
        message: string;
    }>;
    update(id: string, userId: string, updateDto: UpdateHackathonDto): Promise<{
        success: boolean;
        data: {
            tracks: {
                description: string;
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                hackathonId: string;
                order: number;
                prize: string | null;
                eligibilityCriteria: import("@prisma/client/runtime/library").JsonValue | null;
            }[];
        } & {
            description: string;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            startDate: Date;
            endDate: Date;
            prizePool: string | null;
            organizationName: string;
            bannerImage: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue;
            createdById: string;
        };
        message: string;
    }>;
    remove(id: string, userId: string): Promise<{
        message: string;
        success: boolean;
    }>;
}
