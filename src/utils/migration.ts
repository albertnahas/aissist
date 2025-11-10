import { readFile, writeFile, rename, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { info, error as logError } from './cli.js';

/**
 * Migration result interface
 */
export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Migrate a file from inline format to YAML format
 * @param filePath - Path to the file to migrate
 * @param parseInline - Function to parse entries from inline format
 * @param serializeYaml - Function to serialize entries to YAML format
 * @param options - Migration options
 * @returns Migration result
 */
export async function migrateFile<T>(
  filePath: string,
  parseInline: (content: string) => T[],
  serializeYaml: (entries: T[]) => string,
  options: { logMigration?: boolean; dryRun?: boolean } = {}
): Promise<MigrationResult> {
  const { logMigration = false, dryRun = false } = options;
  const result: MigrationResult = {
    success: false,
    migratedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    // Read the file
    const content = await readFile(filePath, 'utf-8');

    // Parse entries using inline parser
    let entries: T[];
    try {
      entries = parseInline(content);
    } catch (err) {
      result.errors.push(`Failed to parse inline format: ${(err as Error).message}`);
      return result;
    }

    if (entries.length === 0) {
      // No entries to migrate
      result.success = true;
      return result;
    }

    // Serialize to YAML format
    let newContent: string;
    try {
      newContent = serializeYaml(entries);
    } catch (err) {
      result.errors.push(`Failed to serialize to YAML: ${(err as Error).message}`);
      result.failedCount = entries.length;
      return result;
    }

    if (dryRun) {
      // Dry run mode - don't actually write
      result.success = true;
      result.migratedCount = entries.length;
      return result;
    }

    // Write to file atomically
    await writeFileAtomic(filePath, newContent);

    result.success = true;
    result.migratedCount = entries.length;

    if (logMigration) {
      info(`Migrated ${entries.length} entries in ${filePath} to YAML format`);
    }

    return result;
  } catch (err) {
    result.errors.push(`Migration failed: ${(err as Error).message}`);
    logError(`Failed to migrate ${filePath}: ${(err as Error).message}`);
    return result;
  }
}

/**
 * Write file atomically using temp file + rename
 * Preserves original file if write fails
 */
export async function writeFileAtomic(filePath: string, content: string): Promise<void> {
  // Create temp file in same directory (ensures same filesystem for atomic rename)
  const tempPath = join(tmpdir(), `aissist-migrate-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);

  try {
    // Write to temp file
    await writeFile(tempPath, content, 'utf-8');

    // Atomic rename (overwrites original)
    await rename(tempPath, filePath);
  } catch (err) {
    // Clean up temp file on error
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw err;
  }
}

/**
 * Check if a file needs migration
 * Returns true if file contains inline format entries
 */
export function needsMigration(content: string): boolean {
  const trimmed = content.trim();

  // If file is empty, no migration needed
  if (!trimmed) {
    return false;
  }

  // If file starts with YAML front matter, assume it's already migrated
  if (trimmed.startsWith('---')) {
    return false;
  }

  // If file contains ## headers (inline format), needs migration
  if (trimmed.includes('## ')) {
    return true;
  }

  return false;
}

/**
 * Log migration statistics
 */
export function logMigrationStats(result: MigrationResult, filePath: string): void {
  if (result.success && result.migratedCount > 0) {
    info(`✓ Migrated ${result.migratedCount} entries in ${filePath}`);
  } else if (result.failedCount > 0) {
    logError(`✗ Failed to migrate ${result.failedCount} entries in ${filePath}`);
    for (const err of result.errors) {
      logError(`  ${err}`);
    }
  }
}
