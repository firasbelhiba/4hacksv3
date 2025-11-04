import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CodeQualityService } from './services/code-quality.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Code Quality')
@ApiBearerAuth('JWT-auth')
@Controller('projects/:projectId/code-quality')
@UseGuards(JwtAuthGuard)
export class CodeQualityController {
  constructor(private readonly codeQualityService: CodeQualityService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all code quality reports for a project',
    description: 'Retrieve a list of all code quality analysis reports for the specified project. Returns reports with status, scores, and timestamps. Reports are sorted by creation date (newest first).'
  })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: 'cm2abc123xyz' })
  @ApiResponse({
    status: 200,
    description: 'Reports retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'cm3report123',
            projectId: 'cm2abc123xyz',
            repositoryUrl: 'https://github.com/user/repo',
            status: 'COMPLETED',
            progress: 100,
            overallScore: 85,
            technicalScore: 88,
            securityScore: 82,
            documentationScore: 90,
            performanceScore: 84,
            richnessScore: 86,
            createdAt: '2025-10-30T10:00:00.000Z',
            analysisCompletedAt: '2025-10-30T10:03:00.000Z',
            project: {
              id: 'cm2abc123xyz',
              name: 'DeFi Swap',
              hackathon: { id: 'hack1', name: 'Web3 Hackathon' },
              track: { id: 'track1', name: 'DeFi Track' }
            }
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Project not found or access denied' })
  async getAllReports(@Param('projectId') projectId: string, @CurrentUser('id') userId: string) {
    try {
      const data = await this.codeQualityService.getAllReports(projectId, userId);
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start code quality analysis',
    description: 'Initiate a comprehensive AI-powered code quality analysis for the project. The analysis runs in the background and examines code structure, security, documentation, performance, and richness. Returns a report ID to track progress.'
  })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: 'cm2abc123xyz' })
  @ApiResponse({
    status: 200,
    description: 'Analysis started successfully',
    schema: {
      example: {
        success: true,
        data: {
          reportId: 'cm3report123',
          status: 'PENDING',
          message: 'Code quality analysis started'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid GitHub URL or repository not accessible' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Project not found or access denied' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Analysis already in progress for this project',
    schema: {
      example: {
        statusCode: 409,
        message: 'Code quality analysis is already in progress for this project',
        reportId: 'cm3report123',
        status: 'IN_PROGRESS'
      }
    }
  })
  async startAnalysis(@Param('projectId') projectId: string, @CurrentUser('id') userId: string) {
    try {
      const data = await this.codeQualityService.startAnalysis(projectId, userId);
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':reportId')
  @ApiOperation({
    summary: 'Get detailed code quality report',
    description: 'Retrieve the complete code quality analysis report with detailed scores, file-by-file analysis, issues found (code smells, bugs, vulnerabilities), recommendations, strengths, and areas for improvement. Only available for completed reports.'
  })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: 'cm2abc123xyz' })
  @ApiParam({ name: 'reportId', description: 'Report ID', example: 'cm3report123' })
  @ApiResponse({
    status: 200,
    description: 'Report retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'cm3report123',
          projectId: 'cm2abc123xyz',
          status: 'COMPLETED',
          progress: 100,
          overallScore: 85,
          technicalScore: 88,
          securityScore: 82,
          documentationScore: 90,
          performanceScore: 84,
          richnessScore: 86,
          codeSmellsCount: 5,
          bugsCount: 2,
          vulnerabilitiesCount: 1,
          totalLinesAnalyzed: 1200,
          fileAnalysis: {
            files: [
              {
                filename: 'index.ts',
                path: 'src/index.ts',
                language: 'TypeScript',
                linesOfCode: 150,
                complexity: 7,
                qualityScore: 85,
                richnessScore: 90,
                issues: {
                  codeSmells: ['Consider breaking down this function'],
                  bugs: [],
                  vulnerabilities: [],
                  suggestions: ['Add input validation']
                }
              }
            ],
            summary: {
              totalFiles: 15,
              totalLines: 1200,
              codeSmellsCount: 5,
              bugsCount: 2,
              vulnerabilitiesCount: 1
            }
          },
          recommendations: [
            {
              priority: 'high',
              category: 'Security',
              description: 'Add input validation for user data',
              impact: 'Prevents potential security vulnerabilities'
            }
          ],
          strengths: ['Well-structured codebase', 'Good test coverage'],
          improvements: ['Add more documentation', 'Optimize database queries'],
          createdAt: '2025-10-30T10:00:00.000Z',
          analysisCompletedAt: '2025-10-30T10:03:00.000Z',
          analysisTimeMs: 180000
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Report not found or access denied' })
  async getReport(@Param('reportId') reportId: string, @CurrentUser('id') userId: string) {
    try {
      const data = await this.codeQualityService.getReport(reportId, userId);
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':reportId/progress')
  @ApiOperation({
    summary: 'Get analysis progress',
    description: 'Track the real-time progress of an ongoing code quality analysis. Returns progress percentage (0-100), current stage, and status. Poll this endpoint every 2-5 seconds during analysis.'
  })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: 'cm2abc123xyz' })
  @ApiParam({ name: 'reportId', description: 'Report ID', example: 'cm3report123' })
  @ApiResponse({
    status: 200,
    description: 'Progress retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          reportId: 'cm3report123',
          status: 'IN_PROGRESS',
          progress: 50,
          currentStage: 'Running AI analysis',
          updatedAt: '2025-10-30T10:01:30.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Report not found or access denied' })
  async getProgress(@Param('reportId') reportId: string, @CurrentUser('id') userId: string) {
    try {
      const data = await this.codeQualityService.getProgress(reportId, userId);
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(':reportId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete code quality report',
    description: 'Permanently delete a code quality analysis report. This action cannot be undone. Only reports belonging to your projects can be deleted.'
  })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: 'cm2abc123xyz' })
  @ApiParam({ name: 'reportId', description: 'Report ID to delete', example: 'cm3report123' })
  @ApiResponse({
    status: 200,
    description: 'Report deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Report deleted successfully'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Report not found or does not belong to this project' })
  async deleteReport(
    @Param('projectId') projectId: string,
    @Param('reportId') reportId: string,
    @CurrentUser('id') userId: string,
  ) {
    try {
      await this.codeQualityService.deleteReport(reportId, projectId, userId);
      return {
        success: true,
        message: 'Report deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }
}
