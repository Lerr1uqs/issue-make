/**
 * Validation Utilities
 * Helper functions for validating inputs and data
 */

import { IssueType } from '../core/types.js';

/**
 * Validate issue type
 * @param type - Type string to validate
 * @returns Valid IssueType or null
 */
export function validateIssueType(type: string): IssueType | null {
  const validTypes = Object.values(IssueType);
  if (validTypes.includes(type as IssueType)) {
    return type as IssueType;
  }
  return null;
}

/**
 * Validate issue number
 * @param number - Number string to validate
 * @returns Valid number or null
 */
export function validateIssueNumber(number: string): number | null {
  if (!/^\d+$/.test(number)) {
    return null;
  }

  const num = Number(number);
  if (Number.isNaN(num) || num < 0) {
    return null;
  }
  return num;
}

/**
 * Validate issue identifier (can be number or title)
 * @param identifier - Identifier string
 * @returns true if valid identifier
 */
export function isValidIdentifier(identifier: string): boolean {
  if (!identifier || identifier.trim().length === 0) {
    return false;
  }

  // Check if it's a number
  if (/^\d+$/.test(identifier)) {
    return true;
  }

  // Check if it's a valid title (not empty, reasonable length)
  if (identifier.trim().length > 0 && identifier.trim().length <= 200) {
    return true;
  }

  return false;
}

/**
 * Check if identifier is a number
 * @param identifier - Identifier string
 * @returns true if identifier is a number
 */
export function isNumberIdentifier(identifier: string): boolean {
  return /^\d+$/.test(identifier);
}

/**
 * Validate slash command format
 * @param command - Command string to validate
 * @returns true if valid slash command format
 */
export function isValidSlashCommand(command: string): boolean {
  return /^\/(add|open|close):(\w+)$/i.test(command);
}

/**
 * Parse slash command
 * @param command - Command string to parse
 * @returns Parsed command object or null
 */
export function parseSlashCommand(command: string): { action: string; type: string; description?: string } | null {
  // Match format: /add:TYPE description
  const match = command.match(/^\/(add|open|close):(\w+)(?:\s+(.*))?$/i);
  if (!match) {
    return null;
  }

  return {
    action: match[1].toLowerCase(),
    type: match[2].toLowerCase(),
    description: match[3] ? match[3].trim() : undefined,
  };
}

/**
 * Validate URL format
 * @param url - URL string to validate
 * @returns true if valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate API key format (basic check)
 * @param apiKey - API key string to validate
 * @returns true if valid format
 */
export function isValidApiKey(apiKey: string): boolean {
  if (!apiKey || apiKey.length < 10) {
    return false;
  }
  return true;
}

/**
 * Validate model name
 * @param model - Model name to validate
 * @returns true if valid
 */
export function isValidModel(model: string): boolean {
  return !!(model && model.trim().length > 0);
}

/**
 * Validate file path
 * @param filePath - File path to validate
 * @returns true if valid path
 */
export function isValidFilePath(filePath: string): boolean {
  if (!filePath || filePath.trim().length === 0) {
    return false;
  }

  // Check for invalid characters
  if (/[<>:"|?*]/.test(filePath)) {
    return false;
  }

  return true;
}

/**
 * Validate markdown content
 * @param content - Content to validate
 * @returns true if valid markdown
 */
export function isValidMarkdown(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }
  return true;
}

/**
 * Validate frontmatter
 * @param frontmatter - Frontmatter object to validate
 * @returns true if valid
 */
export function isValidFrontmatter(frontmatter: any): boolean {
  if (!frontmatter || typeof frontmatter !== 'object') {
    return false;
  }

  // Check for required fields
  if (!frontmatter['Create Date'] || !frontmatter.Type) {
    return false;
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(frontmatter['Create Date'])) {
    return false;
  }

  return true;
}
