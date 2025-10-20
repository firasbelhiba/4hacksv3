import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TogetherAIService } from './services/together-ai.service';
import { GitHubService } from './services/github.service';
import { InnovationProcessor } from './processors/innovation.processor';
import { CoherenceProcessor } from './processors/coherence.processor';
import { HederaProcessor } from './processors/hedera.processor';

@Module({
  imports: [
    // Register Bull queues
    BullModule.registerQueue({
      name: 'innovation',
    }),
    BullModule.registerQueue({
      name: 'coherence',
    }),
    BullModule.registerQueue({
      name: 'hedera',
    }),
    BullModule.registerQueue({
      name: 'code-quality',
    }),
  ],
  providers: [
    TogetherAIService,
    GitHubService,
    InnovationProcessor,
    CoherenceProcessor,
    HederaProcessor,
  ],
  exports: [
    TogetherAIService,
    GitHubService,
    BullModule,
  ],
})
export class AiAgentsModule {}
