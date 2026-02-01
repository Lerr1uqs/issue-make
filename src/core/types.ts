/**
 * Issue-Make Core Type Definitions
 * Defines all core types and interfaces used throughout the application
 */

/**
 * Issue type enumeration
 */
export enum IssueType {
  FEAT = 'feat',
  TODO = 'todo',
  BUG = 'bug',
  REFACT = 'refact',
}

/**
 * Issue status enumeration
 */
export enum IssueStatus {
  STASH = 'stash',
  DOING = 'doing',
  ACHIEVED = 'achieved',
}

/**
 * Global AI configuration settings
 */
export interface Settings {
  url: string;
  api: string;
  model: string;
}

/**
 * Issue file structure
 */
export interface IssueFile {
  title: string;
  number: number;
  type: IssueType;
  content: string;
  createDate: Date;
  status: IssueStatus;
}

/**
 * Issue frontmatter metadata
 */
export interface IssueMetadata {
  'Create Date': string;
  Type: IssueType;
  Index: number;
}

/**
 * Slash command structure
 */
export interface SlashCommand {
  command: string;
  type: IssueType;
  description: string;
}

/**
 * File move result
 */
export interface FileMoveResult {
  success: boolean;
  from: string;
  to: string;
  error?: string;
}

/**
 * AI service response
 */
export interface AIResponse {
  success: boolean;
  title?: string;
  error?: string;
}

/**
 * Config validation result
 */
export interface ConfigValidationResult {
  valid: boolean;
  error?: string;
  details?: string;
}

/**
 * Issue search result
 */
export interface IssueSearchResult {
  found: boolean;
  issue?: IssueFile;
  error?: string;
}

/**
 * AGENTS.md update result
 */
export interface AgentsUpdateResult {
  success: boolean;
  created?: boolean;
  updated?: boolean;
  error?: string;
}

/**
 * AGENTS.md cleanup result
 */
export interface AgentsCleanupResult {
  success: boolean;
  removed?: boolean;
  error?: string;
}

/**
 * Issue creation result
 */
export interface IssueCreationResult {
  success: boolean;
  issue?: IssueFile;
  filePath?: string;
  error?: string;
}

/**
 * Issue open result
 */
export interface IssueOpenResult {
  success: boolean;
  issue?: IssueFile;
  solutionPath?: string;
  error?: string;
}

/**
 * Issue close result
 */
export interface IssueCloseResult {
  success: boolean;
  archivedPath?: string;
  error?: string;
}
