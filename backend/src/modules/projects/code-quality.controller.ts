import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CodeQualityService } from './services/code-quality.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('projects/:projectId/code-quality')
@UseGuards(JwtAuthGuard)
export class CodeQualityController {
  constructor(private readonly codeQualityService: CodeQualityService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async startAnalysis(@Param('projectId') projectId: string, @CurrentUser('id') userId: string) {
    const data = await this.codeQualityService.startAnalysis(projectId, userId);
    return {
      success: true,
      data,
    };
  }

  @Get(':reportId')
  async getReport(@Param('reportId') reportId: string, @CurrentUser('id') userId: string) {
    const data = await this.codeQualityService.getReport(reportId, userId);
    return {
      success: true,
      data,
    };
  }

  @Get(':reportId/progress')
  async getProgress(@Param('reportId') reportId: string, @CurrentUser('id') userId: string) {
    const data = await this.codeQualityService.getProgress(reportId, userId);
    return {
      success: true,
      data,
    };
  }
}
