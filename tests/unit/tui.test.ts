/**
 * Unit Tests for TUI Module using ink-testing-library
 * Tests for AC-2.1.1, AC-2.1.2, AC-2.2.1, AC-2.2.2, AC-2.2.3, AC-2.3.1, AC-2.3.2
 */

import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../../src/tui/components/App';
import { FileManager } from '../../src/core/file-manager';
import { AIService } from '../../src/core/ai';
import { ConfigManager } from '../../src/core/config';
import { IssueType } from '../../src/core/types';

// Type declaration for render with JSX
declare module 'ink-testing-library' {
  export function render(element: React.ReactElement): any;
}

// Mock modules
jest.mock('../../src/core/file-manager');
jest.mock('../../src/core/ai');
jest.mock('../../src/core/config');

const MockedFileManager = FileManager as jest.MockedClass<typeof FileManager>;
const MockedAIService = AIService as jest.MockedClass<typeof AIService>;
const MockedConfigManager = ConfigManager as jest.MockedClass<typeof ConfigManager>;

describe('TUI Module (Ink)', () => {
  let mockFileManager: any;
  let mockAIService: any;
  let mockConfigManager: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFileManager = {
      createIssue: jest.fn().mockResolvedValue({
        success: true,
        issue: { number: 0, title: 'Test', type: IssueType.FEAT },
        filePath: '/test/.issues/stash/Test.0.md',
      }),
    };
    mockAIService = {
      generateTitle: jest.fn().mockResolvedValue({
        success: true,
        title: 'AI Generated Title',
      }),
    };
    mockConfigManager = {
      getConfig: jest.fn().mockResolvedValue({
        url: 'https://api.test.com',
        api: 'test-key',
        model: 'gpt-4',
      }),
    };

    MockedFileManager.mockImplementation(() => mockFileManager);
    MockedAIService.mockImplementation(() => mockAIService);
    MockedConfigManager.mockImplementation(() => mockConfigManager);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AC-2.1.1: TUI startup', () => {
    it('should render TUI successfully', async () => {
      const { lastFrame } = renderTUI();

      expect(lastFrame()).toContain('Issue-Make TUI v1.0.0');
    });

    it('should render welcome message', async () => {
      const { lastFrame } = renderTUI();

      expect(lastFrame()).toContain('Issue-Make TUI');
      expect(lastFrame()).toContain('v1.0.0');
    });

    it('should render command prompt', async () => {
      const { lastFrame } = renderTUI();

      expect(lastFrame()).toContain('Available commands:');
      expect(lastFrame()).toContain('/add:feat');
    });

    it('should initialize AI service when configured', async () => {
      renderTUI();

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockConfigManager.getConfig).toHaveBeenCalled();
    });
  });

  describe('AC-2.1.2: TUI interface elements', () => {
    it('should display all available commands', async () => {
      const { lastFrame } = renderTUI();

      expect(lastFrame()).toContain('/add:feat');
      expect(lastFrame()).toContain('/add:todo');
      expect(lastFrame()).toContain('/add:bug');
      expect(lastFrame()).toContain('/add:refact');
      expect(lastFrame()).toContain('/exit');
    });

    it('should display help information', async () => {
      const { lastFrame } = renderTUI();

      expect(lastFrame()).toContain('Add a new feature issue');
      expect(lastFrame()).toContain('Add a new todo issue');
      expect(lastFrame()).toContain('Add a new bug issue');
      expect(lastFrame()).toContain('Add a new refactor issue');
      expect(lastFrame()).toContain('Exit TUI');
    });
  });

  describe('AC-2.2.1: Slash command parsing', () => {
    it('should parse /add:feat command correctly', async () => {
      const { lastFrame, stdin } = render(<App />);

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate typing /add:feat and pressing Enter
      stdin.write('/add:feat');
      stdin.write('\r');

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFileManager.createIssue).toHaveBeenCalled();
      expect(lastFrame()).toContain('created');
    });

    it('should parse /add:todo command correctly', async () => {
      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:todo');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFileManager.createIssue).toHaveBeenCalled();
      const createCall = mockFileManager.createIssue.mock.calls[0];
      expect(createCall[0]).toBe(IssueType.TODO);
    });

    it('should parse /add:bug command correctly', async () => {
      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:bug');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFileManager.createIssue).toHaveBeenCalled();
      const createCall = mockFileManager.createIssue.mock.calls[0];
      expect(createCall[0]).toBe(IssueType.BUG);
    });

    it('should parse /add:refact command correctly', async () => {
      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:refact');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFileManager.createIssue).toHaveBeenCalled();
      const createCall = mockFileManager.createIssue.mock.calls[0];
      expect(createCall[0]).toBe(IssueType.REFACT);
    });
  });

  describe('AC-2.2.2: Invalid command handling', () => {
    it('should show error for invalid slash command format', async () => {
      const { lastFrame, stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/invalid');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Invalid command format');
      expect(mockFileManager.createIssue).not.toHaveBeenCalled();
    });

    it('should show error for invalid type', async () => {
      const { lastFrame, stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:invalid');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Invalid issue type');
      expect(mockFileManager.createIssue).not.toHaveBeenCalled();
    });

    it('should show error for non-slash command', async () => {
      const { lastFrame, stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('add feat');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Invalid command');
      expect(mockFileManager.createIssue).not.toHaveBeenCalled();
    });
  });

  describe('AC-2.2.3: Slash command file storage in stash', () => {
    it('should create file in stash directory via slash command', async () => {
      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:feat');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFileManager.createIssue).toHaveBeenCalled();
      const result = mockFileManager.createIssue.mock.results[0].value;
      expect(result.filePath).toContain('stash');
    });

    it('should not create file in other directories', async () => {
      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:bug');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFileManager.createIssue).toHaveBeenCalled();
      const result = mockFileManager.createIssue.mock.results[0].value;
      expect(result.filePath).toContain('stash');
      expect(result.filePath).not.toContain('doing');
      expect(result.filePath).not.toContain('achieved');
    });
  });

  describe('AC-2.3.1: AI title generation', () => {
    it('should generate title with AI when configured', async () => {
      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:feat');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockAIService.generateTitle).toHaveBeenCalled();
    });

    it('should use AI-generated title for issue', async () => {
      mockAIService.generateTitle.mockResolvedValue({
        success: true,
        title: 'AI Generated Title',
      });

      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:feat');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      const createCall = mockFileManager.createIssue.mock.calls[0];
      expect(createCall[0]).toBe('AI Generated Title');
    });

    it('should display generated title to user', async () => {
      mockAIService.generateTitle.mockResolvedValue({
        success: true,
        title: 'Test Title',
      });

      const { lastFrame, stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:feat');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Test Title');
    });
  });

  describe('AC-2.3.2: AI unavailable fallback', () => {
    it('should use fallback title when AI not configured', async () => {
      mockConfigManager.getConfig.mockResolvedValue({ url: '', api: '', model: '' });

      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:feat');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFileManager.createIssue).toHaveBeenCalled();
      const createCall = mockFileManager.createIssue.mock.calls[0];
      expect(createCall[0]).toMatch(/^Issue-\d+$/);
    });

    it('should use timestamp as fallback title', async () => {
      mockConfigManager.getConfig.mockResolvedValue({ url: '', api: '', model: '' });

      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:feat');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      const createCall = mockFileManager.createIssue.mock.calls[0];
      expect(createCall[0]).toMatch(/^Issue-\d+$/);
    });

    it('should handle AI generation errors gracefully', async () => {
      mockConfigManager.getConfig.mockResolvedValue({
        url: 'https://api.test.com',
        api: 'test-key',
        model: 'gpt-4',
      });
      mockAIService.generateTitle.mockRejectedValue(new Error('AI error'));

      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:feat');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFileManager.createIssue).toHaveBeenCalled();
    });

    it('should not interrupt workflow when AI fails', async () => {
      mockAIService.generateTitle.mockResolvedValue({
        success: false,
        error: 'Generation failed',
      });

      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:feat');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFileManager.createIssue).toHaveBeenCalled();
    });
  });

  describe('Exit functionality', () => {
    it('should exit on /exit command', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation();

      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/exit');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
    });

    it('should handle empty input gracefully', async () => {
      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFileManager.createIssue).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only input gracefully', async () => {
      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('   ');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFileManager.createIssue).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle issue creation errors', async () => {
      mockFileManager.createIssue.mockResolvedValue({
        success: false,
        error: 'Creation failed',
      });

      const { lastFrame, stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      stdin.write('/add:feat');
      stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Failed to create issue');
      expect(lastFrame()).toContain('Creation failed');
    });
  });
});