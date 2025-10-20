import { TracksService, TrackDto } from './tracks.service';
export declare class TracksController {
    private readonly tracksService;
    constructor(tracksService: TracksService);
    findAll(hackathonId: string, userId: string, query?: string): Promise<{
        success: boolean;
        data: ({
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
            prize: string | null;
            order: number;
            eligibilityCriteria: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    }>;
    create(hackathonId: string, userId: string, trackDto: TrackDto): Promise<{
        success: boolean;
        data: {
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
            prize: string | null;
            order: number;
            eligibilityCriteria: import("@prisma/client/runtime/library").JsonValue | null;
        };
        message: string;
    }>;
    batchUpdate(hackathonId: string, userId: string, tracks: TrackDto[]): Promise<{
        success: boolean;
        data: ({
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
            prize: string | null;
            order: number;
            eligibilityCriteria: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        message: string;
    }>;
}
