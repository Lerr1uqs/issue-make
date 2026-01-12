/**
 * Init Command Handler for TUI
 * Initialize issue-make configuration
 */

import { ConfigManager } from '../../core/config.js';

/**
 * Result type for init command
 */
export interface InitCommandResult {
  success: boolean;
  configPath?: string;
  error?: string;
}

/**
 * Execute init command
 * @returns InitCommandResult with success status and config path
 */
export async function initCommandHandler(): Promise<InitCommandResult> {
  const configManager = new ConfigManager();

  try {
    await configManager.ensureConfigDir();
    const defaultSettings = configManager.getDefaultSettings();
    await configManager.setConfig(defaultSettings);

    return {
      success: true,
      configPath: configManager.getConfigPath(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to initialize configuration: ${error}`,
    };
  }
}