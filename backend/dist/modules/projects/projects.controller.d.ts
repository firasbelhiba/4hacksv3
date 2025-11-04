import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    findAll(userId: string): Promise<{
        success: boolean;
        data: ({
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
    findOne(id: string, userId: string): Promise<{
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
        };
    }>;
    create(userId: string, createDto: CreateProjectDto): Promise<{
        success: boolean;
        data: {
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
        };
        message: string;
    }>;
    update(id: string, userId: string, updateDto: UpdateProjectDto): Promise<{
        success: boolean;
        data: {
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
        };
        message: string;
    }>;
    remove(id: string, userId: string): Promise<{
        message: string;
        success: boolean;
    }>;
}
