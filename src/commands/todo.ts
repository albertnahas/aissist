import { Command } from 'commander';
import { join } from 'path';
import { input, checkbox, select } from '@inquirer/prompts';
import chalk from 'chalk';
import {
  getStoragePath,
  appendToMarkdown,
  readMarkdown,
  parseTodoEntries,
  updateTodoStatus,
  removeTodoEntry,
  updateTodoText,
  updateTodoPriority,
  updateTodoGoal,
  sortTodosByPriority,
  getAllIncompleteTodos,
  type TodoEntry,
} from '../utils/storage.js';
import { getCurrentDate, getCurrentTime, parseDate, formatDate } from '../utils/date.js';
import { parseNaturalDate } from '../utils/date-parser.js';
import { success, error, info } from '../utils/cli.js';
import { linkToGoal } from '../utils/goal-matcher.js';
import { playCompletionAnimation } from '../utils/animations.js';
import { showHint } from '../utils/hints.js';

const todoCommand = new Command('todo');

/**
 * Add a new todo
 */
todoCommand
  .command('add')
  .description('Add a new todo')
  .argument('<text>', 'Todo text')
  .option('-d, --date <date>', 'Date for the todo (YYYY-MM-DD)')
  .option('-g, --goal [keyword]', 'Link this todo to a goal (optional keyword for matching)')
  .option('-p, --priority <number>', 'Set priority (higher = more urgent)', '0')
  .action(async (text: string, options: { date?: string; goal?: string | boolean; priority?: string }) => {
    try {
      const storagePath = await getStoragePath();

      // Validate date if provided
      const date = options.date || getCurrentDate();
      if (options.date && !parseDate(options.date)) {
        error(`Invalid date format: ${options.date}. Use YYYY-MM-DD format.`);
        return;
      }

      const time = getCurrentTime();
      const filePath = join(storagePath, 'todos', `${date}.md`);

      // Parse and validate priority
      const priority = parseInt(options.priority || '0', 10);
      if (isNaN(priority)) {
        error('Priority must be a number');
        return;
      }

      // Handle goal linking if --goal flag is present
      const goalLinkResult = await linkToGoal({
        goalKeyword: options.goal,
        storagePath,
      });

      // Build todo entry with priority and goal metadata
      let metadata = '';
      if (priority > 0) {
        metadata += ` (Priority: ${priority})`;
      }
      if (goalLinkResult.codename) {
        metadata += ` (Goal: ${goalLinkResult.codename})`;
      }
      const entry = `## ${time}\n\n- [ ] ${text}${metadata}`;

      await appendToMarkdown(filePath, entry);

      if (priority > 0 && goalLinkResult.codename) {
        success(`Todo added with priority ${priority} and linked to goal: ${goalLinkResult.codename}`);
      } else if (priority > 0) {
        success(`Todo added with priority ${priority}: "${text}"`);
      } else if (goalLinkResult.codename) {
        success(`Todo added and linked to goal: ${goalLinkResult.codename}`);
      } else {
        if (options.goal && goalLinkResult.message !== 'No goal linking requested') {
          info(goalLinkResult.message);
        }
        success(`Todo added: "${text}"`);
      }

      // Show contextual hint
      await showHint({ command: 'todo.add', metadata: { text, priority } });
    } catch (err) {
      error(`Failed to add todo: ${(err as Error).message}`);
      throw err;
    }
  });

/**
 * List todos
 */
