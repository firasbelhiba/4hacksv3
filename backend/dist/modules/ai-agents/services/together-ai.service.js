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
var TogetherAIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TogetherAIService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const together_ai_1 = require("together-ai");
let TogetherAIService = TogetherAIService_1 = class TogetherAIService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(TogetherAIService_1.name);
        const apiKey = this.configService.get('TOGETHER_AI_API_KEY');
        if (!apiKey) {
            this.logger.warn('TOGETHER_AI_API_KEY not configured - AI features will be disabled');
            this.together = null;
        }
        else {
            this.together = new together_ai_1.default({ apiKey });
        }
        this.model = this.configService.get('TOGETHER_AI_MODEL') ||
            'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';
    }
    get client() {
        return this.together;
    }
    async chat(prompt, systemPrompt) {
        try {
            const messages = [];
            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt,
                });
            }
            messages.push({
                role: 'user',
                content: prompt,
            });
            this.logger.debug(`Sending chat request to Together AI (model: ${this.model})`);
            const response = await this.together.chat.completions.create({
                messages,
                model: this.model,
                max_tokens: 8000,
                temperature: 0.7,
                top_p: 0.7,
                top_k: 50,
                repetition_penalty: 1,
                stop: ['<|eot_id|>', '<|eom_id|>'],
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No content in AI response');
            }
            return content;
        }
        catch (error) {
            this.logger.error('Error calling Together AI:', error);
            throw error;
        }
    }
    extractAndParseJSON(text) {
        if (!text) {
            throw new Error('No response text to parse');
        }
        const patterns = [
            /\{[\s\S]*\}/,
            /```json\s*(\{[\s\S]*?\})\s*```/,
            /```\s*(\{[\s\S]*?\})\s*```/,
            /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const jsonText = match[1] || match[0];
                try {
                    return JSON.parse(jsonText);
                }
                catch (parseError) {
                    this.logger.warn(`Failed to parse JSON with pattern: ${pattern}`);
                }
            }
        }
        const lines = text.split('\n');
        let jsonStart = -1;
        let braceCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('{') && jsonStart === -1) {
                jsonStart = i;
                braceCount = 1;
            }
            else if (jsonStart !== -1) {
                braceCount += (line.match(/\{/g) || []).length;
                braceCount -= (line.match(/\}/g) || []).length;
                if (braceCount === 0) {
                    const jsonText = lines.slice(jsonStart, i + 1).join('\n');
                    try {
                        return JSON.parse(jsonText);
                    }
                    catch (parseError) {
                        this.logger.warn('Failed to parse extracted JSON');
                        break;
                    }
                }
            }
        }
        this.logger.error('Failed to parse JSON from response:', text.substring(0, 500));
        throw new Error('No valid JSON found in response');
    }
};
exports.TogetherAIService = TogetherAIService;
exports.TogetherAIService = TogetherAIService = TogetherAIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TogetherAIService);
//# sourceMappingURL=together-ai.service.js.map