import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AIJurySessionsService } from './services/ai-jury-sessions.service';
import { AIJuryLayersService } from './services/ai-jury-layers.service';
import { AIJuryProgressService } from './services/ai-jury-progress.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ExecuteLayerDto } from './dto/execute-layer.dto';

@Controller('ai-jury')
export class AIJuryController {
  constructor(
    private sessionsService: AIJurySessionsService,
    private layersService: AIJuryLayersService,
    private progressService: AIJuryProgressService,
  ) {}

  // GET /api/ai-jury/sessions?hackathonId=xxx
  @Get('sessions')
  async getSession(
    @Query('hackathonId') hackathonId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionsService.getSession(hackathonId, userId);
  }

  // POST /api/ai-jury/sessions
  @Post('sessions')
  async createSession(
    @Body() dto: CreateSessionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionsService.createSession(
      dto.hackathonId,
      userId,
      dto.eligibilityCriteria
    );
  }

  // GET /api/ai-jury/sessions/:id/progress
  @Get('sessions/:id/progress')
  async getProgress(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionsService.getProgress(sessionId, userId);
  }

  // GET /api/ai-jury/sessions/:id/live-progress
  @Get('sessions/:id/live-progress')
  async getLiveProgress(
    @Param('id') sessionId: string,
  ) {
    const sessionProgress = this.progressService.getSessionProgress(sessionId);

    if (!sessionProgress) {
      return {
        sessionId,
        status: 'not_found',
        message: 'No active progress tracking for this session',
      };
    }

    // Convert Map to object for JSON serialization
    const layers: Record<number, any> = {};
    sessionProgress.layers.forEach((value, key) => {
      layers[key] = value;
    });

    return {
      ...sessionProgress,
      layers,
    };
  }

  // GET /api/ai-jury/sessions/:id/results
  @Get('sessions/:id/results')
  async getResults(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionsService.getResults(sessionId, userId);
  }

  // POST /api/ai-jury/sessions/:id/execute-layer
  @Post('sessions/:id/execute-layer')
  async executeLayer(
    @Param('id') sessionId: string,
    @Body() dto: ExecuteLayerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.layersService.executeLayer(sessionId, dto.layer, userId);
  }

  // POST /api/ai-jury/sessions/:id/reset
  @Post('sessions/:id/reset')
  async resetSession(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionsService.resetSession(sessionId, userId);
  }
}
