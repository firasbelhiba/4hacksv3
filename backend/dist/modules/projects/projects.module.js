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
const projects_service_1 = require("./projects.service");
const projects_controller_1 = require("./projects.controller");
const reviews_service_1 = require("./services/reviews.service");
const reviews_controller_1 = require("./reviews.controller");
const code_quality_service_1 = require("./services/code-quality.service");
const code_quality_controller_1 = require("./code-quality.controller");
const eligibility_service_1 = require("./services/eligibility.service");
const eligibility_controller_1 = require("./eligibility.controller");
const ai_agents_module_1 = require("../ai-agents/ai-agents.module");
let ProjectsModule = class ProjectsModule {
};
exports.ProjectsModule = ProjectsModule;
exports.ProjectsModule = ProjectsModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_agents_module_1.AiAgentsModule],
        controllers: [
            projects_controller_1.ProjectsController,
            reviews_controller_1.ReviewsController,
            reviews_controller_1.BatchReviewsController,
            code_quality_controller_1.CodeQualityController,
            eligibility_controller_1.EligibilityController,
        ],
        providers: [
            projects_service_1.ProjectsService,
            reviews_service_1.ReviewsService,
            code_quality_service_1.CodeQualityService,
            eligibility_service_1.EligibilityService,
        ],
        exports: [
            projects_service_1.ProjectsService,
            reviews_service_1.ReviewsService,
            code_quality_service_1.CodeQualityService,
            eligibility_service_1.EligibilityService,
        ],
    })
], ProjectsModule);
//# sourceMappingURL=projects.module.js.map