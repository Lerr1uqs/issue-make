/**
 * AI Service Module
 * Handles AI integration for issue title generation
 */

import OpenAI from 'openai';
import { Settings, AIResponse, ConfigValidationResult } from './types.js';

/**
 * AIService class for managing AI operations
 */
export class AIService {
  private client: OpenAI | null = null;
  private config: Settings;

  constructor(config: Settings) {
    this.config = config;
  }

  /**
   * Initialize OpenAI client with current configuration
   */
  private initializeClient(): void {
    if (!this.config.url || !this.config.api || !this.config.model) {
      return;
    }

    this.client = new OpenAI({
      baseURL: this.config.url,
      apiKey: this.config.api,
    });
  }

  /**
   * Generate issue title from description
   * @param description - Issue description text
   * @returns AIResponse with generated title or error
   */
  async generateTitle(description: string): Promise<AIResponse> {
    if (!description || description.trim().length === 0) {
      return {
        success: false,
        error: 'Description cannot be empty',
      };
    }

    this.initializeClient();

    if (!this.client) {
      return {
        success: false,
        error: 'AI client not initialized. Please check your configuration.',
      };
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates concise, clear issue titles based on descriptions. Return only the title, no additional text.',
          },
          {
            role: 'user',
            content: `Generate a short, clear issue title for this description: ${description}`,
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
      });

      const title = response.choices[0]?.message?.content?.trim() || '';
      
      if (!title) {
        return {
          success: false,
          error: 'Failed to generate title from AI response',
        };
      }

      return {
        success: true,
        title: this.sanitizeTitle(title),
      };
    } catch (error) {
      return {
        success: false,
        error: `AI generation failed: ${error}`,
      };
    }
  }

  /**
   * Validate current configuration
   * @returns ConfigValidationResult with validation status
   */
  async validateConfig(): Promise<ConfigValidationResult> {
    if (!this.config.url || !this.config.api || !this.config.model) {
      return {
        valid: false,
        error: 'Configuration is incomplete',
        details: 'Please provide url, api, and model in settings',
      };
    }

    this.initializeClient();

    if (!this.client) {
      return {
        valid: false,
        error: 'Failed to initialize AI client',
        details: 'Check your configuration format',
      };
    }

    try {
      // Test connection with a minimal request
      await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: 'test',
          },
        ],
        max_tokens: 1,
      });

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Configuration validation failed',
        details: String(error),
      };
    }
  }

  /**
   * Sanitize generated title
   * @param title - Raw title from AI
   * @returns Sanitized title
   */
  private sanitizeTitle(title: string): string {
    // Remove quotes if present
    let sanitized = title.replace(/^["']|["']$/g, '');
    
    // Remove common prefixes
    sanitized = sanitized.replace(/^(Title:|Issue:|Summary:)\s*/i, '');
    
    // Limit length
    sanitized = sanitized.substring(0, 100);
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
  }

  /**
   * Check if AI service is properly configured
   * @returns true if configured
   */
  isConfigured(): boolean {
    return !!(this.config.url && this.config.api && this.config.model);
  }

  /**
   * Update configuration
   * @param config - New configuration
   */
  updateConfig(config: Settings): void {
    this.config = config;
    this.client = null; // Force re-initialization
  }
}