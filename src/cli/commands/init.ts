/**
 * Init Command
 * Initialize issue-make configuration
 */

import { ConfigManager } from '../../core/config.js';

/**
 * Execute init command
 */
export async function initCommand(): Promise<void> {
  const configManager = new ConfigManager();

  try {
    await configManager.ensureConfigDir();
    const defaultSettings = configManager.getDefaultSettings();
    await configManager.setConfig(defaultSettings);

    console.log('✓ Configuration initialized successfully');
    console.log(`  Config file: ${configManager.getConfigPath()}`);
    console.log('\nNext steps:');
    console.log('  1. Configure AI settings:');
    console.log('     Edit ~/.issue-make/settings.json');
    console.log('  2. Start managing issues:');
    console.log('     issue-make add --type feat path/to/description.md');
  } catch (error) {
    console.error('✗ Failed to initialize configuration:', error);
    process.exit(1);
  }
}