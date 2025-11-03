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
  appendToMarkdown,
  readMarkdown,
  ConfigSchema,
  type Config,
} from './storage';

describe('storage utilities', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a unique test directory in tmp
    testDir = join(tmpdir(), `aissist-test-${Date.now()}`);
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
      expect(result).toEqual(config);
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
      await expect(access(join(testDir, 'slash-commands'))).resolves.toBeUndefined();
    });

    it('should create default config.json', async () => {
      await initializeStorage(testDir);

      const config = await loadConfig(testDir);
      expect(config.version).toBe('1.0.0');
      expect(config.createdAt).toBeDefined();
      expect(config.lastModified).toBeDefined();
    });

    it('should create slash command manifest', async () => {
      await initializeStorage(testDir);

      const manifestPath = join(testDir, 'slash-commands', 'aissist.json');
      await expect(access(manifestPath)).resolves.toBeUndefined();
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
});
