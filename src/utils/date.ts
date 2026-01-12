/**
 * Date Utilities
 * Helper functions for date formatting and manipulation
 */

/**
 * Format date to YYYY-MM-DD format
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse date from YYYY-MM-DD format
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object or null if invalid
 */
export function parseDate(dateString: string): Date | null {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));

  // Validate the date is valid
  if (isNaN(date.getTime())) {
    return null;
  }

  // Check if the parsed date matches the input (handles invalid dates like 2023-02-30)
  if (formatDate(date) !== dateString) {
    return null;
  }

  return date;
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns Current date as formatted string
 */
export function getCurrentDate(): string {
  return formatDate(new Date());
}

/**
 * Get current timestamp for fallback title generation
 * @returns Timestamp string
 */
export function getTimestamp(): string {
  return Date.now().toString();
}

/**
 * Check if date string is valid YYYY-MM-DD format
 * @param dateString - Date string to validate
 * @returns true if valid
 */
export function isValidDateFormat(dateString: string): boolean {
  return parseDate(dateString) !== null;
}

/**
 * Get days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between dates
 */
export function getDaysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date2.getTime() - date1.getTime()) / oneDay);
}