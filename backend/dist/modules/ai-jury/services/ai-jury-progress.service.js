"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AIJuryProgressService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIJuryProgressService = void 0;
const common_1 = require("@nestjs/common");
let AIJuryProgressService = AIJuryProgressService_1 = class AIJuryProgressService {
    constructor() {
        this.logger = new common_1.Logger(AIJuryProgressService_1.name);
        this.sessions = new Map();
    }
    initializeSession(sessionId, totalProjects) {
        this.sessions.set(sessionId, {
            sessionId,
            totalProjects,
            layers: new Map(),
            startTime: Date.now(),
            status: 'in_progress',
        });
        this.logger.log(`🎬 AI Jury session ${sessionId} initialized with ${totalProjects} projects`);
    }
    startLayer(sessionId, layer, totalProjects) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            this.logger.warn(`Session ${sessionId} not found`);
            return;
        }
        session.currentLayer = layer;
        session.layers.set(layer, {
            layer,
            totalProjects,
            processedProjects: 0,
            eliminatedProjects: 0,
            advancedProjects: 0,
            startTime: Date.now(),
            status: 'in_progress',
        });
        this.logger.log(`▶️  Layer ${layer} started for session ${sessionId} with ${totalProjects} projects`);
    }
    startProcessingProject(sessionId, layer, projectId, projectName) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        const layerProgress = session.layers.get(layer);
        if (!layerProgress)
            return;
        layerProgress.currentProject = {
            id: projectId,
            name: projectName,
            status: 'processing',
        };
        this.logger.debug(`   🔄 Processing project "${projectName}" in Layer ${layer}`);
    }
    completeProject(sessionId, layer, projectId, projectName, eliminated, score) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        const layerProgress = session.layers.get(layer);
        if (!layerProgress)
            return;
        layerProgress.processedProjects++;
        if (eliminated) {
            layerProgress.eliminatedProjects++;
        }
        else {
            layerProgress.advancedProjects++;
        }
        if (layerProgress.currentProject?.id === projectId) {
            layerProgress.currentProject.status = 'completed';
        }
        const emoji = eliminated ? '❌' : '✅';
        const scoreText = score !== undefined ? ` (score: ${Math.round(score)})` : '';
        this.logger.debug(`   ${emoji} "${projectName}"${scoreText} - ${eliminated ? 'eliminated' : 'advanced'}`);
    }
    completeLayer(sessionId, layer, eliminated, advanced) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        const layerProgress = session.layers.get(layer);
        if (!layerProgress)
            return;
        layerProgress.endTime = Date.now();
        layerProgress.status = 'completed';
        layerProgress.eliminatedProjects = eliminated;
        layerProgress.advancedProjects = advanced;
        const duration = layerProgress.endTime - layerProgress.startTime;
        this.logger.log(`✅ Layer ${layer} completed in ${Math.round(duration / 1000)}s - ` +
            `${eliminated} eliminated, ${advanced} advanced`);
    }
    completeSession(sessionId, finalResults) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        session.endTime = Date.now();
        session.status = 'completed';
        session.finalResults = finalResults;
        const duration = session.endTime - session.startTime;
        this.logger.log(`🎉 AI Jury session ${sessionId} completed in ${Math.round(duration / 1000)}s`);
    }
    getSessionProgress(sessionId) {
        return this.sessions.get(sessionId);
    }
    getLayerProgress(sessionId, layer) {
        const session = this.sessions.get(sessionId);
        return session?.layers.get(layer);
    }
    clearSession(sessionId) {
        this.sessions.delete(sessionId);
        this.logger.log(`🗑️  Session ${sessionId} cleared from memory`);
    }
};
exports.AIJuryProgressService = AIJuryProgressService;
exports.AIJuryProgressService = AIJuryProgressService = AIJuryProgressService_1 = __decorate([
    (0, common_1.Injectable)()
], AIJuryProgressService);
//# sourceMappingURL=ai-jury-progress.service.js.map