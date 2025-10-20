import { ConfigService } from '@nestjs/config';
export interface GitHubFile {
    name: string;
    path: string;
    content: string;
    size: number;
    type: 'file' | 'dir';
    sha: string;
}
export interface GitHubRepository {
    owner: string;
    repo: string;
    branch: string;
    url: string;
}
export declare class GitHubService {
    private configService;
    private readonly logger;
    private octokit;
    constructor(configService: ConfigService);
    parseGitHubUrl(url: string): GitHubRepository;
    getRepositoryFiles(repoUrl: string, options?: {
        maxFiles?: number;
        path?: string;
    }): Promise<GitHubFile[]>;
    getFileContent(owner: string, repo: string, path: string): Promise<GitHubFile | null>;
    getReadme(repoUrl: string): Promise<string | null>;
    checkRepositoryAccessibility(owner: string, repo: string): Promise<{
        accessible: boolean;
        isPublic: boolean;
        error?: string;
        metadata?: any;
    }>;
}
