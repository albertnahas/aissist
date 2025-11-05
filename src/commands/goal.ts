import { Command } from 'commander';
import { join } from 'path';
import { select, input } from '@inquirer/prompts';
import {
  getStoragePath,
  appendToMarkdown,
  readMarkdown,
  getExistingCodenames,
  parseGoalEntries,
  removeGoalEntry,
  completeGoalEntry,
  updateGoalDeadline,
  updateGoalDescription,
  type GoalEntry,
} from '../utils/storage.js';
import { getCurrentDate, getCurrentTime, parseDate, formatDate } from '../utils/date.js';
import { success, error, info } from '../utils/cli.js';
import { generateGoalCodename } from '../llm/claude.js';
import { parseTimeframe } from '../utils/timeframe-parser.js';
import chalk from 'chalk';
import { playCompletionAnimation } from '../utils/animations.js';
import { promptForFirstTodo } from '../utils/onboarding.js';
import { createTodoInteractive } from '../utils/todo-helpers.js';

const goalCommand = new Command('goal');

goalCommand
  .command('add')
  .description('Add a new goal')
  .argument('<text>', 'Goal text')
  .option('-d, --deadline <date>', 'Set deadline (YYYY-MM-DD format)')
  .option('-D, --description <text>', 'Add a description to the goal')
  .action(async (text: string, options) => {
    try {
      const storagePath = await getStoragePath();
      const date = getCurrentDate();
      const time = getCurrentTime();
      const filePath = join(storagePath, 'goals', `${date}.md`);

      // Validate deadline if provided
      if (options.deadline && !parseDate(options.deadline)) {
        error(`Invalid date format: ${options.deadline}. Use YYYY-MM-DD format.`);
        return;
      }

      // Get existing codenames to ensure uniqueness
      const existingCodenames = await getExistingCodenames(filePath);

      // Generate codename
      let codename: string;
      try {
        codename = await generateGoalCodename(text, existingCodenames);
      } catch (err) {
        error(`Failed to generate codename: ${(err as Error).message}`);
        return;
      }

      // Prompt for deadline if not provided via flag
      let deadlineDate: string | undefined = options.deadline;
      if (!options.deadline) {
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
          // User cancelled (Ctrl+C) or parser error
          error(`Failed to parse deadline: ${(err as Error).message}`);
          return;
        }
      }

      // Build goal entry
      let entry = `## ${time} - ${codename}\n\n${text}`;

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

      // Post-goal onboarding: prompt for linked todo
      info('');
      try {
        const shouldCreateTodo = await promptForFirstTodo(codename);

        if (shouldCreateTodo) {
          // Create todo with goal pre-linked
          await createTodoInteractive({ goal: codename });
        }
      } catch (err) {
        // User cancelled todo prompt with Ctrl+C - gracefully exit
        // Goal is already saved, so we just exit
      }
    } catch (err) {
      error(`Failed to add goal: ${(err as Error).message}`);
      throw err;
    }
  });

goalCommand
  .command('list')
  .description('List goals (interactive mode by default)')
  .option('-d, --date <date>', 'Show goals for specific date (YYYY-MM-DD)')
  .option('-p, --plain', 'Plain text output (non-interactive)')
  .action(async (options) => {
    try {
      const storagePath = await getStoragePath();
      const date = options.date || getCurrentDate();

      if (options.date && !parseDate(options.date)) {
        error(`Invalid date format: ${options.date}. Use YYYY-MM-DD format.`);
        return;
      }

      const filePath = join(storagePath, 'goals', `${date}.md`);
      const content = await readMarkdown(filePath);

      if (!content) {
        info(`No goals found for ${date}`);
        return;
      }

      const entries = parseGoalEntries(content);

      if (entries.length === 0) {
        info(`No goals found for ${date}`);
        return;
      }

      // Plain text mode
      if (options.plain) {
        console.log(`\nGoals for ${date}:\n`);
        console.log(content);
        return;
      }

      // Interactive mode
      await interactiveGoalList(entries, filePath, date, storagePath);
    } catch (err) {
      error(`Failed to list goals: ${(err as Error).message}`);
      throw err;
    }
  });

goalCommand
  .command('remove')
  .description('Remove a goal by codename')
  .argument('<codename>', 'Goal codename to remove')
  .action(async (codename: string) => {
    try {
      const storagePath = await getStoragePath();
      const date = getCurrentDate();
      const filePath = join(storagePath, 'goals', `${date}.md`);

      const removed = await removeGoalEntry(filePath, codename);

      if (removed) {
        success(`Goal '${codename}' removed`);
      } else {
        error(`Goal '${codename}' not found`);
      }
    } catch (err) {
      error(`Failed to remove goal: ${(err as Error).message}`);
      throw err;
    }
  });

goalCommand
  .command('complete')
  .description('Mark a goal as completed')
  .argument('<codename>', 'Goal codename to complete')
  .action(async (codename: string) => {
    try {
      const storagePath = await getStoragePath();
      const date = getCurrentDate();
      const sourcePath = join(storagePath, 'goals', `${date}.md`);
      const destPath = join(storagePath, 'goals', 'finished', `${date}.md`);

      const completed = await completeGoalEntry(sourcePath, destPath, codename);

      if (completed) {
        // Play completion animation for goal achievement
        await playCompletionAnimation(`Goal '${codename}' completed!`);
      } else {
        error(`Goal '${codename}' not found`);
      }
    } catch (err) {
      error(`Failed to complete goal: ${(err as Error).message}`);
      throw err;
    }
  });

