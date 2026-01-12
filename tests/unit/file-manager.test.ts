/**
 * Unit Tests for FileManager
 * Tests for AC-3.1.1, AC-3.1.2, AC-3.2.1, AC-3.2.2, AC-3.3.1, AC-4.1.1, AC-4.2.1, AC-4.2.2, AC-5.1.3, AC-6.3.1, AC-6.3.2
 */

import * as fs from 'fs/promises';
import { FileManager } from '../../src/core/file-manager';
import { IssueType, IssueStatus } from '../../src/core/types';

// Mock fs module
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock yaml module
jest.mock('yaml');
import * as yaml from 'yaml';
const mockedYaml = yaml as jest.Mocked<typeof yaml>;

describe('FileManager', () => {
  let fileManager: FileManager;
  const basePath = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
    fileManager = new FileManager(basePath);
    mockedYaml.stringify.mockReturnValue('Create Date: "2026-01-12"\nType: "feat"\n');
    mockedYaml.parse.mockReturnValue({
      'Create Date': '2026-01-12',
      Type: 'feat',
    });
  });

  describe('AC-4.1.1: Directory creation', () => {
    it('should create all required directories', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);

      await fileManager.ensureDirectories();

      expect(mockedFs.mkdir).toHaveBeenCalledTimes(4);
      expect(mockedFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.issues'),
        { recursive: true }
      );
    });

    it('should create stash directory', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);

      await fileManager.ensureDirectories();

      const stashCall = mockedFs.mkdir.mock.calls.find(call =>
        call[0].includes('stash')
      );
      expect(stashCall).toBeDefined();
    });

    it('should create doing directory', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);

      await fileManager.ensureDirectories();

      const doingCall = mockedFs.mkdir.mock.calls.find(call =>
        call[0].includes('doing')
      );
      expect(doingCall).toBeDefined();
    });

    it('should create achieved directory', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);

      await fileManager.ensureDirectories();

      const achievedCall = mockedFs.mkdir.mock.calls.find(call =>
        call[0].includes('achieved')
      );
      expect(achievedCall).toBeDefined();
    });

    it('should handle directory creation errors', async () => {
      mockedFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(fileManager.ensureDirectories()).rejects.toThrow('Failed to create directory');
    });
  });

  describe('AC-4.2.1: ID increment management', () => {
    it('should start ID from 0 when no issues exist', async () => {
      mockedFs.readdir.mockRejectedValue(new Error('ENOENT') as any);

      const id = await fileManager.getNextId();

      expect(id).toBe(0);
    });

    it('should increment ID correctly', async () => {
      mockedFs.readdir.mockResolvedValue([
        'issue-0.0.md',
        'issue-1.1.md',
        'issue-2.2.md',
      ]);

      const id = await fileManager.getNextId();

      expect(id).toBe(3);
    });

    it('should handle gaps in ID sequence', async () => {
      mockedFs.readdir.mockResolvedValue([
        'issue-0.0.md',
        'issue-2.2.md',
        'issue-5.5.md',
      ]);

      const id = await fileManager.getNextId();

      expect(id).toBe(6);
    });

    it('should scan both stash and doing directories', async () => {
      mockedFs.readdir
        .mockResolvedValueOnce(['issue-0.0.md', 'issue-1.1.md'])
        .mockResolvedValueOnce(['issue-2.2.md']);

      const id = await fileManager.getNextId();

      expect(id).toBe(3);
      expect(mockedFs.readdir).toHaveBeenCalledTimes(2);
    });
  });

  describe('AC-4.2.2: ID management after deletion', () => {
    it('should continue incrementing after deletion', async () => {
      mockedFs.readdir.mockResolvedValue([
        'issue-0.0.md',
        'issue-2.2.md',
      ]);

      const id = await fileManager.getNextId();

      expect(id).toBe(3);
    });

    it('should maintain ID uniqueness', async () => {
      mockedFs.readdir.mockResolvedValue(['issue-9.9.md']);

      const id1 = await fileManager.getNextId();
      const id2 = await fileManager.getNextId();

      expect(id1).toBe(10);
      expect(id2).toBe(10); // Same because no new files created
    });
  });

  describe('AC-3.1.1: Create issue', () => {
    it('should create issue in stash directory', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readdir.mockRejectedValue(new Error('ENOENT') as any);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await fileManager.createIssue('Add User Auth', IssueType.FEAT, 'Description');

      expect(result.success).toBe(true);
      expect(result.issue).toBeDefined();
      expect(result.issue?.number).toBe(0);
      expect(result.issue?.status).toBe(IssueStatus.STASH);
      expect(result.filePath).toContain('stash');
    });

    it('should create issue with correct content format', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readdir.mockRejectedValue(new Error('ENOENT') as any);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await fileManager.createIssue('Add User Auth', IssueType.FEAT, 'Description');

      expect(result.success).toBe(true);
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.0.md'),
        expect.stringContaining('---'),
        'utf-8'
      );
    });

    it('should handle creation errors', async () => {
      mockedFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      const result = await fileManager.createIssue('Test', IssueType.FEAT, 'Description');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create issue');
    });
  });

  describe('AC-3.1.2: Issue file format', () => {
    it('should include YAML frontmatter', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readdir.mockRejectedValue(new Error('ENOENT') as any);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await fileManager.createIssue('Test', IssueType.FEAT, 'Description');

      expect(result.success).toBe(true);
      const writtenContent = mockedFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).toMatch(/^---\n/);
      expect(writtenContent).toMatch(/\n---\n/);
    });

    it('should include Create Date in frontmatter', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readdir.mockRejectedValue(new Error('ENOENT') as any);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await fileManager.createIssue('Test', IssueType.FEAT, 'Description');

      expect(result.success).toBe(true);
      const writtenContent = mockedFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).toContain('Create Date');
      expect(writtenContent).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should include Type in frontmatter', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readdir.mockRejectedValue(new Error('ENOENT') as any);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await fileManager.createIssue('Test', IssueType.FEAT, 'Description');

      expect(result.success).toBe(true);
      const writtenContent = mockedFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).toContain('Type');
      expect(writtenContent).toContain('feat');
    });

    it('should include original content after frontmatter', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readdir.mockRejectedValue(new Error('ENOENT') as any);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const description = 'This is a test description';
      const result = await fileManager.createIssue('Test', IssueType.FEAT, description);

      expect(result.success).toBe(true);
      const writtenContent = mockedFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).toContain(description);
    });
  });

  describe('AC-3.2.1: Open issue by number', () => {
    it('should find and open issue by number', async () => {
      mockedFs.readdir.mockResolvedValue(['Test.0.md']);
      mockedFs.readFile.mockResolvedValue(
        '---\nCreate Date: "2026-01-12"\nType: "feat"\n---\n\nDescription'
      );
      mockedFs.rename.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await fileManager.openIssue('0');

      expect(result.success).toBe(true);
      expect(result.issue).toBeDefined();
      expect(result.issue?.number).toBe(0);
      expect(result.solutionPath).toBeDefined();
    });

    it('should move file to doing directory', async () => {
      mockedFs.readdir.mockResolvedValue(['Test.0.md']);
      mockedFs.readFile.mockResolvedValue(
        '---\nCreate Date: "2026-01-12"\nType: "feat"\n---\n\nDescription'
      );
      mockedFs.rename.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      await fileManager.openIssue('0');

      expect(mockedFs.rename).toHaveBeenCalled();
      const renameCall = mockedFs.rename.mock.calls[0];
      expect(renameCall[1]).toContain('doing');
    });
  });

  describe('AC-3.2.2: Open issue by title', () => {
    it('should find issue by partial title', async () => {
      mockedFs.readdir.mockResolvedValue(['Add-User-Authentication.0.md']);
      mockedFs.readFile.mockResolvedValue(
        '---\nCreate Date: "2026-01-12"\nType: "feat"\n---\n\nDescription'
      );
      mockedFs.rename.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await fileManager.openIssue('User Auth');

      expect(result.success).toBe(true);
      expect(result.issue).toBeDefined();
      expect(result.issue?.title).toContain('User');
    });

    it('should handle case insensitive title search', async () => {
      mockedFs.readdir.mockResolvedValue(['Add-User-Authentication.0.md']);
      mockedFs.readFile.mockResolvedValue(
        '---\nCreate Date: "2026-01-12"\nType: "feat"\n---\n\nDescription'
      );
      mockedFs.rename.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await fileManager.openIssue('user auth');

      expect(result.success).toBe(true);
    });
  });

  describe('AC-3.3.1: Close issue', () => {
    it('should close issue and move to achieved', async () => {
      mockedFs.readdir.mockResolvedValue(['Test.0.md']);
      mockedFs.readFile
        .mockResolvedValueOnce(
          '---\nCreate Date: "2026-01-12"\nType: "feat"\n---\n\nDescription'
        )
        .mockResolvedValueOnce('Solution content');
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);
      mockedFs.unlink.mockResolvedValue(undefined);

      const result = await fileManager.closeIssue('0');

      expect(result.success).toBe(true);
      expect(result.archivedPath).toBeDefined();
      expect(result.archivedPath).toContain('achieved');
    });

    it('should merge solution content', async () => {
      mockedFs.readdir.mockResolvedValue(['Test.0.md']);
      mockedFs.readFile
        .mockResolvedValueOnce(
          '---\nCreate Date: "2026-01-12"\nType: "feat"\n---\n\nOriginal content'
        )
        .mockResolvedValueOnce('Solution content');
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);
      mockedFs.unlink.mockResolvedValue(undefined);

      await fileManager.closeIssue('0');

      const writeCall = mockedFs.writeFile.mock.calls.find(call =>
        call[0].includes('achieved')
      );
      expect(writeCall).toBeDefined();
      const writtenContent = writeCall![1] as string;
      expect(writtenContent).toContain('Original content');
      expect(writtenContent).toContain('Solution content');
    });

    it('should delete solution.md after close', async () => {
      mockedFs.readdir.mockResolvedValue(['Test.0.md']);
      mockedFs.readFile
        .mockResolvedValueOnce(
          '---\nCreate Date: "2026-01-12"\nType: "feat"\n---\n\nDescription'
        )
        .mockResolvedValueOnce('Solution');
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);
      mockedFs.unlink.mockResolvedValue(undefined);

      await fileManager.closeIssue('0');

      expect(mockedFs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('solution.md')
      );
    });
  });

  describe('AC-5.1.3: Create solution.md on open', () => {
    it('should create solution.md file when opening issue', async () => {
      mockedFs.readdir.mockResolvedValue(['Test.0.md']);
      mockedFs.readFile.mockResolvedValue(
        '---\nCreate Date: "2026-01-12"\nType: "feat"\n---\n\nDescription'
      );
      mockedFs.rename.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await fileManager.openIssue('0');

      expect(result.success).toBe(true);
      expect(result.solutionPath).toBeDefined();
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('solution.md'),
        expect.stringContaining('Solution for Issue'),
        'utf-8'
      );
    });

    it('should include issue number and title in solution.md', async () => {
      mockedFs.readdir.mockResolvedValue(['Test-Feature.0.md']);
      mockedFs.readFile.mockResolvedValue(
        '---\nCreate Date: "2026-01-12"\nType: "feat"\n---\n\nDescription'
      );
      mockedFs.rename.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      await fileManager.openIssue('0');

      const writeCall = mockedFs.writeFile.mock.calls.find(call =>
        call[0].includes('solution.md')
      );
      expect(writeCall).toBeDefined();
      const writtenContent = writeCall![1] as string;
      expect(writtenContent).toContain('#0');
      expect(writtenContent).toContain('Test-Feature');
    });
  });

  describe('AC-6.3.1: Error when opening already open issue', () => {
    it('should return error when opening issue already in doing', async () => {
      mockedFs.readdir.mockResolvedValue(['Test.0.md']);
      mockedFs.readFile.mockResolvedValue(
        '---\nCreate Date: "2026-01-12"\nType: "feat"\n---\n\nDescription'
      );
      // File is in doing directory
      const filePath = '/test/project/.issues/doing/Test.0.md';
      mockedFs.rename.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      // Mock findIssue to return issue in DOING status
      jest.spyOn(fileManager as any, 'findIssue').mockResolvedValue({
        found: true,
        issue: {
          title: 'Test',
          number: 0,
          type: IssueType.FEAT,
          content: 'Description',
          createDate: new Date(),
          status: IssueStatus.DOING,
        },
      });

      const result = await fileManager.openIssue('0');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already in progress');
    });
  });

  describe('AC-6.3.2: Error when closing without solution', () => {
    it('should return error when solution.md does not exist', async () => {
      mockedFs.readdir.mockResolvedValue(['Test.0.md']);
      mockedFs.readFile.mockResolvedValue(
        '---\nCreate Date: "2026-01-12"\nType: "feat"\n---\n\nDescription'
      );
      mockedFs.access.mockRejectedValue(new Error('ENOENT') as any);

      const result = await fileManager.closeIssue('0');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Solution file not found');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty title', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readdir.mockRejectedValue(new Error('ENOENT') as any);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await fileManager.createIssue('', IssueType.FEAT, 'Description');

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('untitled');
    });

    it('should handle special characters in title', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readdir.mockRejectedValue(new Error('ENOENT') as any);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await fileManager.createIssue(
        'Fix: Bug<>in/login',
        IssueType.BUG,
        'Description'
      );

      expect(result.success).toBe(true);
      expect(result.filePath).not.toMatch(/[<>:"/\\|?*]/);
    });

    it('should handle large ID numbers', async () => {
      mockedFs.readdir.mockResolvedValue(['Test.9999.md']);
      mockedFs.readFile.mockResolvedValue(
        '---\nCreate Date: "2026-01-12"\nType: "feat"\n---\n\nDescription'
      );
      mockedFs.rename.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await fileManager.openIssue('9999');

      expect(result.success).toBe(true);
      expect(result.issue?.number).toBe(9999);
    });
  });
});
