import { Controller, Post, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { EligibilityService } from './services/eligibility.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('projects/:projectId')
@UseGuards(JwtAuthGuard)
export class EligibilityController {
  constructor(private readonly eligibilityService: EligibilityService) {}

  @Post('eligibility-check')
  @HttpCode(HttpStatus.OK)
  async checkEligibility(@Param('projectId') projectId: string, @CurrentUser('id') userId: string) {
    const data = await this.eligibilityService.checkEligibility(projectId, userId);
    return {
      success: true,
      data,
    };
  }
}
