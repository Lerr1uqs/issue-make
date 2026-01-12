/**
 * Unit Tests for Date Utilities
 * Tests for AC-4.3.3
 */

import {
  formatDate,
  parseDate,
  getCurrentDate,
  getTimestamp,
  isValidDateFormat,
  getDaysBetween,
} from '../../src/utils/date';

describe('Date Utilities', () => {
  describe('AC-4.3.3: Issue file date format', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date(2026, 0, 12); // January 12, 2026
      const formatted = formatDate(date);

      expect(formatted).toBe('2026-01-12');
    });

    it('should format date with single digit month', () => {
      const date = new Date(2026, 0, 5); // January 5, 2026
      const formatted = formatDate(date);

      expect(formatted).toBe('2026-01-05');
    });

    it('should format date with single digit day', () => {
      const date = new Date(2026, 5, 3); // June 3, 2026
      const formatted = formatDate(date);

      expect(formatted).toBe('2026-06-03');
    });

    it('should format date with double digit month and day', () => {
      const date = new Date(2026, 11, 25); // December 25, 2026
      const formatted = formatDate(date);

      expect(formatted).toBe('2026-12-25');
    });

    it('should handle leap year dates', () => {
      const date = new Date(2024, 1, 29); // February 29, 2024 (leap year)
      const formatted = formatDate(date);

      expect(formatted).toBe('2024-02-29');
    });

    it('should handle century dates', () => {
      const date = new Date(2000, 0, 1); // January 1, 2000
      const formatted = formatDate(date);

      expect(formatted).toBe('2000-01-01');
    });

    it('should handle future dates', () => {
      const date = new Date(2030, 11, 31); // December 31, 2030
      const formatted = formatDate(date);

      expect(formatted).toBe('2030-12-31');
    });
  });

  describe('Date parsing', () => {
    it('should parse valid date string', () => {
      const dateStr = '2026-01-12';
      const date = parseDate(dateStr);

      expect(date).not.toBeNull();
      expect(date).toBeInstanceOf(Date);
      expect(formatDate(date!)).toBe(dateStr);
    });

    it('should parse date with single digit month', () => {
      const dateStr = '2026-01-05';
      const date = parseDate(dateStr);

      expect(date).not.toBeNull();
      expect(formatDate(date!)).toBe(dateStr);
    });

    it('should parse date with single digit day', () => {
      const dateStr = '2026-06-03';
      const date = parseDate(dateStr);

      expect(date).not.toBeNull();
      expect(formatDate(date!)).toBe(dateStr);
    });

    it('should return null for invalid format', () => {
      expect(parseDate('2026/01/12')).toBeNull();
      expect(parseDate('01-12-2026')).toBeNull();
      expect(parseDate('2026-1-12')).toBeNull();
      expect(parseDate('2026-01-1')).toBeNull();
    });

    it('should return null for invalid dates', () => {
      expect(parseDate('2026-02-30')).toBeNull(); // February 30 doesn't exist
      expect(parseDate('2026-13-01')).toBeNull(); // Month 13 doesn't exist
      expect(parseDate('2026-00-01')).toBeNull(); // Month 0 doesn't exist
      expect(parseDate('2026-01-32')).toBeNull(); // Day 32 doesn't exist
      expect(parseDate('2026-01-00')).toBeNull(); // Day 0 doesn't exist
    });

    it('should return null for malformed input', () => {
      expect(parseDate('')).toBeNull();
      expect(parseDate('not-a-date')).toBeNull();
      expect(parseDate('2026-01')).toBeNull();
      expect(parseDate('01-12')).toBeNull();
    });

    it('should return null for non-leap year February 29', () => {
      expect(parseDate('2023-02-29')).toBeNull(); // 2023 is not a leap year
    });

    it('should parse leap year February 29 correctly', () => {
      const date = parseDate('2024-02-29');
      expect(date).not.toBeNull();
      expect(formatDate(date!)).toBe('2024-02-29');
    });
  });

  describe('Current date utilities', () => {
    it('should get current date in correct format', () => {
      const currentDate = getCurrentDate();

      expect(currentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isValidDateFormat(currentDate)).toBe(true);
    });

    it('should get timestamp as string', () => {
      const timestamp = getTimestamp();

      expect(typeof timestamp).toBe('string');
      expect(/^\d+$/.test(timestamp)).toBe(true);
    });

    it('should generate unique timestamps', () => {
      const timestamp1 = getTimestamp();
      // Small delay to ensure different timestamp
      const timestamp2 = getTimestamp();

      expect(timestamp1).not.toBe(timestamp2);
    });
  });

  describe('Date format validation', () => {
    it('should validate correct date format', () => {
      expect(isValidDateFormat('2026-01-12')).toBe(true);
      expect(isValidDateFormat('2000-01-01')).toBe(true);
      expect(isValidDateFormat('2030-12-31')).toBe(true);
    });

    it('should reject incorrect date format', () => {
      expect(isValidDateFormat('2026/01/12')).toBe(false);
      expect(isValidDateFormat('01-12-2026')).toBe(false);
      expect(isValidDateFormat('2026-1-12')).toBe(false);
      expect(isValidDateFormat('2026-01-1')).toBe(false);
      expect(isValidDateFormat('')).toBe(false);
      expect(isValidDateFormat('not-a-date')).toBe(false);
    });

    it('should reject invalid dates even with correct format', () => {
      expect(isValidDateFormat('2026-02-30')).toBe(false);
      expect(isValidDateFormat('2026-13-01')).toBe(false);
      expect(isValidDateFormat('2026-01-32')).toBe(false);
    });
  });

  describe('Days between calculation', () => {
    it('should calculate days between same date', () => {
      const date1 = new Date(2026, 0, 12);
      const date2 = new Date(2026, 0, 12);
      const days = getDaysBetween(date1, date2);

      expect(days).toBe(0);
    });

    it('should calculate days between consecutive days', () => {
      const date1 = new Date(2026, 0, 12);
      const date2 = new Date(2026, 0, 13);
      const days = getDaysBetween(date1, date2);

      expect(days).toBe(1);
    });

    it('should calculate days between dates in same month', () => {
      const date1 = new Date(2026, 0, 1);
      const date2 = new Date(2026, 0, 31);
      const days = getDaysBetween(date1, date2);

      expect(days).toBe(30);
    });

    it('should calculate days between dates in different months', () => {
      const date1 = new Date(2026, 0, 1);
      const date2 = new Date(2026, 1, 1);
      const days = getDaysBetween(date1, date2);

      expect(days).toBe(31);
    });

    it('should calculate days between dates in different years', () => {
      const date1 = new Date(2025, 11, 31);
      const date2 = new Date(2026, 0, 1);
      const days = getDaysBetween(date1, date2);

      expect(days).toBe(1);
    });

    it('should handle negative days (date2 before date1)', () => {
      const date1 = new Date(2026, 0, 13);
      const date2 = new Date(2026, 0, 12);
      const days = getDaysBetween(date1, date2);

      expect(days).toBe(-1);
    });

    it('should calculate days across leap year', () => {
      const date1 = new Date(2024, 1, 28); // February 28, 2024
      const date2 = new Date(2024, 2, 1); // March 1, 2024
      const days = getDaysBetween(date1, date2);

      expect(days).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle minimum date', () => {
      const date = new Date(0); // January 1, 1970
      const formatted = formatDate(date);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle very old dates', () => {
      const date = new Date(1900, 0, 1);
      const formatted = formatDate(date);

      expect(formatted).toBe('1900-01-01');
    });

    it('should handle dates with time components', () => {
      const date = new Date(2026, 0, 12, 14, 30, 45);
      const formatted = formatDate(date);

      expect(formatted).toBe('2026-01-12');
    });

    it('should handle UTC dates', () => {
      const date = new Date(Date.UTC(2026, 0, 12));
      const formatted = formatDate(date);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle boundary dates', () => {
      const date1 = new Date(2026, 0, 1);
      const formatted1 = formatDate(date1);
      expect(formatted1).toBe('2026-01-01');

      const date2 = new Date(2026, 11, 31);
      const formatted2 = formatDate(date2);
      expect(formatted2).toBe('2026-12-31');
    });
  });
});