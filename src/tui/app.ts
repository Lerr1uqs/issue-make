/**
 * TUI Application
 * Terminal User Interface for issue-make using Ink (React for CLI)
 */

import { startTUI } from './components/App.js';

/**
 * Start the TUI application
 */
export async function startTUIApp(): Promise<void> {
  startTUI();
}

/**
 * TUIApp class (for backward compatibility)
 * @deprecated Use startTUI() instead
 */
export class TUIApp {
  async start(): Promise<void> {
    await startTUIApp();
  }

  isActive(): boolean {
    return true;
  }

  stop(): void {
    process.exit(0);
  }
}