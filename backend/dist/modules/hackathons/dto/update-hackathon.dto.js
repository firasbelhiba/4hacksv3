"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateHackathonDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_hackathon_dto_1 = require("./create-hackathon.dto");
class UpdateHackathonDto extends (0, mapped_types_1.PartialType)(create_hackathon_dto_1.CreateHackathonDto) {
}
exports.UpdateHackathonDto = UpdateHackathonDto;
//# sourceMappingURL=update-hackathon.dto.js.map