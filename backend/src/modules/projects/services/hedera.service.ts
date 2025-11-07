import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { GitHubService } from '@/modules/ai-agents/services/github.service';
import { TechnologyCategory, HederaComplexityLevel } from '@prisma/client';

interface HederaDetectionResult {
  detected: boolean;
  confidence: number;
  complexityLevel: HederaComplexityLevel | null;
  detectedTechnologies: string[];
  detectedPatterns: {
    dependencies: string[];
    imports: string[];
    accountIds: string[];
    networkEndpoints: string[];
  };
  evidenceFiles: {
    file: string;
    type: 'dependency' | 'code' | 'config';
    evidence: string[];
  }[];
  summary: string;
}

@Injectable()
export class HederaService {
  private readonly logger = new Logger(HederaService.name);

  // Hedera SDK patterns for different languages
  private readonly HEDERA_PATTERNS = {
    // JavaScript/TypeScript
    npm: [
      '@hashgraph/sdk',
      '@hashgraph/hedera-wallet-connect',
      'hedera-sdk',
      '@hashgraph/cryptography',
      '@hashgraph/proto'
    ],
    // Java
    maven: [
      'com.hedera.hashgraph',
      'hedera-sdk-java'
    ],
    // Python
    python: [
      'hedera-sdk-py',
      'hedera-sdk-python'
    ],
    // Go
    go: [
      'github.com/hashgraph/hedera-sdk-go'
    ],
    // Import patterns
    imports: [
      '@hashgraph/sdk',
      'com.hedera.hashgraph',
      'hedera',
      'hashgraph'
    ],
    // Network endpoints
    endpoints: [
      'mainnet.hedera.com',
      'testnet.hedera.com',
      'previewnet.hedera.com',
      'mainnet-public.mirrornode.hedera.com',
      'testnet.mirrornode.hedera.com'
    ],
    // Hedera-specific code patterns
    codePatterns: [
      'Client.forMainnet',
      'Client.forTestnet',
      'Client.forPreviewnet',
      'AccountId',
      'ContractId',
      'TopicId',
      'TokenId',
      'TransactionId',
      'Hbar',
      'AccountCreateTransaction',
      'TransferTransaction',
      'TopicCreateTransaction',
      'TopicMessageSubmitTransaction',
      'TokenCreateTransaction',
      'ContractCreateTransaction',
      'ConsensusTopicId',
      'HederaPreCheckStatusException'
    ]
  };

  constructor(
    private prisma: PrismaService,
    private githubService: GitHubService,
  ) {}

  /**
   * Level 1: Fast detection - Check dependencies and basic patterns
   * This is optimized for speed and uses GitHub API to check key files
   */
  async detectHederaUsageLevel1(
    owner: string,
    repo: string,
  ): Promise<HederaDetectionResult> {
    const result: HederaDetectionResult = {
      detected: false,
      confidence: 0,
      complexityLevel: null,
      detectedTechnologies: [],
      detectedPatterns: {
        dependencies: [],
        imports: [],
        accountIds: [],
        networkEndpoints: [],
      },
      evidenceFiles: [],
      summary: '',
    };

    try {
      // Check dependency files
      await this.checkDependencyFiles(owner, repo, result);

      // Quick code search for Hedera patterns
      await this.searchHederaPatterns(owner, repo, result);

      // Calculate confidence and complexity
      this.calculateConfidenceAndComplexity(result);

      // Generate summary
      result.summary = this.generateSummary(result);

      this.logger.log(
        `Hedera detection for ${owner}/${repo}: ${result.detected ? 'DETECTED' : 'NOT DETECTED'} (confidence: ${result.confidence}%)`,
      );
    } catch (error) {
      this.logger.error(`Error detecting Hedera usage: ${error.message}`);
      throw error;
    }

    return result;
  }

  /**
   * Check package.json, pom.xml, requirements.txt, go.mod for Hedera dependencies
   */
  private async checkDependencyFiles(
    owner: string,
    repo: string,
    result: HederaDetectionResult,
  ): Promise<void> {
    // Check package.json (JavaScript/TypeScript)
    await this.checkPackageJson(owner, repo, result);

    // Check pom.xml (Java Maven)
    await this.checkPomXml(owner, repo, result);

    // Check requirements.txt (Python)
    await this.checkRequirementsTxt(owner, repo, result);

    // Check go.mod (Go)
    await this.checkGoMod(owner, repo, result);
  }

