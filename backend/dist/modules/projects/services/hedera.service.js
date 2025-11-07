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
var HederaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HederaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
const github_service_1 = require("../../ai-agents/services/github.service");
const client_1 = require("@prisma/client");
let HederaService = HederaService_1 = class HederaService {
    constructor(prisma, githubService) {
        this.prisma = prisma;
        this.githubService = githubService;
        this.logger = new common_1.Logger(HederaService_1.name);
        this.HEDERA_PATTERNS = {
            npm: [
                '@hashgraph/sdk',
                '@hashgraph/hedera-wallet-connect',
                'hedera-sdk',
                '@hashgraph/cryptography',
                '@hashgraph/proto'
            ],
            maven: [
                'com.hedera.hashgraph',
                'hedera-sdk-java'
            ],
            python: [
                'hedera-sdk-py',
                'hedera-sdk-python'
            ],
            go: [
                'github.com/hashgraph/hedera-sdk-go'
            ],
            imports: [
                '@hashgraph/sdk',
                'com.hedera.hashgraph',
                'hedera',
                'hashgraph'
            ],
            endpoints: [
                'mainnet.hedera.com',
                'testnet.hedera.com',
                'previewnet.hedera.com',
                'mainnet-public.mirrornode.hedera.com',
                'testnet.mirrornode.hedera.com'
            ],
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
    }
    async detectHederaUsageLevel1(owner, repo) {
        const result = {
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
            await this.checkDependencyFiles(owner, repo, result);
            await this.searchHederaPatterns(owner, repo, result);
            this.calculateConfidenceAndComplexity(result);
            result.summary = this.generateSummary(result);
            this.logger.log(`Hedera detection for ${owner}/${repo}: ${result.detected ? 'DETECTED' : 'NOT DETECTED'} (confidence: ${result.confidence}%)`);
        }
        catch (error) {
            this.logger.error(`Error detecting Hedera usage: ${error.message}`);
            throw error;
        }
        return result;
    }
    async checkDependencyFiles(owner, repo, result) {
        await this.checkPackageJson(owner, repo, result);
        await this.checkPomXml(owner, repo, result);
        await this.checkRequirementsTxt(owner, repo, result);
        await this.checkGoMod(owner, repo, result);
    }
    async checkPackageJson(owner, repo, result) {
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
        }
        catch (error) {
            this.logger.debug(`No package.json found for ${owner}/${repo}`);
        }
    }
    async checkPomXml(owner, repo, result) {
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
        }
        catch (error) {
            this.logger.debug(`No pom.xml found for ${owner}/${repo}`);
        }
    }
    async checkRequirementsTxt(owner, repo, result) {
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
        }
        catch (error) {
            this.logger.debug(`No requirements.txt found for ${owner}/${repo}`);
        }
    }
    async checkGoMod(owner, repo, result) {
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
        }
        catch (error) {
            this.logger.debug(`No go.mod found for ${owner}/${repo}`);
        }
    }
    async searchHederaPatterns(owner, repo, result) {
        try {
            const accountIdPattern = '0.0.';
            const searchResults = await this.githubService.searchCode(owner, repo, accountIdPattern);
            if (searchResults && searchResults.length > 0) {
                result.detectedPatterns.accountIds = searchResults.slice(0, 5);
                result.detected = true;
            }
        }
        catch (error) {
            this.logger.debug(`Account ID search failed: ${error.message}`);
        }
        for (const endpoint of this.HEDERA_PATTERNS.endpoints) {
            try {
                const searchResults = await this.githubService.searchCode(owner, repo, endpoint);
                if (searchResults && searchResults.length > 0) {
                    result.detectedPatterns.networkEndpoints.push(endpoint);
                    result.detected = true;
                }
            }
            catch (error) {
                this.logger.debug(`Endpoint search for ${endpoint} failed: ${error.message}`);
            }
        }
        for (const importPattern of this.HEDERA_PATTERNS.imports.slice(0, 2)) {
            try {
                const searchResults = await this.githubService.searchCode(owner, repo, `import ${importPattern}`);
                if (searchResults && searchResults.length > 0) {
                    result.detectedPatterns.imports.push(importPattern);
                    result.detected = true;
                }
            }
            catch (error) {
                this.logger.debug(`Import search for ${importPattern} failed: ${error.message}`);
            }
        }
    }
    calculateConfidenceAndComplexity(result) {
        let score = 0;
        if (result.detectedPatterns.dependencies.length > 0) {
            score += 50;
            score += Math.min(result.detectedPatterns.dependencies.length * 10, 30);
        }
        if (result.detectedPatterns.networkEndpoints.length > 0) {
            score += 10;
        }
        if (result.detectedPatterns.accountIds.length > 0) {
            score += 10;
        }
        if (result.detectedPatterns.imports.length > 0) {
            score += 10;
        }
        result.confidence = Math.min(score, 100);
        if (result.detected) {
            const techCount = result.detectedTechnologies.length;
            const patternCount = result.detectedPatterns.dependencies.length +
                result.detectedPatterns.imports.length +
                result.detectedPatterns.accountIds.length +
                result.detectedPatterns.networkEndpoints.length;
            if (patternCount >= 5 || techCount >= 2) {
                result.complexityLevel = client_1.HederaComplexityLevel.ADVANCED;
            }
            else if (patternCount >= 3 || techCount >= 1) {
                result.complexityLevel = client_1.HederaComplexityLevel.MODERATE;
            }
            else {
                result.complexityLevel = client_1.HederaComplexityLevel.SIMPLE;
            }
        }
    }
    generateSummary(result) {
        if (!result.detected) {
            return 'No Hedera technology detected in this project.';
        }
        const parts = [];
        if (result.detectedTechnologies.length > 0) {
            parts.push(`Uses ${result.detectedTechnologies.join(', ')}`);
        }
        if (result.detectedPatterns.networkEndpoints.length > 0) {
            const networks = result.detectedPatterns.networkEndpoints
                .map((e) => {
                if (e.includes('mainnet'))
                    return 'Mainnet';
                if (e.includes('testnet'))
                    return 'Testnet';
                if (e.includes('previewnet'))
                    return 'Previewnet';
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
    async analyzeBatch(hackathonId, projectIds, userId) {
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
                const analysisResult = await this.detectHederaUsageLevel1(repoInfo.owner, repoInfo.repo);
                const existingReport = await this.prisma.hedera_analysis_reports.findFirst({
                    where: { projectId },
                });
                if (existingReport) {
                    await this.prisma.hedera_analysis_reports.update({
                        where: { id: existingReport.id },
                        data: {
                            status: 'COMPLETED',
                            technologyCategory: analysisResult.detected
                                ? client_1.TechnologyCategory.HEDERA
                                : client_1.TechnologyCategory.NO_BLOCKCHAIN,
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
                }
                else {
                    await this.prisma.hedera_analysis_reports.create({
                        data: {
                            projectId,
                            repositoryUrl: project.githubUrl,
                            status: 'COMPLETED',
                            technologyCategory: analysisResult.detected
                                ? client_1.TechnologyCategory.HEDERA
                                : client_1.TechnologyCategory.NO_BLOCKCHAIN,
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
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            catch (error) {
                failed++;
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.logger.error(`❌ FAILED PROJECT ${processed + failed}/${projectIds.length}`);
                this.logger.error(`   Project ID: ${projectId}`);
                this.logger.error(`   Error: ${error.message}`);
                this.logger.error(`   Remaining: ${projectIds.length - (processed + failed)} projects`);
                this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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
                    }
                    else {
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
                }
                catch (dbError) {
                    this.logger.error(`Failed to save error status: ${dbError.message}`);
                }
            }
        }
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
};
exports.HederaService = HederaService;
exports.HederaService = HederaService = HederaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        github_service_1.GitHubService])
], HederaService);
//# sourceMappingURL=hedera.service.js.map