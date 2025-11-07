import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus, Logger, NotFoundException } from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { HederaService } from './services/hedera.service';
import { PrismaService } from '@/database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class AnalyzeBatchDto {
  @IsArray()
  @IsString({ each: true })
  projectIds: string[];
}

@Controller()
@UseGuards(JwtAuthGuard)
export class HederaController {
  private readonly logger = new Logger(HederaController.name);

  constructor(
    private readonly hederaService: HederaService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('hackathons/:hackathonId/hedera-analysis/batch')
  @HttpCode(HttpStatus.OK)
  async analyzeBatch(
    @Param('hackathonId') hackathonId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AnalyzeBatchDto,
  ) {
    this.logger.log(`Starting Hedera batch analysis for ${dto.projectIds.length} projects`);

    // Run analysis asynchronously (don't await)
    this.hederaService.analyzeBatch(
      hackathonId,
      dto.projectIds,
      userId,
    ).catch(error => {
      this.logger.error(`Batch analysis failed: ${error.message}`);
    });

    // Return immediately so frontend can start polling
    return {
      success: true,
      data: {
        queued: dto.projectIds.length,
        status: 'processing',
      },
      message: `Started analysis for ${dto.projectIds.length} projects`,
    };
  }

  @Get('projects/:projectId/hedera-report')
  async getHederaReport(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    // Verify user has access to this project
    const project = await this.prisma.projects.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: userId,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    // Get hedera report
    const report = await this.prisma.hedera_analysis_reports.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: report,
    };
  }

  @Get('hackathons/:hackathonId/hedera-reports')
  async getAllHederaReports(
    @Param('hackathonId') hackathonId: string,
    @CurrentUser('id') userId: string,
  ) {
    // Verify user has access to this hackathon
    const hackathon = await this.prisma.hackathons.findFirst({
      where: {
        id: hackathonId,
        createdById: userId,
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found or access denied');
    }

    // Get all projects for this hackathon with their hedera reports
    const projects = await this.prisma.projects.findMany({
      where: {
        hackathonId,
      },
      include: {
        hederaReports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Transform data
    const results = projects.map(project => ({
      project: {
        id: project.id,
        name: project.name,
        teamName: project.teamName,
        githubUrl: project.githubUrl,
      },
      report: project.hederaReports[0] || null,
    }));

    return {
      success: true,
      data: results,
    };
  }
}
