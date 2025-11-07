"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EligibilityBatchesModule = void 0;
const common_1 = require("@nestjs/common");
const eligibility_batches_controller_1 = require("./eligibility-batches.controller");
const eligibility_batches_service_1 = require("./eligibility-batches.service");
let EligibilityBatchesModule = class EligibilityBatchesModule {
};
exports.EligibilityBatchesModule = EligibilityBatchesModule;
exports.EligibilityBatchesModule = EligibilityBatchesModule = __decorate([
    (0, common_1.Module)({
        controllers: [eligibility_batches_controller_1.EligibilityBatchesController],
        providers: [eligibility_batches_service_1.EligibilityBatchesService],
        exports: [eligibility_batches_service_1.EligibilityBatchesService],
    })
], EligibilityBatchesModule);
//# sourceMappingURL=eligibility-batches.module.js.map