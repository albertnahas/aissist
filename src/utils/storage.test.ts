import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, writeFile, rm, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  findStoragePath,
  getStoragePath,
  ensureDirectory,
  initializeStorage,
  loadConfig,
  saveConfig,
  saveDescription,
  loadDescription,
  appendToMarkdown,
  readMarkdown,
  getActiveGoals,
  getGoalByCodename,
  readProgressFile,
  writeProgressFile,
  updateProgressFile,
  addProgressNote,
  discoverChildDirectories,
  ConfigSchema,
  type Config,
  type ProgressFile,
} from './storage';

describe('storage utilities', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a unique test directory in tmp
    testDir = join(tmpdir(), `aissist-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('ConfigSchema', () => {
    it('should validate correct config', () => {
      const config = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      const result = ConfigSchema.parse(config);
      expect(result.version).toBe(config.version);
      expect(result.createdAt).toBe(config.createdAt);
      expect(result.lastModified).toBe(config.lastModified);
      expect(result.animations).toEqual({ enabled: true });
    });

    it('should use default version if not provided', () => {
      const config = {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      const result = ConfigSchema.parse(config);
      expect(result.version).toBe('1.0.0');
    });
  });

  describe('findStoragePath', () => {
    it('should find .aissist directory in current path', async () => {
      const aissistPath = join(testDir, '.aissist');
      await mkdir(aissistPath);

      const result = await findStoragePath(testDir);
      expect(result).toBe(aissistPath);
    });

    it('should find .aissist directory in parent path', async () => {
      const aissistPath = join(testDir, '.aissist');
      const subDir = join(testDir, 'sub', 'nested');
      await mkdir(aissistPath);
      await mkdir(subDir, { recursive: true });

      const result = await findStoragePath(subDir);
      expect(result).toBe(aissistPath);
    });

    it('should return null if no .aissist directory found', async () => {
      const result = await findStoragePath(testDir);
      expect(result).toBeNull();
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const newDir = join(testDir, 'new-dir');
      await ensureDirectory(newDir);

      await expect(access(newDir)).resolves.toBeUndefined();
    });

    it('should not throw if directory already exists', async () => {
      const existingDir = join(testDir, 'existing');
      await mkdir(existingDir);

      await expect(ensureDirectory(existingDir)).resolves.toBeUndefined();
    });

    it('should create nested directories', async () => {
      const nestedDir = join(testDir, 'level1', 'level2', 'level3');
      await ensureDirectory(nestedDir);

      await expect(access(nestedDir)).resolves.toBeUndefined();
    });
  });

  describe('initializeStorage', () => {
    it('should create all required directories', async () => {
      await initializeStorage(testDir);

      await expect(access(join(testDir, 'goals'))).resolves.toBeUndefined();
      await expect(access(join(testDir, 'history'))).resolves.toBeUndefined();
      await expect(access(join(testDir, 'context'))).resolves.toBeUndefined();
      await expect(access(join(testDir, 'reflections'))).resolves.toBeUndefined();
    });

    it('should create default config.json', async () => {
      await initializeStorage(testDir);

      const config = await loadConfig(testDir);
      expect(config.version).toBe('1.0.0');
      expect(config.createdAt).toBeDefined();
      expect(config.lastModified).toBeDefined();
    });

    it('should not overwrite existing config', async () => {
      const initialConfig: Config = {
        version: '1.0.0',
        createdAt: '2025-01-01T00:00:00.000Z',
        lastModified: '2025-01-01T00:00:00.000Z',
      };
      await saveConfig(testDir, initialConfig);

      await initializeStorage(testDir);

      const config = await loadConfig(testDir);
      expect(config.createdAt).toBe(initialConfig.createdAt);
    });
  });

  describe('saveDescription and loadDescription', () => {
    it('should save and load description correctly', async () => {
      const description = 'Project Apollo sprint tracking';
      await saveDescription(testDir, description);

      const result = await loadDescription(testDir);
      expect(result).toBe(description);
    });

    it('should trim whitespace from description', async () => {
      await saveDescription(testDir, '  My description  ');

      const result = await loadDescription(testDir);
      expect(result).toBe('My description');
    });

    it('should return null if DESCRIPTION.md does not exist', async () => {
      const result = await loadDescription(testDir);
      expect(result).toBeNull();
    });

    it('should return null if DESCRIPTION.md is empty', async () => {
      const descPath = join(testDir, 'DESCRIPTION.md');
      await writeFile(descPath, '   ');

      const result = await loadDescription(testDir);
      expect(result).toBeNull();
    });

    it('should overwrite existing description', async () => {
      await saveDescription(testDir, 'First description');
      await saveDescription(testDir, 'Second description');

      const result = await loadDescription(testDir);
      expect(result).toBe('Second description');
    });
  });

  describe('loadConfig and saveConfig', () => {
    it('should save and load config correctly', async () => {
      const config: Config = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      await saveConfig(testDir, config);
      const loaded = await loadConfig(testDir);

      expect(loaded.version).toBe(config.version);
      expect(loaded.createdAt).toBe(config.createdAt);
    });

    it('should update lastModified when saving', async () => {
      const config: Config = {
        version: '1.0.0',
        createdAt: '2025-01-01T00:00:00.000Z',
        lastModified: '2025-01-01T00:00:00.000Z',
      };

      await saveConfig(testDir, config);
      const loaded = await loadConfig(testDir);

      expect(loaded.lastModified).not.toBe(config.lastModified);
    });

    it('should throw error when loading non-existent config', async () => {
      await expect(loadConfig(testDir)).rejects.toThrow();
    });

    it('should throw error when loading invalid config', async () => {
      const configPath = join(testDir, 'config.json');
      await writeFile(configPath, 'invalid json');

      await expect(loadConfig(testDir)).rejects.toThrow();
    });
  });

  describe('appendToMarkdown', () => {
    it('should create new file if it does not exist', async () => {
      const filePath = join(testDir, 'test.md');
      const content = '# Test Content';

      await appendToMarkdown(filePath, content);

      const result = await readMarkdown(filePath);
      expect(result).toBe(content);
    });

    it('should append to existing file with separator', async () => {
      const filePath = join(testDir, 'test.md');
      const content1 = '# First Entry';
      const content2 = '# Second Entry';

      await appendToMarkdown(filePath, content1);
      await appendToMarkdown(filePath, content2);

      const result = await readMarkdown(filePath);
      expect(result).toBe(`${content1}\n\n${content2}`);
    });

    it('should not add extra separator to empty file', async () => {
      const filePath = join(testDir, 'test.md');
      await writeFile(filePath, '');

      await appendToMarkdown(filePath, 'Content');

      const result = await readMarkdown(filePath);
      expect(result).toBe('Content');
    });

    it('should create parent directory if createIfMissing is true', async () => {
      const filePath = join(testDir, 'sub', 'dir', 'test.md');

      await appendToMarkdown(filePath, 'Content', true);

      const result = await readMarkdown(filePath);
      expect(result).toBe('Content');
    });
  });

  describe('readMarkdown', () => {
    it('should read existing file', async () => {
      const filePath = join(testDir, 'test.md');
      const content = '# Test Content';
      await writeFile(filePath, content);

      const result = await readMarkdown(filePath);
      expect(result).toBe(content);
    });

    it('should return null for non-existent file', async () => {
      const filePath = join(testDir, 'nonexistent.md');

      const result = await readMarkdown(filePath);
      expect(result).toBeNull();
    });
  });

  describe('getActiveGoals', () => {
    it('should return empty array when goals directory does not exist', async () => {
      const result = await getActiveGoals(testDir);
      expect(result).toEqual([]);
    });

    it('should return empty array when goals directory is empty', async () => {
      const goalsDir = join(testDir, 'goals');
      await mkdir(goalsDir);

      const result = await getActiveGoals(testDir);
      expect(result).toEqual([]);
    });

    it('should return active goals from single date file', async () => {
      const goalsDir = join(testDir, 'goals');
      await mkdir(goalsDir);

      const goalContent = `## 10:00 - test-goal

Complete the test

Deadline: 2025-12-31`;

      await writeFile(join(goalsDir, '2025-11-04.md'), goalContent);

      const result = await getActiveGoals(testDir);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        codename: 'test-goal',
        text: 'Complete the test',
        date: '2025-11-04',
        deadline: '2025-12-31',
        timestamp: '10:00',
      });
    });

    it('should return active goals from multiple date files', async () => {
      const goalsDir = join(testDir, 'goals');
      await mkdir(goalsDir);

      const goal1 = `## 10:00 - goal-one

First goal`;
      const goal2 = `## 15:30 - goal-two

Second goal`;

      await writeFile(join(goalsDir, '2025-11-01.md'), goal1);
      await writeFile(join(goalsDir, '2025-11-04.md'), goal2);

      const result = await getActiveGoals(testDir);
      expect(result).toHaveLength(2);
      // Most recent first
      expect(result[0].codename).toBe('goal-two');
      expect(result[0].date).toBe('2025-11-04');
      expect(result[1].codename).toBe('goal-one');
      expect(result[1].date).toBe('2025-11-01');
    });

    it('should skip goals without codenames (legacy format)', async () => {
      const goalsDir = join(testDir, 'goals');
      await mkdir(goalsDir);

      const mixedContent = `## 10:00 - with-codename

Goal with codename

## 11:00

Legacy goal without codename`;

      await writeFile(join(goalsDir, '2025-11-04.md'), mixedContent);

      const result = await getActiveGoals(testDir);
      expect(result).toHaveLength(1);
      expect(result[0].codename).toBe('with-codename');
    });

    it('should return multiple goals from same date file', async () => {
      const goalsDir = join(testDir, 'goals');
      await mkdir(goalsDir);

      const multiGoalContent = `## 10:00 - morning-goal

Morning task

## 14:00 - afternoon-goal

Afternoon task`;

      await writeFile(join(goalsDir, '2025-11-04.md'), multiGoalContent);

      const result = await getActiveGoals(testDir);
      expect(result).toHaveLength(2);
      expect(result[0].codename).toBe('morning-goal');
      expect(result[1].codename).toBe('afternoon-goal');
    });
  });

  describe('getGoalByCodename', () => {
    it('should find goal by codename', async () => {
      const goalsDir = join(testDir, 'goals');
      await mkdir(goalsDir);

      const goalContent = `## 10:00 - test-goal

Test goal text

> A test goal for unit testing

Deadline: 2025-12-31`;

      await writeFile(join(goalsDir, '2025-11-04.md'), goalContent);

      const result = await getGoalByCodename(testDir, 'test-goal');
      expect(result).not.toBeNull();
      expect(result?.codename).toBe('test-goal');
      expect(result?.text).toBe('Test goal text');
      expect(result?.description).toBe('A test goal for unit testing');
      expect(result?.deadline).toBe('2025-12-31');
    });

    it('should return null if goal not found', async () => {
      const goalsDir = join(testDir, 'goals');
      await mkdir(goalsDir);

      const goalContent = `## 10:00 - other-goal

Other goal`;

      await writeFile(join(goalsDir, '2025-11-04.md'), goalContent);

      const result = await getGoalByCodename(testDir, 'nonexistent-goal');
      expect(result).toBeNull();
    });

    it('should find goal across multiple files', async () => {
      const goalsDir = join(testDir, 'goals');
      await mkdir(goalsDir);

      const goal1 = `## 10:00 - goal-one

Goal one text`;

      const goal2 = `## 14:00 - goal-two

Goal two text`;

      await writeFile(join(goalsDir, '2025-11-01.md'), goal1);
      await writeFile(join(goalsDir, '2025-11-04.md'), goal2);

      const result = await getGoalByCodename(testDir, 'goal-two');
      expect(result).not.toBeNull();
      expect(result?.codename).toBe('goal-two');
      expect(result?.text).toBe('Goal two text');
    });

    it('should handle goal without deadline or description', async () => {
      const goalsDir = join(testDir, 'goals');
      await mkdir(goalsDir);

      const goalContent = `## 10:00 - simple-goal

Simple goal text`;

      await writeFile(join(goalsDir, '2025-11-04.md'), goalContent);

      const result = await getGoalByCodename(testDir, 'simple-goal');
      expect(result).not.toBeNull();
      expect(result?.codename).toBe('simple-goal');
      expect(result?.text).toBe('Simple goal text');
      expect(result?.description).toBeNull();
      expect(result?.deadline).toBeNull();
    });
  });

  describe('Progress File Operations', () => {
    describe('readProgressFile and writeProgressFile', () => {
      it('should return null if progress.json does not exist', async () => {
        const result = await readProgressFile(testDir);
        expect(result).toBeNull();
      });

      it('should write and read progress file correctly', async () => {
        const progress: ProgressFile = {
          schema_version: '1.0',
          instance_path: testDir,
          description: 'Test instance',
          last_updated: new Date().toISOString(),
          goals: {
            'test-goal': {
              text: 'Test goal text',
              status: 'active',
              deadline: '2025-12-31',
              parent_goal: null,
              completed_at: null,
              progress_notes: [],
            },
          },
        };

        await writeProgressFile(testDir, progress);
        const result = await readProgressFile(testDir);

        expect(result).not.toBeNull();
        expect(result?.schema_version).toBe('1.0');
        expect(result?.description).toBe('Test instance');
        expect(result?.goals['test-goal'].text).toBe('Test goal text');
        expect(result?.goals['test-goal'].status).toBe('active');
      });

      it('should return null for invalid progress.json', async () => {
        await writeFile(join(testDir, 'progress.json'), 'invalid json');
        const result = await readProgressFile(testDir);
        expect(result).toBeNull();
      });
    });

    describe('updateProgressFile', () => {
      it('should create progress.json from active goals', async () => {
        // Setup: Create a goal file
        const goalsDir = join(testDir, 'goals');
        await mkdir(goalsDir, { recursive: true });

        const goalContent = `---
schema_version: "1.0"
timestamp: "10:00"
codename: test-goal
deadline: "2025-12-31"
---

Complete the test task`;

        await writeFile(join(goalsDir, '2025-11-04.md'), goalContent);

        await updateProgressFile(testDir);

        const progress = await readProgressFile(testDir);
        expect(progress).not.toBeNull();
        expect(progress?.goals['test-goal']).toBeDefined();
        expect(progress?.goals['test-goal'].text).toBe('Complete the test task');
        expect(progress?.goals['test-goal'].status).toBe('active');
      });

      it('should preserve existing progress notes when updating', async () => {
        // Setup: Create existing progress with notes
        const existingProgress: ProgressFile = {
          schema_version: '1.0',
          instance_path: testDir,
          description: null,
          last_updated: '2025-01-01T00:00:00.000Z',
          goals: {
            'test-goal': {
              text: 'Old text',
              status: 'active',
              deadline: null,
              parent_goal: null,
              completed_at: null,
              progress_notes: [
                { timestamp: '2025-01-01T10:00:00.000Z', text: 'Note 1' },
              ],
            },
          },
        };
        await writeProgressFile(testDir, existingProgress);

        // Create goals directory with updated goal
        const goalsDir = join(testDir, 'goals');
        await mkdir(goalsDir, { recursive: true });

        const goalContent = `---
schema_version: "1.0"
timestamp: "10:00"
codename: test-goal
---

Updated goal text`;

        await writeFile(join(goalsDir, '2025-11-04.md'), goalContent);

        await updateProgressFile(testDir);

        const progress = await readProgressFile(testDir);
        expect(progress?.goals['test-goal'].text).toBe('Updated goal text');
        expect(progress?.goals['test-goal'].progress_notes).toHaveLength(1);
        expect(progress?.goals['test-goal'].progress_notes[0].text).toBe('Note 1');
      });
    });

    describe('addProgressNote', () => {
      it('should add progress note to existing goal', async () => {
        // Setup: Create goal and progress file
        const goalsDir = join(testDir, 'goals');
        await mkdir(goalsDir, { recursive: true });

        const goalContent = `---
schema_version: "1.0"
timestamp: "10:00"
codename: test-goal
---

Test goal`;

        await writeFile(join(goalsDir, '2025-11-04.md'), goalContent);
        await updateProgressFile(testDir);

        const added = await addProgressNote(testDir, 'test-goal', 'Made progress');

        expect(added).toBe(true);

        const progress = await readProgressFile(testDir);
        expect(progress?.goals['test-goal'].progress_notes).toHaveLength(1);
        expect(progress?.goals['test-goal'].progress_notes[0].text).toBe('Made progress');
      });

      it('should return false for non-existent goal', async () => {
        const added = await addProgressNote(testDir, 'nonexistent-goal', 'Note');
        expect(added).toBe(false);
      });
    });

    describe('discoverChildDirectories', () => {
      it('should discover child .aissist directories', async () => {
        // Setup: Create nested .aissist directories
        const parentAissist = join(testDir, '.aissist');
        const childDir = join(testDir, 'subproject');
        const childAissist = join(childDir, '.aissist');

        await mkdir(parentAissist, { recursive: true });
        await mkdir(childAissist, { recursive: true });

        const result = await discoverChildDirectories(testDir);

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(childAissist);
      });

      it('should exclude node_modules by default', async () => {
        // Setup: Create .aissist in node_modules
        const nodeModulesAissist = join(testDir, 'node_modules', 'some-package', '.aissist');
        await mkdir(nodeModulesAissist, { recursive: true });

        const result = await discoverChildDirectories(testDir);
        expect(result).toHaveLength(0);
      });

      it('should respect maxDepth option', async () => {
        // Setup: Create deeply nested .aissist
        const deepAissist = join(testDir, 'a', 'b', 'c', 'd', '.aissist');
        await mkdir(deepAissist, { recursive: true });

        const result = await discoverChildDirectories(testDir, { maxDepth: 2 });
        expect(result).toHaveLength(0);
      });

      it('should respect custom exclude option', async () => {
        // Setup: Create .aissist in custom-excluded directory
        const customExcluded = join(testDir, 'excluded-dir', '.aissist');
        await mkdir(customExcluded, { recursive: true });

        const result = await discoverChildDirectories(testDir, { exclude: ['excluded-dir'] });
        expect(result).toHaveLength(0);
      });

      it('should find multiple child directories', async () => {
        // Setup: Create multiple child .aissist directories
        const child1 = join(testDir, 'api', '.aissist');
        const child2 = join(testDir, 'web', '.aissist');
        await mkdir(child1, { recursive: true });
        await mkdir(child2, { recursive: true });

        const result = await discoverChildDirectories(testDir);

        expect(result).toHaveLength(2);
        expect(result).toContain(child1);
        expect(result).toContain(child2);
      });
    });

    describe('Goal with parent_goal field', () => {
      it('should parse goal with parent_goal from YAML', async () => {
        const goalsDir = join(testDir, 'goals');
        await mkdir(goalsDir, { recursive: true });

        const goalContent = `---
schema_version: "1.0"
timestamp: "10:00"
codename: child-goal
parent_goal: parent-goal
---

Child goal text`;

        await writeFile(join(goalsDir, '2025-11-04.md'), goalContent);

        const goals = await getActiveGoals(testDir);
        expect(goals).toHaveLength(1);
        expect(goals[0].codename).toBe('child-goal');
        expect(goals[0].parent_goal).toBe('parent-goal');
      });

      it('should handle goal without parent_goal', async () => {
        const goalsDir = join(testDir, 'goals');
        await mkdir(goalsDir, { recursive: true });

        const goalContent = `---
schema_version: "1.0"
timestamp: "10:00"
codename: standalone-goal
---

Standalone goal text`;

        await writeFile(join(goalsDir, '2025-11-04.md'), goalContent);

        const goals = await getActiveGoals(testDir);
        expect(goals).toHaveLength(1);
        expect(goals[0].parent_goal).toBeNull();
      });
    });
  });
});
