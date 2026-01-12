/**
 * Close Command Handler for TUI
 * Complete and archive an issue
 */

import * as fs from 'fs/promises';
import { FileManager } from '../../core/file-manager.js';
import { getAgentsPath } from '../../utils/path.js';

/**
 * Result type for close command
 */
export interface CloseCommandResult {
  success: boolean;
  archivedPath?: string;
  agentsPath?: string;
  error?: string;
}

/**
 * Execute close command
 * @param identifier - Issue number or title
 * @param basePath - Project base path
 * @returns CloseCommandResult with success status and archived path
 */
export async function closeCommandHandler(
  identifier: string,
  basePath: string
): Promise<CloseCommandResult> {
  if (!identifier || identifier.trim().length === 0) {
    return {
      success: false,
      error: 'Please provide an issue identifier (number or title)',
    };
  }

  const fileManager = new FileManager(basePath);

  // Close issue
  const result = await fileManager.closeIssue(identifier);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  const agentsPath = getAgentsPath(basePath);

  // Clean up AGENTS.md
  const cleanupResult = await cleanupAgentsFile(basePath);

  if (!cleanupResult.success) {
    return {
      success: false,
      error: `Issue closed but failed to clean up AGENTS.md: ${cleanupResult.error}`,
    };
  }

  return {
    success: true,
    archivedPath: result.archivedPath,
    agentsPath,
  };
}

/**
 * Clean up AGENTS.md file
 * @param basePath - Project base path
 * @returns Success status and error if any
 */
async function cleanupAgentsFile(
  basePath: string
): Promise<{ success: boolean; error?: string }> {
  const agentsPath = getAgentsPath(basePath);

  try {
    const agentsContent = await fs.readFile(agentsPath, 'utf-8');

    // Remove ISSUE-MAKE section
    const cleanedContent = agentsContent.replace(
      /<!-- ISSUE-MAKE:START -->[\s\S]*?<!-- ISSUE-MAKE:END -->\n?/g,
      ''
    );

    await fs.writeFile(agentsPath, cleanedContent, 'utf-8');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to clean up AGENTS.md: ${error}`,
    };
  }
}
