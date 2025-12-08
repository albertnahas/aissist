import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enhanceHistoryEntry, type GoalInfo } from './claude.js';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('enhanceHistoryEntry', () => {
  const mockGoals: GoalInfo[] = [
    { codename: 'improve-performance', text: 'Optimize application performance' },
    { codename: 'fix-auth', text: 'Fix authentication issues' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createMockProcess(exitCode: number, stdout: string, stderr: string = '') {
    const proc = new EventEmitter() as any;
    proc.stdin = { write: vi.fn(), end: vi.fn() };
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = vi.fn();

    // Simulate async output and close
    setTimeout(() => {
      if (stdout) proc.stdout.emit('data', Buffer.from(stdout));
      if (stderr) proc.stderr.emit('data', Buffer.from(stderr));
      proc.emit('close', exitCode);
    }, 10);

    return proc;
  }

  describe('when Claude CLI is available', () => {
    beforeEach(() => {
      // Mock 'which claude' to succeed
      const whichProc = createMockProcess(0, '/usr/local/bin/claude');
      vi.mocked(spawn).mockImplementation((cmd: string, args?: string[]) => {
        if (cmd === 'which') {
          return whichProc;
        }
        // For actual claude command, return a different mock
        return createMockProcess(0, JSON.stringify({
          text: 'Enhanced text here',
          goal: 'improve-performance'
        }));
      });
    });

    it('should return enhanced text and goal when AI succeeds', async () => {
      const result = await enhanceHistoryEntry('fixd perf issue', mockGoals);

      expect(result.wasEnhanced).toBe(true);
      expect(result.enhancedText).toBe('Enhanced text here');
      expect(result.goalCodename).toBe('improve-performance');
      expect(result.warning).toBeUndefined();
    });

    it('should return enhanced text without goal when no match', async () => {
      vi.mocked(spawn).mockImplementation((cmd: string) => {
        if (cmd === 'which') {
          return createMockProcess(0, '/usr/local/bin/claude');
        }
        return createMockProcess(0, JSON.stringify({
          text: 'Fixed typo in docs',
          goal: null
        }));
      });

      const result = await enhanceHistoryEntry('fixd typo', mockGoals);

      expect(result.wasEnhanced).toBe(true);
      expect(result.enhancedText).toBe('Fixed typo in docs');
      expect(result.goalCodename).toBeNull();
    });

    it('should ignore invalid goal codenames not in list', async () => {
      vi.mocked(spawn).mockImplementation((cmd: string) => {
        if (cmd === 'which') {
          return createMockProcess(0, '/usr/local/bin/claude');
        }
        return createMockProcess(0, JSON.stringify({
          text: 'Enhanced text',
          goal: 'nonexistent-goal'
        }));
      });

      const result = await enhanceHistoryEntry('some text', mockGoals);

      expect(result.wasEnhanced).toBe(true);
      expect(result.goalCodename).toBeNull(); // Invalid goal is ignored
    });

    it('should handle empty goals list', async () => {
      vi.mocked(spawn).mockImplementation((cmd: string) => {
        if (cmd === 'which') {
          return createMockProcess(0, '/usr/local/bin/claude');
        }
        return createMockProcess(0, JSON.stringify({
          text: 'Enhanced text',
          goal: null
        }));
      });

      const result = await enhanceHistoryEntry('some text', []);

      expect(result.wasEnhanced).toBe(true);
      expect(result.goalCodename).toBeNull();
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      vi.mocked(spawn).mockImplementation((cmd: string) => {
        if (cmd === 'which') {
          return createMockProcess(0, '/usr/local/bin/claude');
        }
        return createMockProcess(0, '```json\n{"text": "Clean text", "goal": null}\n```');
      });

      const result = await enhanceHistoryEntry('rough text', mockGoals);

      expect(result.wasEnhanced).toBe(true);
      expect(result.enhancedText).toBe('Clean text');
    });

    it('should fallback to original text on invalid JSON', async () => {
      vi.mocked(spawn).mockImplementation((cmd: string) => {
        if (cmd === 'which') {
          return createMockProcess(0, '/usr/local/bin/claude');
        }
        return createMockProcess(0, 'This is not valid JSON');
      });

      const result = await enhanceHistoryEntry('original text', mockGoals);

      expect(result.wasEnhanced).toBe(false);
      expect(result.enhancedText).toBe('original text');
      expect(result.warning).toContain('Failed to parse AI response');
    });
  });

  describe('when Claude CLI is unavailable', () => {
    beforeEach(() => {
      // Mock 'which claude' to fail
      const whichProc = createMockProcess(1, '', 'claude not found');
      vi.mocked(spawn).mockReturnValue(whichProc);
    });

    it('should return original text with warning', async () => {
      const result = await enhanceHistoryEntry('original text', mockGoals);

      expect(result.wasEnhanced).toBe(false);
      expect(result.enhancedText).toBe('original text');
      expect(result.goalCodename).toBeNull();
      expect(result.warning).toContain('Claude CLI not available');
    });
  });

  describe('when Claude CLI fails', () => {
    it('should return original text on authentication error', async () => {
      vi.mocked(spawn).mockImplementation((cmd: string) => {
        if (cmd === 'which') {
          return createMockProcess(0, '/usr/local/bin/claude');
        }
        return createMockProcess(1, '', 'not authenticated');
      });

      const result = await enhanceHistoryEntry('original text', mockGoals);

      expect(result.wasEnhanced).toBe(false);
      expect(result.enhancedText).toBe('original text');
      expect(result.warning).toContain('Smart enhancement failed');
    });

    it('should return original text on generic error', async () => {
      vi.mocked(spawn).mockImplementation((cmd: string) => {
        if (cmd === 'which') {
          return createMockProcess(0, '/usr/local/bin/claude');
        }
        return createMockProcess(1, '', 'Some error occurred');
      });

      const result = await enhanceHistoryEntry('original text', mockGoals);

      expect(result.wasEnhanced).toBe(false);
      expect(result.enhancedText).toBe('original text');
      expect(result.warning).toBeDefined();
    });
  });
});
