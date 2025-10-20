declare class TeamMemberDto {
    name: string;
    email?: string;
    role?: string;
}
export declare class CreateProjectDto {
    name: string;
    description: string;
    teamName: string;
    teamMembers: TeamMemberDto[];
    githubUrl: string;
    demoUrl?: string;
    videoUrl?: string;
    presentationUrl?: string;
    hackathonId: string;
    trackId: string;
}
export {};
