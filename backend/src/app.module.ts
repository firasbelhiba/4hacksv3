import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { HackathonsModule } from './modules/hackathons/hackathons.module';
import { AiAgentsModule } from './modules/ai-agents/ai-agents.module';
import { AIJuryModule } from './modules/ai-jury/ai-jury.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EventsModule } from './modules/events/events.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Bull Queue configuration
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),

    // Database
    DatabaseModule,

    // Feature modules
    AuthModule,
    HackathonsModule,
    ProjectsModule,
    AiAgentsModule,
    AIJuryModule,
    ScoringModule,
    NotificationsModule,
    EventsModule,
  ],
  controllers: [],
  providers: [
    // Global auth guard - all routes require authentication unless @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
