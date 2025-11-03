import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCurrentDate,
  getCurrentTime,
  formatDate,
  parseDate,
  isValidDateString,
} from './date';

describe('date utilities', () => {
  describe('getCurrentDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should return date in YYYY-MM-DD format', () => {
      vi.setSystemTime(new Date('2025-11-03T14:30:00'));
      expect(getCurrentDate()).toBe('2025-11-03');
    });

    it('should pad single-digit months and days', () => {
      vi.setSystemTime(new Date('2025-01-05T10:00:00'));
      expect(getCurrentDate()).toBe('2025-01-05');
    });

    it('should handle end of year', () => {
      vi.setSystemTime(new Date('2025-12-31T23:59:59'));
      expect(getCurrentDate()).toBe('2025-12-31');
    });
  });

  describe('getCurrentTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should return time in HH:MM format', () => {
      vi.setSystemTime(new Date('2025-11-03T14:30:00'));
      expect(getCurrentTime()).toBe('14:30');
    });

    it('should pad single-digit hours and minutes', () => {
      vi.setSystemTime(new Date('2025-11-03T09:05:00'));
      expect(getCurrentTime()).toBe('09:05');
    });

    it('should handle midnight', () => {
      vi.setSystemTime(new Date('2025-11-03T00:00:00'));
      expect(getCurrentTime()).toBe('00:00');
    });

    it('should handle end of day', () => {
      vi.setSystemTime(new Date('2025-11-03T23:59:00'));
      expect(getCurrentTime()).toBe('23:59');
    });
  });

  describe('formatDate', () => {
    it('should format date in YYYY-MM-DD format', () => {
      const date = new Date('2025-11-03T14:30:00');
      expect(formatDate(date)).toBe('2025-11-03');
    });

    it('should pad single-digit months and days', () => {
      const date = new Date('2025-01-05T10:00:00');
      expect(formatDate(date)).toBe('2025-01-05');
    });

    it('should handle leap year dates', () => {
      const date = new Date('2024-02-29T12:00:00');
      expect(formatDate(date)).toBe('2024-02-29');
    });
  });

  describe('parseDate', () => {
    it('should parse valid date string', () => {
      const result = parseDate('2025-11-03');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(10); // November is month 10
      expect(result?.getDate()).toBe(3);
    });

    it('should return null for invalid format', () => {
      expect(parseDate('2025/11/03')).toBeNull();
      expect(parseDate('11-03-2025')).toBeNull();
      expect(parseDate('2025-11-3')).toBeNull();
      expect(parseDate('not-a-date')).toBeNull();
    });

    it('should return null for invalid date values', () => {
      expect(parseDate('2025-13-01')).toBeNull(); // Invalid month
      expect(parseDate('2025-02-30')).toBeNull(); // Invalid day for February
      expect(parseDate('2025-00-01')).toBeNull(); // Invalid month
      expect(parseDate('2025-01-32')).toBeNull(); // Invalid day
    });

    it('should handle leap year correctly', () => {
      const leapYear = parseDate('2024-02-29');
      expect(leapYear).toBeInstanceOf(Date);

      const nonLeapYear = parseDate('2025-02-29');
      expect(nonLeapYear).toBeNull();
    });
  });

  describe('isValidDateString', () => {
    it('should return true for valid date strings', () => {
      expect(isValidDateString('2025-11-03')).toBe(true);
      expect(isValidDateString('2024-02-29')).toBe(true);
      expect(isValidDateString('2025-01-01')).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      expect(isValidDateString('2025-13-01')).toBe(false);
      expect(isValidDateString('2025-02-30')).toBe(false);
      expect(isValidDateString('2025/11/03')).toBe(false);
      expect(isValidDateString('invalid')).toBe(false);
    });
  });
});
