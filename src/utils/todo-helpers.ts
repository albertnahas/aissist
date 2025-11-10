import { join } from 'path';
import { input } from '@inquirer/prompts';
import {
  getStoragePath,
  appendToMarkdown,
  serializeTodoEntryYaml,
  type TodoEntry,
} from './storage.js';
import { getCurrentDate, getCurrentTime, parseDate } from './date.js';
import { success, error } from './cli.js';

export interface TodoCreationOptions {
  text?: string;
  date?: string;
  goal?: string;
  priority?: number;
  skipPriorityPrompt?: boolean;
}

export interface TodoCreationResult {
  success: boolean;
  error?: string;
}

/**
 * Create a todo interactively, prompting for text and priority if not provided
 *
 * @param options - Todo creation options
 * @returns Todo creation result with success status
 */
export async function createTodoInteractive(options: TodoCreationOptions = {}): Promise<TodoCreationResult> {
  try {
    const storagePath = await getStoragePath();

    // Validate date if provided
    const date = options.date || getCurrentDate();
    if (options.date && !parseDate(options.date)) {
      error(`Invalid date format: ${options.date}. Use YYYY-MM-DD format.`);
      return { success: false, error: 'invalid_date' };
    }

    // Prompt for todo text if not provided
    let todoText = options.text;
    if (!todoText) {
      try {
        todoText = await input({
          message: 'Enter your todo:',
          validate: (value) => {
            if (!value.trim()) return 'Todo text is required';
            return true;
          },
        });
      } catch (_err) {
        // User cancelled (Ctrl+C)
        return { success: false, error: 'cancelled' };
      }
    }

    const time = getCurrentTime();
    const filePath = join(storagePath, 'todos', `${date}.md`);

    // Parse and validate priority
    let priority = options.priority ?? 0;
    if (!options.skipPriorityPrompt && options.priority === undefined) {
      try {
        const priorityInput = await input({
          message: 'Enter priority (default: medium):',
          default: 'medium',
        });

        // Map text priority to numbers
        const priorityMap: Record<string, number> = {
          'low': 1,
          'medium': 3,
          'high': 5,
          'urgent': 8,
        };

        const trimmed = priorityInput.trim().toLowerCase();
        if (trimmed in priorityMap) {
          priority = priorityMap[trimmed];
        } else {
          const parsed = parseInt(trimmed, 10);
          if (!isNaN(parsed)) {
            priority = parsed;
          }
        }
      } catch (_err) {
        // User cancelled (Ctrl+C) during priority prompt
        return { success: false, error: 'cancelled' };
      }
    }

    if (isNaN(priority)) {
      error('Priority must be a number');
      return { success: false, error: 'invalid_priority' };
    }

    // Handle goal linking
    let goalCodename: string | undefined;
    if (options.goal) {
      // Goal is pre-specified (from onboarding flow)
      goalCodename = options.goal;
    } else {
      // No goal specified - skip goal linking for now
      // (User can link later via todo manage or --goal flag)
    }

    // Build todo entry using YAML format
    const todoEntry: TodoEntry = {
      timestamp: time,
      text: todoText,
      completed: false,
      priority,
      goal: goalCodename || null,
      rawEntry: '', // Will be set by serializer
    };

    const entry = serializeTodoEntryYaml(todoEntry);
    await appendToMarkdown(filePath, entry);

    if (priority > 0 && goalCodename) {
      success(`Todo added with priority ${priority} and linked to goal: ${goalCodename}`);
    } else if (priority > 0) {
      success(`Todo added with priority ${priority}: "${todoText}"`);
    } else if (goalCodename) {
      success(`Todo added and linked to goal: ${goalCodename}`);
    } else {
      success(`Todo added: "${todoText}"`);
    }

    return { success: true };
  } catch (err) {
    error(`Failed to add todo: ${(err as Error).message}`);
    return { success: false, error: (err as Error).message };
  }
}