todoCommand
  .command('list')
  .description('List all incomplete todos (use --date to filter by specific date)')
  .option('-d, --date <date>', 'Show todos for specific date (YYYY-MM-DD or natural language like "today", "yesterday")')
  .option('-p, --plain', 'Plain text output (non-interactive)')
  .option('-g, --goal <codename>', 'Filter todos by goal codename')
  .action(async (options: { date?: string; plain?: boolean; goal?: string }) => {
    try {
      const storagePath = await getStoragePath();
      let entries: TodoEntry[];
      let dateLabel: string;

      // If --date flag is provided, filter to specific date or date range
      if (options.date) {
        // Try parsing as natural language first
        const naturalDate = parseNaturalDate(options.date);
        let targetDate: string;

        if (naturalDate) {
          // Use the 'from' date for single dates, or handle ranges
          targetDate = formatDate(naturalDate.from);
          dateLabel = targetDate;
        } else if (parseDate(options.date)) {
          // Fall back to ISO date parsing
          targetDate = options.date;
          dateLabel = targetDate;
        } else {
          error(`Invalid date format: ${options.date}`);
          info('Use YYYY-MM-DD format or natural language like "today", "yesterday", "this week"');
          return;
        }

        const filePath = join(storagePath, 'todos', `${targetDate}.md`);
        const content = await readMarkdown(filePath);

        if (!content) {
          info(`No todos found for ${dateLabel}`);
          return;
        }

        entries = parseTodoEntries(content);
        entries.forEach(e => e.date = targetDate); // Add date to entries
      } else {
        // Default: show all incomplete todos across all dates
        entries = await getAllIncompleteTodos(storagePath);
        dateLabel = 'all dates';
      }

      // Filter by goal if specified
      if (options.goal) {
        entries = entries.filter(e => e.goal === options.goal);
        if (entries.length === 0) {
          info(`No todos found for goal: ${options.goal}`);
          return;
        }
      }

      // Filter to incomplete only (unless plain mode with date filter)
      const incompleteTodos = entries.filter(e => !e.completed);

      if (incompleteTodos.length === 0) {
        if (options.date) {
          info(`No incomplete todos found for ${dateLabel}`);
        } else {
          success('All todos completed!');
        }
        return;
      }

      // Plain text mode
      if (options.plain) {
        console.log(`\nTodos${dateLabel !== 'all dates' ? ` for ${dateLabel}` : ''}:\n`);
        incompleteTodos.forEach((entry, index) => {
          const checkbox = entry.completed ? '[x]' : '[ ]';
          const dateDisplay = entry.date ? chalk.gray(`[${entry.date}] `) : '';
          const priorityDisplay = entry.priority > 0 ? chalk.gray(` (Priority: ${entry.priority})`) : '';
          const goalDisplay = entry.goal ? chalk.gray(` (Goal: ${entry.goal})`) : '';
          console.log(`${index + 1}. ${dateDisplay}${checkbox} ${entry.text}${priorityDisplay}${goalDisplay}`);
        });
        return;
      }

      // Interactive mode
      await interactiveTodoList(incompleteTodos, '', dateLabel, storagePath);
    } catch (err) {
      error(`Failed to list todos: ${(err as Error).message}`);
      throw err;
    }
  });

/**
 * Mark a todo as done
 */
todoCommand
  .command('done')
  .description('Mark a todo as completed and log to history')
  .argument('<indexOrText>', 'Todo index (1-based) or text to match')
  .action(async (indexOrText: string) => {
    try {
      const storagePath = await getStoragePath();
      const date = getCurrentDate();
      const filePath = join(storagePath, 'todos', `${date}.md`);

      // Parse as number if possible, otherwise treat as text
      const identifier = /^\d+$/.test(indexOrText)
        ? parseInt(indexOrText, 10) - 1 // Convert to 0-based index
        : indexOrText;

      const updatedTodo = await updateTodoStatus(filePath, identifier, true);

      if (!updatedTodo) {
        error('Todo not found');
        return;
      }

      // Log to history
      await logTodoCompletion(updatedTodo, storagePath);

      // Play completion animation
      await playCompletionAnimation(`Todo completed: "${updatedTodo.text}"`);
      if (updatedTodo.goal) {
        info(`Linked to goal: ${updatedTodo.goal}`);
      }

      // Show contextual hint
      await showHint({ command: 'todo.done', metadata: { text: updatedTodo.text } });
    } catch (err) {
      error(`Failed to complete todo: ${(err as Error).message}`);
      throw err;
    }
  });

/**
 * Remove a todo
 */
todoCommand
  .command('remove')
  .description('Remove a todo without logging to history')
  .argument('<indexOrText>', 'Todo index (1-based) or text to match')
  .action(async (indexOrText: string) => {
    try {
      const storagePath = await getStoragePath();
      const date = getCurrentDate();
      const filePath = join(storagePath, 'todos', `${date}.md`);

      const identifier = /^\d+$/.test(indexOrText)
        ? parseInt(indexOrText, 10) - 1
        : indexOrText;

      const removed = await removeTodoEntry(filePath, identifier);

      if (!removed) {
        error('Todo not found');
        return;
      }

      success(`Todo removed: "${removed.text}"`);
    } catch (err) {
      error(`Failed to remove todo: ${(err as Error).message}`);
      throw err;
    }
  });

/**
 * Edit a todo
 */
