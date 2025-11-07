import { PrismaService } from '@/database/prisma.service';
export interface TrackDto {
    id?: string;
    name: string;
    description: string;
    prize?: string;
    order?: number;
    eligibilityCriteria?: string[];
}
export declare class TracksService {
    private prisma;
    constructor(prisma: PrismaService);
    private verifyHackathonAccess;
    findAll(hackathonId: string, userId: string, query?: string): Promise<({
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
    })[]>;
    create(hackathonId: string, userId: string, trackDto: TrackDto): Promise<{
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
    }>;
    batchUpdate(hackathonId: string, userId: string, tracks: TrackDto[]): Promise<({
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
    })[]>;
}
