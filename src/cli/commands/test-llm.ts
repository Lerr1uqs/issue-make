/**
 * Test-LLM Command
 * Test LLM connection and functionality
 */

import { ConfigManager } from '../../core/config.js';
import OpenAI from 'openai';

/**
 * Execute test-llm command
 */
export async function testLLMCommand(): Promise<void> {
  const configManager = new ConfigManager();

  try {
    // Check if config exists
    if (!configManager.configExists()) {
      console.error('✗ Configuration not found');
      console.log('  Please run: issue-make init');
      process.exit(1);
    }

    // Load configuration
    const config = await configManager.getConfig();

    // Check if configuration is complete
    if (!config.url || !config.api || !config.model) {
      console.error('✗ Configuration is incomplete');
      console.log('  Please configure AI settings in ~/.issue-make/settings.json');
      console.log('  Required fields: url, api, model');
      process.exit(1);
    }

    console.log('Testing LLM connection...');
    console.log(`  URL: ${config.url}`);
    console.log(`  Model: ${config.model}`);
    console.log('');

    // Initialize OpenAI client
    const client = new OpenAI({
      baseURL: config.url,
      apiKey: config.api,
    });

    // Test connection
    console.log('Sending "hello" message...');
    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'user',
          content: 'hello',
        },
      ],
      max_tokens: 100,
    });

    const duration = Date.now() - startTime;

    const reply = response.choices[0]?.message?.content || '';

    console.log('✓ LLM connection successful');
    console.log(`  Response: ${reply}`);
    console.log(`  Duration: ${duration}ms`);
  } catch (error) {
    console.error('✗ LLM connection failed');
    console.error(`  Error: ${error}`);
    process.exit(1);
  }
}