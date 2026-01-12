/**
 * Open Command
 * Start working on an issue
 */

import * as fs from 'fs/promises';
import { FileManager } from '../../core/file-manager.js';
import { getAgentsPath, getSolutionPath } from '../../utils/path.js';

const ISSUE_MAKE_START = '<!-- ISSUE-MAKE:START -->';
const ISSUE_MAKE_END = '<!-- ISSUE-MAKE:END -->';

/**
 * Execute open command
 * @param identifier - Issue number or title
 */
export async function openCommand(identifier: string): Promise<void> {
  if (!identifier || identifier.trim().length === 0) {
    console.error('✗ Please provide an issue identifier (number or title)');
    console.error('  Usage: issue-make open <number|title>');
    process.exit(1);
  }

  const basePath = process.cwd();
  const fileManager = new FileManager(basePath);

  // Open issue
  const result = await fileManager.openIssue(identifier);

  if (!result.success) {
    console.error('✗ Failed to open issue');
    console.error(`  Error: ${result.error}`);
    process.exit(1);
  }

  const issue = result.issue!;
  console.log('✓ Issue opened successfully');
  console.log(`  ID: ${issue.number}`);
  console.log(`  Title: ${issue.title}`);
  console.log(`  Type: ${issue.type}`);
  console.log(`  Solution file: ${result.solutionPath}`);

  // Update AGENTS.md
  await updateAgentsFile(basePath, issue);
}

/**
 * Update AGENTS.md file with task description
 * @param basePath - Project base path
 * @param issue - Issue object
 */
async function updateAgentsFile(basePath: string, issue: any): Promise<void> {
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

    console.log(`✓ Updated AGENTS.md: ${agentsPath}`);
  } catch (error) {
    console.warn('⚠ Failed to update AGENTS.md');
    console.warn(`  Error: ${error}`);
  }
}
