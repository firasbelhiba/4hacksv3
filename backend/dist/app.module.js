"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bull_1 = require("@nestjs/bull");
const core_1 = require("@nestjs/core");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./modules/auth/auth.module");
const projects_module_1 = require("./modules/projects/projects.module");
const hackathons_module_1 = require("./modules/hackathons/hackathons.module");
const ai_agents_module_1 = require("./modules/ai-agents/ai-agents.module");
const ai_jury_module_1 = require("./modules/ai-jury/ai-jury.module");
const scoring_module_1 = require("./modules/scoring/scoring.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const events_module_1 = require("./modules/events/events.module");
const eligibility_batches_module_1 = require("./modules/eligibility-batches/eligibility-batches.module");
const jwt_auth_guard_1 = require("./modules/auth/guards/jwt-auth.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            bull_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    redis: {
                        host: configService.get('REDIS_HOST', 'localhost'),
                        port: configService.get('REDIS_PORT', 6379),
                        password: configService.get('REDIS_PASSWORD'),
                    },
                }),
            }),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            hackathons_module_1.HackathonsModule,
            projects_module_1.ProjectsModule,
            ai_agents_module_1.AiAgentsModule,
            ai_jury_module_1.AIJuryModule,
            scoring_module_1.ScoringModule,
            notifications_module_1.NotificationsModule,
            events_module_1.EventsModule,
            eligibility_batches_module_1.EligibilityBatchesModule,
        ],
        controllers: [],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map