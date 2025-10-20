"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HackathonsModule = void 0;
const common_1 = require("@nestjs/common");
const hackathons_service_1 = require("./hackathons.service");
const hackathons_controller_1 = require("./hackathons.controller");
const tracks_service_1 = require("./tracks.service");
const tracks_controller_1 = require("./tracks.controller");
const projects_controller_1 = require("./projects.controller");
const projects_module_1 = require("../projects/projects.module");
let HackathonsModule = class HackathonsModule {
};
exports.HackathonsModule = HackathonsModule;
exports.HackathonsModule = HackathonsModule = __decorate([
    (0, common_1.Module)({
        imports: [projects_module_1.ProjectsModule],
        controllers: [hackathons_controller_1.HackathonsController, tracks_controller_1.TracksController, projects_controller_1.HackathonProjectsController],
        providers: [hackathons_service_1.HackathonsService, tracks_service_1.TracksService],
        exports: [hackathons_service_1.HackathonsService, tracks_service_1.TracksService],
    })
], HackathonsModule);
//# sourceMappingURL=hackathons.module.js.map