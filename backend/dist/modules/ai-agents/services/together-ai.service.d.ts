import { ConfigService } from '@nestjs/config';
import Together from 'together-ai';
export declare class TogetherAIService {
    private configService;
    private readonly logger;
    private together;
    private model;
    constructor(configService: ConfigService);
    get client(): Together;
    chat(prompt: string, systemPrompt?: string): Promise<string>;
    extractAndParseJSON(text: string): any;
}
