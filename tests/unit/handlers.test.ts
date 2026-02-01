/**
 * Unit Tests for TUI Command Handlers
 * Tests for init, add, open, and close commands with return values
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigManager } from '../../src/core/config';
import { FileManager } from '../../src/core/file-manager';
import { AIService } from '../../src/core/ai';
import {
  initCommandHandler,
  addCommandHandler,
  openCommandHandler,
  closeCommandHandler,
} from '../../src/tui/handlers';
import { IssueType } from '../../src/core/types';

// Mock modules
jest.mock('fs/promises');
jest.mock('../../src/core/config');
jest.mock('../../src/core/file-manager');
jest.mock('../../src/core/ai');

const mockedFs = fs as jest.Mocked<typeof fs>;
const MockedConfigManager = ConfigManager as jest.MockedClass<typeof ConfigManager>;
const MockedFileManager = FileManager as jest.MockedClass<typeof FileManager>;
const MockedAIService = AIService as jest.MockedClass<typeof AIService>;

describe('TUI Command Handlers', () => {
  const basePath = '/test';
  let mockConfigManager: any;
  let mockFileManager: any;
  let mockAIService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfigManager = {
      ensureConfigDir: jest.fn().mockResolvedValue(undefined),
      getDefaultSettings: jest.fn().mockReturnValue({
        url: '',
        api: '',
        model: '',
      }),
      getConfig: jest.fn().mockResolvedValue({
        url: 'https://api.test.com',
        api: 'test-key',
        model: 'gpt-4',
      }),
      setConfig: jest.fn().mockResolvedValue(undefined),
      getConfigPath: jest.fn().mockReturnValue('/home/user/.issue-make/settings.json'),
    };

    mockFileManager = {
      ensureDirectories: jest.fn().mockResolvedValue(undefined),
      getNextId: jest.fn().mockResolvedValue(0),
      createIssue: jest.fn().mockImplementation((title: string, type: IssueType, content: string) =>
        Promise.resolve({
          success: true,
          issue: {
            number: 0,
            title,
            type,
            content,
            createDate: new Date(),
            status: 'stash',
          },
          filePath: path.join(basePath, '.issues', 'stash', 'Test.0.md'),
        })
      ),
      openIssue: jest.fn().mockResolvedValue({
        success: true,
        issue: {
          number: 0,
          title: 'Test Issue',
          type: IssueType.FEAT,
          content: 'Test content',
          createDate: new Date(),
          status: 'doing',
        },
        solutionPath: path.join(basePath, '.issues', 'solution.md'),
      }),
      closeIssue: jest.fn().mockResolvedValue({
        success: true,
        archivedPath: path.join(basePath, '.issues', 'achieved', 'Test.md'),
      }),
    };

    mockAIService = {
      isConfigured: jest.fn().mockReturnValue(false),
      generateTitle: jest.fn().mockResolvedValue({
        success: true,
        title: 'Test Issue',
      }),
    };

    MockedConfigManager.mockImplementation(() => mockConfigManager);
    MockedFileManager.mockImplementation(() => mockFileManager);
    MockedAIService.mockImplementation((config: any) => ({
      ...mockAIService,
      isConfigured: jest.fn().mockReturnValue(!!(config?.url && config?.api && config?.model)),
    }));

    mockedFs.readFile.mockResolvedValue('# AGENTS.md\n\n');
    mockedFs.writeFile.mockResolvedValue(undefined);
  });

  describe('initCommandHandler', () => {
    it('should initialize configuration successfully', async () => {
      const result = await initCommandHandler();

      expect(result.success).toBe(true);
      expect(result.configPath).toBe('/home/user/.issue-make/settings.json');
      expect(mockConfigManager.ensureConfigDir).toHaveBeenCalled();
      expect(mockConfigManager.setConfig).toHaveBeenCalled();
    });

    it('should return config path on success', async () => {
      const result = await initCommandHandler();

      expect(result.configPath).toBeDefined();
      expect(typeof result.configPath).toBe('string');
    });

    it('should handle errors gracefully', async () => {
      mockConfigManager.ensureConfigDir.mockRejectedValue(new Error('Config dir error'));

      const result = await initCommandHandler();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to initialize configuration');
      expect(result.error).toContain('Config dir error');
    });

    it('should return error when setConfig fails', async () => {
      mockConfigManager.setConfig.mockRejectedValue(new Error('Set config error'));

      const result = await initCommandHandler();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('addCommandHandler', () => {
    it('should create issue successfully with valid description', async () => {
      const description = 'Test issue description';
      const result = await addCommandHandler(IssueType.FEAT, description, basePath);

      expect(result.success).toBe(true);
      expect(result.issue).toBeDefined();
      expect(result.issue?.number).toBe(0);
      expect(result.issue?.title).toBe('Test Issue');
      expect(result.issue?.type).toBe(IssueType.FEAT);
      expect(result.filePath).toBe(path.join(basePath, '.issues', 'stash', 'Test.0.md'));
      expect(mockFileManager.createIssue).toHaveBeenCalled();
    });

    it('should return error for empty description', async () => {
      const result = await addCommandHandler(IssueType.FEAT, '', '/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Description cannot be empty');
      expect(mockFileManager.createIssue).not.toHaveBeenCalled();
    });

    it('should return error for whitespace-only description', async () => {
      const result = await addCommandHandler(IssueType.FEAT, '   ', '/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Description cannot be empty');
    });

    it('should handle file manager errors', async () => {
      mockFileManager.createIssue.mockResolvedValue({
        success: false,
        error: 'File system error',
      });

      const result = await addCommandHandler(IssueType.BUG, 'Test', '/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('File system error');
    });

    it('should generate fallback title when AI is not configured', async () => {
      mockConfigManager.getConfig.mockResolvedValue({ url: '', api: '', model: '' });

      const result = await addCommandHandler(IssueType.TODO, 'Test', '/test');

      expect(result.success).toBe(true);
      expect(result.issue?.title).toMatch(/^Issue-\d+$/);
    });

    it('should use AI title when AI is configured', async () => {
      mockConfigManager.getConfig.mockResolvedValue({
        url: 'https://api.test.com',
        api: 'test-key',
        model: 'gpt-4',
      });

      const result = await addCommandHandler(IssueType.REFACT, 'Test', '/test');

      expect(result.success).toBe(true);
      expect(result.issue?.title).toBe('Test Issue');
    });

    it('should handle AI errors gracefully', async () => {
      mockConfigManager.getConfig.mockImplementation(() => {
        throw new Error('AI config error');
      });

      const result = await addCommandHandler(IssueType.FEAT, 'Test', '/test');

      expect(result.success).toBe(true);
      expect(result.issue?.title).toMatch(/^Issue-\d+$/);
    });

    it('should return correct file path', async () => {
      const result = await addCommandHandler(IssueType.FEAT, 'Test', '/test');

      expect(result.filePath).toBeDefined();
      expect(typeof result.filePath).toBe('string');
      expect(result.filePath).toContain(path.join(basePath, '.issues', 'stash'));
    });
  });

  describe('openCommandHandler', () => {
    it('should open issue successfully with valid identifier', async () => {
      const identifier = '0';
      const result = await openCommandHandler(identifier, basePath);

      expect(result.success).toBe(true);
      expect(result.issue).toBeDefined();
      expect(result.issue?.number).toBe(0);
      expect(result.issue?.title).toBe('Test Issue');
      expect(result.solutionPath).toBe(path.join(basePath, '.issues', 'solution.md'));
      expect(result.agentsPath).toBeDefined();
      expect(mockFileManager.openIssue).toHaveBeenCalledWith(identifier);
      expect(mockedFs.writeFile).toHaveBeenCalled();
    });

    it('should return error for empty identifier', async () => {
      const result = await openCommandHandler('', '/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please provide an issue identifier (number or title)');
      expect(mockFileManager.openIssue).not.toHaveBeenCalled();
    });

    it('should return error for whitespace-only identifier', async () => {
      const result = await openCommandHandler('   ', '/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please provide an issue identifier (number or title)');
    });

    it('should handle file manager errors', async () => {
      mockFileManager.openIssue.mockResolvedValue({
        success: false,
        error: 'Issue not found',
      });

      const result = await openCommandHandler('999', '/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Issue not found');
    });

    it('should update AGENTS.md file', async () => {
      const result = await openCommandHandler('0', '/test');

      expect(result.success).toBe(true);
      expect(mockedFs.readFile).toHaveBeenCalled();
      expect(mockedFs.writeFile).toHaveBeenCalled();
    });

    it('should create AGENTS.md if it does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockedFs.readFile.mockRejectedValue(error);

      const result = await openCommandHandler('0', '/test');

      expect(result.success).toBe(true);
      expect(mockedFs.readFile).toHaveBeenCalled();
      expect(mockedFs.writeFile).toHaveBeenCalled();
    });

    it('should return error when AGENTS.md update fails', async () => {
      mockedFs.readFile.mockResolvedValue('# AGENTS.md\n\n');
      mockedFs.writeFile.mockRejectedValue(new Error('Write error'));

      const result = await openCommandHandler('0', '/test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update AGENTS.md');
    });

    it('should return solution path', async () => {
      const result = await openCommandHandler('0', '/test');

      expect(result.solutionPath).toBeDefined();
      expect(typeof result.solutionPath).toBe('string');
      expect(result.solutionPath).toContain(path.join(basePath, '.issues', 'solution.md'));
    });

    it('should return agents path', async () => {
      const result = await openCommandHandler('0', '/test');

      expect(result.agentsPath).toBeDefined();
      expect(typeof result.agentsPath).toBe('string');
    });
  });

  describe('closeCommandHandler', () => {
    it('should close issue successfully with valid identifier', async () => {
      const identifier = '0';
      const result = await closeCommandHandler(identifier, basePath);

      expect(result.success).toBe(true);
      expect(result.archivedPath).toBe(path.join(basePath, '.issues', 'achieved', 'Test.md'));
      expect(result.agentsPath).toBeDefined();
      expect(mockFileManager.closeIssue).toHaveBeenCalledWith(identifier);
      expect(mockedFs.writeFile).toHaveBeenCalled();
    });

    it('should return error for empty identifier', async () => {
      const result = await closeCommandHandler('', '/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please provide an issue identifier (number or title)');
      expect(mockFileManager.closeIssue).not.toHaveBeenCalled();
    });

    it('should return error for whitespace-only identifier', async () => {
      const result = await closeCommandHandler('   ', '/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please provide an issue identifier (number or title)');
    });

    it('should handle file manager errors', async () => {
      mockFileManager.closeIssue.mockResolvedValue({
        success: false,
        error: 'Issue not found',
      });

      const result = await closeCommandHandler('999', '/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Issue not found');
    });

    it('should clean up AGENTS.md file', async () => {
      const result = await closeCommandHandler('0', '/test');

      expect(result.success).toBe(true);
      expect(mockedFs.readFile).toHaveBeenCalled();
      expect(mockedFs.writeFile).toHaveBeenCalled();
    });

    it('should return error when AGENTS.md cleanup fails', async () => {
      mockFileManager.closeIssue.mockResolvedValue({
        success: true,
        archivedPath: '/test/.issues/achieved/Test.md',
      });
      mockedFs.readFile.mockRejectedValue(new Error('Read error'));

      const result = await closeCommandHandler('0', '/test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to clean up AGENTS.md');
    });

    it('should return archived path', async () => {
      const result = await closeCommandHandler('0', '/test');

      expect(result.archivedPath).toBeDefined();
      expect(typeof result.archivedPath).toBe('string');
      expect(result.archivedPath).toContain(path.join(basePath, '.issues', 'achieved'));
    });

    it('should return agents path', async () => {
      const result = await closeCommandHandler('0', '/test');

      expect(result.agentsPath).toBeDefined();
      expect(typeof result.agentsPath).toBe('string');
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle multiple commands in sequence', async () => {
      // Init
      const initResult = await initCommandHandler();
      expect(initResult.success).toBe(true);

      // Add
      const addResult = await addCommandHandler(IssueType.FEAT, 'Test', '/test');
      expect(addResult.success).toBe(true);

      // Open
      const openResult = await openCommandHandler('0', '/test');
      expect(openResult.success).toBe(true);

      // Close
      mockedFs.readFile.mockResolvedValue('<!-- ISSUE-MAKE:START -->\nTest\n<!-- ISSUE-MAKE:END -->');
      const closeResult = await closeCommandHandler('0', '/test');
      expect(closeResult.success).toBe(true);
    });

    it('should handle all issue types', async () => {
      const types = [IssueType.FEAT, IssueType.TODO, IssueType.BUG, IssueType.REFACT];

      for (const type of types) {
        const result = await addCommandHandler(type, 'Test description', '/test');
        expect(result.success).toBe(true);
        expect(result.issue?.type).toBe(type);
      }
    });
  });
});
