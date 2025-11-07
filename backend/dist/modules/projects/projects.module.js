"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const projects_service_1 = require("./projects.service");
const projects_controller_1 = require("./projects.controller");
const reviews_service_1 = require("./services/reviews.service");
const reviews_controller_1 = require("./reviews.controller");
const code_quality_service_1 = require("./services/code-quality.service");
const code_quality_controller_1 = require("./code-quality.controller");
const code_quality_processor_1 = require("./processors/code-quality.processor");
const eligibility_service_1 = require("./services/eligibility.service");
const eligibility_controller_1 = require("./eligibility.controller");
const hedera_service_1 = require("./services/hedera.service");
const hedera_controller_1 = require("./hedera.controller");
const ai_agents_module_1 = require("../ai-agents/ai-agents.module");
let ProjectsModule = class ProjectsModule {
};
exports.ProjectsModule = ProjectsModule;
exports.ProjectsModule = ProjectsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            ai_agents_module_1.AiAgentsModule,
            bull_1.BullModule.registerQueue({
                name: 'code-quality',
            }),
        ],
        controllers: [
            projects_controller_1.ProjectsController,
            reviews_controller_1.ReviewsController,
            reviews_controller_1.BatchReviewsController,
            code_quality_controller_1.CodeQualityController,
            eligibility_controller_1.EligibilityController,
            hedera_controller_1.HederaController,
        ],
        providers: [
            projects_service_1.ProjectsService,
            reviews_service_1.ReviewsService,
            code_quality_service_1.CodeQualityService,
            code_quality_processor_1.CodeQualityProcessor,
            eligibility_service_1.EligibilityService,
            hedera_service_1.HederaService,
        ],
        exports: [
            projects_service_1.ProjectsService,
            reviews_service_1.ReviewsService,
            code_quality_service_1.CodeQualityService,
            eligibility_service_1.EligibilityService,
            hedera_service_1.HederaService,
        ],
    })
], ProjectsModule);
//# sourceMappingURL=projects.module.js.map