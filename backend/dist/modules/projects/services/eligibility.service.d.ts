import { PrismaService } from '@/database/prisma.service';
export declare class EligibilityService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    checkEligibility(projectId: string, userId: string): Promise<{
        projectId: string;
        projectName: string;
        trackName: string;
        hackathonName: string;
        isEligible: boolean;
        checks: {
            hasGithubUrl: boolean;
            hasDescription: boolean;
            hasTeamMembers: boolean;
            trackEligibility: {
                eligible: boolean;
                message: string;
                criteria?: undefined;
            } | {
                eligible: boolean;
                message: string;
                criteria: any;
            };
        };
        message: string;
    }>;
    private checkTrackEligibility;
}
