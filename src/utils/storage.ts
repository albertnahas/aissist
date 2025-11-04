import { mkdir, access, readFile, writeFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { z } from 'zod';

// Config schema
export const ConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  createdAt: z.string(),
  lastModified: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Find .aissist directory by searching up from current directory
 */
export async function findStoragePath(startPath: string = process.cwd()): Promise<string | null> {
  let currentPath = startPath;

  while (true) {
    const aissistPath = join(currentPath, '.aissist');
    try {
      await access(aissistPath);
      return aissistPath;
    } catch {
      // Directory doesn't exist, continue up
    }

    const parentPath = dirname(currentPath);
    if (parentPath === currentPath) {
      // Reached root, not found
      return null;
    }
    currentPath = parentPath;
  }
}

/**
 * Get storage path with global/local fallback
 */
export async function getStoragePath(): Promise<string> {
  const localPath = await findStoragePath();
  if (localPath) {
    return localPath;
  }

  // Fallback to global storage
  return join(homedir(), '.aissist');
}

/**
 * Check if storage path is global
 */
export async function isGlobalStorage(): Promise<boolean> {
  const storagePath = await getStoragePath();
  const globalPath = join(homedir(), '.aissist');
  return storagePath === globalPath;
}

/**
 * Ensure directory exists, create if not
 */
export async function ensureDirectory(path: string): Promise<void> {
  try {
    await mkdir(path, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Initialize storage structure
 */
export async function initializeStorage(basePath: string): Promise<void> {
  await ensureDirectory(basePath);
  await ensureDirectory(join(basePath, 'goals'));
  await ensureDirectory(join(basePath, 'goals', 'finished'));
  await ensureDirectory(join(basePath, 'history'));
  await ensureDirectory(join(basePath, 'context'));
  await ensureDirectory(join(basePath, 'reflections'));
  await ensureDirectory(join(basePath, 'todos'));
  await ensureDirectory(join(basePath, 'slash-commands'));

  // Create default config if it doesn't exist
  const configPath = join(basePath, 'config.json');
  try {
    await access(configPath);
  } catch {
    const now = new Date().toISOString();
    const config: Config = {
      version: '1.0.0',
      createdAt: now,
      lastModified: now,
    };
    await saveConfig(basePath, config);
  }

  // Create Claude Code slash command manifest
  const slashCommandPath = join(basePath, 'slash-commands', 'aissist.json');
  try {
    await access(slashCommandPath);
  } catch {
    const slashCommand = {
      command: "aissist",
      description: "Query your personal assistant memories",
      prompt: "Use the aissist recall command to search the user's personal memories and answer their question"
    };
    await writeFile(slashCommandPath, JSON.stringify(slashCommand, null, 2));
  }
}

/**
 * Load config from storage
 */
export async function loadConfig(basePath: string): Promise<Config> {
  const configPath = join(basePath, 'config.json');
  try {
    const content = await readFile(configPath, 'utf-8');
    const data = JSON.parse(content);
    return ConfigSchema.parse(data);
  } catch (error) {
    throw new Error(`Failed to load config: ${(error as Error).message}`);
  }
}

/**
 * Save config to storage
 */
export async function saveConfig(basePath: string, config: Config): Promise<void> {
  const configPath = join(basePath, 'config.json');
  const updatedConfig = {
    ...config,
    lastModified: new Date().toISOString(),
  };
  await writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
}

/**
 * Append content to a markdown file
 */
export async function appendToMarkdown(
  filePath: string,
  content: string,
  createIfMissing: boolean = true
): Promise<void> {
  if (createIfMissing) {
    await ensureDirectory(dirname(filePath));
  }

  try {
    await access(filePath);
    // File exists, read and append
    const existing = await readFile(filePath, 'utf-8');
    const separator = existing.trim() ? '\n\n' : '';
    await writeFile(filePath, existing + separator + content);
  } catch {
    // File doesn't exist, create
    await writeFile(filePath, content);
  }
}

/**
 * Read markdown file content
 */
export async function readMarkdown(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// Goal entry interface
export interface GoalEntry {
  timestamp: string;
  codename: string | null;
  text: string;
  description: string | null;
  deadline: string | null;
  rawEntry: string;
}

/**
 * Parse a goal entry from markdown format
 * Supports both new format (with codename) and legacy format (without)
 *
 * New format: ## HH:MM - codename\n\nGoal text\n\n> Description\n\nDeadline: YYYY-MM-DD
 * Legacy format: ## HH:MM\n\nGoal text
 */
export function parseGoalEntry(entry: string): GoalEntry | null {
  const trimmed = entry.trim();
  if (!trimmed) return null;

  // Match header: ## HH:MM or ## HH:MM - codename
  const headerMatch = trimmed.match(/^##\s+(\d{2}:\d{2})(?:\s+-\s+([a-z0-9-]+))?/);
  if (!headerMatch) return null;

  const timestamp = headerMatch[1];
  const codename = headerMatch[2] || null;

  // Extract content after header
  const afterHeader = trimmed.substring(headerMatch[0].length).trim();

  // Extract deadline if present (always at the end)
  const deadlineMatch = afterHeader.match(/\n\nDeadline:\s+(\d{4}-\d{2}-\d{2})\s*$/);
  const deadline = deadlineMatch ? deadlineMatch[1] : null;
  const contentWithoutDeadline = deadlineMatch
    ? afterHeader.substring(0, deadlineMatch.index).trim()
    : afterHeader;

  // Extract description (blockquote format: lines starting with >)
  // Description comes after goal text, separated by blank line
  const descriptionMatch = contentWithoutDeadline.match(/\n\n((?:^>.*$\n?)+)/m);
  let text: string;
  let description: string | null = null;

  if (descriptionMatch) {
    // Extract description and remove blockquote markers
    const rawDescription = descriptionMatch[1];
    description = rawDescription
      .split('\n')
      .map(line => line.replace(/^>\s?/, ''))
      .join('\n')
      .trim();

    // Text is everything before the description
    text = contentWithoutDeadline.substring(0, descriptionMatch.index).trim();
  } else {
    text = contentWithoutDeadline;
  }

  return {
    timestamp,
    codename,
    text,
    description,
    deadline,
    rawEntry: trimmed,
  };
}

/**
 * Parse all goal entries from a markdown file content
 */
export function parseGoalEntries(content: string): GoalEntry[] {
  if (!content) return [];

  // Split by ## headers
  const entries = content.split(/(?=^## )/gm).filter(e => e.trim());
  return entries.map(parseGoalEntry).filter((e): e is GoalEntry => e !== null);
}

/**
 * Find a goal by codename in a file
 */
export async function findGoalByCodename(filePath: string, codename: string): Promise<GoalEntry | null> {
  const content = await readMarkdown(filePath);
  if (!content) return null;

  const entries = parseGoalEntries(content);
  return entries.find(e => e.codename === codename) || null;
}

/**
 * Extract existing codenames from a markdown file
 */
export async function getExistingCodenames(filePath: string): Promise<string[]> {
  const content = await readMarkdown(filePath);
  if (!content) return [];

  const entries = parseGoalEntries(content);
  return entries
    .map(e => e.codename)
    .filter((c): c is string => c !== null);
}

/**
 * Remove a goal entry from a file by codename
 */
export async function removeGoalEntry(filePath: string, codename: string): Promise<boolean> {
  const content = await readMarkdown(filePath);
  if (!content) return false;

  const entries = parseGoalEntries(content);
  const filtered = entries.filter(e => e.codename !== codename);

  if (filtered.length === entries.length) {
    return false; // Goal not found
  }

  // Rebuild file content
  const newContent = filtered.map(e => e.rawEntry).join('\n\n');
  await writeFile(filePath, newContent);
  return true;
}

/**
 * Complete a goal entry (move from source to finished file)
 */
export async function completeGoalEntry(
  sourcePath: string,
  destPath: string,
  codename: string
): Promise<boolean> {
  const goal = await findGoalByCodename(sourcePath, codename);
  if (!goal) return false;

  // Add completion date to finished entry
  const completionDate = new Date().toISOString().split('T')[0];
  const finishedEntry = `${goal.rawEntry}\n\nCompleted: ${completionDate}`;

  // Append to finished file
  await appendToMarkdown(destPath, finishedEntry);

  // Remove from source file
  await removeGoalEntry(sourcePath, codename);

  return true;
}

/**
 * Update a goal's deadline
 */
export async function updateGoalDeadline(
  filePath: string,
  codename: string,
  deadline: string
): Promise<boolean> {
  const content = await readMarkdown(filePath);
  if (!content) return false;

  const entries = parseGoalEntries(content);
  const goalIndex = entries.findIndex(e => e.codename === codename);

  if (goalIndex === -1) return false;

  const goal = entries[goalIndex];

  // Rebuild goal entry with new deadline
  let newEntry = `## ${goal.timestamp}`;
  if (goal.codename) {
    newEntry += ` - ${goal.codename}`;
  }
  newEntry += `\n\n${goal.text}`;

  if (goal.description) {
    const descriptionLines = goal.description.split('\n').map(line => `> ${line}`).join('\n');
    newEntry += `\n\n${descriptionLines}`;
  }

  newEntry += `\n\nDeadline: ${deadline}`;

  entries[goalIndex] = {
    ...goal,
    deadline,
    rawEntry: newEntry,
  };

  // Rebuild file content
  const newContent = entries.map(e => e.rawEntry).join('\n\n');
  await writeFile(filePath, newContent);
  return true;
}

/**
 * Update a goal's description
 */
export async function updateGoalDescription(
  filePath: string,
  codename: string,
  description: string
): Promise<boolean> {
  const content = await readMarkdown(filePath);
  if (!content) return false;

  const entries = parseGoalEntries(content);
  const goalIndex = entries.findIndex(e => e.codename === codename);

  if (goalIndex === -1) return false;

  const goal = entries[goalIndex];

  // Rebuild goal entry with new description
  let newEntry = `## ${goal.timestamp}`;
  if (goal.codename) {
    newEntry += ` - ${goal.codename}`;
  }
  newEntry += `\n\n${goal.text}`;

  // Add description if provided (and not empty)
  const trimmedDescription = description.trim();
  if (trimmedDescription) {
    const descriptionLines = trimmedDescription.split('\n').map(line => `> ${line}`).join('\n');
    newEntry += `\n\n${descriptionLines}`;
  }

  // Add deadline if present
  if (goal.deadline) {
    newEntry += `\n\nDeadline: ${goal.deadline}`;
  }

  entries[goalIndex] = {
    ...goal,
    description: trimmedDescription || null,
    rawEntry: newEntry,
  };

  // Rebuild file content
  const newContent = entries.map(e => e.rawEntry).join('\n\n');
  await writeFile(filePath, newContent);
  return true;
}

/**
 * Active goal interface for linking
 */
export interface ActiveGoal {
  codename: string;
  text: string;
  date: string;
}

/**
 * Get all active goals (excluding finished goals) across all dates
 */
export async function getActiveGoals(storagePath: string): Promise<ActiveGoal[]> {
  const goalsDir = join(storagePath, 'goals');
  const activeGoals: ActiveGoal[] = [];

  try {
    const files = await readdir(goalsDir);
    const mdFiles = files.filter(f => f.endsWith('.md')).sort().reverse(); // Most recent first

    for (const file of mdFiles) {
      const filePath = join(goalsDir, file);
      const content = await readMarkdown(filePath);

      if (!content) continue;

      const entries = parseGoalEntries(content);
      const date = file.replace('.md', '');

      // Only include goals with codenames (non-legacy goals)
      for (const entry of entries) {
        if (entry.codename) {
          activeGoals.push({
            codename: entry.codename,
            text: entry.text,
            date,
          });
        }
      }
    }
  } catch (error) {
    // Goals directory doesn't exist or is empty
  }

  return activeGoals;
}

/**
 * Todo entry interface
 */
export interface TodoEntry {
  timestamp: string;
  text: string;
  completed: boolean;
  goal: string | null;
  rawEntry: string;
}

/**
 * Parse a single todo entry from markdown content
 */
function parseTodoEntry(entry: string): TodoEntry | null {
  const trimmed = entry.trim();
  if (!trimmed) return null;

  // Match format: ## HH:MM\n\n- [x] or - [ ] Todo text (Goal: codename)
  const headerMatch = trimmed.match(/^##\s+(\d{2}:\d{2})/);
  if (!headerMatch) return null;

  const timestamp = headerMatch[1];

  // Extract checkbox content after header
  const afterHeader = trimmed.substring(headerMatch[0].length).trim();
  const checkboxMatch = afterHeader.match(/^-\s+\[([ x])\]\s+(.+)$/m);

  if (!checkboxMatch) return null;

  const completed = checkboxMatch[1] === 'x';
  const todoContent = checkboxMatch[2];

  // Extract goal if present: (Goal: codename)
  const goalMatch = todoContent.match(/\(Goal:\s+([a-z0-9-]+)\)\s*$/);
  const goal = goalMatch ? goalMatch[1] : null;
  const text = goalMatch ? todoContent.substring(0, goalMatch.index).trim() : todoContent;

  return {
    timestamp,
    text,
    completed,
    goal,
    rawEntry: trimmed,
  };
}

/**
 * Parse all todo entries from a markdown file content
 */
export function parseTodoEntries(content: string): TodoEntry[] {
  if (!content) return [];

  // Split by ## headers
  const entries = content.split(/(?=^## )/gm).filter(e => e.trim());
  return entries.map(parseTodoEntry).filter((e): e is TodoEntry => e !== null);
}

/**
 * Update todo completion status in a file
 */
export async function updateTodoStatus(
  filePath: string,
  indexOrText: number | string,
  completed: boolean
): Promise<TodoEntry | null> {
  const content = await readMarkdown(filePath);
  if (!content) return null;

  const entries = parseTodoEntries(content);

  let todoIndex: number;
  if (typeof indexOrText === 'number') {
    todoIndex = indexOrText;
  } else {
    // Find by text substring (case insensitive)
    todoIndex = entries.findIndex(e =>
      e.text.toLowerCase().includes(indexOrText.toLowerCase())
    );
  }

  if (todoIndex === -1 || todoIndex >= entries.length) return null;

  const todo = entries[todoIndex];

  // Build updated entry
  const checkbox = completed ? '[x]' : '[ ]';
  const goalSuffix = todo.goal ? ` (Goal: ${todo.goal})` : '';
  const newEntry = `## ${todo.timestamp}\n\n- ${checkbox} ${todo.text}${goalSuffix}`;

  entries[todoIndex] = {
    ...todo,
    completed,
    rawEntry: newEntry,
  };

  // Rebuild file content
  const newContent = entries.map(e => e.rawEntry).join('\n\n');
  await writeFile(filePath, newContent);

  return entries[todoIndex];
}

/**
 * Remove a todo entry from a file by index or text match
 */
export async function removeTodoEntry(
  filePath: string,
  indexOrText: number | string
): Promise<TodoEntry | null> {
  const content = await readMarkdown(filePath);
  if (!content) return null;

  const entries = parseTodoEntries(content);

  let todoIndex: number;
  if (typeof indexOrText === 'number') {
    todoIndex = indexOrText;
  } else {
    todoIndex = entries.findIndex(e =>
      e.text.toLowerCase().includes(indexOrText.toLowerCase())
    );
  }

  if (todoIndex === -1 || todoIndex >= entries.length) return null;

  const removed = entries[todoIndex];
  entries.splice(todoIndex, 1);

  // Rebuild file content
  const newContent = entries.length > 0
    ? entries.map(e => e.rawEntry).join('\n\n')
    : '';
  await writeFile(filePath, newContent);

  return removed;
}

/**
 * Update todo text
 */
export async function updateTodoText(
  filePath: string,
  indexOrText: number | string,
  newText: string
): Promise<TodoEntry | null> {
  const content = await readMarkdown(filePath);
  if (!content) return null;

  const entries = parseTodoEntries(content);

  let todoIndex: number;
  if (typeof indexOrText === 'number') {
    todoIndex = indexOrText;
  } else {
    todoIndex = entries.findIndex(e =>
      e.text.toLowerCase().includes(indexOrText.toLowerCase())
    );
  }

  if (todoIndex === -1 || todoIndex >= entries.length) return null;

  const todo = entries[todoIndex];

  // Build updated entry with new text
  const checkbox = todo.completed ? '[x]' : '[ ]';
  const goalSuffix = todo.goal ? ` (Goal: ${todo.goal})` : '';
  const newEntry = `## ${todo.timestamp}\n\n- ${checkbox} ${newText}${goalSuffix}`;

  entries[todoIndex] = {
    ...todo,
    text: newText,
    rawEntry: newEntry,
  };

  // Rebuild file content
  const newContent = entries.map(e => e.rawEntry).join('\n\n');
  await writeFile(filePath, newContent);

  return entries[todoIndex];
}
