import chalk from 'chalk';
import { getStoragePath, loadConfig } from './storage.js';

/**
 * Context information passed to hint generation
 */
export interface HintContext {
  command: string;
  metadata?: Record<string, unknown>;
}

/**
 * Static hints mapping
 */
const STATIC_HINTS: Record<string, string> = {
  'goal.add': 'Try `aissist recall goals` to check progress',
  'goal.complete': 'Check your achievements with `aissist recall goals`',
  'goal.remove': 'View your remaining goals with `aissist recall goals`',
  'todo.add': 'Use `aissist todo list` to see all tasks',
  'todo.done': 'See remaining todos with `aissist todo list`',
  'todo.remove': 'Check what\'s left with `aissist todo list`',
  'history.log': 'Run `aissist reflect` to review your day',
  'recall.goals': 'Create a new goal with `aissist goal add <description>`',
  'recall.todos': 'Add a todo with `aissist todo add <task>`',
  'recall.history': 'Reflect on your progress with `aissist reflect`',
  'reflect': 'Generate next steps with `aissist propose`',
  'propose': 'Take action on your plan with related commands',
};

/**
 * Get a static hint for a command
 */
export function getStaticHint(command: string): string | null {
  return STATIC_HINTS[command] || null;
}

/**
 * Display a hint to the user with visual styling
 */
export function displayHint(text: string): void {
  console.log(''); // Blank line separator
  console.log(chalk.dim('💡 ' + text));
}

/**
 * Main hint function - gets hint based on config strategy
 * This will be enhanced in Phase 3 to support AI hints
 */
export async function showHint(context: HintContext): Promise<void> {
  try {
    // Check if hints are enabled in config
    const storagePath = await getStoragePath();
    const config = await loadConfig(storagePath);

    if (!config.hints?.enabled) {
      return; // Hints disabled
    }

    // For now, only support static hints (AI hints in Phase 3)
    const hint = getStaticHint(context.command);

    if (hint) {
      displayHint(hint);
    }
  } catch {
    // Silently fail if hint generation fails - don't disrupt user workflow
  }
}
