/**
 * Open Command Handler for TUI
 * Start working on an issue
 */

import * as fs from 'fs/promises';
import { FileManager } from '../../core/file-manager.js';
import { getAgentsPath, getSolutionPath } from '../../utils/path.js';

const ISSUE_MAKE_START = '<!-- ISSUE-MAKE:START -->';
const ISSUE_MAKE_END = '<!-- ISSUE-MAKE:END -->';

/**
 * Result type for open command
 */
export interface OpenCommandResult {
  success: boolean;
  issue?: {
    number: number;
    title: string;
    type: string;
    createDate: Date;
  };
  solutionPath?: string;
  agentsPath?: string;
  error?: string;
}

/**
 * Execute open command
 * @param identifier - Issue number or title
 * @param basePath - Project base path
 * @returns OpenCommandResult with success status and issue details
 */
export async function openCommandHandler(
  identifier: string,
  basePath: string
): Promise<OpenCommandResult> {
  if (!identifier || identifier.trim().length === 0) {
    return {
      success: false,
      error: 'Please provide an issue identifier (number or title)',
    };
  }

  const fileManager = new FileManager(basePath);

  // Open issue
  const result = await fileManager.openIssue(identifier);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  const issue = result.issue!;
  const solutionPath = result.solutionPath;
  const agentsPath = getAgentsPath(basePath);

  // Update AGENTS.md
  const updateResult = await updateAgentsFile(basePath, issue);

  if (!updateResult.success) {
    return {
      success: false,
      error: `Issue opened but failed to update AGENTS.md: ${updateResult.error}`,
    };
  }

  return {
    success: true,
    issue: {
      number: issue.number,
      title: issue.title,
      type: issue.type,
      createDate: issue.createDate,
    },
    solutionPath,
    agentsPath,
  };
}

/**
 * Update AGENTS.md file with task description
 * @param basePath - Project base path
 * @param issue - Issue object
 * @returns Success status and error if any
 */
async function updateAgentsFile(
  basePath: string,
  issue: any
): Promise<{ success: boolean; error?: string }> {
  const agentsPath = getAgentsPath(basePath);
  const solutionPath = getSolutionPath(basePath);

  const taskContent = `
${ISSUE_MAKE_START}
## Task: ${issue.title}

**Issue ID:** ${issue.number}
**Type:** ${issue.type}
**Created:** ${issue.createDate}

### Description
${issue.content}

### Instructions
- Work on this issue and implement the solution
- Document your progress in ${solutionPath}
- When complete, use \`issue-make close ${issue.number}\` to archive

${ISSUE_MAKE_END}
`;

  try {
    let agentsContent = '';

    try {
      agentsContent = await fs.readFile(agentsPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, create new
      agentsContent = '# AGENTS.md\n\nThis file contains tasks for AI agents.\n\n';
    }

    // Remove existing ISSUE-MAKE section
    const cleanedContent = agentsContent.replace(
      /<!-- ISSUE-MAKE:START -->[\s\S]*?<!-- ISSUE-MAKE:END -->\n?/g,
      ''
    );

    // Append new task
    const newContent = cleanedContent + taskContent;
    await fs.writeFile(agentsPath, newContent, 'utf-8');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to update AGENTS.md: ${error}`,
    };
  }
}
