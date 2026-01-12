/**
 * Unit Tests for Validation Utilities
 * Tests for AC-2.2.1, AC-2.2.2, AC-3.2.1, AC-3.2.2
 */

import {
  validateIssueType,
  validateIssueNumber,
  isValidIdentifier,
  isNumberIdentifier,
  isValidSlashCommand,
  parseSlashCommand,
  isValidUrl,
  isValidApiKey,
  isValidModel,
  isValidFilePath,
  isValidMarkdown,
  isValidFrontmatter,
} from '../../src/utils/validation';
import { IssueType } from '../../src/core/types';

describe('Validation Utilities', () => {
  describe('AC-2.2.1: Issue type validation', () => {
    it('should validate feat type', () => {
      expect(validateIssueType('feat')).toBe(IssueType.FEAT);
    });

    it('should validate todo type', () => {
      expect(validateIssueType('todo')).toBe(IssueType.TODO);
    });

    it('should validate bug type', () => {
      expect(validateIssueType('bug')).toBe(IssueType.BUG);
    });

    it('should validate refact type', () => {
      expect(validateIssueType('refact')).toBe(IssueType.REFACT);
    });

    it('should reject invalid types', () => {
      expect(validateIssueType('invalid')).toBeNull();
      expect(validateIssueType('feature')).toBeNull();
      expect(validateIssueType('')).toBeNull();
    });

    it('should be case sensitive', () => {
      expect(validateIssueType('FEAT')).toBeNull();
      expect(validateIssueType('Feat')).toBeNull();
    });
  });

  describe('AC-2.2.2: Slash command validation', () => {
    it('should validate correct slash command format', () => {
      expect(isValidSlashCommand('/add:feat')).toBe(true);
      expect(isValidSlashCommand('/add:todo')).toBe(true);
      expect(isValidSlashCommand('/add:bug')).toBe(true);
      expect(isValidSlashCommand('/add:refact')).toBe(true);
    });

    it('should validate open and close commands', () => {
      expect(isValidSlashCommand('/open:feat')).toBe(true);
      expect(isValidSlashCommand('/close:bug')).toBe(true);
    });

    it('should reject invalid slash command format', () => {
      expect(isValidSlashCommand('add:feat')).toBe(false); // Missing slash
      expect(isValidSlashCommand('/add')).toBe(false); // Missing type
      expect(isValidSlashCommand('/add:')).toBe(false); // Empty type
      expect(isValidSlashCommand('/add feat')).toBe(false); // Wrong separator
      expect(isValidSlashCommand('/add:feat:extra')).toBe(false); // Extra parts
    });

    it('should reject empty command', () => {
      expect(isValidSlashCommand('')).toBe(false);
    });

    it('should parse slash command correctly', () => {
      const result = parseSlashCommand('/add:feat');
      expect(result).toEqual({ action: 'add', type: 'feat' });
    });

    it('should parse open command correctly', () => {
      const result = parseSlashCommand('/open:bug');
      expect(result).toEqual({ action: 'open', type: 'bug' });
    });

    it('should parse close command correctly', () => {
      const result = parseSlashCommand('/close:refact');
      expect(result).toEqual({ action: 'close', type: 'refact' });
    });

    it('should return null for invalid command', () => {
      expect(parseSlashCommand('invalid')).toBeNull();
      expect(parseSlashCommand('/add')).toBeNull();
    });

    it('should handle case insensitive parsing', () => {
      const result = parseSlashCommand('/ADD:FEAT');
      expect(result).toEqual({ action: 'add', type: 'feat' });
    });
  });

  describe('AC-3.2.1 & AC-3.2.2: Issue identifier validation', () => {
    it('should validate numeric identifier', () => {
      expect(validateIssueNumber('0')).toBe(0);
      expect(validateIssueNumber('1')).toBe(1);
      expect(validateIssueNumber('123')).toBe(123);
    });

    it('should reject negative numbers', () => {
      expect(validateIssueNumber('-1')).toBeNull();
      expect(validateIssueNumber('-10')).toBeNull();
    });

    it('should reject non-numeric strings', () => {
      expect(validateIssueNumber('abc')).toBeNull();
      expect(validateIssueNumber('1abc')).toBeNull();
      expect(validateIssueNumber('abc1')).toBeNull();
    });

    it('should reject empty string', () => {
      expect(validateIssueNumber('')).toBeNull();
    });

    it('should check if identifier is number', () => {
      expect(isNumberIdentifier('0')).toBe(true);
      expect(isNumberIdentifier('123')).toBe(true);
      expect(isNumberIdentifier('abc')).toBe(false);
      expect(isNumberIdentifier('1abc')).toBe(false);
    });

    it('should validate numeric identifier', () => {
      expect(isValidIdentifier('0')).toBe(true);
      expect(isValidIdentifier('123')).toBe(true);
    });

    it('should validate title identifier', () => {
      expect(isValidIdentifier('Add User Authentication')).toBe(true);
      expect(isValidIdentifier('Fix bug')).toBe(true);
    });

    it('should reject empty identifier', () => {
      expect(isValidIdentifier('')).toBe(false);
      expect(isValidIdentifier('   ')).toBe(false);
    });

    it('should reject very long identifiers', () => {
      const longIdentifier = 'a'.repeat(201);
      expect(isValidIdentifier(longIdentifier)).toBe(false);
    });

    it('should accept identifiers at max length', () => {
      const maxLengthIdentifier = 'a'.repeat(200);
      expect(isValidIdentifier(maxLengthIdentifier)).toBe(true);
    });
  });

  describe('URL validation', () => {
    it('should validate valid URLs', () => {
      expect(isValidUrl('https://api.deepseek.com')).toBe(true);
      expect(isValidUrl('http://api.test.com')).toBe(true);
      expect(isValidUrl('https://api.openai.com/v1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('api.test.com')).toBe(false); // Missing protocol
      expect(isValidUrl('')).toBe(false);
    });

    it('should accept localhost URLs', () => {
      expect(isValidUrl('http://localhost:8080')).toBe(true);
      expect(isValidUrl('http://127.0.0.1:3000')).toBe(true);
    });
  });

  describe('API key validation', () => {
    it('should validate reasonable API key length', () => {
      expect(isValidApiKey('sk-1234567890abcdef')).toBe(true);
      expect(isValidApiKey('a'.repeat(10))).toBe(true);
    });

    it('should reject short API keys', () => {
      expect(isValidApiKey('short')).toBe(false);
      expect(isValidApiKey('123')).toBe(false);
      expect(isValidApiKey('')).toBe(false);
    });

    it('should accept long API keys', () => {
      expect(isValidApiKey('sk-'.repeat(50))).toBe(true);
    });
  });

  describe('Model validation', () => {
    it('should validate model names', () => {
      expect(isValidModel('gpt-4')).toBe(true);
      expect(isValidModel('deepseek-chat')).toBe(true);
      expect(isValidModel('claude-3')).toBe(true);
    });

    it('should reject empty model', () => {
      expect(isValidModel('')).toBe(false);
      expect(isValidModel('   ')).toBe(false);
    });
  });

  describe('File path validation', () => {
    it('should validate valid file paths', () => {
      expect(isValidFilePath('path/to/file.md')).toBe(true);
      expect(isValidFilePath('file.md')).toBe(true);
      expect(isValidFilePath('./relative/path.md')).toBe(true);
    });

    it('should reject paths with invalid characters', () => {
      expect(isValidFilePath('file<.md')).toBe(false);
      expect(isValidFilePath('file>.md')).toBe(false);
      expect(isValidFilePath('file|.md')).toBe(false);
      expect(isValidFilePath('file?.md')).toBe(false);
      expect(isValidFilePath('file*.md')).toBe(false);
    });

    it('should reject empty paths', () => {
      expect(isValidFilePath('')).toBe(false);
      expect(isValidFilePath('   ')).toBe(false);
    });
  });

  describe('Markdown validation', () => {
    it('should validate markdown content', () => {
      expect(isValidMarkdown('# Title')).toBe(true);
      expect(isValidMarkdown('Some content')).toBe(true);
      expect(isValidMarkdown('**Bold text**')).toBe(true);
    });

    it('should reject empty content', () => {
      expect(isValidMarkdown('')).toBe(false);
      expect(isValidMarkdown('   ')).toBe(false);
    });
  });

  describe('Frontmatter validation', () => {
    it('should validate valid frontmatter', () => {
      const validFrontmatter = {
        'Create Date': '2026-01-12',
        Type: IssueType.FEAT,
      };
      expect(isValidFrontmatter(validFrontmatter)).toBe(true);
    });

    it('should reject frontmatter without Create Date', () => {
      const invalidFrontmatter = {
        Type: IssueType.FEAT,
      };
      expect(isValidFrontmatter(invalidFrontmatter)).toBe(false);
    });

    it('should reject frontmatter without Type', () => {
      const invalidFrontmatter = {
        'Create Date': '2026-01-12',
      };
      expect(isValidFrontmatter(invalidFrontmatter)).toBe(false);
    });

    it('should reject invalid date format', () => {
      const invalidFrontmatter = {
        'Create Date': '2026/01/12',
        Type: IssueType.FEAT,
      };
      expect(isValidFrontmatter(invalidFrontmatter)).toBe(false);
    });

    it('should reject null frontmatter', () => {
      expect(isValidFrontmatter(null)).toBe(false);
    });

    it('should reject non-object frontmatter', () => {
      expect(isValidFrontmatter('not an object')).toBe(false);
      expect(isValidFrontmatter(123)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in identifiers', () => {
      expect(isValidIdentifier('Fix bug with émojis 🎉')).toBe(true);
    });

    it('should handle whitespace in identifiers', () => {
      expect(isValidIdentifier('  Test  ')).toBe(true);
    });

    it('should handle URLs with query parameters', () => {
      expect(isValidUrl('https://api.test.com/v1?param=value')).toBe(true);
    });

    it('should handle URLs with fragments', () => {
      expect(isValidUrl('https://api.test.com/v1#section')).toBe(true);
    });

    it('should handle file paths with Windows separators', () => {
      expect(isValidFilePath('path\\to\\file.md')).toBe(true);
    });

    it('should handle file paths with Unix separators', () => {
      expect(isValidFilePath('path/to/file.md')).toBe(true);
    });
  });
});
