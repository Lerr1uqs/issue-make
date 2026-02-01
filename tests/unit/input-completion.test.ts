/**
 * Unit Tests for Input Component Command Completion (logic-only)
 * Focuses on filtering, sorting, previews, and selection index behavior.
 */

import {
  AVAILABLE_COMMANDS,
  getMatchingCommands,
  getCompletionPreview,
  getNextSelectedIndex,
} from '../../src/tui/components/input-logic';

describe('Input Component - Command Completion Logic', () => {
  describe('Matching and filtering', () => {
    it('should show completion list when typing /', () => {
      const matches = getMatchingCommands('/');

      expect(matches).toContain('/init');
      expect(matches).toContain('/add:feat');
      expect(matches).toContain('/exit');
    });

    it('should filter commands based on input', () => {
      const matches = getMatchingCommands('/add');

      expect(matches).toContain('/add:feat');
      expect(matches).toContain('/add:todo');
      expect(matches).toContain('/add:bug');
      expect(matches).toContain('/add:refact');
      expect(matches).not.toContain('/init');
      expect(matches).not.toContain('/exit');
    });

    it('should hide completion when no matches found', () => {
      const matches = getMatchingCommands('/xyz');
      expect(matches).toHaveLength(0);
    });

    it('should return no matches when input does not start with /', () => {
      const matches = getMatchingCommands('add');
      expect(matches).toHaveLength(0);
    });
  });

  describe('Sorting and previews', () => {
    it('should sort commands by match score', () => {
      const matches = getMatchingCommands('/add:f');
      expect(matches[0]).toBe('/add:feat');
    });

    it('should prioritize exact matches', () => {
      const matches = getMatchingCommands('/add:feat');
      expect(matches[0]).toBe('/add:feat');
    });

    it('should show completion preview for selected command', () => {
      const preview = getCompletionPreview('/a', '/add:feat');
      expect(preview).toBe('dd:feat');
    });

    it('should return empty preview when value does not match', () => {
      const preview = getCompletionPreview('/x', '/add:feat');
      expect(preview).toBe('');
    });
  });

  describe('Selection index behavior', () => {
    it('should move down within bounds', () => {
      const nextIndex = getNextSelectedIndex(0, 'down', AVAILABLE_COMMANDS.length);
      expect(nextIndex).toBe(1);
    });

    it('should not go below 0 when moving up', () => {
      const nextIndex = getNextSelectedIndex(0, 'up', AVAILABLE_COMMANDS.length);
      expect(nextIndex).toBe(0);
    });

    it('should not go beyond max index when moving down', () => {
      const lastIndex = AVAILABLE_COMMANDS.length - 1;
      const nextIndex = getNextSelectedIndex(lastIndex, 'down', AVAILABLE_COMMANDS.length);
      expect(nextIndex).toBe(lastIndex);
    });

    it('should handle empty command list', () => {
      const nextIndex = getNextSelectedIndex(0, 'down', 0);
      expect(nextIndex).toBe(0);
    });
  });
});
