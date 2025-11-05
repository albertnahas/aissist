import { join } from 'path';
import { homedir } from 'os';
import { access } from 'fs/promises';
import { confirm } from '@inquirer/prompts';
import { initializeStorage } from '../utils/storage.js';
import { success, warn, info, error } from '../utils/cli.js';
import { checkClaudeCodeInstalled, integrateClaudeCodePlugin } from '../utils/claude-plugin.js';
import { promptForFirstGoal, promptForFirstTodo } from '../utils/onboarding.js';
import { createGoalInteractive } from '../utils/goal-helpers.js';
import { createTodoInteractive } from '../utils/todo-helpers.js';
import ora from 'ora';

interface InitOptions {
  global?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const basePath = options.global ? join(homedir(), '.aissist') : join(process.cwd(), '.aissist');

  // Track if storage was newly created
  let storageNewlyCreated = false;

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
    storageNewlyCreated = true;
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

  // Post-initialization onboarding: prompt for first goal
  if (storageNewlyCreated) {
    info('');
    try {
      const shouldCreateGoal = await promptForFirstGoal();

      if (shouldCreateGoal) {
        // Create first goal interactively
        const goalResult = await createGoalInteractive();

        if (goalResult.success && goalResult.codename) {
          // Post-goal onboarding: prompt for first todo linked to goal
          info('');
          try {
            const shouldCreateTodo = await promptForFirstTodo(goalResult.codename);

            if (shouldCreateTodo) {
              // Create first todo with goal pre-linked
              await createTodoInteractive({ goal: goalResult.codename });
            }
          } catch (err) {
            // User cancelled todo prompt with Ctrl+C - gracefully exit
            info('');
          }
        }
      }
    } catch (err) {
      // User cancelled goal prompt with Ctrl+C - gracefully exit
      info('');
    }
  }

  info('');
  info('Quick start:');
  info('  aissist goal add "Learn TypeScript"');
  info('  aissist history log "Completed code review"');
  info('  aissist reflect');
  info('  aissist recall "what did I learn today?"');
}
