import { Command } from 'commander';
import { join } from 'path';
import { select, input } from '@inquirer/prompts';
import {
  getStoragePath,
  appendToMarkdown,
  getExistingCodenames,
  removeGoalEntry,
  completeGoalEntry,
  updateGoalDeadline,
  updateGoalDescription,
  getActiveGoals,
  serializeGoalEntryYaml,
  type GoalEntry,
  type ActiveGoal,
} from '../utils/storage.js';
import { getCurrentDate, getCurrentTime, parseDate, formatDate } from '../utils/date.js';
import { parseNaturalDate } from '../utils/date-parser.js';
import { success, error, info, withSpinner } from '../utils/cli.js';
import { generateGoalCodename } from '../llm/claude.js';
import { parseTimeframe } from '../utils/timeframe-parser.js';
import chalk from 'chalk';
import { playCompletionAnimation } from '../utils/animations.js';
import { promptForFirstTodo } from '../utils/onboarding.js';
import { createTodoInteractive } from '../utils/todo-helpers.js';
import { showHint } from '../utils/hints.js';

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

      // Generate codename with loading indicator
      let codename: string;
      try {
        codename = await withSpinner(
          generateGoalCodename(text, existingCodenames),
          'Generating unique codename...'
        );
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

      // Build goal entry using YAML format
      const goalEntry: GoalEntry = {
        timestamp: time,
        codename,
        text,
        description: options.description || null,
        deadline: deadlineDate || null,
        rawEntry: '', // Will be set by serializer
      };

      const entry = serializeGoalEntryYaml(goalEntry);
      await appendToMarkdown(filePath, entry);

      success(`Goal added with codename: ${chalk.cyan(codename)}`);
      if (options.description) {
        info('Description added');
      }
      if (deadlineDate) {
        info(`Deadline: ${deadlineDate}`);
      }

      // Show contextual hint
      await showHint({ command: 'goal.add', metadata: { codename } });

      // Post-goal onboarding: prompt for linked todo
      info('');
      try {
        const shouldCreateTodo = await promptForFirstTodo(codename);

        if (shouldCreateTodo) {
          // Create todo with goal pre-linked
          await createTodoInteractive({ goal: codename });
        }
      } catch (_err) {
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
  .description('List all active goals (interactive mode by default)')
  .option('-d, --deadline <date>', 'Filter goals by deadline (supports natural language like "next week")')
  .option('-p, --plain', 'Plain text output (non-interactive)')
  .action(async (options) => {
    try {
      const storagePath = await getStoragePath();

      // Get all active goals
      let activeGoals = await getActiveGoals(storagePath);

      // Filter by deadline if specified
      if (options.deadline) {
        let targetDate: string;

        // Try parsing as natural language first
        const naturalDate = parseNaturalDate(options.deadline);
        if (naturalDate) {
          // Use the 'to' date from the range (end of period)
          targetDate = formatDate(naturalDate.to);
        } else if (parseDate(options.deadline)) {
          // Fall back to ISO date parsing
          targetDate = options.deadline;
        } else {
          error(`Invalid deadline format: ${options.deadline}`);
          info('Use YYYY-MM-DD format or natural language like "next week", "tomorrow", etc.');
          return;
        }

        // Filter goals with deadlines on or before target date
        activeGoals = activeGoals.filter(goal =>
          goal.deadline !== null && goal.deadline <= targetDate
        );

        if (activeGoals.length === 0) {
          info(`No goals found with deadline before ${targetDate}`);
          info('View all goals with: aissist goal list');
          return;
        }
      }

      if (activeGoals.length === 0) {
        info('No active goals found');
        info('Add a goal with: aissist goal add <text>');
        return;
      }

      // Sort by deadline (earliest first, no deadline goes last)
      activeGoals.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      });

      // Plain text mode - group by date
      if (options.plain) {
        console.log('\nAll Active Goals:\n');

        // Group by date
        const goalsByDate = new Map<string, ActiveGoal[]>();
        for (const goal of activeGoals) {
          if (!goalsByDate.has(goal.date)) {
            goalsByDate.set(goal.date, []);
          }
          goalsByDate.get(goal.date)!.push(goal);
        }

        // Sort dates (newest first)
        const sortedDates = Array.from(goalsByDate.keys()).sort().reverse();

        for (const date of sortedDates) {
          console.log(`## ${date}\n`);
          for (const goal of goalsByDate.get(date)!) {
            console.log(goal.rawEntry);
            console.log('');
          }
        }
        return;
      }

      // Interactive mode for all goals - pass ActiveGoal[] to keep date info
      await interactiveGoalListWithDates(activeGoals, storagePath);
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

      // Find the goal across all files
      const allGoals = await getActiveGoals(storagePath);
      const goalToComplete = allGoals.find(g => g.codename === codename);

      if (!goalToComplete) {
        error(`Goal '${codename}' not found`);
        return;
      }

      const sourcePath = join(storagePath, 'goals', `${goalToComplete.date}.md`);
      const destPath = join(storagePath, 'goals', 'finished', `${goalToComplete.date}.md`);

      const completed = await completeGoalEntry(sourcePath, destPath, codename);

      if (completed) {
        // Play completion animation for goal achievement
        await playCompletionAnimation(`Goal '${codename}' completed!`);
        // Show contextual hint
        await showHint({ command: 'goal.complete', metadata: { codename } });
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

      // Find the goal across all files
      const allGoals = await getActiveGoals(storagePath);
      const goalToUpdate = allGoals.find(g => g.codename === codename);

      if (!goalToUpdate) {
        error(`Goal '${codename}' not found`);
        return;
      }

      const filePath = join(storagePath, 'goals', `${goalToUpdate.date}.md`);
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
 * Interactive goal list interface for ActiveGoals (with date field)
 */
async function interactiveGoalListWithDates(
  activeGoals: ActiveGoal[],
  storagePath: string
): Promise<void> {
  console.log(chalk.bold(`\nGoals for all dates:\n`));

  const choices = activeGoals.map((goal, index) => {
    const codenameDisplay = goal.codename
      ? chalk.cyan(goal.codename)
      : chalk.gray('[no-codename]');

    const deadlineDisplay = goal.deadline
      ? isOverdue(goal.deadline)
        ? chalk.red(` [Due: ${goal.deadline}]`)
        : chalk.yellow(` [Due: ${goal.deadline}]`)
      : '';

    const truncatedText = goal.text.length > 60
      ? goal.text.substring(0, 60) + '...'
      : goal.text;

    // Build description for display
    let displayDescription = goal.text;
    if (goal.description) {
      const truncatedDescription = goal.description.length > 40
        ? goal.description.substring(0, 40) + '...'
        : goal.description;
      displayDescription = `${goal.text}\n${chalk.gray('Description: ' + truncatedDescription)}`;
    }

    return {
      name: `${goal.timestamp} | ${codenameDisplay} | ${truncatedText}${deadlineDisplay}`,
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

  const selectedGoal = activeGoals[selectedIndex];

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

  // Use the date from ActiveGoal
  const goalFilePath = join(storagePath, 'goals', `${selectedGoal.date}.md`);
  const destPath = join(storagePath, 'goals', 'finished', `${selectedGoal.date}.md`);

  if (action === 'complete') {
    const completed = await completeGoalEntry(goalFilePath, destPath, selectedGoal.codename);
    if (completed) {
      await playCompletionAnimation(`Goal '${selectedGoal.codename}' completed!`);
      await showHint({ command: 'goal.complete', metadata: { codename: selectedGoal.codename } });
    } else {
      error('Failed to complete goal');
    }
  } else if (action === 'delete') {
    const removed = await removeGoalEntry(goalFilePath, selectedGoal.codename);
    if (removed) {
      success(`Goal '${selectedGoal.codename}' deleted`);
    } else {
      error('Failed to delete goal');
    }
  } else if (action === 'deadline') {
    const deadlineInput = await input({
      message: 'Enter deadline (YYYY-MM-DD):',
      default: selectedGoal.deadline || '',
      validate: (value: string) => {
        if (!value) return true;
        return parseDate(value) ? true : 'Invalid date format. Use YYYY-MM-DD';
      },
    });

    if (deadlineInput) {
      const updated = await updateGoalDeadline(goalFilePath, selectedGoal.codename, deadlineInput);
      if (updated) {
        success(`Deadline updated for '${selectedGoal.codename}'`);
      } else {
        error('Failed to update deadline');
      }
    }
  } else if (action === 'description') {
    const descriptionInput = await input({
      message: 'Enter description:',
      default: selectedGoal.description || '',
    });

    if (descriptionInput) {
      const updated = await updateGoalDescription(goalFilePath, selectedGoal.codename, descriptionInput);
      if (updated) {
        success(`Description updated for '${selectedGoal.codename}'`);
      } else {
        error('Failed to update description');
      }
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
