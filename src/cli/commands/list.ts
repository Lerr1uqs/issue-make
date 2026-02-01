/**
 * List Command
 * Display current issues in a table
 */

import { FileManager } from '../../core/file-manager.js';

/**
 * Execute list command
 */
export async function listCommand(): Promise<void> {
  const basePath = process.cwd();
  const fileManager = new FileManager(basePath);

  const result = await fileManager.listIssues();
  if (!result.success) {
    console.error('✗ Failed to list issues');
    console.error(`  Error: ${result.error}`);
    process.exit(1);
  }

  const issues = result.issues || [];
  if (issues.length === 0) {
    console.log('No issues found.');
    return;
  }

  const header = ['Index', 'Type', 'Status', 'Title'];
  const rows = issues.map(issue => [
    String(issue.index),
    String(issue.type),
    issue.status,
    issue.title,
  ]);

  const allRows = [header, ...rows];
  const widths = header.map((_, col) => Math.max(...allRows.map(row => row[col].length)));
  const formatRow = (row: string[]) =>
    row.map((cell, col) => cell.padEnd(widths[col])).join('  ');

  console.log(formatRow(header));
  console.log(widths.map(width => '-'.repeat(width)).join('  '));
  for (const row of rows) {
    console.log(formatRow(row));
  }
}
