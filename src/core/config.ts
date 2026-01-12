/**
 * Configuration Management Module
 * Handles global configuration for Issue-Make including AI service settings
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Settings } from './types.js';

const CONFIG_DIR = '.issue-make';
const CONFIG_FILE = 'settings.json';

/**
 * ConfigManager class for managing global configuration
 */
export class ConfigManager {
  private configPath: string;

  constructor() {
    this.configPath = path.join(os.homedir(), CONFIG_DIR, CONFIG_FILE);
  }

  /**
   * Get the full path to the configuration file
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Ensure the configuration directory exists
   * @throws Error if directory creation fails
   */
  async ensureConfigDir(): Promise<void> {
    const configDir = path.dirname(this.configPath);
    try {
      await fs.mkdir(configDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create config directory: ${error}`);
    }
  }

  /**
   * Get current configuration
   * @returns Settings object or default settings if not exists
   */
  async getConfig(): Promise<Settings> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(content);
      return this.validateSettings(config);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return this.getDefaultSettings();
      }
      throw new Error(`Failed to read config: ${error}`);
    }
  }

  /**
   * Set configuration
   * @param settings - Settings to save
   */
  async setConfig(settings: Settings): Promise<void> {
    await this.ensureConfigDir();
    const validated = this.validateSettings(settings);
    await fs.writeFile(this.configPath, JSON.stringify(validated, null, 2), 'utf-8');
  }

  /**
   * Validate settings object
   * @param settings - Settings to validate
   * @returns Validated settings
   * @throws Error if settings are invalid
   */
  private validateSettings(settings: any): Settings {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings must be an object');
    }

    const validated: Settings = {
      url: settings.url || '',
      api: settings.api || '',
      model: settings.model || '',
    };

    return validated;
  }

  /**
   * Get default settings
   * @returns Default settings with empty strings
   */
  getDefaultSettings(): Settings {
    return {
      url: '',
      api: '',
      model: '',
    };
  }

  /**
   * Check if configuration exists
   * @returns true if config file exists
   */
  async configExists(): Promise<boolean> {
    try {
      await fs.access(this.configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete configuration file
   * @throws Error if deletion fails
   */
  async deleteConfig(): Promise<void> {
    try {
      await fs.unlink(this.configPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(`Failed to delete config: ${error}`);
      }
    }
  }
}