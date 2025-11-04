import { Command } from 'commander';
import { join } from 'path';
import { input, checkbox } from '@inquirer/prompts';
import chalk from 'chalk';
import {
  getStoragePath,
  appendToMarkdown,
  readMarkdown,
  parseTodoEntries,
  updateTodoStatus,
  removeTodoEntry,
  updateTodoText,
  type TodoEntry,
} from '../utils/storage.js';
import { getCurrentDate, getCurrentTime, parseDate } from '../utils/date.js';
import { success, error, info } from '../utils/cli.js';
import { linkToGoal } from '../utils/goal-matcher.js';

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
  .action(async (text: string, options: { date?: string; goal?: string | boolean }) => {
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

      // Handle goal linking if --goal flag is present
      const goalLinkResult = await linkToGoal({
        goalKeyword: options.goal,
        storagePath,
      });

      // Build todo entry
      const goalSuffix = goalLinkResult.codename ? ` (Goal: ${goalLinkResult.codename})` : '';
      const entry = `## ${time}\n\n- [ ] ${text}${goalSuffix}`;

      await appendToMarkdown(filePath, entry);

      if (goalLinkResult.codename) {
        success(`Todo added and linked to goal: ${goalLinkResult.codename}`);
      } else {
        if (options.goal && goalLinkResult.message !== 'No goal linking requested') {
          info(goalLinkResult.message);
        }
        success(`Todo added: "${text}"`);
      }
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
  .description('List todos (interactive mode by default)')
  .option('-d, --date <date>', 'Show todos for specific date (YYYY-MM-DD)')
  .option('-p, --plain', 'Plain text output (non-interactive)')
  .option('-g, --goal <codename>', 'Filter todos by goal codename')
  .action(async (options: { date?: string; plain?: boolean; goal?: string }) => {
    try {
      const storagePath = await getStoragePath();
      const date = options.date || getCurrentDate();

      if (options.date && !parseDate(options.date)) {
        error(`Invalid date format: ${options.date}. Use YYYY-MM-DD format.`);
        return;
      }

      const filePath = join(storagePath, 'todos', `${date}.md`);
      const content = await readMarkdown(filePath);

      if (!content) {
        info(`No todos found for ${date}`);
        return;
      }

      let entries = parseTodoEntries(content);

      // Filter by goal if specified
      if (options.goal) {
        entries = entries.filter(e => e.goal === options.goal);
        if (entries.length === 0) {
          info(`No todos found for goal: ${options.goal}`);
          return;
        }
      }

      if (entries.length === 0) {
        info(`No todos found for ${date}`);
        return;
      }

      // Plain text mode
      if (options.plain) {
        console.log(`\nTodos for ${date}:\n`);
        entries.forEach((entry, index) => {
          const checkbox = entry.completed ? '[x]' : '[ ]';
          const goalDisplay = entry.goal ? chalk.gray(` (Goal: ${entry.goal})`) : '';
          console.log(`${index + 1}. ${checkbox} ${entry.text}${goalDisplay}`);
        });
        return;
      }

      // Interactive mode - show checkbox UI for incomplete todos
      const incompleteTodos = entries.filter(e => !e.completed);

      if (incompleteTodos.length === 0) {
        success('All todos completed!');
        return;
      }

      await interactiveTodoList(incompleteTodos, filePath, date, storagePath);
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

      success(`Todo completed: "${updatedTodo.text}"`);
      if (updatedTodo.goal) {
        info(`Linked to goal: ${updatedTodo.goal}`);
      }
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
    const goalDisplay = entry.goal ? chalk.gray(` (Goal: ${entry.goal})`) : '';
    return {
      name: `${entry.text}${goalDisplay}`,
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
      await updateTodoStatus(filePath, todo.text, true);
      await logTodoCompletion(todo, storagePath);
    }

    success(`${selectedIndices.length} todo(s) completed and logged to history`);
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

export { todoCommand };
