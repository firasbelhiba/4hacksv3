import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Together from 'together-ai';

@Injectable()
export class TogetherAIService {
  private readonly logger = new Logger(TogetherAIService.name);
  private together: Together;
  private model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('TOGETHER_AI_API_KEY');
    if (!apiKey) {
      this.logger.warn('TOGETHER_AI_API_KEY not configured - AI features will be disabled');
      this.together = null as any; // Will throw error if used
    } else {
      this.together = new Together({ apiKey });
    }

    this.model = this.configService.get<string>('TOGETHER_AI_MODEL') ||
                 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';
  }

  // Public getter for the together client
  get client() {
    return this.together;
  }

  async chat(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages: any[] = [];

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
    } catch (error) {
      this.logger.error('Error calling Together AI:', error);
      throw error;
    }
  }

  // Utility function for robust JSON parsing from AI responses
  extractAndParseJSON(text: string): any {
    if (!text) {
      throw new Error('No response text to parse');
    }

    // Try to find JSON in various formats
    const patterns = [
      // Standard JSON object
      /\{[\s\S]*\}/,
      // JSON wrapped in code blocks
      /```json\s*(\{[\s\S]*?\})\s*```/,
      // JSON wrapped in generic code blocks
      /```\s*(\{[\s\S]*?\})\s*```/,
      // Multiple JSON objects, take the first one
      /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const jsonText = match[1] || match[0];
        try {
          return JSON.parse(jsonText);
        } catch (parseError) {
          this.logger.warn(`Failed to parse JSON with pattern: ${pattern}`);
        }
      }
    }

    // If no valid JSON found, try to extract anything that looks like JSON
    const lines = text.split('\n');
    let jsonStart = -1;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('{') && jsonStart === -1) {
        jsonStart = i;
        braceCount = 1;
      } else if (jsonStart !== -1) {
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;

        if (braceCount === 0) {
          const jsonText = lines.slice(jsonStart, i + 1).join('\n');
          try {
            return JSON.parse(jsonText);
          } catch (parseError) {
            this.logger.warn('Failed to parse extracted JSON');
            break;
          }
        }
      }
    }

    this.logger.error('Failed to parse JSON from response:', text.substring(0, 500));
    throw new Error('No valid JSON found in response');
  }
}
