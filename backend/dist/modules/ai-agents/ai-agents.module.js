"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiAgentsModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const together_ai_service_1 = require("./services/together-ai.service");
const github_service_1 = require("./services/github.service");
const innovation_processor_1 = require("./processors/innovation.processor");
const coherence_processor_1 = require("./processors/coherence.processor");
const hedera_processor_1 = require("./processors/hedera.processor");
let AiAgentsModule = class AiAgentsModule {
};
exports.AiAgentsModule = AiAgentsModule;
exports.AiAgentsModule = AiAgentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bull_1.BullModule.registerQueue({
                name: 'innovation',
            }),
            bull_1.BullModule.registerQueue({
                name: 'coherence',
            }),
            bull_1.BullModule.registerQueue({
                name: 'hedera',
            }),
            bull_1.BullModule.registerQueue({
                name: 'code-quality',
            }),
        ],
        providers: [
            together_ai_service_1.TogetherAIService,
            github_service_1.GitHubService,
            innovation_processor_1.InnovationProcessor,
            coherence_processor_1.CoherenceProcessor,
            hedera_processor_1.HederaProcessor,
        ],
        exports: [
            together_ai_service_1.TogetherAIService,
            github_service_1.GitHubService,
            bull_1.BullModule,
        ],
    })
], AiAgentsModule);
//# sourceMappingURL=ai-agents.module.js.map