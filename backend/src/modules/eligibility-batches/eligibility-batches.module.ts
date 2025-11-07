import { Module } from '@nestjs/common';
import { EligibilityBatchesController } from './eligibility-batches.controller';
import { EligibilityBatchesService } from './eligibility-batches.service';

@Module({
  controllers: [EligibilityBatchesController],
  providers: [EligibilityBatchesService],
  exports: [EligibilityBatchesService],
})
export class EligibilityBatchesModule {}
