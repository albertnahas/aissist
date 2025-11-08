import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseTimeframe, createTimeframeToDeadline, createTimelessTimeframe } from './timeframe-parser';
import { addDays } from 'date-fns';

describe('timeframe parser', () => {
  describe('parseTimeframe - "now"', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should parse "now" as a 2-hour window from current time', () => {
      const testDate = new Date('2025-11-06T14:30:00');
      vi.setSystemTime(testDate);

      const result = parseTimeframe('now');

      expect(result.label).toBe('Right Now');
      expect(result.start).toEqual(testDate);

      // End should be 2 hours later (0.0833 days = 2/24)
      const expectedEnd = addDays(testDate, 0.0833);
      expect(result.end.getTime()).toBeCloseTo(expectedEnd.getTime(), -2);
    });

    it('should handle "now" case-insensitively', () => {
      vi.setSystemTime(new Date('2025-11-06T10:00:00'));

      expect(parseTimeframe('NOW').label).toBe('Right Now');
      expect(parseTimeframe('Now').label).toBe('Right Now');
      expect(parseTimeframe('now').label).toBe('Right Now');
    });

    it('should handle "now" with extra whitespace', () => {
      vi.setSystemTime(new Date('2025-11-06T10:00:00'));

      const result = parseTimeframe('  now  ');
      expect(result.label).toBe('Right Now');
    });
  });

  describe('parseTimeframe - "today"', () => {
    it('should parse "today" correctly', () => {
      const result = parseTimeframe('today');
      expect(result.label).toBe('Today');
      expect(result.start.getHours()).toBe(0);
      expect(result.start.getMinutes()).toBe(0);
      expect(result.end.getHours()).toBe(23);
      expect(result.end.getMinutes()).toBe(59);
    });

    it('should use "today" as default when no argument provided', () => {
      const result = parseTimeframe();
      expect(result.label).toBe('Today');
    });
  });

  describe('parseTimeframe - "tomorrow"', () => {
    it('should parse "tomorrow" correctly', () => {
      const result = parseTimeframe('tomorrow');
      expect(result.label).toBe('Tomorrow');

      const tomorrow = addDays(new Date(), 1);
      expect(result.start.getDate()).toBe(tomorrow.getDate());
      expect(result.start.getHours()).toBe(0);
      expect(result.end.getHours()).toBe(23);
    });
  });

  describe('parseTimeframe - weeks', () => {
    it('should parse "this week"', () => {
      const result = parseTimeframe('this week');
      expect(result.label).toBe('This Week');
    });

    it('should parse "next week"', () => {
      const result = parseTimeframe('next week');
      expect(result.label).toBe('Next Week');
    });
  });

  describe('parseTimeframe - quarters', () => {
    it('should parse "this quarter"', () => {
      const result = parseTimeframe('this quarter');
      expect(result.label).toBe('This Quarter');
    });

    it('should parse "next quarter"', () => {
      const result = parseTimeframe('next quarter');
      expect(result.label).toBe('Next Quarter');
    });

    it('should parse specific quarter format "YYYY QN"', () => {
      const result = parseTimeframe('2026 Q1');
      expect(result.label).toBe('2026 Q1');
      expect(result.start.getFullYear()).toBe(2026);
      expect(result.start.getMonth()).toBe(0); // January
    });
  });

  describe('parseTimeframe - months', () => {
    it('should parse "this month"', () => {
      const result = parseTimeframe('this month');
      expect(result.label).toBe('This Month');
    });

    it('should parse "next month"', () => {
      const result = parseTimeframe('next month');
      expect(result.label).toBe('Next Month');
    });

    it('should parse "Month YYYY" format', () => {
      const result = parseTimeframe('November 2025');
      expect(result.label).toBe('November 2025');
      expect(result.start.getFullYear()).toBe(2025);
      expect(result.start.getMonth()).toBe(10); // November
    });
  });

  describe('parseTimeframe - next N days', () => {
    it('should parse "next 3 days"', () => {
      const result = parseTimeframe('next 3 days');
      expect(result.label).toBe('Next 3 Days');
    });

    it('should parse "next 7 days"', () => {
      const result = parseTimeframe('next 7 days');
      expect(result.label).toBe('Next 7 Days');
    });
  });

  describe('parseTimeframe - error cases', () => {
    it('should throw error for invalid timeframe', () => {
      expect(() => parseTimeframe('invalid')).toThrow('Invalid timeframe');
    });

    it('should include "now" in error message for invalid input', () => {
      try {
        parseTimeframe('not-valid');
      } catch (error) {
        expect((error as Error).message).toContain('now (single immediate action)');
      }
    });

    it('should include supported formats in error message', () => {
      try {
        parseTimeframe('xyz');
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('today');
        expect(message).toContain('this week');
        expect(message).toContain('this quarter');
      }
    });
  });

  describe('createTimeframeToDeadline', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should create timeframe from now to deadline', () => {
      const testDate = new Date('2025-11-06T14:30:00');
      vi.setSystemTime(testDate);

      const result = createTimeframeToDeadline('2025-12-31');

      expect(result.start).toEqual(testDate);
      expect(result.end.getFullYear()).toBe(2025);
      expect(result.end.getMonth()).toBe(11); // December
      expect(result.end.getDate()).toBe(31);
      expect(result.label).toContain('Now until');
      expect(result.label).toContain('December 31, 2025');
    });

    it('should throw error for invalid deadline', () => {
      vi.setSystemTime(new Date('2025-11-06T14:30:00'));

      expect(() => createTimeframeToDeadline('invalid-date')).toThrow('Invalid deadline date');
    });

    it('should handle past deadlines', () => {
      vi.setSystemTime(new Date('2025-11-06T14:30:00'));

      const result = createTimeframeToDeadline('2025-01-01');

      expect(result.start.getTime()).toBeGreaterThan(result.end.getTime());
      expect(result.label).toContain('Now until');
      expect(result.label).toContain('January 1, 2025');
    });

    it('should handle same-day deadlines', () => {
      vi.setSystemTime(new Date('2025-11-06T10:00:00'));

      const result = createTimeframeToDeadline('2025-11-06');

      expect(result.start.getDate()).toBe(result.end.getDate());
      expect(result.label).toContain('November 6, 2025');
    });
  });

  describe('createTimelessTimeframe', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should create timeless timeframe', () => {
      const testDate = new Date('2025-11-06T14:30:00');
      vi.setSystemTime(testDate);

      const result = createTimelessTimeframe();

      expect(result.start).toEqual(testDate);
      expect(result.end.getFullYear()).toBe(2026); // One year in future
      expect(result.label).toBe('Comprehensive Plan');
    });

    it('should create far future end date', () => {
      vi.setSystemTime(new Date('2025-11-06T14:30:00'));

      const result = createTimelessTimeframe();

      const oneYearLater = new Date('2026-11-06');
      expect(result.end.getFullYear()).toBe(oneYearLater.getFullYear());
      expect(result.end.getMonth()).toBe(oneYearLater.getMonth());
      expect(result.end.getDate()).toBe(oneYearLater.getDate());
    });
  });
});
