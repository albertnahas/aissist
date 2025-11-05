import { join } from 'path';
import { homedir } from 'os';
import { access } from 'fs/promises';
import { confirm } from '@inquirer/prompts';
import { initializeStorage } from '../utils/storage.js';
import { success, warn, info, error } from '../utils/cli.js';
import { checkClaudeCodeInstalled, integrateClaudeCodePlugin } from '../utils/claude-plugin.js';
import ora from 'ora';

interface InitOptions {
  global?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const basePath = options.global ? join(homedir(), '.aissist') : join(process.cwd(), '.aissist');

  // Check if already exists
  try {
    await access(basePath);
    warn(`Storage already exists at: ${basePath}`);
    info('Storage initialization skipped.');
  } catch {
    // Directory doesn't exist, proceed with initialization
    await initializeStorage(basePath);
    success(`Initialized aissist storage at: ${basePath}`);
    info('You can now start tracking your goals, history, context, and reflections!');
  }

  // Check for Claude Code integration
  const claudeStatus = await checkClaudeCodeInstalled();
  if (claudeStatus.installed) {
    info('');
    const shouldIntegrate = await confirm({
      message: 'Would you like to integrate with Claude Code?',
      default: true,
    });

    if (shouldIntegrate) {
      const spinner = ora('Installing Claude Code plugin...').start();

      try {
        const result = await integrateClaudeCodePlugin();

        if (result.success) {
          spinner.succeed();
          if (result.alreadyInstalled) {
            info(result.message);
          } else {
            success(result.message);
            info('');
            info('Available commands:');
            info('  /aissist:log    - Import GitHub activity as history');
            info('  /aissist:recall - Semantic search across your memory');
            info('  /aissist:goal   - Manage goals interactively');
          }
        } else {
          spinner.fail('Failed to install plugin');
          error(result.message);
        }
      } catch (err) {
        spinner.fail('Installation error');
        error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  }

  info('');
  info('Quick start:');
  info('  aissist goal add "Learn TypeScript"');
  info('  aissist history log "Completed code review"');
  info('  aissist reflect');
  info('  aissist recall "what did I learn today?"');
}
