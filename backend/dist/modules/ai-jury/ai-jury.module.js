"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIJuryModule = void 0;
const common_1 = require("@nestjs/common");
const ai_jury_controller_1 = require("./ai-jury.controller");
const ai_jury_sessions_service_1 = require("./services/ai-jury-sessions.service");
const ai_jury_layers_service_1 = require("./services/ai-jury-layers.service");
const ai_jury_progress_service_1 = require("./services/ai-jury-progress.service");
const ai_agents_module_1 = require("../ai-agents/ai-agents.module");
let AIJuryModule = class AIJuryModule {
};
exports.AIJuryModule = AIJuryModule;
exports.AIJuryModule = AIJuryModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_agents_module_1.AiAgentsModule],
        controllers: [ai_jury_controller_1.AIJuryController],
        providers: [
            ai_jury_sessions_service_1.AIJurySessionsService,
            ai_jury_layers_service_1.AIJuryLayersService,
            ai_jury_progress_service_1.AIJuryProgressService,
        ],
        exports: [
            ai_jury_sessions_service_1.AIJurySessionsService,
            ai_jury_layers_service_1.AIJuryLayersService,
            ai_jury_progress_service_1.AIJuryProgressService,
        ],
    })
], AIJuryModule);
//# sourceMappingURL=ai-jury.module.js.map