import { join, relative } from 'path';
import { homedir } from 'os';
import { getStoragePath, isGlobalStorage, loadConfig } from '../utils/storage.js';
import { info } from '../utils/cli.js';

interface PathOptions {
  hierarchy?: boolean;
}

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

export async function pathCommand(options: PathOptions = {}): Promise<void> {
  const storagePath = await getStoragePath();
  const isGlobal = await isGlobalStorage();

  console.log(`\nStorage path (writes): ${storagePath}`);
  info(isGlobal ? 'Using global storage' : 'Using local storage');

  // Show hierarchy if requested
  if (options.hierarchy) {
    try {
      const config = await loadConfig(storagePath);
      const readPaths = config.readPaths || [];

      if (readPaths.length > 0) {
        console.log('\nRead hierarchy:');
        console.log(`  • ${storagePath} (local)`);

        for (const path of readPaths) {
          const depth = calculateDepth(storagePath, path);
          console.log(`  • ${path} (${depth})`);
        }
      } else {
        info('\nNo hierarchical configuration (isolated mode)');
      }
    } catch {
      info('\nNo hierarchical configuration (isolated mode)');
    }
  }
}