  private async checkPackageJson(
    owner: string,
    repo: string,
    result: HederaDetectionResult,
  ): Promise<void> {
    try {
      const fileData = await this.githubService.getFileContent(owner, repo, 'package.json');
      if (fileData && fileData.content) {
        const packageJson = JSON.parse(fileData.content);
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        for (const dep of this.HEDERA_PATTERNS.npm) {
          if (allDeps[dep]) {
            result.detectedPatterns.dependencies.push(`${dep}@${allDeps[dep]}`);
            result.detectedTechnologies.push(dep);
            result.detected = true;
          }
        }

        if (result.detectedPatterns.dependencies.length > 0) {
          result.evidenceFiles.push({
            file: 'package.json',
            type: 'dependency',
            evidence: result.detectedPatterns.dependencies,
          });
        }
      }
    } catch (error) {
      // File doesn't exist or can't be read - not an error
      this.logger.debug(`No package.json found for ${owner}/${repo}`);
    }
  }

  private async checkPomXml(
    owner: string,
    repo: string,
    result: HederaDetectionResult,
  ): Promise<void> {
    try {
      const fileData = await this.githubService.getFileContent(owner, repo, 'pom.xml');
      if (fileData && fileData.content) {
        for (const pattern of this.HEDERA_PATTERNS.maven) {
          if (fileData.content.includes(pattern)) {
            result.detectedPatterns.dependencies.push(pattern);
            result.detectedTechnologies.push('Hedera Java SDK');
            result.detected = true;

            result.evidenceFiles.push({
              file: 'pom.xml',
              type: 'dependency',
              evidence: [pattern],
            });
          }
        }
      }
    } catch (error) {
      this.logger.debug(`No pom.xml found for ${owner}/${repo}`);
    }
  }

  private async checkRequirementsTxt(
    owner: string,
    repo: string,
    result: HederaDetectionResult,
  ): Promise<void> {
    try {
      const fileData = await this.githubService.getFileContent(owner, repo, 'requirements.txt');
      if (fileData && fileData.content) {
        for (const pattern of this.HEDERA_PATTERNS.python) {
          if (fileData.content.includes(pattern)) {
            result.detectedPatterns.dependencies.push(pattern);
            result.detectedTechnologies.push('Hedera Python SDK');
            result.detected = true;

            result.evidenceFiles.push({
              file: 'requirements.txt',
              type: 'dependency',
              evidence: [pattern],
            });
          }
        }
      }
    } catch (error) {
      this.logger.debug(`No requirements.txt found for ${owner}/${repo}`);
    }
  }

  private async checkGoMod(
    owner: string,
    repo: string,
    result: HederaDetectionResult,
  ): Promise<void> {
    try {
      const fileData = await this.githubService.getFileContent(owner, repo, 'go.mod');
      if (fileData && fileData.content) {
        for (const pattern of this.HEDERA_PATTERNS.go) {
          if (fileData.content.includes(pattern)) {
            result.detectedPatterns.dependencies.push(pattern);
            result.detectedTechnologies.push('Hedera Go SDK');
            result.detected = true;

            result.evidenceFiles.push({
              file: 'go.mod',
              type: 'dependency',
              evidence: [pattern],
            });
          }
        }
      }
    } catch (error) {
      this.logger.debug(`No go.mod found for ${owner}/${repo}`);
    }
  }

  /**
   * Search for Hedera patterns in code using GitHub search API
   */
  private async searchHederaPatterns(
    owner: string,
    repo: string,
    result: HederaDetectionResult,
  ): Promise<void> {
    // Search for account ID patterns (0.0.xxxxx)
    try {
      const accountIdPattern = '0.0.';
      const searchResults = await this.githubService.searchCode(
        owner,
        repo,
        accountIdPattern,
      );

      if (searchResults && searchResults.length > 0) {
        result.detectedPatterns.accountIds = searchResults.slice(0, 5);
        result.detected = true;
      }
    } catch (error) {
      this.logger.debug(`Account ID search failed: ${error.message}`);
    }

    // Search for network endpoints
    for (const endpoint of this.HEDERA_PATTERNS.endpoints) {
      try {
        const searchResults = await this.githubService.searchCode(
          owner,
          repo,
          endpoint,
        );

        if (searchResults && searchResults.length > 0) {
          result.detectedPatterns.networkEndpoints.push(endpoint);
          result.detected = true;
        }
      } catch (error) {
        this.logger.debug(`Endpoint search for ${endpoint} failed: ${error.message}`);
      }
    }

    // Search for common Hedera imports
    for (const importPattern of this.HEDERA_PATTERNS.imports.slice(0, 2)) {
      try {
        const searchResults = await this.githubService.searchCode(
          owner,
          repo,
          `import ${importPattern}`,
        );

        if (searchResults && searchResults.length > 0) {
          result.detectedPatterns.imports.push(importPattern);
          result.detected = true;
        }
      } catch (error) {
        this.logger.debug(`Import search for ${importPattern} failed: ${error.message}`);
      }
    }
  }

