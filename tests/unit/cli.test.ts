/**
 * Unit Tests for CLI Commands
 * Tests for AC-3.1.1, AC-3.1.2, AC-3.2.1, AC-3.2.2, AC-3.3.1
 */

import * as fs from 'fs/promises';
import { initCommand } from '../../src/cli/commands/init';
import { addCommand } from '../../src/cli/commands/add';
import { openCommand } from '../../src/cli/commands/open';
import { closeCommand } from '../../src/cli/commands/close';
import { ConfigManager } from '../../src/core/config';
import { FileManager } from '../../src/core/file-manager';
import { AIService } from '../../src/core/ai';

// Mock console methods
const consoleError = jest.spyOn(console, 'error').mockImplementation();
const consoleLog = jest.spyOn(console, 'log').mockImplementation();
const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const processExit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
  throw new Error(`Process exited with code ${code}`);
}) as any);

// Mock modules
jest.mock('fs/promises');
jest.mock('../../src/core/config');
jest.mock('../../src/core/file-manager');
jest.mock('../../src/core/ai');

const mockedFs = fs as jest.Mocked<typeof fs>;
const MockedConfigManager = ConfigManager as jest.MockedClass<typeof ConfigManager>;
const MockedFileManager = FileManager as jest.MockedClass<typeof FileManager>;
const MockedAIService = AIService as jest.MockedClass<typeof AIService>;

