/**
 * Issue-Make Main Entry Point
 * A lightweight issue management tool for developers
 */

import { runCLI } from './cli/index.js';
import { TUIApp } from './tui/app.js';

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // If no arguments, start TUI
  if (args.length === 0) {
    const tuiApp = new TUIApp();
    await tuiApp.start();
    // TUI runs continuously, don't exit here
    return;
  }

  // Otherwise, run CLI
  runCLI(process.argv);
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});