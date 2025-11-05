import { confirm } from '@inquirer/prompts';
import { isTTY } from './tty.js';

/**
 * Prompt user to create their first goal after initialization
 *
 * @returns true if user accepts, false if declined
 * @throws Error if user cancels with Ctrl+C (handled by caller)
 */
export async function promptForFirstGoal(): Promise<boolean> {
  // Skip prompt if not in TTY environment
  if (!isTTY()) {
    return false;
  }

  try {
    const shouldCreateGoal = await confirm({
      message: 'Would you like to set your first goal?',
      default: true,
    });

    return shouldCreateGoal;
  } catch (err) {
    // User cancelled with Ctrl+C - let the caller handle it
    throw err;
  }
}

/**
 * Prompt user to create a todo and link it to a goal after goal creation
 *
 * @param _goalCodename - The codename of the goal to link to (used for context, not in function body)
 * @returns true if user accepts, false if declined
 * @throws Error if user cancels with Ctrl+C (handled by caller)
 */
export async function promptForFirstTodo(_goalCodename: string): Promise<boolean> {
  // Skip prompt if not in TTY environment
  if (!isTTY()) {
    return false;
  }

  try {
    const shouldCreateTodo = await confirm({
      message: 'Would you like to add a todo and link it to this goal?',
      default: true,
    });

    return shouldCreateTodo;
  } catch (err) {
    // User cancelled with Ctrl+C - let the caller handle it
    throw err;
  }
}
