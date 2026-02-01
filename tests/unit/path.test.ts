/**
 * Unit Tests for Path Utilities
 * Tests for AC-4.3.1, AC-4.3.2
 */

import {
  sanitizeTitle,
  generateIssueFilename,
  generateAchievedFilename,
  extractIssueNumber,
  isIssueFile,
  getIssuesDir,
  getStashDir,
  getDoingDir,
  getAchievedDir,
  getSolutionPath,
  getAgentsPath,
} from '../../src/utils/path';
import * as path from 'path';

describe('Path Utilities', () => {
  describe('AC-4.3.1: File naming in stash directory', () => {
    it('should generate filename with sanitized title and number', () => {
      const title = 'Add User Authentication';
      const number = 0;
      const filename = generateIssueFilename(title, number);

      expect(filename).toBe('Add-User-Authentication.0.md');
    });

    it('should sanitize invalid characters from title', () => {
      const title = 'Fix: Bug<>in/login?feature';
      const number = 1;
      const filename = generateIssueFilename(title, number);

      expect(filename).toBe('Fix_-Bug_in_login_feature.1.md');
      expect(filename).not.toMatch(/[<>:"/\\|?*]/);
    });

    it('should replace spaces with dashes', () => {
      const title = 'Add new feature';
      const number = 2;
      const filename = generateIssueFilename(title, number);

      expect(filename).toBe('Add-new-feature.2.md');
    });

    it('should remove consecutive dashes', () => {
      const title = 'Fix  bug  in  code';
      const number = 3;
      const filename = generateIssueFilename(title, number);

      expect(filename).toBe('Fix-bug-in-code.3.md');
      expect(filename).not.toMatch(/--/);
    });

    it('should remove leading and trailing dashes', () => {
      const title = '  Test Title  ';
      const number = 4;
      const filename = generateIssueFilename(title, number);

      expect(filename).toBe('Test-Title.4.md');
      expect(filename).not.toMatch(/^-|-$/);
    });

    it('should limit filename length to 80 characters for title part', () => {
      const longTitle = 'a'.repeat(100);
      const number = 5;
      const filename = generateIssueFilename(longTitle, number);

      const titlePart = filename.split('.')[0];
      expect(titlePart.length).toBeLessThanOrEqual(80);
    });

    it('should use "untitled" for empty title', () => {
      const filename = generateIssueFilename('', 6);
      expect(filename).toBe('untitled.6.md');
    });

    it('should use "untitled" for title with only invalid characters', () => {
      const filename = generateIssueFilename('<<<>>>???', 7);
      expect(filename).toBe('untitled.7.md');
    });
  });

  describe('AC-4.3.2: File naming in achieved directory', () => {
    it('should generate filename without number', () => {
      const title = 'Add User Authentication';
      const filename = generateAchievedFilename(title);

      expect(filename).toBe('Add-User-Authentication.md');
    });

    it('should remove ID from filename', () => {
      const title = 'Add User Authentication';
      const stashFilename = generateIssueFilename(title, 0);
      const achievedFilename = generateAchievedFilename(title);

      expect(stashFilename).toContain('.0.');
      expect(achievedFilename).not.toContain('.0.');
    });

    it('should keep title consistent between stash and achieved', () => {
      const title = 'Add User Authentication';
      const stashFilename = generateIssueFilename(title, 0);
      const achievedFilename = generateAchievedFilename(title);

      const stashTitlePart = stashFilename.split('.')[0];
      const achievedTitlePart = achievedFilename.replace('.md', '');

      expect(stashTitlePart).toBe(achievedTitlePart);
    });
  });

  describe('Issue number extraction', () => {
    it('should extract issue number from filename', () => {
      const filename = 'Add-User-Authentication.0.md';
      const number = extractIssueNumber(filename);

      expect(number).toBe(0);
    });

    it('should extract issue number from larger numbers', () => {
      const filename = 'Fix-bug.123.md';
      const number = extractIssueNumber(filename);

      expect(number).toBe(123);
    });

    it('should return null for filename without number', () => {
      const filename = 'Add-User-Authentication.md';
      const number = extractIssueNumber(filename);

      expect(number).toBeNull();
    });

    it('should return null for invalid filename', () => {
      const filename = 'invalid.txt';
      const number = extractIssueNumber(filename);

      expect(number).toBeNull();
    });
  });

  describe('Issue file detection', () => {
    it('should identify issue files correctly', () => {
      expect(isIssueFile('Add-User-Authentication.0.md')).toBe(true);
      expect(isIssueFile('Fix-bug.1.md')).toBe(true);
      expect(isIssueFile('Refactor-code.99.md')).toBe(true);
    });

    it('should reject non-issue files', () => {
      expect(isIssueFile('Add-User-Authentication.md')).toBe(false);
      expect(isIssueFile('README.md')).toBe(false);
      expect(isIssueFile('test.txt')).toBe(false);
      expect(isIssueFile('.gitignore')).toBe(false);
    });
  });

  describe('Directory path generation', () => {
    const basePath = '/project/root';

    it('should generate issues directory path', () => {
      const issuesDir = getIssuesDir(basePath);
      expect(issuesDir).toBe(path.join(basePath, '.issues'));
    });

    it('should generate stash directory path', () => {
      const stashDir = getStashDir(basePath);
      expect(stashDir).toBe(path.join(basePath, '.issues', 'stash'));
    });

    it('should generate doing directory path', () => {
      const doingDir = getDoingDir(basePath);
      expect(doingDir).toBe(path.join(basePath, '.issues', 'doing'));
    });

    it('should generate achieved directory path', () => {
      const achievedDir = getAchievedDir(basePath);
      expect(achievedDir).toBe(path.join(basePath, '.issues', 'achieved'));
    });

    it('should generate solution file path', () => {
      const solutionPath = getSolutionPath(basePath);
      expect(solutionPath).toBe(path.join(basePath, '.issues', 'solution.md'));
    });

    it('should generate AGENTS.md path', () => {
      const agentsPath = getAgentsPath(basePath);
      expect(agentsPath).toBe(path.join(basePath, 'AGENTS.md'));
    });
  });

  describe('Edge cases', () => {
    it('should handle titles with special characters', () => {
      const title = 'Fix: émojis 🎉 and spëcial çhars';
      const filename = generateIssueFilename(title, 0);

      expect(filename).toBe('Fix_-émojis-🎉-and-spëcial-çhars.0.md');
    });

    it('should handle titles with numbers', () => {
      const title = 'Fix bug in version 2.0';
      const filename = generateIssueFilename(title, 1);

      expect(filename).toBe('Fix-bug-in-version-2.0.1.md');
    });

    it('should handle titles with underscores', () => {
      const title = 'Add_user_authentication_feature';
      const filename = generateIssueFilename(title, 2);

      expect(filename).toBe('Add_user_authentication_feature.2.md');
    });

    it('should handle titles with mixed case', () => {
      const title = 'Add USER Authentication FEATURE';
      const filename = generateIssueFilename(title, 3);

      expect(filename).toBe('Add-USER-Authentication-FEATURE.3.md');
    });

    it('should handle very long titles', () => {
      const longTitle = 'a'.repeat(200);
      const filename = generateIssueFilename(longTitle, 4);

      const titlePart = filename.split('.')[0];
      expect(titlePart.length).toBeLessThanOrEqual(80);
      expect(filename).toContain('.4.md');
    });

    it('should handle consecutive spaces', () => {
      const title = 'Fix    bug    in    code';
      const filename = generateIssueFilename(title, 5);

      expect(filename).toBe('Fix-bug-in-code.5.md');
    });

    it('should handle leading/trailing spaces', () => {
      const title = '  Add feature  ';
      const filename = generateIssueFilename(title, 6);

      expect(filename).toBe('Add-feature.6.md');
    });

    it('should handle Windows paths', () => {
      const basePath = 'C:\\Users\\test\\project';
      const issuesDir = getIssuesDir(basePath);

      expect(issuesDir).toContain('.issues');
    });

    it('should handle Unix paths', () => {
      const basePath = '/home/user/project';
      const issuesDir = getIssuesDir(basePath);

      expect(issuesDir).toBe(path.join(basePath, '.issues'));
    });
  });
});
