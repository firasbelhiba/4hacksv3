import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';

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

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private octokit: Octokit;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('GITHUB_TOKEN');
    this.octokit = new Octokit({ auth: token });
  }

  parseGitHubUrl(url: string): GitHubRepository {
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

  async getRepositoryFiles(
    repoUrl: string,
    options?: { maxFiles?: number; path?: string }
  ): Promise<GitHubFile[]> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const maxFiles = options?.maxFiles || 50;
    const path = options?.path || '';

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      const files: GitHubFile[] = [];
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (files.length >= maxFiles) break;

        if (item.type === 'file') {
          try {
            const fileData = await this.getFileContent(owner, repo, item.path);
            if (fileData) {
              files.push(fileData);
            }
          } catch (error) {
            this.logger.warn(`Failed to fetch file ${item.path}:`, error);
          }
        } else if (item.type === 'dir' && files.length < maxFiles) {
          const subFiles = await this.getRepositoryFiles(repoUrl, {
            maxFiles: maxFiles - files.length,
            path: item.path,
          });
          files.push(...subFiles);
        }
      }

      return files;
    } catch (error) {
      this.logger.error('Error fetching repository files:', error);
      throw error;
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<GitHubFile | null> {
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
    } catch (error) {
      this.logger.error(`Error fetching file ${path}:`, error);
      return null;
    }
  }

  async getReadme(repoUrl: string): Promise<string | null> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);

    try {
      const { data } = await this.octokit.repos.getReadme({ owner, repo });
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch (error) {
      this.logger.warn('No README found');
      return null;
    }
  }

  async checkRepositoryAccessibility(
    owner: string,
    repo: string
  ): Promise<{
    accessible: boolean;
    isPublic: boolean;
    error?: string;
    metadata?: any;
  }> {
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
    } catch (error: any) {
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
}
