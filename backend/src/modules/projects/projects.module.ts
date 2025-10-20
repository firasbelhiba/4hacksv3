import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ReviewsService } from './services/reviews.service';
import { ReviewsController, BatchReviewsController } from './reviews.controller';
import { CodeQualityService } from './services/code-quality.service';
import { CodeQualityController } from './code-quality.controller';
import { EligibilityService } from './services/eligibility.service';
import { EligibilityController } from './eligibility.controller';
import { AiAgentsModule } from '../ai-agents/ai-agents.module';

@Module({
  imports: [AiAgentsModule],
  controllers: [
    ProjectsController,
    ReviewsController,
    BatchReviewsController,
    CodeQualityController,
    EligibilityController,
  ],
  providers: [
    ProjectsService,
    ReviewsService,
    CodeQualityService,
    EligibilityService,
  ],
  exports: [
    ProjectsService,
    ReviewsService,
    CodeQualityService,
    EligibilityService,
  ],
})
export class ProjectsModule {}