todoCommand
  .command('edit')
  .description('Edit a todo\'s text')
  .argument('<indexOrText>', 'Todo index (1-based) or text to match')
  .action(async (indexOrText: string) => {
    try {
      const storagePath = await getStoragePath();
      const date = getCurrentDate();
      const filePath = join(storagePath, 'todos', `${date}.md`);

      const content = await readMarkdown(filePath);
      if (!content) {
        error('No todos found');
        return;
      }

      const entries = parseTodoEntries(content);
      const identifier = /^\d+$/.test(indexOrText)
        ? parseInt(indexOrText, 10) - 1
        : indexOrText;

      let todoIndex: number;
      if (typeof identifier === 'number') {
        todoIndex = identifier;
      } else {
        todoIndex = entries.findIndex(e =>
          e.text.toLowerCase().includes(identifier.toLowerCase())
        );
      }

      if (todoIndex === -1 || todoIndex >= entries.length) {
        error('Todo not found');
        return;
      }

      const currentTodo = entries[todoIndex];

      const newText = await input({
        message: 'Enter new todo text:',
        default: currentTodo.text,
      });

      if (newText.trim() === currentTodo.text) {
        info('No changes made');
        return;
      }

      const updated = await updateTodoText(filePath, todoIndex, newText.trim());

      if (updated) {
        success(`Todo updated: "${updated.text}"`);
      } else {
        error('Failed to update todo');
      }
    } catch (err) {
      if ((err as Error).name === 'ExitPromptError') {
        info('Edit cancelled');
        return;
      }
      error(`Failed to edit todo: ${(err as Error).message}`);
      throw err;
    }
  });

/**
 * Manage todos interactively
 */
todoCommand
  .command('manage')
  .description('Manage todos interactively with full CRUD operations')
  .option('-d, --date <date>', 'Show todos for specific date (YYYY-MM-DD)')
  .option('-g, --goal <codename>', 'Filter todos by goal codename')
  .action(async (options: { date?: string; goal?: string }) => {
    try {
      const storagePath = await getStoragePath();
      const date = options.date || getCurrentDate();

      if (options.date && !parseDate(options.date)) {
        error(`Invalid date format: ${options.date}. Use YYYY-MM-DD format.`);
        return;
      }

      const filePath = join(storagePath, 'todos', `${date}.md`);

      await interactiveTodoManagement(filePath, date, storagePath, options.goal);
    } catch (err) {
      if ((err as Error).name === 'ExitPromptError') {
        info('Exited todo management');
        return;
      }
      error(`Failed to manage todos: ${(err as Error).message}`);
      throw err;
    }
  });

/**
 * Interactive todo list with checkbox selection
 */
async function interactiveTodoList(
  incompleteTodos: TodoEntry[],
  filePath: string,
  date: string,
  storagePath: string
): Promise<void> {
  console.log(chalk.bold(`\nTodos for ${date}:\n`));

  const choices = incompleteTodos.map((entry, index) => {
    const dateDisplay = entry.date && date === 'all dates'
      ? chalk.gray(`[${entry.date}] `)
      : '';
    const priorityDisplay = entry.priority > 0
      ? chalk.yellow(`[P:${entry.priority}] `)
      : '';
    const goalDisplay = entry.goal ? chalk.gray(` (Goal: ${entry.goal})`) : '';
    return {
      name: `${dateDisplay}${priorityDisplay}${entry.text}${goalDisplay}`,
      value: index,
      checked: false,
    };
  });

  try {
    const selectedIndices = await checkbox({
      message: 'Select todos to mark as complete (Space to select, Enter to confirm):',
      choices,
    });

    if (selectedIndices.length === 0) {
      info('No todos selected');
      return;
    }

    // Mark selected todos as complete and log to history
    for (const index of selectedIndices) {
      const todo = incompleteTodos[index];
      // Determine the correct file path for this todo
      const todoFilePath = todo.date
        ? join(storagePath, 'todos', `${todo.date}.md`)
        : filePath;
      await updateTodoStatus(todoFilePath, todo.text, true);
      await logTodoCompletion(todo, storagePath);
    }

    // Play completion animation with batch count
    await playCompletionAnimation(
      `${selectedIndices.length} todo(s) completed and logged to history`,
      { count: selectedIndices.length }
    );
  } catch (err) {
    if ((err as Error).name === 'ExitPromptError') {
      info('Selection cancelled');
      return;
    }
    throw err;
  }
}

/**
 * Log completed todo to history
 */
async function logTodoCompletion(todo: TodoEntry, storagePath: string): Promise<void> {
  const date = getCurrentDate();
  const time = getCurrentTime();
  const historyPath = join(storagePath, 'history', `${date}.md`);

  let entry = `## ${time}\n\n${todo.text}\n\nCompleted from TODO`;

  if (todo.goal) {
    entry += `\n\nGoal: ${todo.goal}`;
  }

  await appendToMarkdown(historyPath, entry);
}

/**
 * Interactive todo management interface
 */
