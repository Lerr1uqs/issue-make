/**
 * Path Utilities
 * Helper functions for file path operations
 */

import * as path from 'path';

/**
 * Sanitize a title for use in filenames
 * Replaces invalid characters with underscores
 * @param title - Title to sanitize
 * @returns Sanitized title
 */
export function sanitizeTitle(title: string): string {
  // Remove or replace invalid characters
  let sanitized = title
    .replace(/[<>:"/\\|?*]/g, '_') // Invalid filename characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/_+/g, '_') // Collapse consecutive underscores
    .replace(/-+/g, '-') // Remove consecutive dashes
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

  // Limit length
  if (sanitized.length > 80) {
    sanitized = sanitized.substring(0, 80);
  }

  if (!sanitized || sanitized.replace(/[-_]+/g, '').trim().length === 0) {
    return 'untitled';
  }

  return sanitized;
}

/**
 * Generate filename for issue in stash/doing directories
 * @param title - Issue title
 * @param number - Issue number
 * @returns Filename with format {sanitized-title}.{number}.md
 */
export function generateIssueFilename(title: string, number: number): string {
  const sanitized = sanitizeTitle(title);
  return `${sanitized}.${number}.md`;
}

/**
 * Generate filename for issue in achieved directory
 * @param title - Issue title
 * @returns Filename with format {sanitized-title}.md
 */
export function generateAchievedFilename(title: string): string {
  const sanitized = sanitizeTitle(title);
  return `${sanitized}.md`;
}

/**
 * Extract issue number from filename
 * @param filename - Filename with format {title}.{number}.md
 * @returns Issue number or null if not found
 */
export function extractIssueNumber(filename: string): number | null {
  const match = filename.match(/\.(\d+)\.md$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if filename is an issue file (has .number.md extension)
 * @param filename - Filename to check
 * @returns true if filename matches issue pattern
 */
export function isIssueFile(filename: string): boolean {
  return /\.(\d+)\.md$/.test(filename);
}

/**
 * Get the issues directory path
 * @param basePath - Base project path
 * @returns Path to .issues directory
 */
export function getIssuesDir(basePath: string): string {
  return path.join(basePath, '.issues');
}

/**
 * Get the stash directory path
 * @param basePath - Base project path
 * @returns Path to .issues/stash directory
 */
export function getStashDir(basePath: string): string {
  return path.join(getIssuesDir(basePath), 'stash');
}

/**
 * Get the doing directory path
 * @param basePath - Base project path
 * @returns Path to .issues/doing directory
 */
export function getDoingDir(basePath: string): string {
  return path.join(getIssuesDir(basePath), 'doing');
}

/**
 * Get the achieved directory path
 * @param basePath - Base project path
 * @returns Path to .issues/achieved directory
 */
export function getAchievedDir(basePath: string): string {
  return path.join(getIssuesDir(basePath), 'achieved');
}

/**
 * Get the solution file path
 * @param basePath - Base project path
 * @returns Path to .issues/solution.md
 */
export function getSolutionPath(basePath: string): string {
  return path.join(getIssuesDir(basePath), 'solution.md');
}

/**
 * Get the AGENTS.md file path
 * @param basePath - Base project path
 * @returns Path to AGENTS.md
 */
export function getAgentsPath(basePath: string): string {
  return path.join(basePath, 'AGENTS.md');
}
