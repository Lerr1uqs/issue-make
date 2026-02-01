/**
 * List Command Handler for TUI
 * List current issues in a table
 */

import { FileManager } from '../../core/file-manager.js';

export interface ListCommandResult {
  success: boolean;
  output?: string;
  error?: string;
}

const formatTable = (rows: string[][]): string => {
  if (rows.length === 0) {
    return '';
  }

  const columnCount = rows[0].length;
  const widths = new Array(columnCount).fill(0).map((_, col) => {
    return Math.max(...rows.map(row => row[col].length));
  });

  const formatRow = (row: string[]) =>
    row.map((cell, col) => cell.padEnd(widths[col])).join('  ');

  const header = formatRow(rows[0]);
  const separator = widths.map(width => '-'.repeat(width)).join('  ');
  const body = rows.slice(1).map(formatRow);

  return [header, separator, ...body].join('\n');
};

export async function listCommandHandler(basePath: string): Promise<ListCommandResult> {
  const fileManager = new FileManager(basePath);
  const result = await fileManager.listIssues();

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to list issues',
    };
  }

  const issues = result.issues || [];
  if (issues.length === 0) {
    return {
      success: true,
      output: 'No issues found.',
    };
  }

  const rows = [
    ['Index', 'Type', 'Status', 'Title'],
    ...issues.map(issue => [
      String(issue.index),
      String(issue.type),
      issue.status,
      issue.title,
    ]),
  ];

  return {
    success: true,
    output: formatTable(rows),
  };
}
