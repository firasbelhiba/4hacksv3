import { EligibilityService } from './services/eligibility.service';
export declare class EligibilityController {
    private readonly eligibilityService;
    constructor(eligibilityService: EligibilityService);
    checkEligibility(projectId: string, userId: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
