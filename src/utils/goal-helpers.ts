import { join } from 'path';
import { input } from '@inquirer/prompts';
import {
  getStoragePath,
  appendToMarkdown,
  getExistingCodenames,
} from './storage.js';
import { getCurrentDate, getCurrentTime, parseDate, formatDate } from './date.js';
import { success, error, info } from './cli.js';
import { generateGoalCodename } from '../llm/claude.js';
import { parseTimeframe } from './timeframe-parser.js';
import chalk from 'chalk';

export interface GoalCreationOptions {
  text?: string;
  deadline?: string;
  description?: string;
  skipDeadlinePrompt?: boolean;
}

export interface GoalCreationResult {
  success: boolean;
  codename?: string;
  error?: string;
}

/**
 * Create a goal interactively, prompting for text and deadline if not provided
 *
 * @param options - Goal creation options
 * @returns Goal creation result with success status and codename
 */
export async function createGoalInteractive(options: GoalCreationOptions = {}): Promise<GoalCreationResult> {
  try {
    const storagePath = await getStoragePath();
    const date = getCurrentDate();
    const time = getCurrentTime();
    const filePath = join(storagePath, 'goals', `${date}.md`);

    // Prompt for goal text if not provided
    let goalText = options.text;
    if (!goalText) {
      try {
        goalText = await input({
          message: 'Enter your goal:',
          validate: (value) => {
            if (!value.trim()) return 'Goal text is required';
            return true;
          },
        });
      } catch (err) {
        // User cancelled (Ctrl+C)
        return { success: false, error: 'cancelled' };
      }
    }

    // Validate deadline if provided via options
    if (options.deadline && !parseDate(options.deadline)) {
      error(`Invalid date format: ${options.deadline}. Use YYYY-MM-DD format.`);
      return { success: false, error: 'invalid_deadline' };
    }

    // Get existing codenames to ensure uniqueness
    const existingCodenames = await getExistingCodenames(filePath);

    // Generate codename
    let codename: string;
    try {
      codename = await generateGoalCodename(goalText, existingCodenames);
    } catch (err) {
      error(`Failed to generate codename: ${(err as Error).message}`);
      return { success: false, error: 'codename_generation_failed' };
    }

    // Prompt for deadline if not provided via options and not skipped
    let deadlineDate: string | undefined = options.deadline;
    if (!options.deadline && !options.skipDeadlinePrompt) {
      try {
        const deadlineInput = await input({
          message: 'Enter deadline (default: Tomorrow):',
          default: 'Tomorrow',
        });

        const trimmed = deadlineInput.trim();
        if (trimmed !== '' && trimmed.toLowerCase() !== 'skip') {
          const parsedTimeframe = parseTimeframe(trimmed);
          deadlineDate = formatDate(parsedTimeframe.end);
        }
      } catch (err) {
        // User cancelled (Ctrl+C) during deadline prompt
        return { success: false, error: 'cancelled', codename };
      }
    }

    // Build goal entry
    let entry = `## ${time} - ${codename}\n\n${goalText}`;

    // Add description if provided
    if (options.description) {
      const descriptionLines = options.description.split('\n').map((line: string) => `> ${line}`).join('\n');
      entry += `\n\n${descriptionLines}`;
    }

    if (deadlineDate) {
      entry += `\n\nDeadline: ${deadlineDate}`;
    }

    await appendToMarkdown(filePath, entry);

    success(`Goal added with codename: ${chalk.cyan(codename)}`);
    if (options.description) {
      info('Description added');
    }
    if (deadlineDate) {
      info(`Deadline: ${deadlineDate}`);
    }

    return { success: true, codename };
  } catch (err) {
    error(`Failed to add goal: ${(err as Error).message}`);
    return { success: false, error: (err as Error).message };
  }
}