goalCommand
  .command('deadline')
  .description('Set or update deadline for a goal')
  .argument('<codename>', 'Goal codename')
  .argument('<date>', 'Deadline date (YYYY-MM-DD)')
  .action(async (codename: string, deadlineDate: string) => {
    try {
      if (!parseDate(deadlineDate)) {
        error(`Invalid date format: ${deadlineDate}. Use YYYY-MM-DD format.`);
        return;
      }

      const storagePath = await getStoragePath();
      const date = getCurrentDate();
      const filePath = join(storagePath, 'goals', `${date}.md`);

      const updated = await updateGoalDeadline(filePath, codename, deadlineDate);

      if (updated) {
        success(`Deadline set for '${codename}': ${deadlineDate}`);
      } else {
        error(`Goal '${codename}' not found`);
      }
    } catch (err) {
      error(`Failed to set deadline: ${(err as Error).message}`);
      throw err;
    }
  });

/**
 * Interactive goal list interface
 */
async function interactiveGoalList(
  entries: GoalEntry[],
  filePath: string,
  date: string,
  storagePath: string
): Promise<void> {
  console.log(chalk.bold(`\nGoals for ${date}:\n`));

  const choices = entries.map((entry, index) => {
    const codenameDisplay = entry.codename
      ? chalk.cyan(entry.codename)
      : chalk.gray('[no-codename]');

    const deadlineDisplay = entry.deadline
      ? isOverdue(entry.deadline)
        ? chalk.red(` [Due: ${entry.deadline}]`)
        : chalk.yellow(` [Due: ${entry.deadline}]`)
      : '';

    const truncatedText = entry.text.length > 60
      ? entry.text.substring(0, 60) + '...'
      : entry.text;

    // Build description for display (shown below the choice)
    let displayDescription = entry.text;
    if (entry.description) {
      const truncatedDescription = entry.description.length > 40
        ? entry.description.substring(0, 40) + '...'
        : entry.description;
      displayDescription = `${entry.text}\n${chalk.gray('Description: ' + truncatedDescription)}`;
    }

    return {
      name: `${entry.timestamp} | ${codenameDisplay} | ${truncatedText}${deadlineDisplay}`,
      value: index,
      description: displayDescription,
    };
  });

  // Add "Exit" option
  choices.push({
    name: chalk.gray('← Back'),
    value: -1,
    description: 'Exit goal list',
  });

  const selectedIndex = await select({
    message: 'Select a goal to manage:',
    choices,
  });

  if (selectedIndex === -1) {
    return;
  }

  const selectedGoal = entries[selectedIndex];

  // If goal has no codename, offer migration or show message
  if (!selectedGoal.codename) {
    info('This is a legacy goal without a codename. Management actions require codenames.');
    info('Please use the plain text mode (--plain) to view legacy goals.');
    return;
  }

  // Show action menu
  const action = await select({
    message: `What would you like to do with '${selectedGoal.codename}'?`,
    choices: [
      { name: '✓ Complete', value: 'complete' },
      { name: '✗ Delete', value: 'delete' },
      { name: '📅 Set Deadline', value: 'deadline' },
      { name: '📝 Edit Description', value: 'description' },
      { name: '← Cancel', value: 'cancel' },
    ],
  });

  if (action === 'cancel') {
    return;
  }

  if (action === 'complete') {
    const destPath = join(storagePath, 'goals', 'finished', `${date}.md`);
    const completed = await completeGoalEntry(filePath, destPath, selectedGoal.codename);
    if (completed) {
      success(`Goal '${selectedGoal.codename}' completed! 🎉`);
    } else {
      error('Failed to complete goal');
    }
  } else if (action === 'delete') {
    const removed = await removeGoalEntry(filePath, selectedGoal.codename);
    if (removed) {
      success(`Goal '${selectedGoal.codename}' deleted`);
    } else {
      error('Failed to delete goal');
    }
  } else if (action === 'deadline') {
    const deadlineDate = await input({
      message: 'Enter deadline date (YYYY-MM-DD):',
      validate: (value) => {
        if (!value) return 'Deadline is required';
        if (!parseDate(value)) return 'Invalid date format. Use YYYY-MM-DD';
        return true;
      },
    });

    const updated = await updateGoalDeadline(filePath, selectedGoal.codename, deadlineDate);
    if (updated) {
      success(`Deadline set for '${selectedGoal.codename}': ${deadlineDate}`);
    } else {
      error('Failed to set deadline');
    }
  } else if (action === 'description') {
    const currentDescription = selectedGoal.description || '';
    const descriptionText = await input({
      message: 'Enter description (leave empty to remove):',
      default: currentDescription,
    });

    const updated = await updateGoalDescription(filePath, selectedGoal.codename, descriptionText);
    if (updated) {
      if (descriptionText.trim()) {
        success(`Description updated for '${selectedGoal.codename}'`);
      } else {
        success(`Description removed from '${selectedGoal.codename}'`);
      }
    } else {
      error('Failed to update description');
    }
  }
}

/**
 * Check if a deadline is overdue
 */
function isOverdue(deadline: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return deadline < today;
}

export { goalCommand };
