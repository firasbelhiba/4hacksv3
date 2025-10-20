"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIJuryController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const ai_jury_sessions_service_1 = require("./services/ai-jury-sessions.service");
const ai_jury_layers_service_1 = require("./services/ai-jury-layers.service");
const ai_jury_progress_service_1 = require("./services/ai-jury-progress.service");
const create_session_dto_1 = require("./dto/create-session.dto");
const execute_layer_dto_1 = require("./dto/execute-layer.dto");
let AIJuryController = class AIJuryController {
    constructor(sessionsService, layersService, progressService) {
        this.sessionsService = sessionsService;
        this.layersService = layersService;
        this.progressService = progressService;
    }
    async getSession(hackathonId, userId) {
        return this.sessionsService.getSession(hackathonId, userId);
    }
    async createSession(dto, userId) {
        return this.sessionsService.createSession(dto.hackathonId, userId, dto.eligibilityCriteria);
    }
    async getProgress(sessionId, userId) {
        return this.sessionsService.getProgress(sessionId, userId);
    }
    async getLiveProgress(sessionId) {
        const sessionProgress = this.progressService.getSessionProgress(sessionId);
        if (!sessionProgress) {
            return {
                sessionId,
                status: 'not_found',
                message: 'No active progress tracking for this session',
            };
        }
        const layers = {};
        sessionProgress.layers.forEach((value, key) => {
            layers[key] = value;
        });
        return {
            ...sessionProgress,
            layers,
        };
    }
    async getResults(sessionId, userId) {
        return this.sessionsService.getResults(sessionId, userId);
    }
    async executeLayer(sessionId, dto, userId) {
        return this.layersService.executeLayer(sessionId, dto.layer, userId);
    }
    async resetSession(sessionId, userId) {
        return this.sessionsService.resetSession(sessionId, userId);
    }
};
exports.AIJuryController = AIJuryController;
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, common_1.Query)('hackathonId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AIJuryController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)('sessions'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_session_dto_1.CreateSessionDto, String]),
    __metadata("design:returntype", Promise)
], AIJuryController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('sessions/:id/progress'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AIJuryController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Get)('sessions/:id/live-progress'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AIJuryController.prototype, "getLiveProgress", null);
__decorate([
    (0, common_1.Get)('sessions/:id/results'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AIJuryController.prototype, "getResults", null);
__decorate([
    (0, common_1.Post)('sessions/:id/execute-layer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, execute_layer_dto_1.ExecuteLayerDto, String]),
    __metadata("design:returntype", Promise)
], AIJuryController.prototype, "executeLayer", null);
__decorate([
    (0, common_1.Post)('sessions/:id/reset'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AIJuryController.prototype, "resetSession", null);
exports.AIJuryController = AIJuryController = __decorate([
    (0, common_1.Controller)('ai-jury'),
    __metadata("design:paramtypes", [ai_jury_sessions_service_1.AIJurySessionsService,
        ai_jury_layers_service_1.AIJuryLayersService,
        ai_jury_progress_service_1.AIJuryProgressService])
], AIJuryController);
//# sourceMappingURL=ai-jury.controller.js.map