import { describe, it, expect } from 'vitest';
import {
  extractExcerpt,
  filterTopMatches,
  groupMatchesByContext,
  type SearchMatch,
} from './search';

describe('search utilities', () => {
  describe('extractExcerpt', () => {
    const lines = [
      'Line 1',
      'Line 2',
      'Line 3 - Target',
      'Line 4',
      'Line 5',
      'Line 6',
    ];

    it('should extract excerpt with 2 lines of context', () => {
      const result = extractExcerpt(lines, 2, 2);
      expect(result).toBe('Line 1\nLine 2\nLine 3 - Target\nLine 4\nLine 5');
    });

    it('should handle excerpt at start of file', () => {
      const result = extractExcerpt(lines, 0, 2);
      expect(result).toBe('Line 1\nLine 2\nLine 3 - Target');
    });

    it('should handle excerpt at end of file', () => {
      const result = extractExcerpt(lines, 5, 2);
      expect(result).toBe('Line 4\nLine 5\nLine 6');
    });

    it('should handle single line of context', () => {
      const result = extractExcerpt(lines, 2, 1);
      expect(result).toBe('Line 2\nLine 3 - Target\nLine 4');
    });

    it('should handle no context lines', () => {
      const result = extractExcerpt(lines, 2, 0);
      expect(result).toBe('Line 3 - Target');
    });
  });

  describe('filterTopMatches', () => {
    const matches: SearchMatch[] = [
      {
        filePath: '/path/file1.md',
        relativeFilePath: 'file1.md',
        lineNumber: 5,
        line: 'Match 1',
        excerpt: 'Context 1',
        context: 'goal',
        date: '2025-11-01',
      },
      {
        filePath: '/path/file2.md',
        relativeFilePath: 'file2.md',
        lineNumber: 10,
        line: 'Match 2',
        excerpt: 'Context 2',
        context: 'history',
        date: '2025-11-03',
      },
      {
        filePath: '/path/file3.md',
        relativeFilePath: 'file3.md',
        lineNumber: 3,
        line: 'Match 3',
        excerpt: 'Context 3',
        context: 'reflection',
        date: '2025-11-02',
      },
    ];

    it('should sort by date (most recent first)', () => {
      const result = filterTopMatches(matches, 10);
      expect(result[0].date).toBe('2025-11-03');
      expect(result[1].date).toBe('2025-11-02');
      expect(result[2].date).toBe('2025-11-01');
    });

    it('should limit to maxResults', () => {
      const result = filterTopMatches(matches, 2);
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2025-11-03');
      expect(result[1].date).toBe('2025-11-02');
    });

    it('should handle empty matches array', () => {
      const result = filterTopMatches([], 10);
      expect(result).toHaveLength(0);
    });

    it('should sort by line number when dates are equal', () => {
      const sameDate: SearchMatch[] = [
        { ...matches[0], date: '2025-11-03', lineNumber: 15 },
        { ...matches[1], date: '2025-11-03', lineNumber: 5 },
        { ...matches[2], date: '2025-11-03', lineNumber: 10 },
      ];

      const result = filterTopMatches(sameDate, 10);
      expect(result[0].lineNumber).toBe(5);
      expect(result[1].lineNumber).toBe(10);
      expect(result[2].lineNumber).toBe(15);
    });
  });

  describe('groupMatchesByContext', () => {
    const matches: SearchMatch[] = [
      {
        filePath: '/path/file1.md',
        relativeFilePath: 'file1.md',
        lineNumber: 5,
        line: 'Match 1',
        excerpt: 'Context 1',
        context: 'goal',
        date: '2025-11-01',
      },
      {
        filePath: '/path/file2.md',
        relativeFilePath: 'file2.md',
        lineNumber: 10,
        line: 'Match 2',
        excerpt: 'Context 2',
        context: 'history',
        date: '2025-11-03',
      },
      {
        filePath: '/path/file3.md',
        relativeFilePath: 'file3.md',
        lineNumber: 3,
        line: 'Match 3',
        excerpt: 'Context 3',
        context: 'goal',
        date: '2025-11-02',
      },
    ];

    it('should group matches by context type', () => {
      const result = groupMatchesByContext(matches);

      expect(result.size).toBe(2);
      expect(result.get('goal')).toHaveLength(2);
      expect(result.get('history')).toHaveLength(1);
    });

    it('should handle empty matches array', () => {
      const result = groupMatchesByContext([]);
      expect(result.size).toBe(0);
    });

    it('should preserve match order within groups', () => {
      const result = groupMatchesByContext(matches);
      const goalMatches = result.get('goal')!;

      expect(goalMatches[0].lineNumber).toBe(5);
      expect(goalMatches[1].lineNumber).toBe(3);
    });
  });
});
