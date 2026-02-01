/**
 * Unit Tests for TUI Logic (non-rendering)
 * Focuses on command definitions and parsing helpers.
 */

import { IssueType } from '../../src/core/types';
import { parseSlashCommand, validateIssueType } from '../../src/utils/validation';
import { AVAILABLE_COMMANDS, getMatchingCommands } from '../../src/tui/components/input-logic';

describe('TUI Command Definitions', () => {
  it('should include core commands', () => {
    expect(AVAILABLE_COMMANDS).toContain('/init');
    expect(AVAILABLE_COMMANDS).toContain('/add:feat');
    expect(AVAILABLE_COMMANDS).toContain('/add:todo');
    expect(AVAILABLE_COMMANDS).toContain('/add:bug');
    expect(AVAILABLE_COMMANDS).toContain('/add:refact');
    expect(AVAILABLE_COMMANDS).toContain('/open');
    expect(AVAILABLE_COMMANDS).toContain('/close');
    expect(AVAILABLE_COMMANDS).toContain('/list');
    expect(AVAILABLE_COMMANDS).toContain('/exit');
    expect(AVAILABLE_COMMANDS).toContain('/quit');
  });

  it('should return add commands for /add prefix', () => {
    const matches = getMatchingCommands('/add');
    expect(matches).toContain('/add:feat');
    expect(matches).toContain('/add:todo');
    expect(matches).toContain('/add:bug');
    expect(matches).toContain('/add:refact');
  });
});

describe('TUI Slash Command Parsing', () => {
  it('should parse /add:feat command correctly', () => {
    const parsed = parseSlashCommand('/add:feat Add a feature');
    expect(parsed?.action).toBe('add');
    expect(parsed?.type).toBe('feat');
    expect(parsed?.description).toBe('Add a feature');
  });

  it('should validate parsed issue type', () => {
    const parsed = parseSlashCommand('/add:bug Fix something');
    const type = parsed ? validateIssueType(parsed.type) : null;
    expect(type).toBe(IssueType.BUG);
  });
});