async function interactiveTodoManagement(
  filePath: string,
  date: string,
  storagePath: string,
  goalFilter?: string
): Promise<void> {
  while (true) {
    const content = await readMarkdown(filePath);

    if (!content) {
      info(`No todos to manage for ${date}`);
      return;
    }

    let entries = parseTodoEntries(content);

    // Filter by goal if specified
    if (goalFilter) {
      entries = entries.filter(e => e.goal === goalFilter);
      if (entries.length === 0) {
        info(`No todos found for goal: ${goalFilter}`);
        return;
      }
    }

    // Filter to incomplete todos only
    const incompleteTodos = entries.filter(e => !e.completed);

    if (incompleteTodos.length === 0) {
      success('All todos completed!');
      return;
    }

    // Sort by priority
    const sortedTodos = sortTodosByPriority(incompleteTodos);

    console.log(chalk.bold(`\nTodos for ${date}:\n`));

    // Build choices for selection
    const choices = sortedTodos.map((entry, index) => {
      const priorityDisplay = entry.priority >= 5
        ? chalk.red(`[P:${entry.priority}]`)
        : entry.priority > 0
        ? chalk.yellow(`[P:${entry.priority}]`)
        : chalk.gray('[P:0]');

      const goalDisplay = entry.goal ? chalk.gray(` (Goal: ${entry.goal})`) : '';
      const truncatedText = entry.text.length > 60
        ? entry.text.substring(0, 60) + '...'
        : entry.text;

      return {
        name: `${entry.timestamp} | ${priorityDisplay} | ${truncatedText}${goalDisplay}`,
        value: index,
        description: entry.text,
      };
    });

    // Add "Back" option
    choices.push({
      name: chalk.gray('← Back'),
      value: -1,
      description: 'Exit todo management',
    });

    const selectedIndex = await select({
      message: 'Select a todo to manage:',
      choices,
    });

    if (selectedIndex === -1) {
      return;
    }

    const selectedTodo = sortedTodos[selectedIndex];

    // Show action menu
    const action = await select({
      message: `What would you like to do with this todo?`,
      choices: [
        { name: '✓ Complete', value: 'complete' },
        { name: '✗ Delete', value: 'delete' },
        { name: '✏️ Edit', value: 'edit' },
        { name: '⚡ Set Priority', value: 'priority' },
        { name: '🎯 Link Goal', value: 'goal' },
        { name: '← Cancel', value: 'cancel' },
      ],
    });

    if (action === 'cancel') {
      continue;
    }

    if (action === 'complete') {
      const updatedTodo = await updateTodoStatus(filePath, selectedTodo.text, true);
      if (updatedTodo) {
        await logTodoCompletion(updatedTodo, storagePath);
        await playCompletionAnimation(`Todo completed: "${updatedTodo.text}"`);
        if (updatedTodo.goal) {
          info(`Linked to goal: ${updatedTodo.goal}`);
        }
      } else {
        error('Failed to complete todo');
      }
    } else if (action === 'delete') {
      const removed = await removeTodoEntry(filePath, selectedTodo.text);
      if (removed) {
        success(`Todo deleted: "${removed.text}"`);
      } else {
        error('Failed to delete todo');
      }
    } else if (action === 'edit') {
      const newText = await input({
        message: 'Enter new todo text:',
        default: selectedTodo.text,
      });

      if (newText.trim() === selectedTodo.text) {
        info('No changes made');
        continue;
      }

      const updated = await updateTodoText(filePath, selectedTodo.text, newText.trim());
      if (updated) {
        success(`Todo updated: "${updated.text}"`);
      } else {
        error('Failed to update todo');
      }
    } else if (action === 'priority') {
      const priorityInput = await input({
        message: 'Enter priority (number, higher = more urgent):',
        default: selectedTodo.priority.toString(),
        validate: (value) => {
          const num = parseInt(value, 10);
          if (isNaN(num)) return 'Priority must be a number';
          return true;
        },
      });

      const newPriority = parseInt(priorityInput, 10);
      const updated = await updateTodoPriority(filePath, selectedTodo.text, newPriority);
      if (updated) {
        success(`Priority set to ${newPriority} for "${updated.text}"`);
      } else {
        error('Failed to set priority');
      }
    } else if (action === 'goal') {
      const goalKeyword = await input({
        message: 'Enter goal keyword for matching (or "remove" to unlink, empty for interactive):',
        default: '',
      });

      if (goalKeyword.toLowerCase() === 'remove' || goalKeyword.toLowerCase() === 'none') {
        const updated = await updateTodoGoal(filePath, selectedTodo.text, null);
        if (updated) {
          success('Goal link removed');
        } else {
          error('Failed to remove goal link');
        }
      } else {
        const goalLinkResult = await linkToGoal({
          goalKeyword: goalKeyword || undefined,
          storagePath,
        });

        if (goalLinkResult.codename) {
          const updated = await updateTodoGoal(filePath, selectedTodo.text, goalLinkResult.codename);
          if (updated) {
            success(`Todo linked to goal: ${goalLinkResult.codename}`);
          } else {
            error('Failed to link goal');
          }
        } else {
          info(goalLinkResult.message);
        }
      }
    }
  }
}

export { todoCommand };
