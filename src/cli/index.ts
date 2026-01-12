/**
 * CLI Module
 * Command-line interface for issue-make
 */

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { openCommand } from './commands/open.js';
import { closeCommand } from './commands/close.js';
import { testLLMCommand } from './commands/test-llm.js';

/**
 * Create and configure CLI
 */
export function createCLI(): Command {
  const program = new Command();

  program
    .name('issue-make')
    .description('A lightweight issue management tool for developers')
    .version('1.0.0');

  program
    .command('init')
    .description('Initialize issue-make configuration')
    .action(async () => {
      await initCommand();
    });

  program
    .command('add')
    .description('Create a new issue from a description file')
    .option('--type <type>', 'Issue type (feat, todo, bug, refact)', 'feat')
    .argument('<path>', 'Path to description file')
    .action(async (path: string, options: { type: string }) => {
      await addCommand(options.type, path);
    });

  program
    .command('open')
    .description('Start working on an issue')
    .argument('<identifier>', 'Issue number or title')
    .action(async (identifier: string) => {
      await openCommand(identifier);
    });

  program
    .command('close')
    .description('Complete and archive an issue')
    .argument('<identifier>', 'Issue number or title')
    .action(async (identifier: string) => {
      await closeCommand(identifier);
    });

  program
    .command('test-llm')
    .description('Test LLM connection and functionality')
    .action(async () => {
      await testLLMCommand();
    });

  return program;
}

/**
 * Parse and execute CLI commands
 * @param args - Command line arguments
 */
export function runCLI(args: string[]): void {
  const program = createCLI();
  program.parse(args);
}