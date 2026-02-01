/**
 * Add Command Handler for TUI
 * Create a new issue from description
 */

import { FileManager } from '../../core/file-manager.js';
import { AIService } from '../../core/ai.js';
import { ConfigManager } from '../../core/config.js';
import { IssueType } from '../../core/types.js';
import { getTimestamp } from '../../utils/date.js';

/**
 * Result type for add command
 */
export interface AddCommandResult {
  success: boolean;
  issue?: {
    number: number;
    title: string;
    type: IssueType;
  };
  filePath?: string;
  warning?: string;
  error?: string;
}

/**
 * Execute add command
 * @param type - Issue type
 * @param description - Issue description
 * @param basePath - Project base path
 * @returns AddCommandResult with success status and issue details
 */
export async function addCommandHandler(
  type: IssueType,
  description: string,
  basePath: string
): Promise<AddCommandResult> {
  if (!description.trim()) {
    return {
      success: false,
      error: 'Description cannot be empty',
    };
  }

  const fileManager = new FileManager(basePath);
  const configManager = new ConfigManager();
  let warning: string | undefined;

  const configExists = await configManager.configExists();
  if (!configExists) {
    warning = 'Config file not found. Run /init to enable AI titles.';
  }

  // Try to generate title with AI
  let title: string;
  try {
    const config = await configManager.getConfig();
    const aiService = new AIService(config);

    if (aiService.isConfigured()) {
      const result = await aiService.generateTitle(description);
      if (result.success && result.title) {
        title = result.title;
      } else {
        title = `Issue-${getTimestamp()}`;
      }
    } else {
      title = `Issue-${getTimestamp()}`;
    }
  } catch (error) {
    title = `Issue-${getTimestamp()}`;
  }

  // Create issue
  const result = await fileManager.createIssue(title, type, description);

  if (result.success) {
    return {
      success: true,
      issue: {
        number: result.issue!.number,
        title: result.issue!.title,
        type: result.issue!.type,
      },
      filePath: result.filePath,
      warning,
    };
  } else {
    return {
      success: false,
      error: result.error,
    };
  }
}
