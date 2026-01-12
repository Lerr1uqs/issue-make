/**
 * Close Command
 * Complete and archive an issue
 */

import * as fs from 'fs/promises';
import { FileManager } from '../../core/file-manager.js';
import { getAgentsPath } from '../../utils/path.js';

/**
 * Execute close command
 * @param identifier - Issue number or title
 */
export async function closeCommand(identifier: string): Promise<void> {
  if (!identifier || identifier.trim().length === 0) {
    console.error('✗ Please provide an issue identifier (number or title)');
    console.error('  Usage: issue-make close <number|title>');
    process.exit(1);
  }

  const basePath = process.cwd();
  const fileManager = new FileManager(basePath);

  // Close issue
  const result = await fileManager.closeIssue(identifier);

  if (!result.success) {
    console.error('✗ Failed to close issue');
    console.error(`  Error: ${result.error}`);
    if (result.error?.includes('Solution file not found')) {
      console.error('  Hint: Please create solution.md first or ask your agent to create it');
    }
    process.exit(1);
  }

  console.log('✓ Issue closed successfully');
  console.log(`  Archived: ${result.archivedPath}`);

  // Clean up AGENTS.md
  await cleanupAgentsFile(basePath);
}

/**
 * Clean up AGENTS.md file
 * @param basePath - Project base path
 */
async function cleanupAgentsFile(basePath: string): Promise<void> {
  const agentsPath = getAgentsPath(basePath);

  try {
    const agentsContent = await fs.readFile(agentsPath, 'utf-8');

    // Remove ISSUE-MAKE section
    const cleanedContent = agentsContent.replace(
      /<!-- ISSUE-MAKE:START -->[\s\S]*?<!-- ISSUE-MAKE:END -->\n?/g,
      ''
    );

    await fs.writeFile(agentsPath, cleanedContent, 'utf-8');

    console.log(`✓ Cleaned up AGENTS.md: ${agentsPath}`);
  } catch (error) {
    console.warn('⚠ Failed to clean up AGENTS.md');
    console.warn(`  Error: ${error}`);
  }
}