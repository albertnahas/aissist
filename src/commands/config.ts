import { Command } from 'commander';
import { join, relative } from 'path';
import { homedir } from 'os';
import { getStoragePath, discoverHierarchy, loadConfig, saveConfig } from '../utils/storage.js';
import { success, info, warn, handleError } from '../utils/cli.js';

const configCommand = new Command('config');

/**
 * Calculate relative depth from current directory to a path
 */
function calculateDepth(from: string, to: string): string {
  const globalPath = join(homedir(), '.aissist');

  if (to === globalPath) {
    return 'global';
  }

  if (to === from) {
    return 'local';
  }

  const rel = relative(from, to);
  const levels = rel.split('..').length - 1;

  if (levels === 0) return 'local';
  if (levels === 1) return '1 level up';
  return `${levels} levels up`;
}

/**
 * Enable hierarchical configuration at runtime
 */
export async function hierarchyEnableCommand(): Promise<void> {
  const storagePath = await getStoragePath();

  // Discover parent paths
  const discoveredPaths = await discoverHierarchy(storagePath);

  if (discoveredPaths.length === 0) {
    info('No parent directories found. Hierarchy remains disabled.');
    return;
  }

  // Update config
  const config = await loadConfig(storagePath);
  config.readPaths = discoveredPaths;
  await saveConfig(storagePath, config);

  success(`Hierarchical read access enabled (${discoveredPaths.length} parent ${discoveredPaths.length === 1 ? 'path' : 'paths'})`);

  for (const path of discoveredPaths) {
    const depth = calculateDepth(storagePath, path);
    info(`  • ${path} (${depth})`);
  }
}

/**
 * Disable hierarchical configuration at runtime
 */
export async function hierarchyDisableCommand(): Promise<void> {
  const storagePath = await getStoragePath();
  const config = await loadConfig(storagePath);

  if (!config.readPaths || config.readPaths.length === 0) {
    info('Hierarchical read access already disabled');
    return;
  }

  config.readPaths = [];
  await saveConfig(storagePath, config);

  success('Hierarchical read access disabled (sandbox mode)');
}

/**
 * Show hierarchy status
 */
export async function hierarchyStatusCommand(): Promise<void> {
  const storagePath = await getStoragePath();

  try {
    const config = await loadConfig(storagePath);
    const readPaths = config.readPaths || [];

    if (readPaths.length > 0) {
      console.log(`\nHierarchical read access: enabled (${readPaths.length} parent ${readPaths.length === 1 ? 'path' : 'paths'})`);
      console.log('\nRead hierarchy:');
      console.log(`  • ${storagePath} (local)`);

      for (const path of readPaths) {
        const depth = calculateDepth(storagePath, path);
        console.log(`  • ${path} (${depth})`);
      }
    } else {
      console.log('\nHierarchical read access: disabled (sandbox mode)');
    }
  } catch {
    warn('No configuration found');
  }
}

// Register hierarchy subcommands
const hierarchyCommand = configCommand
  .command('hierarchy')
  .description('Manage hierarchical configuration');

hierarchyCommand
  .command('enable')
  .description('Enable hierarchical read access to parent directories')
  .action(async () => {
    try {
      await hierarchyEnableCommand();
    } catch (error) {
      handleError(error);
    }
  });

hierarchyCommand
  .command('disable')
  .description('Disable hierarchical read access (sandbox mode)')
  .action(async () => {
    try {
      await hierarchyDisableCommand();
    } catch (error) {
      handleError(error);
    }
  });

hierarchyCommand
  .command('status')
  .description('Show current hierarchy status')
  .action(async () => {
    try {
      await hierarchyStatusCommand();
    } catch (error) {
      handleError(error);
    }
  });

// Default action shows status
hierarchyCommand.action(async () => {
  try {
    await hierarchyStatusCommand();
  } catch (error) {
    handleError(error);
  }
});

export { configCommand };
