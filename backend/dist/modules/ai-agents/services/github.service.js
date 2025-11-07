"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GitHubService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const rest_1 = require("@octokit/rest");
let GitHubService = GitHubService_1 = class GitHubService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(GitHubService_1.name);
        const token = this.configService.get('GITHUB_TOKEN');
        this.octokit = new rest_1.Octokit({ auth: token });
    }
    parseGitHubUrl(url) {
        const patterns = [
            /github\.com\/([^\/]+)\/([^\/]+)/,
            /github\.com\/([^\/]+)\/([^\/]+)\.git/,
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                const owner = match[1];
                const repo = match[2].replace(/\.git$/, '');
                return {
                    owner,
                    repo,
                    branch: 'main',
                    url,
                };
            }
        }
        throw new Error('Invalid GitHub URL');
    }
    async getRepositoryFiles(repoUrl, options) {
        const { owner, repo } = this.parseGitHubUrl(repoUrl);
        const maxFiles = options?.maxFiles || 50;
        const path = options?.path || '';
        try {
            const { data } = await this.octokit.repos.getContent({
                owner,
                repo,
                path,
            });
            const files = [];
            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
                if (files.length >= maxFiles)
                    break;
                if (item.type === 'file') {
                    try {
                        const fileData = await this.getFileContent(owner, repo, item.path);
                        if (fileData) {
                            files.push(fileData);
                        }
                    }
                    catch (error) {
                        this.logger.warn(`Failed to fetch file ${item.path}:`, error);
                    }
                }
                else if (item.type === 'dir' && files.length < maxFiles) {
                    const subFiles = await this.getRepositoryFiles(repoUrl, {
                        maxFiles: maxFiles - files.length,
                        path: item.path,
                    });
                    files.push(...subFiles);
                }
            }
            return files;
        }
        catch (error) {
            this.logger.error('Error fetching repository files:', error);
            throw error;
        }
    }
    async getFileContent(owner, repo, path) {
        try {
            const { data } = await this.octokit.repos.getContent({
                owner,
                repo,
                path,
            });
            if ('content' in data && data.type === 'file') {
                const content = Buffer.from(data.content, 'base64').toString('utf-8');
                return {
                    name: data.name,
                    path: data.path,
                    content,
                    size: data.size,
                    type: 'file',
                    sha: data.sha,
                };
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Error fetching file ${path}:`, error);
            return null;
        }
    }
    async getReadme(repoUrl) {
        const { owner, repo } = this.parseGitHubUrl(repoUrl);
        try {
            const { data } = await this.octokit.repos.getReadme({ owner, repo });
            return Buffer.from(data.content, 'base64').toString('utf-8');
        }
        catch (error) {
            this.logger.warn('No README found');
            return null;
        }
    }
    async checkRepositoryAccessibility(owner, repo) {
        try {
            const { data } = await this.octokit.repos.get({ owner, repo });
            return {
                accessible: true,
                isPublic: !data.private,
                metadata: {
                    name: data.name,
                    fullName: data.full_name,
                    description: data.description,
                    stars: data.stargazers_count,
                    forks: data.forks_count,
                    language: data.language,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at,
                },
            };
        }
        catch (error) {
            if (error.status === 404) {
                return {
                    accessible: false,
                    isPublic: false,
                    error: 'Repository not found or is private',
                };
            }
            return {
                accessible: false,
                isPublic: false,
                error: error.message || 'Unknown error',
            };
        }
    }
    async searchCode(owner, repo, query) {
        try {
            const searchQuery = `${query} repo:${owner}/${repo}`;
            const { data } = await this.octokit.search.code({
                q: searchQuery,
                per_page: 5,
            });
            return data.items.map((item) => item.path);
        }
        catch (error) {
            if (error.status === 403 || error.status === 422) {
                this.logger.debug(`Code search rate limited or restricted for query: ${query}`);
                return [];
            }
            this.logger.error(`Error searching code: ${error.message}`);
            return [];
        }
    }
};
exports.GitHubService = GitHubService;
exports.GitHubService = GitHubService = GitHubService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GitHubService);
//# sourceMappingURL=github.service.js.map