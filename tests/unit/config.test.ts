/**
 * Unit Tests for ConfigManager
 * Tests for AC-1.1.1, AC-1.1.2, AC-1.2.1, AC-1.2.2
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ConfigManager } from '../../src/core/config';
import { Settings } from '../../src/core/types';

// Mock fs module
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockConfigPath: string;

  beforeEach(() => {
    jest.clearAllMocks();
    configManager = new ConfigManager();
    mockConfigPath = path.join(os.homedir(), '.issue-make', 'settings.json');
  });

  describe('AC-1.1.1: Config file creation', () => {
    it('should create config directory when setting config', async () => {
      const settings: Settings = { url: 'https://api.test.com', api: 'test-key', model: 'gpt-4' };
      
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      await configManager.setConfig(settings);

      expect(mockedFs.mkdir).toHaveBeenCalledWith(
        path.dirname(mockConfigPath),
        { recursive: true }
      );
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify(settings, null, 2),
        'utf-8'
      );
    });

    it('should create config file with valid JSON format', async () => {
      const settings: Settings = { url: 'https://api.test.com', api: 'test-key', model: 'gpt-4' };
      
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      await configManager.setConfig(settings);

      const writtenContent = mockedFs.writeFile.mock.calls[0][1] as string;
      const parsedContent = JSON.parse(writtenContent);
      
      expect(parsedContent).toEqual(settings);
      expect(() => JSON.parse(writtenContent)).not.toThrow();
    });
  });

  describe('AC-1.1.2: Config file contains required fields', () => {
    it('should return default settings with all required fields when config does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockedFs.readFile.mockRejectedValue(error);

      const config = await configManager.getConfig();

      expect(config).toEqual({
        url: '',
        api: '',
        model: '',
      });
      expect(typeof config.url).toBe('string');
      expect(typeof config.api).toBe('string');
      expect(typeof config.model).toBe('string');
    });

    it('should validate that config contains url, api, and model fields', async () => {
      const testSettings: Settings = { url: 'https://api.test.com', api: 'test-key', model: 'gpt-4' };
      mockedFs.readFile.mockResolvedValue(JSON.stringify(testSettings));

      const config = await configManager.getConfig();

      expect(config).toHaveProperty('url');
      expect(config).toHaveProperty('api');
      expect(config).toHaveProperty('model');
      expect(config.url).toBe('https://api.test.com');
      expect(config.api).toBe('test-key');
      expect(config.model).toBe('gpt-4');
    });

    it('should handle partial config by filling missing fields with empty strings', async () => {
      const partialSettings = { url: 'https://api.test.com' };
      mockedFs.readFile.mockResolvedValue(JSON.stringify(partialSettings));

      const config = await configManager.getConfig();

      expect(config.url).toBe('https://api.test.com');
      expect(config.api).toBe('');
      expect(config.model).toBe('');
    });
  });

  describe('AC-1.2.1: Valid config validation', () => {
    it('should accept valid configuration', async () => {
      const validSettings: Settings = {
        url: 'https://api.deepseek.com',
        api: 'sk-1234567890abcdef',
        model: 'deepseek-chat',
      };

      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      await expect(configManager.setConfig(validSettings)).resolves.not.toThrow();
    });

    it('should successfully read valid configuration', async () => {
      const validSettings: Settings = {
        url: 'https://api.deepseek.com',
        api: 'sk-1234567890abcdef',
        model: 'deepseek-chat',
      };
      mockedFs.readFile.mockResolvedValue(JSON.stringify(validSettings));

      const config = await configManager.getConfig();

      expect(config).toEqual(validSettings);
    });
  });

  describe('AC-1.2.2: Invalid config error handling', () => {
    it('should throw error for invalid JSON format', async () => {
      mockedFs.readFile.mockResolvedValue('invalid json content');

      await expect(configManager.getConfig()).rejects.toThrow();
    });

    it('should throw error for non-object settings', async () => {
      mockedFs.readFile.mockResolvedValue(JSON.stringify('not an object'));

      await expect(configManager.getConfig()).rejects.toThrow('Settings must be an object');
    });

    it('should handle null settings gracefully', async () => {
      mockedFs.readFile.mockResolvedValue(JSON.stringify(null));

      await expect(configManager.getConfig()).rejects.toThrow('Settings must be an object');
    });

    it('should provide clear error message for invalid settings', async () => {
      mockedFs.readFile.mockResolvedValue('invalid');

      try {
        await configManager.getConfig();
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('Failed to read config');
      }
    });
  });

  describe('Additional utility methods', () => {
    it('should return correct config path', () => {
      const configPath = configManager.getConfigPath();
      expect(configPath).toContain('.issue-make');
      expect(configPath).toContain('settings.json');
    });

    it('should check if config exists', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      const exists = await configManager.configExists();
      expect(exists).toBe(true);
    });

    it('should return false when config does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockedFs.access.mockRejectedValue(error);
      
      const exists = await configManager.configExists();
      expect(exists).toBe(false);
    });

    it('should delete config file successfully', async () => {
      mockedFs.unlink.mockResolvedValue(undefined);
      await expect(configManager.deleteConfig()).resolves.not.toThrow();
      expect(mockedFs.unlink).toHaveBeenCalledWith(mockConfigPath);
    });

    it('should not throw when deleting non-existent config', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockedFs.unlink.mockRejectedValue(error);
      
      await expect(configManager.deleteConfig()).resolves.not.toThrow();
    });

    it('should throw error when deletion fails for other reasons', async () => {
      mockedFs.unlink.mockRejectedValue(new Error('Permission denied'));
      
      await expect(configManager.deleteConfig()).rejects.toThrow('Failed to delete config');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string values in settings', async () => {
      const emptySettings: Settings = { url: '', api: '', model: '' };
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      await expect(configManager.setConfig(emptySettings)).resolves.not.toThrow();
    });

    it('should handle special characters in API key', async () => {
      const specialSettings: Settings = {
        url: 'https://api.test.com',
        api: 'sk-!@#$%^&*()_+-=[]{}|;:,.<>?',
        model: 'gpt-4',
      };
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      await expect(configManager.setConfig(specialSettings)).resolves.not.toThrow();
    });

    it('should handle very long URL', async () => {
      const longUrl = 'https://api.test.com/' + 'a'.repeat(1000);
      const longUrlSettings: Settings = {
        url: longUrl,
        api: 'test-key',
        model: 'gpt-4',
      };
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      await expect(configManager.setConfig(longUrlSettings)).resolves.not.toThrow();
    });
  });
});