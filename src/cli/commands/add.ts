/**
 * Add Command
 * Create a new issue from a description file
 */

import * as fs from 'fs/promises';
import { FileManager } from '../../core/file-manager.js';
import { AIService } from '../../core/ai.js';
import { ConfigManager } from '../../core/config.js';
import { validateIssueType } from '../../utils/validation.js';
import { getTimestamp } from '../../utils/date.js';

/**
 * Execute add command
 * @param type - Issue type
 * @param filePath - Path to description file
 */
export async function addCommand(type: string, filePath: string): Promise<void> {
  // Validate type
  const validatedType = validateIssueType(type);
  if (!validatedType) {
    console.error(`✗ Invalid issue type: ${type}`);
    console.error('  Valid types: feat, todo, bug, refact');
    process.exit(1);
  }

  // Read description file
  let description: string;
  try {
    description = await fs.readFile(filePath, 'utf-8');
    if (!description.trim()) {
      console.error(`✗ Description file is empty: ${filePath}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`✗ Failed to read description file: ${filePath}`);
    console.error(`  Error: ${error}`);
    process.exit(1);
  }

  // Get project base path
  const basePath = process.cwd();

  // Initialize services
  const configManager = new ConfigManager();
  const fileManager = new FileManager(basePath);

  // Try to generate title with AI
  let title: string;
  try {
    const configExists = await configManager.configExists();
    if (!configExists) {
      console.warn('⚠ Config file not found. Run "issue-make init" to enable AI titles.');
    }
    const config = await configManager.getConfig();
    const aiService = new AIService(config);

    if (aiService.isConfigured()) {
      console.log('Generating title with AI...');
      const result = await aiService.generateTitle(description);
      if (result.success && result.title) {
        title = result.title;
        console.log(`✓ Generated title: ${title}`);
      } else {
        console.log('⚠ AI generation failed, using fallback');
        title = `Issue-${getTimestamp()}`;
      }
    } else {
      console.log('⚠ AI not configured, using fallback title');
      title = `Issue-${getTimestamp()}`;
    }
  } catch (error) {
    console.log('⚠ AI service error, using fallback title');
    title = `Issue-${getTimestamp()}`;
  }

  // Create issue
  const result = await fileManager.createIssue(title, validatedType, description);

  if (result.success) {
    console.log('✓ Issue created successfully');
    console.log(`  ID: ${result.issue?.number}`);
    console.log(`  Title: ${result.issue?.title}`);
    console.log(`  Type: ${result.issue?.type}`);
    console.log(`  File: ${result.filePath}`);
  } else {
    console.error('✗ Failed to create issue');
    console.error(`  Error: ${result.error}`);
    process.exit(1);
  }
}
