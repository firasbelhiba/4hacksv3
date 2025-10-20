import { Module } from '@nestjs/common';
import { AIJuryController } from './ai-jury.controller';
import { AIJurySessionsService } from './services/ai-jury-sessions.service';
import { AIJuryLayersService } from './services/ai-jury-layers.service';
import { AIJuryProgressService } from './services/ai-jury-progress.service';
import { AiAgentsModule } from '../ai-agents/ai-agents.module';

@Module({
  imports: [AiAgentsModule],
  controllers: [AIJuryController],
  providers: [
    AIJurySessionsService,
    AIJuryLayersService,
    AIJuryProgressService,
  ],
  exports: [
    AIJurySessionsService,
    AIJuryLayersService,
    AIJuryProgressService,
  ],
})
export class AIJuryModule {}