describe('CLI Commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleError.mockClear();
    consoleLog.mockClear();
    consoleWarn.mockClear();
    processExit.mockClear();
  });

  describe('AC-1.1.1: Init command', () => {
    it('should create configuration directory and file', async () => {
      const mockConfigManager = {
        ensureConfigDir: jest.fn().mockResolvedValue(undefined),
        getDefaultSettings: jest.fn().mockReturnValue({ url: '', api: '', model: '' }),
        setConfig: jest.fn().mockResolvedValue(undefined),
        getConfigPath: jest.fn().mockReturnValue('/home/user/.issue-make/settings.json'),
      };
      MockedConfigManager.mockImplementation(() => mockConfigManager as any);

      await initCommand();

      expect(mockConfigManager.ensureConfigDir).toHaveBeenCalled();
      expect(mockConfigManager.setConfig).toHaveBeenCalled();
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('initialized successfully'));
    });

    it('should handle initialization errors', async () => {
      const mockConfigManager = {
        ensureConfigDir: jest.fn().mockRejectedValue(new Error('Permission denied')),
      };
      MockedConfigManager.mockImplementation(() => mockConfigManager as any);

      try {
        await initCommand();
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Process exited');
      }

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize'),
        expect.any(Error)
      );
    });
  });

  describe('AC-3.1.1: Add command', () => {
    it('should create issue from description file', async () => {
      mockedFs.readFile.mockResolvedValue('Test description');
      const mockConfigManager = {
        getConfig: jest.fn().mockResolvedValue({ url: '', api: '', model: '' }),
      };
      const mockFileManager = {
        createIssue: jest.fn().mockResolvedValue({
          success: true,
          issue: { number: 0, title: 'Test', type: 'feat' },
          filePath: '/test/.issues/stash/Test.0.md',
        }),
      };
      MockedConfigManager.mockImplementation(() => mockConfigManager as any);
      MockedFileManager.mockImplementation(() => mockFileManager as any);

      await addCommand('feat', '/test/description.md');

      expect(mockFileManager.createIssue).toHaveBeenCalled();
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('created successfully'));
    });

    it('should validate issue type', async () => {
      try {
        await addCommand('invalid', '/test/description.md');
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Process exited');
      }

      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Invalid issue type'));
    });

    it('should handle missing description file', async () => {
      mockedFs.readFile.mockRejectedValue(new Error('File not found'));

      try {
        await addCommand('feat', '/test/description.md');
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Process exited');
      }

      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Failed to read'));
    });

    it('should handle empty description file', async () => {
      mockedFs.readFile.mockResolvedValue('   ');

      try {
        await addCommand('feat', '/test/description.md');
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Process exited');
      }

      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('empty'));
    });

    it('should use AI to generate title when configured', async () => {
      mockedFs.readFile.mockResolvedValue('Test description');
      const mockConfigManager = {
        getConfig: jest.fn().mockResolvedValue({
          url: 'https://api.test.com',
          api: 'test-key',
          model: 'gpt-4',
        }),
      };
      const mockAIService = {
        isConfigured: jest.fn().mockReturnValue(true),
        generateTitle: jest.fn().mockResolvedValue({
          success: true,
          title: 'AI Generated Title',
        }),
      };
      const mockFileManager = {
        createIssue: jest.fn().mockResolvedValue({
          success: true,
          issue: { number: 0, title: 'AI Generated Title', type: 'feat' },
          filePath: '/test/.issues/stash/AI-Generated-Title.0.md',
        }),
      };
      MockedConfigManager.mockImplementation(() => mockConfigManager as any);
      MockedAIService.mockImplementation(() => mockAIService as any);
      MockedFileManager.mockImplementation(() => mockFileManager as any);

      await addCommand('feat', '/test/description.md');

      expect(mockAIService.generateTitle).toHaveBeenCalledWith('Test description');
      expect(mockFileManager.createIssue).toHaveBeenCalledWith(
        'AI Generated Title',
        'feat',
        'Test description'
      );
    });

    it('should fallback to timestamp when AI fails', async () => {
      mockedFs.readFile.mockResolvedValue('Test description');
      const mockConfigManager = {
        getConfig: jest.fn().mockResolvedValue({
          url: 'https://api.test.com',
          api: 'test-key',
          model: 'gpt-4',
        }),
      };
      const mockAIService = {
        isConfigured: jest.fn().mockReturnValue(true),
        generateTitle: jest.fn().mockResolvedValue({
          success: false,
          error: 'AI error',
        }),
      };
      const mockFileManager = {
        createIssue: jest.fn().mockResolvedValue({
          success: true,
          issue: { number: 0, title: expect.stringContaining('Issue-'), type: 'feat' },
          filePath: '/test/.issues/stash/Issue-123.0.md',
        }),
      };
      MockedConfigManager.mockImplementation(() => mockConfigManager as any);
      MockedAIService.mockImplementation(() => mockAIService as any);
      MockedFileManager.mockImplementation(() => mockFileManager as any);

      await addCommand('feat', '/test/description.md');

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('AI generation failed'));
    });

    it('should handle creation errors', async () => {
      mockedFs.readFile.mockResolvedValue('Test description');
      const mockConfigManager = {
        getConfig: jest.fn().mockResolvedValue({ url: '', api: '', model: '' }),
      };
      const mockFileManager = {
        createIssue: jest.fn().mockResolvedValue({
          success: false,
          error: 'Creation failed',
        }),
      };
      MockedConfigManager.mockImplementation(() => mockConfigManager as any);
      MockedFileManager.mockImplementation(() => mockFileManager as any);

      try {
        await addCommand('feat', '/test/description.md');
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Process exited');
      }

      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Failed to create issue'));
    });
  });

  describe('AC-3.2.1: Open command by number', () => {
    it('should open issue by number', async () => {
      const mockFileManager = {
        openIssue: jest.fn().mockResolvedValue({
          success: true,
          issue: { number: 0, title: 'Test', type: 'feat' },
          solutionPath: '/test/.issues/solution.md',
        }),
      };
      MockedFileManager.mockImplementation(() => mockFileManager as any);
      mockedFs.readFile.mockResolvedValue('# AGENTS.md\n\n');
      mockedFs.writeFile.mockResolvedValue(undefined);

      await openCommand('0');

      expect(mockFileManager.openIssue).toHaveBeenCalledWith('0');
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('opened successfully'));
    });

    it('should update AGENTS.md', async () => {
      const mockFileManager = {
        openIssue: jest.fn().mockResolvedValue({
          success: true,
          issue: { number: 0, title: 'Test', type: 'feat', createDate: new Date() },
          solutionPath: '/test/.issues/solution.md',
        }),
      };
      MockedFileManager.mockImplementation(() => mockFileManager as any);
      mockedFs.readFile.mockResolvedValue('# AGENTS.md\n\n');
      mockedFs.writeFile.mockResolvedValue(undefined);

      await openCommand('0');

      expect(mockedFs.writeFile).toHaveBeenCalled();
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Updated AGENTS.md'));
    });

    it('should require identifier', async () => {
      try {
        await openCommand('');
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Process exited');
      }

      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Please provide'));
    });

    it('should handle open errors', async () => {
      const mockFileManager = {
        openIssue: jest.fn().mockResolvedValue({
          success: false,
          error: 'Issue not found',
        }),
      };
      MockedFileManager.mockImplementation(() => mockFileManager as any);

      try {
        await openCommand('999');
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Process exited');
      }

      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Failed to open issue'));
    });
  });

  describe('AC-3.2.2: Open command by title', () => {
    it('should open issue by title', async () => {
      const mockFileManager = {
        openIssue: jest.fn().mockResolvedValue({
          success: true,
          issue: { number: 1, title: 'User Authentication', type: 'feat' },
          solutionPath: '/test/.issues/solution.md',
        }),
      };
      MockedFileManager.mockImplementation(() => mockFileManager as any);
      mockedFs.readFile.mockResolvedValue('# AGENTS.md\n\n');
      mockedFs.writeFile.mockResolvedValue(undefined);

      await openCommand('User Auth');

      expect(mockFileManager.openIssue).toHaveBeenCalledWith('User Auth');
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('opened successfully'));
    });

    it('should support fuzzy title matching', async () => {
      const mockFileManager = {
        openIssue: jest.fn().mockResolvedValue({
          success: true,
          issue: { number: 2, title: 'Add User Authentication Feature', type: 'feat' },
          solutionPath: '/test/.issues/solution.md',
        }),
      };
      MockedFileManager.mockImplementation(() => mockFileManager as any);
      mockedFs.readFile.mockResolvedValue('# AGENTS.md\n\n');
      mockedFs.writeFile.mockResolvedValue(undefined);

      await openCommand('auth');

      expect(mockFileManager.openIssue).toHaveBeenCalledWith('auth');
    });
  });

  describe('AC-3.3.1: Close command', () => {
    it('should close issue and archive', async () => {
      const mockFileManager = {
        closeIssue: jest.fn().mockResolvedValue({
          success: true,
          archivedPath: '/test/.issues/achieved/Test.md',
        }),
      };
      MockedFileManager.mockImplementation(() => mockFileManager as any);
      mockedFs.readFile.mockResolvedValue('# AGENTS.md\n\n<!-- ISSUE-MAKE:START -->\nTask\n<!-- ISSUE-MAKE:END -->\n');
      mockedFs.writeFile.mockResolvedValue(undefined);

      await closeCommand('0');

      expect(mockFileManager.closeIssue).toHaveBeenCalledWith('0');
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('closed successfully'));
    });

    it('should clean up AGENTS.md', async () => {
      const mockFileManager = {
        closeIssue: jest.fn().mockResolvedValue({
          success: true,
          archivedPath: '/test/.issues/achieved/Test.md',
        }),
      };
      MockedFileManager.mockImplementation(() => mockFileManager as any);
      mockedFs.readFile.mockResolvedValue('# AGENTS.md\n\n<!-- ISSUE-MAKE:START -->\nTask\n<!-- ISSUE-MAKE:END -->\n');
      mockedFs.writeFile.mockResolvedValue(undefined);

      await closeCommand('0');

      expect(mockedFs.writeFile).toHaveBeenCalled();
      const writtenContent = mockedFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).not.toContain('ISSUE-MAKE:START');
      expect(writtenContent).not.toContain('ISSUE-MAKE:END');
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Cleaned up AGENTS.md'));
    });

    it('should require identifier', async () => {
      try {
        await closeCommand('');
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Process exited');
      }

      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Please provide'));
    });

    it('should handle close errors', async () => {
      const mockFileManager = {
        closeIssue: jest.fn().mockResolvedValue({
          success: false,
          error: 'Solution file not found',
        }),
      };
      MockedFileManager.mockImplementation(() => mockFileManager as any);

      try {
        await closeCommand('0');
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Process exited');
      }

      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Failed to close issue'));
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Hint'));
    });

    it('should handle AGENTS.md cleanup errors', async () => {
      const mockFileManager = {
        closeIssue: jest.fn().mockResolvedValue({
          success: true,
          archivedPath: '/test/.issues/achieved/Test.md',
        }),
      };
      MockedFileManager.mockImplementation(() => mockFileManager as any);
      mockedFs.readFile.mockRejectedValue(new Error('File not found'));

      await closeCommand('0');

      expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('Failed to clean up AGENTS.md'));
    });
  });

  describe('Edge cases', () => {
    it('should handle whitespace-only identifier', async () => {
      try {
        await openCommand('   ');
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Process exited');
      }

      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Please provide'));
    });

    it('should handle special characters in title', async () => {
      const mockFileManager = {
        openIssue: jest.fn().mockResolvedValue({
          success: true,
          issue: { number: 0, title: 'Fix: Bug<>in/login', type: 'bug' },
          solutionPath: '/test/.issues/solution.md',
        }),
      };
      MockedFileManager.mockImplementation(() => mockFileManager as any);
      mockedFs.readFile.mockResolvedValue('# AGENTS.md\n\n');
      mockedFs.writeFile.mockResolvedValue(undefined);

      await openCommand('Fix: Bug<>in/login');

      expect(mockFileManager.openIssue).toHaveBeenCalledWith('Fix: Bug<>in/login');
    });
  });
});
