import { join } from 'path';
import { homedir } from 'os';
import { access } from 'fs/promises';
import { initializeStorage } from '../utils/storage.js';
import { success, warn, info } from '../utils/cli.js';

interface InitOptions {
  global?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const basePath = options.global ? join(homedir(), '.aissist') : join(process.cwd(), '.aissist');

  // Check if already exists
  try {
    await access(basePath);
    warn(`Storage already exists at: ${basePath}`);
    info('Initialization skipped. Use a different location or remove the existing directory.');
    return;
  } catch {
    // Directory doesn't exist, proceed
  }

  // Initialize storage
  await initializeStorage(basePath);

  success(`Initialized aissist storage at: ${basePath}`);
  info('You can now start tracking your goals, history, context, and reflections!');
  info('');
  info('Quick start:');
  info('  aissist goal add "Learn TypeScript"');
  info('  aissist history log "Completed code review"');
  info('  aissist reflect');
  info('  aissist recall "what did I learn today?"');
}
