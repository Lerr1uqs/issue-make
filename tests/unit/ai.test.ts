/**
 * Unit Tests for AIService
 * Tests for AC-2.3.1, AC-2.3.2, AC-6.2.1, AC-6.2.2
 */

import { AIService } from '../../src/core/ai';
import { Settings } from '../../src/core/types';

// Mock OpenAI module
jest.mock('openai', () => {
  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };
  return {
    __esModule: true,
    default: jest.fn(() => mockOpenAI),
  };
});

import OpenAI from 'openai';

describe('AIService', () => {
  let aiService: AIService;
  let mockOpenAI: jest.Mocked<OpenAI>;
  let validSettings: Settings;

  beforeEach(() => {
    jest.clearAllMocks();
    validSettings = {
      url: 'https://api.deepseek.com',
      api: 'sk-1234567890abcdef',
      model: 'deepseek-chat',
    };
    aiService = new AIService(validSettings);
    mockOpenAI = new OpenAI() as jest.Mocked<OpenAI>;
  });

  describe('AC-2.3.1: Generate title with valid config', () => {
    it('should generate a relevant title from description', async () => {
      const description = 'Add user authentication feature with JWT tokens';
      const expectedTitle = 'Add user authentication with JWT tokens';

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: expectedTitle,
            },
          },
        ],
      } as any);

      const result = await aiService.generateTitle(description);

      expect(result.success).toBe(true);
      expect(result.title).toBe(expectedTitle);
    });

    it('should generate a title of reasonable length', async () => {
      const description = 'Implement comprehensive error handling for all API endpoints including validation, authorization, and database errors';
      const shortTitle = 'Implement comprehensive API error handling';

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: shortTitle,
            },
          },
        ],
      } as any);

      const result = await aiService.generateTitle(description);

      expect(result.success).toBe(true);
      expect(result.title).toBeDefined();
      expect(result.title!.length).toBeLessThanOrEqual(100);
    });

    it('should sanitize quotes from generated title', async () => {
      const description = 'Add login feature';
      const quotedTitle = '"Add login feature"';

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: quotedTitle,
            },
          },
        ],
      } as any);

      const result = await aiService.generateTitle(description);

      expect(result.success).toBe(true);
      expect(result.title).not.toMatch(/^["']|["']$/);
    });

    it('should remove common prefixes from title', async () => {
      const description = 'Add logout feature';
      const prefixedTitle = 'Title: Add logout feature';

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: prefixedTitle,
            },
          },
        ],
      } as any);

      const result = await aiService.generateTitle(description);

      expect(result.success).toBe(true);
      expect(result.title).not.toMatch(/^(Title:|Issue:|Summary:)\s*/i);
    });
  });

  describe('AC-2.3.2: AI unavailable fallback handling', () => {
    it('should return error when description is empty', async () => {
      const result = await aiService.generateTitle('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should return error when description is only whitespace', async () => {
      const result = await aiService.generateTitle('   \n\t  ');

      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should return error when AI client is not initialized', async () => {
      const emptySettings: Settings = { url: '', api: '', model: '' };
      const noConfigService = new AIService(emptySettings);

      const result = await noConfigService.generateTitle('Some description');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not initialized');
    });

    it('should handle network errors gracefully', async () => {
      const description = 'Test feature';
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('Network timeout')
      );

      const result = await aiService.generateTitle(description);

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI generation failed');
    });

    it('should handle empty AI response', async () => {
      const description = 'Test feature';
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      } as any);

      const result = await aiService.generateTitle(description);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to generate title');
    });

    it('should handle missing content in AI response', async () => {
      const description = 'Test feature';
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {},
          },
        ],
      } as any);

      const result = await aiService.generateTitle(description);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to generate title');
    });
  });

  describe('AC-1.2.1: Valid config validation', () => {
    it('should validate valid configuration successfully', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: 'test',
            },
          },
        ],
      } as any);

      const result = await aiService.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should test connection to AI service', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: 'test',
            },
          },
        ],
      } as any);

      await aiService.validateConfig();

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: validSettings.model,
          max_tokens: 1,
        })
      );
    });
  });

  describe('AC-1.2.2: Invalid config error handling', () => {
    it('should fail validation with incomplete config', async () => {
      const incompleteSettings: Settings = {
        url: 'https://api.test.com',
        api: '',
        model: 'gpt-4',
      };
      const incompleteService = new AIService(incompleteSettings);

      const result = await incompleteService.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('incomplete');
      expect(result.details).toContain('url, api, and model');
    });

    it('should fail validation with missing URL', async () => {
      const missingUrlSettings: Settings = {
        url: '',
        api: 'test-key',
        model: 'gpt-4',
      };
      const missingUrlService = new AIService(missingUrlSettings);

      const result = await missingUrlService.validateConfig();

      expect(result.valid).toBe(false);
    });

    it('should provide clear error message for invalid config', async () => {
      const invalidSettings: Settings = {
        url: 'invalid-url',
        api: 'test-key',
        model: 'gpt-4',
      };
      const invalidService = new AIService(invalidSettings);

      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('Invalid URL')
      );

      const result = await invalidService.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('validation failed');
      expect(result.details).toBeDefined();
    });

    it('should handle connection errors during validation', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('Connection refused')
      );

      const result = await aiService.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('validation failed');
      expect(result.details).toContain('Connection refused');
    });
  });

  describe('AC-6.2.1: Network exception fallback', () => {
    it('should handle network disconnection gracefully', async () => {
      const description = 'Test feature';
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('ECONNREFUSED')
      );

      const result = await aiService.generateTitle(description);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle timeout errors gracefully', async () => {
      const description = 'Test feature';
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('ETIMEDOUT')
      );

      const result = await aiService.generateTitle(description);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle DNS resolution errors', async () => {
      const description = 'Test feature';
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('ENOTFOUND')
      );

      const result = await aiService.generateTitle(description);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('AC-6.2.2: Network timeout handling', () => {
    it('should handle timeout during title generation', async () => {
      const description = 'Test feature';
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('Request timeout after 30000ms')
      );

      const result = await aiService.generateTitle(description);

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI generation failed');
    });

    it('should handle timeout during validation', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('Timeout during connection test')
      );

      const result = await aiService.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('validation failed');
    });
  });

  describe('Utility methods', () => {
    it('should check if service is configured', () => {
      expect(aiService.isConfigured()).toBe(true);

      const unconfiguredService = new AIService({ url: '', api: '', model: '' });
      expect(unconfiguredService.isConfigured()).toBe(false);
    });

    it('should update configuration', () => {
      const newSettings: Settings = {
        url: 'https://api.new.com',
        api: 'new-key',
        model: 'new-model',
      };

      aiService.updateConfig(newSettings);

      expect(aiService.isConfigured()).toBe(true);
    });

    it('should re-initialize client after config update', () => {
      const newSettings: Settings = {
        url: 'https://api.new.com',
        api: 'new-key',
        model: 'new-model',
      };

      aiService.updateConfig(newSettings);

      // Next operation should use new config
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: 'test',
            },
          },
        ],
      } as any);

      aiService.generateTitle('test');

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long descriptions', async () => {
      const longDescription = 'a'.repeat(10000);
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Short title',
            },
          },
        ],
      } as any);

      const result = await aiService.generateTitle(longDescription);

      expect(result.success).toBe(true);
    });

    it('should handle special characters in description', async () => {
      const specialDescription = 'Fix bug with émojis 🎉 and spëcial çhars';
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Fix emoji and special character bug',
            },
          },
        ],
      } as any);

      const result = await aiService.generateTitle(specialDescription);

      expect(result.success).toBe(true);
    });

    it('should handle multiline descriptions', async () => {
      const multilineDescription = `Add new feature:
- Support for multiple languages
- Auto-save functionality
- Export to PDF`;

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Add multi-language, auto-save, and PDF export',
            },
          },
        ],
      } as any);

      const result = await aiService.generateTitle(multilineDescription);

      expect(result.success).toBe(true);
    });

    it('should truncate very long titles', async () => {
      const description = 'Test';
      const veryLongTitle = 'a'.repeat(200);

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: veryLongTitle,
            },
          },
        ],
      } as any);

      const result = await aiService.generateTitle(description);

      expect(result.success).toBe(true);
      expect(result.title!.length).toBeLessThanOrEqual(100);
    });
  });
});
