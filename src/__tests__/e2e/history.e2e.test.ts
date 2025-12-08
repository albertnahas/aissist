/**
 * E2E Tests for History Logging
 *
 * Tests the complete workflow of history management:
 * - Logging history entries
 * - Showing history entries
 * - Retroactive logging
 * - Linking to goals
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CliTestHarness } from '../helpers/cli-test-harness.js';

describe('History Logging E2E', () => {
  let harness: CliTestHarness;

  beforeEach(async () => {
    harness = new CliTestHarness({ mockClaudeCli: true });
    await harness.setup();
  });

  afterEach(async () => {
    await harness.teardown();
  });

  it('should log a history entry', async () => {
    const result = await harness.run(['history', 'log', 'Completed the API integration']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('History logged');

    // Verify history file was created
    const historyFiles = harness.listFiles('history');
    expect(historyFiles.length).toBeGreaterThan(0);

    // Check that the history contains the expected text
    const historyFile = historyFiles[0];
    const content = harness.readFile(`history/${historyFile}`);
    expect(content).toContain('Completed the API integration');
  });

  it('should show history entries', async () => {
    // Log some history entries first
    await harness.run(['history', 'log', 'First entry']);
    await harness.run(['history', 'log', 'Second entry']);

    // Show history
    const result = await harness.run(['history', 'show']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('First entry');
    expect(result.stdout).toContain('Second entry');
  });

  it('should support retroactive logging', async () => {
    const result = await harness.run([
      'history',
      'log',
      'Past accomplishment',
      '--date',
      '2025-01-01',
    ]);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('History logged');

    // Verify the file was created with the correct date
    const historyFiles = harness.listFiles('history');
    expect(historyFiles.length).toBeGreaterThan(0);

    // Check if there's a file for the specified date
    const hasDateFile = historyFiles.some(f => f.includes('2025-01-01'));
    expect(hasDateFile).toBe(true);
  });

  it('should link history to goals', async () => {
    // First create a goal
    const goalResult = await harness.run([
      'goal',
      'add',
      'Complete documentation',
      '--deadline',
      '2025-12-31',
    ]);
    harness.expectSuccess(goalResult);

    // Extract the codename
    const codenameMatch = goalResult.stdout.match(/Goal added with codename: ([a-z0-9-]+)/i);
    expect(codenameMatch).toBeTruthy();
    const codename = codenameMatch![1];

    // Log history linked to the goal
    const historyResult = await harness.run([
      'history',
      'log',
      'Worked on documentation',
      '--goal',
      codename,
    ]);

    harness.expectSuccess(historyResult);
    expect(historyResult.stdout).toContain('History logged');

    // Verify the history file contains the goal reference
    const historyFiles = harness.listFiles('history');
    expect(historyFiles.length).toBeGreaterThan(0);

    const historyFile = historyFiles[0];
    const content = harness.readFile(`history/${historyFile}`);
    expect(content).toContain('Worked on documentation');
    // The goal reference should be in the file
    expect(content).toContain(codename);
  });

  it('should persist history across command invocations', async () => {
    // Log a history entry
    await harness.run(['history', 'log', 'Persistent history entry']);

    // Show history in a separate command
    const result = await harness.run(['history', 'show']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Persistent history entry');
  });

  it('should handle multiple history entries on the same day', async () => {
    // Log multiple entries
    await harness.run(['history', 'log', 'Morning task']);
    await harness.run(['history', 'log', 'Afternoon task']);
    await harness.run(['history', 'log', 'Evening task']);

    // Show all history
    const result = await harness.run(['history', 'show']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Morning task');
    expect(result.stdout).toContain('Afternoon task');
    expect(result.stdout).toContain('Evening task');

    // Verify all entries are in the same file (same day)
    const historyFiles = harness.listFiles('history');
    expect(historyFiles.length).toBe(1); // All entries should be in one file for today
  });

  describe('--smart flag', () => {
    it('should enhance text with AI when --smart is used', async () => {
      const result = await harness.run([
        'history',
        'log',
        '--smart',
        'fixd the login bug',
      ]);

      harness.expectSuccess(result);
      expect(result.stdout).toContain('History logged');

      // Verify the enhanced text was stored
      const historyFiles = harness.listFiles('history');
      expect(historyFiles.length).toBeGreaterThan(0);

      const content = harness.readFile(`history/${historyFiles[0]}`);
      // The mock should have corrected "fixd" to "Fixed"
      expect(content).toContain('Fixed');
      // The original typo should not be there
      expect(content).not.toContain('fixd');
    });

    it('should use short flag -s', async () => {
      const result = await harness.run([
        'history',
        'log',
        '-s',
        'implmented new featur for usr',
      ]);

      harness.expectSuccess(result);
      expect(result.stdout).toContain('History logged');

      // Verify the enhanced text
      const historyFiles = harness.listFiles('history');
      const content = harness.readFile(`history/${historyFiles[0]}`);
      // Mock should correct typos
      expect(content).toContain('Implemented');
      expect(content).toContain('feature');
      expect(content).toContain('user');
      // Original typos should not be there
      expect(content).not.toContain('implmented');
      expect(content).not.toContain('usr');
    });

    it('should work with --date flag', async () => {
      const result = await harness.run([
        'history',
        'log',
        '--smart',
        '--date',
        '2025-01-15',
        'fixd the bug',
      ]);

      harness.expectSuccess(result);
      expect(result.stdout).toContain('History logged');

      // Verify the file was created with the correct date
      const historyFiles = harness.listFiles('history');
      const hasDateFile = historyFiles.some(f => f.includes('2025-01-15'));
      expect(hasDateFile).toBe(true);

      // Verify the text was enhanced
      const content = harness.readFile('history/2025-01-15.md');
      expect(content).toContain('Fixed');
    });

    it('should use explicit --goal over smart auto-linking', async () => {
      // First create a goal
      const goalResult = await harness.run([
        'goal',
        'add',
        'Manual goal',
        '--deadline',
        '2025-12-31',
      ]);
      harness.expectSuccess(goalResult);

      const codenameMatch = goalResult.stdout.match(/Goal added with codename: ([a-z0-9-]+)/i);
      expect(codenameMatch).toBeTruthy();
      const codename = codenameMatch![1];

      // Log with both --smart and explicit --goal
      const result = await harness.run([
        'history',
        'log',
        '--smart',
        '--goal',
        codename,
        'did some work',
      ]);

      harness.expectSuccess(result);
      expect(result.stdout).toContain('linked to goal');
      expect(result.stdout).toContain(codename);
    });
  });
});
