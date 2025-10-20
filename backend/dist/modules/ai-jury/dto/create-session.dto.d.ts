export declare class CreateSessionDto {
    hackathonId: string;
    eligibilityCriteria?: {
        submissionDeadline?: boolean;
        repositoryAccess?: boolean;
        repositoryPublic?: boolean;
    };
}
