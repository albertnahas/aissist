import { Command } from 'commander';
import { join } from 'path';
import { homedir } from 'os';
import { access, readdir, stat, rm } from 'fs/promises';
import { confirm } from '@inquirer/prompts';
import { getStoragePath, isGlobalStorage } from '../utils/storage.js';
import { success, error, info, warn } from '../utils/cli.js';
import chalk from 'chalk';

interface ClearOptions {
  yes?: boolean;
  dry?: boolean;
  global?: boolean;
  hard?: boolean;
}

interface DeletedItem {
  path: string;
  type: 'file' | 'directory';
  size: number;
}

interface ClearResult {
  deleted: DeletedItem[];
  failed: Array<{ path: string; error: string }>;
  totalSize: number;
}

/**
 * Get list of items to delete from storage
 */
async function getItemsToDelete(storagePath: string, hard: boolean): Promise<DeletedItem[]> {
  const items: DeletedItem[] = [];

  if (hard) {
    // Hard mode: delete entire .aissist directory
    try {
      await stat(storagePath);
      const size = await calculateDirectorySize(storagePath);
      items.push({
        path: storagePath,
        type: 'directory',
        size,
      });
    } catch {
      // Directory doesn't exist
    }
    return items;
  }

  // Normal mode: delete contents but preserve .aissist directory
  const itemsToDelete = [
    'goals',
    'history',
    'context',
    'reflections',
    'todos',
    'config.json',
  ];

  for (const item of itemsToDelete) {
    const itemPath = join(storagePath, item);
    try {
      const stats = await stat(itemPath);
      const size = stats.isDirectory()
        ? await calculateDirectorySize(itemPath)
        : stats.size;
      items.push({
        path: itemPath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size,
      });
    } catch {
      // Item doesn't exist, skip
    }
  }

  return items;
}

/**
 * Calculate total size of a directory recursively
 */
async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += await calculateDirectorySize(fullPath);
      } else {
        const stats = await stat(fullPath);
        totalSize += stats.size;
      }
    }
  } catch {
    // Directory not accessible
  }

  return totalSize;
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Clear storage by deleting specified items
 */
async function clearStorage(items: DeletedItem[]): Promise<ClearResult> {
  const result: ClearResult = {
    deleted: [],
    failed: [],
    totalSize: 0,
  };

  for (const item of items) {
    try {
      await rm(item.path, { recursive: true, force: true });
      result.deleted.push(item);
      result.totalSize += item.size;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      result.failed.push({
        path: item.path,
        error: errorMessage,
      });
    }
  }

  return result;
}

/**
 * Display dry-run preview
 */
function displayDryRunPreview(items: DeletedItem[], storagePath: string): void {
  if (items.length === 0) {
    info('No data to clear.');
    return;
  }

  info(chalk.bold('\nThe following items would be deleted:'));
  info(chalk.gray(`Storage path: ${storagePath}\n`));

  let totalSize = 0;
  for (const item of items) {
    const icon = item.type === 'directory' ? '📁' : '📄';
    const relativePath = item.path.replace(storagePath, '').substring(1) || item.path;
    info(`  ${icon} ${relativePath} ${chalk.gray(`(${formatBytes(item.size)})`)}`);
    totalSize += item.size;
  }

  info('');
  info(chalk.bold(`Total: ${items.length} item(s), ${formatBytes(totalSize)}`));
}

/**
 * Clear command handler
 */
async function clearCommandHandler(options: ClearOptions): Promise<void> {
  try {
    // Determine storage path
    let storagePath: string;
    if (options.global) {
      storagePath = join(homedir(), '.aissist');
    } else {
      storagePath = await getStoragePath();
    }

    // Check if storage exists
    try {
      await access(storagePath);
    } catch {
      info(`No storage directory found at: ${storagePath}`);
      return;
    }

    // Check if storage is global
    const isGlobal = options.global || (await isGlobalStorage());

    // Get items to delete
    const items = await getItemsToDelete(storagePath, options.hard || false);

    if (items.length === 0) {
      info('No data to clear.');
      return;
    }

    // Dry-run mode: just display what would be deleted
    if (options.dry) {
      displayDryRunPreview(items, storagePath);
      return;
    }

    // Show confirmation prompt unless --yes flag is provided
    if (!options.yes) {
      const storageType = isGlobal ? 'global' : 'local';
      const warningMessage = options.hard
        ? `This will ${chalk.bold.red('completely remove')} the entire .aissist directory at:\n  ${chalk.cyan(storagePath)}\n\n${chalk.yellow('⚠️  All data will be permanently deleted!')}`
        : `This will ${chalk.bold.red('delete all data')} from ${storageType} storage at:\n  ${chalk.cyan(storagePath)}\n\n${chalk.yellow('⚠️  This action cannot be undone!')}`;

      info(warningMessage);
      info('');

      const confirmed = await confirm({
        message: 'Are you sure you want to continue?',
        default: false,
      });

      if (!confirmed) {
        info('Clear operation cancelled.');
        return;
      }
    }

    // Perform deletion
    const result = await clearStorage(items);

    // Display results
    if (result.failed.length > 0) {
      warn('\nSome items could not be deleted:');
      for (const failure of result.failed) {
        error(`  ✗ ${failure.path}: ${failure.error}`);
      }
      info('');
    }

    if (result.deleted.length > 0) {
      success(`\n✓ Cleared ${result.deleted.length} item(s) (${formatBytes(result.totalSize)})`);

      if (options.hard) {
        info('The .aissist directory has been completely removed.');
      } else {
        info('The .aissist directory structure has been preserved.');
        info('You can run "aissist init" to recreate the default configuration.');
      }
    }

    // Exit with error code if any failures occurred
    if (result.failed.length > 0) {
      process.exit(1);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Check for permission errors
    if (errorMessage.includes('EACCES') || errorMessage.includes('EPERM')) {
      error('Permission denied. You may need to run this command with elevated privileges.');
      error(`Error: ${errorMessage}`);
    } else {
      error(`Failed to clear storage: ${errorMessage}`);
    }

    process.exit(1);
  }
}

// Create the command
const clearCommand = new Command('clear');

clearCommand
  .description('Clear storage data')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('--dry', 'Preview what would be deleted without deleting')
  .option('-g, --global', 'Clear global storage (~/.aissist/)')
  .option('--hard', 'Remove entire .aissist directory')
  .action(clearCommandHandler);

export { clearCommand };