  /**
   * Calculate confidence score and complexity level based on detected patterns
   */
  private calculateConfidenceAndComplexity(result: HederaDetectionResult): void {
    let score = 0;

    // Dependency detection is highly reliable
    if (result.detectedPatterns.dependencies.length > 0) {
      score += 50;
      score += Math.min(result.detectedPatterns.dependencies.length * 10, 30);
    }

    // Network endpoints indicate actual usage
    if (result.detectedPatterns.networkEndpoints.length > 0) {
      score += 10;
    }

    // Account IDs indicate real Hedera accounts
    if (result.detectedPatterns.accountIds.length > 0) {
      score += 10;
    }

    // Imports confirm SDK usage
    if (result.detectedPatterns.imports.length > 0) {
      score += 10;
    }

    result.confidence = Math.min(score, 100);

    // Determine complexity level
    if (result.detected) {
      const techCount = result.detectedTechnologies.length;
      const patternCount =
        result.detectedPatterns.dependencies.length +
        result.detectedPatterns.imports.length +
        result.detectedPatterns.accountIds.length +
        result.detectedPatterns.networkEndpoints.length;

      if (patternCount >= 5 || techCount >= 2) {
        result.complexityLevel = HederaComplexityLevel.ADVANCED;
      } else if (patternCount >= 3 || techCount >= 1) {
        result.complexityLevel = HederaComplexityLevel.MODERATE;
      } else {
        result.complexityLevel = HederaComplexityLevel.SIMPLE;
      }
    }
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(result: HederaDetectionResult): string {
    if (!result.detected) {
      return 'No Hedera technology detected in this project.';
    }

    const parts: string[] = [];

    if (result.detectedTechnologies.length > 0) {
      parts.push(
        `Uses ${result.detectedTechnologies.join(', ')}`,
      );
    }

    if (result.detectedPatterns.networkEndpoints.length > 0) {
      const networks = result.detectedPatterns.networkEndpoints
        .map((e) => {
          if (e.includes('mainnet')) return 'Mainnet';
          if (e.includes('testnet')) return 'Testnet';
          if (e.includes('previewnet')) return 'Previewnet';
          return e;
        })
        .filter((v, i, a) => a.indexOf(v) === i);

      parts.push(`Connected to ${networks.join(', ')}`);
    }

    if (parts.length === 0) {
      return 'Hedera technology detected based on code patterns.';
    }

    return parts.join('. ') + '.';
  }

  /**
   * Analyze multiple projects for Hedera usage
   */
  async analyzeBatch(
    hackathonId: string,
    projectIds: string[],
    userId: string,
  ): Promise<{ processed: number; detected: number; failed: number }> {
    this.logger.log('\n╔═══════════════════════════════════════════════════════════════════════════════╗');
    this.logger.log('║                     🚀 HEDERA BATCH ANALYSIS STARTED                         ║');
    this.logger.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
    this.logger.log(`📊 Total Projects: ${projectIds.length}`);
    this.logger.log(`⏱️  Estimated Time: ~${Math.ceil(projectIds.length / 60)} minutes`);
    this.logger.log(`📅 Started: ${new Date().toLocaleString()}\n`);

    let processed = 0;
    let detected = 0;
    let failed = 0;

    for (const projectId of projectIds) {
      try {
        const project = await this.prisma.projects.findFirst({
          where: {
            id: projectId,
            hackathonId,
            hackathon: {
              createdById: userId,
            },
          },
        });

        if (!project || !project.githubUrl || project.githubUrl === 'N/A') {
          failed++;
          continue;
        }

        const repoInfo = this.githubService.parseGitHubUrl(project.githubUrl);
        if (!repoInfo) {
          failed++;
          continue;
        }

        const analysisResult = await this.detectHederaUsageLevel1(
          repoInfo.owner,
          repoInfo.repo,
        );

        // Save analysis result to database
        const existingReport = await this.prisma.hedera_analysis_reports.findFirst({
          where: { projectId },
        });

        if (existingReport) {
          await this.prisma.hedera_analysis_reports.update({
            where: { id: existingReport.id },
            data: {
              status: 'COMPLETED',
              technologyCategory: analysisResult.detected
                ? TechnologyCategory.HEDERA
                : TechnologyCategory.NO_BLOCKCHAIN,
              confidence: analysisResult.confidence,
              detectedTechnologies: analysisResult.detectedTechnologies,
              hederaPresenceDetected: analysisResult.detected,
              complexityLevel: analysisResult.complexityLevel,
              detectedPatterns: analysisResult.detectedPatterns,
              evidenceFiles: analysisResult.evidenceFiles,
              summary: analysisResult.summary,
              progress: 100,
              analysisCompletedAt: new Date(),
              agentModel: 'Level1-PatternDetection',
            },
          });
        } else {
          await this.prisma.hedera_analysis_reports.create({
            data: {
              projectId,
              repositoryUrl: project.githubUrl,
              status: 'COMPLETED',
              technologyCategory: analysisResult.detected
                ? TechnologyCategory.HEDERA
                : TechnologyCategory.NO_BLOCKCHAIN,
              confidence: analysisResult.confidence,
              detectedTechnologies: analysisResult.detectedTechnologies,
              hederaPresenceDetected: analysisResult.detected,
              complexityLevel: analysisResult.complexityLevel,
              detectedPatterns: analysisResult.detectedPatterns,
              evidenceFiles: analysisResult.evidenceFiles,
              summary: analysisResult.summary,
              progress: 100,
              analysisStartedAt: new Date(),
              analysisCompletedAt: new Date(),
              agentModel: 'Level1-PatternDetection',
            },
          });
        }

        processed++;
        if (analysisResult.detected) {
          detected++;
        }

        // Log completion with visual separator
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.log(`✅ FINISHED PROJECT ${processed}/${projectIds.length} (${Math.round((processed / projectIds.length) * 100)}%)`);
        this.logger.log(`   Project: ${project.name || 'Unknown'}`);
        this.logger.log(`   Repository: ${repoInfo.owner}/${repoInfo.repo}`);
        this.logger.log(`   Hedera Detected: ${analysisResult.detected ? '✓ YES' : '✗ NO'} (${analysisResult.confidence}% confidence)`);
        if (analysisResult.detected) {
          this.logger.log(`   Technologies: ${analysisResult.detectedTechnologies.join(', ')}`);
          this.logger.log(`   Complexity: ${analysisResult.complexityLevel}`);
        }
        this.logger.log(`   Remaining: ${projectIds.length - processed} projects (~${Math.ceil((projectIds.length - processed) / 60)} minutes)`);
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Rate limiting: 1 request per second
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        failed++;

        // Log failure with visual separator
        this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.error(`❌ FAILED PROJECT ${processed + failed}/${projectIds.length}`);
        this.logger.error(`   Project ID: ${projectId}`);
        this.logger.error(`   Error: ${error.message}`);
        this.logger.error(`   Remaining: ${projectIds.length - (processed + failed)} projects`);
        this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Save failed status
        try {
          const existingReport = await this.prisma.hedera_analysis_reports.findFirst({
            where: { projectId },
          });

          if (existingReport) {
            await this.prisma.hedera_analysis_reports.update({
              where: { id: existingReport.id },
              data: {
                status: 'FAILED',
                errorMessage: error.message,
              },
            });
          } else {
            await this.prisma.hedera_analysis_reports.create({
              data: {
                projectId,
                repositoryUrl: '',
                status: 'FAILED',
                errorMessage: error.message,
                progress: 0,
              },
            });
          }
        } catch (dbError) {
          this.logger.error(`Failed to save error status: ${dbError.message}`);
        }
      }
    }

    // Final completion banner
    this.logger.log('\n╔═══════════════════════════════════════════════════════════════════════════════╗');
    this.logger.log('║                     🎉 HEDERA BATCH ANALYSIS COMPLETED                       ║');
    this.logger.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
    this.logger.log(`📊 Total Processed: ${processed + failed}/${projectIds.length}`);
    this.logger.log(`✅ Successful: ${processed}`);
    this.logger.log(`🔍 Hedera Detected: ${detected} projects`);
    this.logger.log(`❌ Failed: ${failed}`);
    this.logger.log(`📅 Completed: ${new Date().toLocaleString()}\n`);

    return { processed, detected, failed };
  }
}
