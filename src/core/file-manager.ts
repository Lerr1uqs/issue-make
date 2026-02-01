/**
 * File Management Module
 * Handles issue file operations and directory management
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import {
  IssueFile,
  IssueStatus,
  IssueType,
  IssueMetadata,
  IssueCreationResult,
  IssueSearchResult,
  IssueOpenResult,
  IssueCloseResult,
} from './types.js';
import {
  generateIssueFilename,
  generateAchievedFilename,
  extractIssueNumber,
  isIssueFile,
  getIssuesDir,
  getStashDir,
  getDoingDir,
  getAchievedDir,
  getSolutionPath,
} from '../utils/path.js';
import { getCurrentDate } from '../utils/date.js';
import { validateIssueType } from '../utils/validation.js';

/**
 * FileManager class for managing issue files
 */
export class FileManager {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Ensure all required directories exist
   * @throws Error if directory creation fails
   */
  async ensureDirectories(): Promise<void> {
    const dirs = [
      getIssuesDir(this.basePath),
      getStashDir(this.basePath),
      getDoingDir(this.basePath),
      getAchievedDir(this.basePath),
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        throw new Error(`Failed to create directory ${dir}: ${error}`);
      }
    }
  }

  /**
   * Get next available issue ID
   * @returns Next ID number
   */
  async getNextId(): Promise<number> {
    const stashDir = getStashDir(this.basePath);
    const doingDir = getDoingDir(this.basePath);

    let maxId = -1;

    // Scan stash directory
    try {
      const stashFiles = await fs.readdir(stashDir);
      for (const file of stashFiles) {
        const number = extractIssueNumber(file);
        if (number !== null && number > maxId) {
          maxId = number;
        }
      }
    } catch (error) {
      // Directory doesn't exist yet, maxId remains -1
    }

    // Scan doing directory
    try {
      const doingFiles = await fs.readdir(doingDir);
      for (const file of doingFiles) {
        const number = extractIssueNumber(file);
        if (number !== null && number > maxId) {
          maxId = number;
        }
      }
    } catch (error) {
      // Directory doesn't exist yet
    }

    return maxId + 1;
  }

  /**
   * Create a new issue file
   * @param title - Issue title
   * @param type - Issue type
   * @param content - Issue content
   * @returns IssueCreationResult
   */
  async createIssue(title: string, type: IssueType, content: string): Promise<IssueCreationResult> {
    try {
      await this.ensureDirectories();

      const id = await this.getNextId();
      const filename = generateIssueFilename(title, id);
      const filePath = path.join(getStashDir(this.basePath), filename);

      const metadata: IssueMetadata = {
        'Create Date': getCurrentDate(),
        Type: type,
        Index: id,
      };

      const fileContent = this.formatIssueFile(metadata, content);
      await fs.writeFile(filePath, fileContent, 'utf-8');

      const issue: IssueFile = {
        title,
        number: id,
        type,
        content,
        createDate: new Date(),
        status: IssueStatus.STASH,
      };

      return {
        success: true,
        issue,
        filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create issue: ${error}`,
      };
    }
  }

  /**
   * Find issue by identifier (number or title)
   * @param identifier - Issue number or title
   * @returns IssueSearchResult
   */
  async findIssue(identifier: string): Promise<IssueSearchResult> {
    try {
      // Try to parse as number first
      const number = parseInt(identifier, 10);
      if (!isNaN(number)) {
        return this.findIssueByNumber(number);
      }

      // Try to find by title
      return this.findIssueByTitle(identifier);
    } catch (error) {
      return {
        found: false,
        error: `Failed to find issue: ${error}`,
      };
    }
  }

  /**
   * Find issue by number
   * @param number - Issue number
   * @returns IssueSearchResult
   */
  async findIssueByNumber(number: number): Promise<IssueSearchResult> {
    const stashDir = getStashDir(this.basePath);
    const doingDir = getDoingDir(this.basePath);

    // Check stash directory
    try {
      const stashFiles = await fs.readdir(stashDir);
      for (const file of stashFiles) {
        const fileNumber = extractIssueNumber(file);
        if (fileNumber === number) {
          return this.loadIssueFile(path.join(stashDir, file));
        }
      }
    } catch (error) {
      // Directory doesn't exist
    }

    // Check doing directory
    try {
      const doingFiles = await fs.readdir(doingDir);
      for (const file of doingFiles) {
        const fileNumber = extractIssueNumber(file);
        if (fileNumber === number) {
          return this.loadIssueFile(path.join(doingDir, file));
        }
      }
    } catch (error) {
      // Directory doesn't exist
    }

    return {
      found: false,
      error: `Issue with number ${number} not found`,
    };
  }

  /**
   * Find issue by title (fuzzy match)
   * @param title - Issue title
   * @returns IssueSearchResult
   */
  async findIssueByTitle(title: string): Promise<IssueSearchResult> {
    const stashDir = getStashDir(this.basePath);
    const doingDir = getDoingDir(this.basePath);
    const searchNormalized = this.normalizeTitleForSearch(title);

    if (!searchNormalized) {
      return {
        found: false,
        error: `Issue with title containing "${title}" not found`,
      };
    }

    // Check stash directory
    try {
      const stashFiles = await fs.readdir(stashDir);
      for (const file of stashFiles) {
        if (isIssueFile(file)) {
          const fileTitle = file.replace(/\.\d+\.md$/, '').toLowerCase();
          const fileNormalized = this.normalizeTitleForSearch(fileTitle);
          if (
            fileNormalized.includes(searchNormalized) ||
            searchNormalized.includes(fileNormalized)
          ) {
            return this.loadIssueFile(path.join(stashDir, file));
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist
    }

    // Check doing directory
    try {
      const doingFiles = await fs.readdir(doingDir);
      for (const file of doingFiles) {
        if (isIssueFile(file)) {
          const fileTitle = file.replace(/\.\d+\.md$/, '').toLowerCase();
          const fileNormalized = this.normalizeTitleForSearch(fileTitle);
          if (
            fileNormalized.includes(searchNormalized) ||
            searchNormalized.includes(fileNormalized)
          ) {
            return this.loadIssueFile(path.join(doingDir, file));
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist
    }

    return {
      found: false,
      error: `Issue with title containing "${title}" not found`,
    };
  }

  /**
   * Open an issue (move to doing directory)
   * @param identifier - Issue number or title
   * @returns IssueOpenResult
   */
  async openIssue(identifier: string): Promise<IssueOpenResult> {
    try {
      const searchResult = await this.findIssue(identifier);
      if (!searchResult.found || !searchResult.issue) {
        return {
          success: false,
          error: searchResult.error || 'Issue not found',
        };
      }

      const issue = searchResult.issue;

      // Check if issue is already in doing directory
      if (issue.status === IssueStatus.DOING) {
        return {
          success: false,
          error: `Issue #${issue.number} is already in progress`,
        };
      }

      // Move file to doing directory
      const doingDir = getDoingDir(this.basePath);
      const oldPath = path.join(
        issue.status === IssueStatus.STASH ? getStashDir(this.basePath) : getAchievedDir(this.basePath),
        generateIssueFilename(issue.title, issue.number)
      );
      const newPath = path.join(doingDir, generateIssueFilename(issue.title, issue.number));

      await fs.rename(oldPath, newPath);

      // Create solution.md file
      const solutionPath = getSolutionPath(this.basePath);
      await fs.writeFile(
        solutionPath,
        `# Solution for Issue #${issue.number}: ${issue.title}\n\n`,
        'utf-8'
      );

      return {
        success: true,
        issue,
        solutionPath,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to open issue: ${error}`,
      };
    }
  }

  /**
   * Close an issue (move to achieved directory)
   * @param identifier - Issue number or title
   * @returns IssueCloseResult
   */
  async closeIssue(identifier: string): Promise<IssueCloseResult> {
    try {
      const searchResult = await this.findIssue(identifier);
      if (!searchResult.found || !searchResult.issue) {
        return {
          success: false,
          error: searchResult.error || 'Issue not found',
        };
      }

      const issue = searchResult.issue;

      // Check if solution.md exists
      const solutionPath = getSolutionPath(this.basePath);
      try {
        await fs.access(solutionPath);
      } catch {
        return {
          success: false,
          error: 'Solution file not found. Please create solution.md first.',
        };
      }

      // Read solution content
      const solutionContent = await fs.readFile(solutionPath, 'utf-8');

      // Move file to achieved directory
      const achievedDir = getAchievedDir(this.basePath);
      const oldPath = path.join(getDoingDir(this.basePath), generateIssueFilename(issue.title, issue.number));
      const newPath = path.join(achievedDir, generateAchievedFilename(issue.title));

      // Combine original content with solution
      const combinedContent = `${issue.content}\n\n---\n\n## Solution\n\n${solutionContent}`;
      await fs.writeFile(newPath, combinedContent, 'utf-8');
      await fs.unlink(oldPath);

      // Delete solution.md
      await fs.unlink(solutionPath);

      return {
        success: true,
        archivedPath: newPath,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to close issue: ${error}`,
      };
    }
  }

  /**
   * Load issue file from disk
   * @param filePath - Path to issue file
   * @returns IssueSearchResult
   */
  private async loadIssueFile(filePath: string): Promise<IssueSearchResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { metadata, body } = this.parseIssueFile(content);

      const filename = path.basename(filePath);
      const number = extractIssueNumber(filename);
      const title = filename.replace(/\.\d+\.md$/, '');

      const type = validateIssueType(metadata.Type);
      if (!type) {
        return {
          found: false,
          error: `Invalid issue type in ${filePath}`,
        };
      }

      const createDateStr = metadata['Create Date'];
      const createDate = new Date(createDateStr);

      const issue: IssueFile = {
        title,
        number: number || 0,
        type,
        content: body,
        createDate,
        status: filePath.includes('doing') ? IssueStatus.DOING : IssueStatus.STASH,
      };

      return {
        found: true,
        issue,
      };
    } catch (error) {
      return {
        found: false,
        error: `Failed to load issue file: ${error}`,
      };
    }
  }

  /**
   * Format issue file with frontmatter
   * @param metadata - Issue metadata
   * @param content - Issue body content
   * @returns Formatted file content
   */
  private formatIssueFile(metadata: IssueMetadata, content: string): string {
    const yamlStr = yaml.stringify(metadata);
    return `---\n${yamlStr}---\n\n${content}`;
  }

  /**
   * Parse issue file
   * @param content - File content
   * @returns Parsed metadata and body
   */
  private parseIssueFile(content: string): { metadata: any; body: string } {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      return { metadata: {}, body: content };
    }

    const metadata = yaml.parse(match[1]);
    const body = match[2];

    return { metadata, body };
  }

  /**
   * Normalize titles for fuzzy matching
   * @param title - Title to normalize
   * @returns Normalized string
   */
  private normalizeTitleForSearch(title: string): string {
    return title
      .toLowerCase()
      .replace(/[-_]+/g, ' ')
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
