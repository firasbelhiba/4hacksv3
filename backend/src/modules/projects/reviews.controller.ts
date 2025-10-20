import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './services/reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('projects/:projectId/review')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Overall review status
  @Get('status')
  async getReviewStatus(@Param('projectId') projectId: string, @CurrentUser('id') userId: string) {
    const data = await this.reviewsService.getReviewStatus(projectId, userId);
    return {
      success: true,
      data,
    };
  }

  // Innovation Review
  @Post('innovation')
  @HttpCode(HttpStatus.OK)
  async startInnovationReview(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.reviewsService.startInnovationReview(projectId, userId);
    return {
      success: true,
      data,
    };
  }

  @Get('innovation/:reportId')
  async getInnovationReport(@Param('reportId') reportId: string, @CurrentUser('id') userId: string) {
    const data = await this.reviewsService.getInnovationReport(reportId, userId);
    return {
      success: true,
      data,
    };
  }

  // Coherence Review
  @Post('coherence')
  @HttpCode(HttpStatus.OK)
  async startCoherenceReview(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.reviewsService.startCoherenceReview(projectId, userId);
    return {
      success: true,
      data,
    };
  }

  @Get('coherence/:reportId')
  async getCoherenceReport(@Param('reportId') reportId: string, @CurrentUser('id') userId: string) {
    const data = await this.reviewsService.getCoherenceReport(reportId, userId);
    return {
      success: true,
      data,
    };
  }

  @Delete('coherence/:reportId/delete')
  @HttpCode(HttpStatus.OK)
  async deleteCoherenceReport(
    @Param('reportId') reportId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.reviewsService.deleteCoherenceReport(reportId, userId);
    return {
      success: true,
      ...result,
    };
  }

  // Hedera Review
  @Post('hedera')
  @HttpCode(HttpStatus.OK)
  async startHederaReview(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.reviewsService.startHederaReview(projectId, userId);
    return {
      success: true,
      data,
    };
  }

  @Get('hedera/:reportId')
  async getHederaReport(@Param('reportId') reportId: string, @CurrentUser('id') userId: string) {
    const data = await this.reviewsService.getHederaReport(reportId, userId);
    return {
      success: true,
      data,
    };
  }
}

// Separate controller for batch operations
@Controller('projects/reviews')
@UseGuards(JwtAuthGuard)
export class BatchReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Batch review status for multiple projects
  @Get('batch-status')
  async getBatchReviewStatus(
    @Query('projectIds') projectIds: string,
    @CurrentUser('id') userId: string,
  ) {
    const projectIdArray = projectIds.split(',').filter(id => id.trim());
    const data = await this.reviewsService.getBatchReviewStatus(projectIdArray, userId);
    return {
      success: true,
      data,
    };
  }
}
