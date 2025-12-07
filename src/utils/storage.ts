import { mkdir, access, readFile, writeFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { z } from 'zod';
import { parseYamlFrontMatter, serializeYamlFrontMatter, detectFormat, normalizeSchemaVersion, splitEntries } from './yaml-helpers.js';
import { needsMigration, writeFileAtomic } from './migration.js';

// Re-export migration utilities for other modules
export { needsMigration, writeFileAtomic };

// Config schema
export const ConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  createdAt: z.string(),
  lastModified: z.string(),
  animations: z
    .object({
      enabled: z.boolean().default(true),
    })
    .default({ enabled: true }),
  hints: z
    .object({
      enabled: z.boolean().default(true),
      strategy: z.enum(['ai', 'static']).default('ai'),
      timeout: z.number().positive().default(2000),
    })
    .default({ enabled: true, strategy: 'ai', timeout: 2000 }),
  updateCheck: z
    .object({
      enabled: z.boolean().default(true),
    })
    .default({ enabled: true }),
  readPaths: z.array(z.string()).optional().default([]),
  backup: z
    .object({
      defaultPath: z.string().optional(),
      autoBackup: z
        .object({
          enabled: z.boolean().default(false),
          intervalHours: z.number().positive().default(24),
        })
        .default({ enabled: false, intervalHours: 24 }),
      retention: z
        .object({
          maxAgeDays: z.number().positive().optional(),
          maxCount: z.number().positive().optional(),
        })
        .default({}),
    })
    .default({
      autoBackup: { enabled: false, intervalHours: 24 },
      retention: {},
    }),
  sync: z
    .object({
      maxDepth: z.number().positive().default(5),
      exclude: z.array(z.string()).default([]),
    })
    .default({ maxDepth: 5, exclude: [] }),
});

export type Config = z.infer<typeof ConfigSchema>;

// ============================================================================
// PROGRESS FILE TYPES AND SCHEMAS
// ============================================================================

/**
 * Progress note attached to a goal
 */
export interface ProgressNote {
  timestamp: string; // ISO 8601 format
  text: string;
}

/**
 * Goal progress entry in progress.json
 */
export interface GoalProgress {
  text: string;
  status: 'active' | 'completed';
  deadline: string | null;
  parent_goal: string | null;
  completed_at: string | null;
  progress_notes: ProgressNote[];
}

/**
 * Child instance progress (aggregated from child directories)
 */
export interface ChildProgress {
  instance_path: string;
  description: string | null;
  last_updated: string;
  goals: Record<string, GoalProgress>;
}

/**
 * Progress file format for parent-child sync
 */
export interface ProgressFile {
  schema_version: string;
  instance_path: string;
  description: string | null;
  last_updated: string;
  goals: Record<string, GoalProgress>;
  children?: Record<string, ChildProgress>; // Aggregated from child directories
}

// Zod schema for validation
export const ProgressNoteSchema = z.object({
  timestamp: z.string(),
  text: z.string(),
});

export const GoalProgressSchema = z.object({
  text: z.string(),
  status: z.enum(['active', 'completed']),
  deadline: z.string().nullable(),
  parent_goal: z.string().nullable(),
  completed_at: z.string().nullable(),
  progress_notes: z.array(ProgressNoteSchema).default([]),
});

export const ChildProgressSchema = z.object({
  instance_path: z.string(),
  description: z.string().nullable(),
  last_updated: z.string(),
  goals: z.record(GoalProgressSchema),
});

export const ProgressFileSchema = z.object({
  schema_version: z.string(),
  instance_path: z.string(),
  description: z.string().nullable(),
  last_updated: z.string(),
  goals: z.record(GoalProgressSchema),
  children: z.record(ChildProgressSchema).optional(),
});

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
 * Discover all .aissist directories in ancestor paths
 * Walks upward from startPath to filesystem root, collecting all .aissist paths
 * Excludes the immediate .aissist at startPath/.aissist (for finding parents only)
 */
export async function discoverHierarchy(startPath: string): Promise<string[]> {
  const discovered: string[] = [];
  let currentPath = dirname(startPath); // Start from parent

  while (true) {
    const aissistPath = join(currentPath, '.aissist');
    try {
      await access(aissistPath);
      discovered.push(aissistPath);
    } catch {
      // Not found, continue
    }

    const parentPath = dirname(currentPath);
    if (parentPath === currentPath) break; // Reached root
    currentPath = parentPath;
  }

  return discovered;
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
 * Get all read paths (local + configured parents)
 * Returns array with local path first, followed by parent paths from config
 */
export async function getReadPaths(storagePath: string): Promise<string[]> {
  try {
    const config = await loadConfig(storagePath);
    const readPaths = config.readPaths || [];
    return [storagePath, ...readPaths];
  } catch {
    // Config doesn't exist or can't be loaded, return just the storage path
    return [storagePath];
  }
}

/**
 * Ensure directory exists, create if not
 */
export async function ensureDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
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
  await ensureDirectory(join(basePath, 'proposals'));
  await ensureDirectory(join(basePath, 'cache'));

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
      animations: {
        enabled: true,
      },
      hints: {
        enabled: true,
        strategy: 'ai',
        timeout: 2000,
      },
      updateCheck: {
        enabled: true,
      },
      readPaths: [],
      backup: {
        autoBackup: {
          enabled: false,
          intervalHours: 24,
        },
        retention: {},
      },
      sync: {
        maxDepth: 5,
        exclude: [],
      },
    };
    await saveConfig(basePath, config);
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
 * Save instance description to DESCRIPTION.md
 * @param basePath - Path to storage directory
 * @param description - Description text (single line)
 */
export async function saveDescription(basePath: string, description: string): Promise<void> {
  const descriptionPath = join(basePath, 'DESCRIPTION.md');
  await writeFile(descriptionPath, description.trim());
}

/**
 * Load instance description from DESCRIPTION.md
 * @param basePath - Path to storage directory
 * @returns Description text or null if not found
 */
export async function loadDescription(basePath: string): Promise<string | null> {
  const descriptionPath = join(basePath, 'DESCRIPTION.md');
  try {
    const content = await readFile(descriptionPath, 'utf-8');
    return content.trim() || null;
  } catch {
    return null;
  }
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
  parent_goal: string | null;
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
  const descriptionMatch = contentWithoutDeadline.match(/\n\n((?:>.*(?:\n|$))+)/m);
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
    parent_goal: null, // Inline format doesn't support parent_goal
    rawEntry: trimmed,
  };
}

/**
 * Parse a goal entry from YAML front matter format
 *
 * YAML format:
 * ---
 * timestamp: "14:30"
 * codename: goal-codename
 * deadline: "2025-11-15"
 * description: Description text
 * ---
 *
 * Goal text
 */
export function parseGoalEntryYaml(entry: string): GoalEntry | null {
  const parsed = parseYamlFrontMatter(entry);
  if (!parsed) return null;

  const [metadata, body] = parsed;

  // Extract and normalize schema version (for future version-specific parsing)
  normalizeSchemaVersion(metadata.schema_version as string | undefined);

  // Extract required fields
  const timestamp = metadata.timestamp as string;
  const codename = (metadata.codename as string) || null;
  const text = body.trim();

  if (!timestamp || !text) return null;

  // Extract optional fields
  const deadline = (metadata.deadline as string) || null;
  const description = (metadata.description as string) || null;
  const parent_goal = (metadata.parent_goal as string) || null;

  return {
    timestamp,
    codename,
    text,
    description,
    deadline,
    parent_goal,
    rawEntry: entry.trim(),
  };
}

/**
 * Serialize a goal entry to YAML front matter format
 */
export function serializeGoalEntryYaml(goal: GoalEntry): string {
  const metadata: Record<string, unknown> = {
    schema_version: '1.0',
    timestamp: goal.timestamp,
  };

  if (goal.codename) {
    metadata.codename = goal.codename;
  }
  if (goal.parent_goal) {
    metadata.parent_goal = goal.parent_goal;
  }
  if (goal.deadline) {
    metadata.deadline = goal.deadline;
  }
  if (goal.description) {
    metadata.description = goal.description;
  }

  return serializeYamlFrontMatter(metadata, goal.text);
}

/**
 * Parse a goal entry with automatic format detection
 * Supports both YAML front matter and inline format
 */
export function parseGoalEntryAuto(entry: string): GoalEntry | null {
  const format = detectFormat(entry);

  if (format === 'yaml') {
    return parseGoalEntryYaml(entry);
  } else {
    return parseGoalEntry(entry);
  }
}

/**
 * Parse all goal entries from a markdown file content
 * Automatically detects and handles both YAML and inline formats
 */
export function parseGoalEntries(content: string): GoalEntry[] {
  if (!content) return [];

  // Detect format and split entries accordingly
  const format = detectFormat(content);

  if (format === 'yaml') {
    // YAML format: entries separated by --- delimiters
    const entries: string[] = [];
    const lines = content.split('\n');
    let currentEntry: string[] = [];
    let inFrontMatter = false;
    let frontMatterCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === '---') {
        if (!inFrontMatter && frontMatterCount % 2 === 0) {
          // Start of a new entry
          if (currentEntry.length > 0) {
            entries.push(currentEntry.join('\n').trim());
            currentEntry = [];
            frontMatterCount = 0;
          }
          inFrontMatter = true;
          frontMatterCount++;
          currentEntry.push(line);
        } else if (inFrontMatter) {
          // End of front matter
          inFrontMatter = false;
          frontMatterCount++;
          currentEntry.push(line);
        }
      } else {
        currentEntry.push(line);
      }
    }

    if (currentEntry.length > 0) {
      entries.push(currentEntry.join('\n').trim());
    }

    return entries.map(parseGoalEntryAuto).filter((e): e is GoalEntry => e !== null);
  } else {
    // Inline format: entries separated by ## headers
    const entries = content.split(/(?=^## )/gm).filter(e => e.trim());
    return entries.map(parseGoalEntryAuto).filter((e): e is GoalEntry => e !== null);
  }
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
  timestamp: string;
  deadline: string | null;
  description: string | null;
  parent_goal: string | null;
  rawEntry: string;
}

/**
 * Get goals from a single storage path
 */
async function getGoalsFromPath(storagePath: string): Promise<ActiveGoal[]> {
  const goalsDir = join(storagePath, 'goals');
  const activeGoals: ActiveGoal[] = [];

  try {
    const files = await readdir(goalsDir);
    const mdFiles = files.filter(f => f.endsWith('.md')).sort().reverse(); // Most recent first

    for (const file of mdFiles) {
      const filePath = join(goalsDir, file);
      let content = await readMarkdown(filePath);

      if (!content) continue;

      // Auto-migrate inline format to YAML if needed
      if (needsMigration(content)) {
        try {
          const inlineEntries = parseGoalEntries(content);
          const yamlEntries = inlineEntries.map(serializeGoalEntryYaml);
          const migratedContent = yamlEntries.join('\n\n');
          await writeFileAtomic(filePath, migratedContent);
          content = migratedContent;
        } catch (error) {
          // If migration fails, continue with original content
          console.warn(`Failed to migrate ${filePath}:`, error);
        }
      }

      const entries = parseGoalEntries(content);
      const date = file.replace('.md', '');

      // Only include goals with codenames (non-legacy goals)
      for (const entry of entries) {
        if (entry.codename) {
          activeGoals.push({
            codename: entry.codename,
            text: entry.text,
            date,
            timestamp: entry.timestamp,
            deadline: entry.deadline,
            description: entry.description,
            parent_goal: entry.parent_goal,
            rawEntry: entry.rawEntry,
          });
        }
      }
    }
  } catch (_error) {
    // Goals directory doesn't exist or is empty
  }

  return activeGoals;
}

/**
 * Get all active goals (excluding finished goals) across all dates
 * Supports hierarchical configuration - reads from local + parent paths
 * Local goals take precedence when codenames conflict
 */
export async function getActiveGoals(storagePath: string): Promise<ActiveGoal[]> {
  const readPaths = await getReadPaths(storagePath);

  // Read goals from all paths in parallel
  const goalArrays = await Promise.all(
    readPaths.map(path => getGoalsFromPath(path))
  );

  // Merge with local precedence (first path = local, takes priority)
  const seenCodenames = new Set<string>();
  const mergedGoals: ActiveGoal[] = [];

  for (const goals of goalArrays) {
    for (const goal of goals) {
      if (!seenCodenames.has(goal.codename)) {
        mergedGoals.push(goal);
        seenCodenames.add(goal.codename);
      }
    }
  }

  return mergedGoals;
}

/**
 * Get a specific goal by codename across all storage paths
 * @param storagePath - Path to storage directory
 * @param codename - Goal codename to search for
 * @returns Goal details or null if not found
 */
export async function getGoalByCodename(storagePath: string, codename: string): Promise<ActiveGoal | null> {
  const activeGoals = await getActiveGoals(storagePath);
  return activeGoals.find(g => g.codename === codename) || null;
}

/**
 * History entry interface for getAllHistory (file-level)
 */
export interface HistoryEntry {
  date: string;
  content: string;
}

/**
 * Individual history entry interface (parsed from file content)
 */
export interface HistoryItemEntry {
  timestamp: string;
  text: string;
  goal: string | null;
  rawEntry: string;
}

/**
 * Parse a history item entry from inline format
 *
 * Inline format:
 * ## HH:MM
 *
 * History text
 *
 * Goal: goal-codename
 */
export function parseHistoryItemEntry(entry: string): HistoryItemEntry | null {
  const trimmed = entry.trim();
  if (!trimmed) return null;

  // Match header: ## HH:MM
  const headerMatch = trimmed.match(/^##\s+(\d{2}:\d{2})/);
  if (!headerMatch) return null;

  const timestamp = headerMatch[1];

  // Extract content after header
  const afterHeader = trimmed.substring(headerMatch[0].length).trim();

  // Extract goal if present (at the end)
  const goalMatch = afterHeader.match(/\n\nGoal:\s+([a-z0-9-]+)\s*$/);
  const goal = goalMatch ? goalMatch[1] : null;
  const text = goalMatch ? afterHeader.substring(0, goalMatch.index).trim() : afterHeader;

  return {
    timestamp,
    text,
    goal,
    rawEntry: trimmed,
  };
}

/**
 * Parse a history item entry from YAML front matter format
 *
 * YAML format:
 * ---
 * timestamp: "16:45"
 * goal: team-alignment
 * ---
 *
 * History text
 */
export function parseHistoryItemEntryYaml(entry: string): HistoryItemEntry | null {
  const parsed = parseYamlFrontMatter(entry);
  if (!parsed) return null;

  const [metadata, body] = parsed;

  // Extract and normalize schema version (for future version-specific parsing)
  normalizeSchemaVersion(metadata.schema_version as string | undefined);

  // Extract required fields
  const timestamp = metadata.timestamp as string;
  const text = body.trim();

  if (!timestamp || !text) return null;

  // Extract optional fields
  const goal = (metadata.goal as string) || null;

  return {
    timestamp,
    text,
    goal,
    rawEntry: entry.trim(),
  };
}

/**
 * Serialize a history item entry to YAML front matter format
 */
export function serializeHistoryItemEntryYaml(history: HistoryItemEntry): string {
  const metadata: Record<string, unknown> = {
    schema_version: '1.0',
    timestamp: history.timestamp,
  };

  if (history.goal) {
    metadata.goal = history.goal;
  }

  return serializeYamlFrontMatter(metadata, history.text);
}

/**
 * Parse a history item entry with automatic format detection
 */
export function parseHistoryItemEntryAuto(entry: string): HistoryItemEntry | null {
  const format = detectFormat(entry);

  if (format === 'yaml') {
    return parseHistoryItemEntryYaml(entry);
  } else {
    return parseHistoryItemEntry(entry);
  }
}

/**
 * Parse all history item entries from a markdown file content
 */
export function parseHistoryItemEntries(content: string): HistoryItemEntry[] {
  if (!content) return [];

  // Use splitEntries to handle both YAML and inline formats
  const entries = splitEntries(content);
  return entries.map(parseHistoryItemEntryAuto).filter((e): e is HistoryItemEntry => e !== null);
}

/**
 * Get all history entries across all dates
 * Returns entries sorted chronologically (newest first)
 * @param storagePath - Path to storage directory
 * @param sinceDate - Optional: Only return entries on or after this date (YYYY-MM-DD format)
 */
export async function getAllHistory(storagePath: string, sinceDate?: string): Promise<HistoryEntry[]> {
  const historyDir = join(storagePath, 'history');
  const allHistory: HistoryEntry[] = [];

  try {
    const files = await readdir(historyDir);
    const mdFiles = files.filter(f => f.endsWith('.md')).sort().reverse(); // Most recent first

    for (const file of mdFiles) {
      const filePath = join(historyDir, file);
      let content = await readMarkdown(filePath);

      if (content) {
        // Auto-migrate inline format to YAML if needed
        if (needsMigration(content)) {
          try {
            const inlineEntries = parseHistoryItemEntries(content);
            const yamlEntries = inlineEntries.map(serializeHistoryItemEntryYaml);
            const migratedContent = yamlEntries.join('\n\n');
            await writeFileAtomic(filePath, migratedContent);
            content = migratedContent;
          } catch (error) {
            // If migration fails, continue with original content
            console.warn(`Failed to migrate ${filePath}:`, error);
          }
        }

        const date = file.replace('.md', '');

        // Filter by sinceDate if provided
        if (!sinceDate || date >= sinceDate) {
          allHistory.push({
            date,
            content,
          });
        }
      }
    }
  } catch (_error) {
    // History directory doesn't exist or is empty
  }

  return allHistory;
}

/**
 * Get all incomplete todos across all dates
 * Returns entries sorted by priority (descending) then by date (ascending)
 * @param storagePath - Path to storage directory
 */
export async function getAllIncompleteTodos(storagePath: string): Promise<TodoEntry[]> {
  const todosDir = join(storagePath, 'todos');
  const allTodos: TodoEntry[] = [];

  try {
    const files = await readdir(todosDir);
    const mdFiles = files
      .filter(f => f.endsWith('.md') && f !== 'finished') // Exclude finished dir
      .sort(); // Sort chronologically (oldest first)

    for (const file of mdFiles) {
      const filePath = join(todosDir, file);
      let content = await readMarkdown(filePath);

      if (content) {
        // Auto-migrate inline format to YAML if needed
        if (needsMigration(content)) {
          try {
            const inlineEntries = parseTodoEntries(content);
            const yamlEntries = inlineEntries.map(serializeTodoEntryYaml);
            const migratedContent = yamlEntries.join('\n\n');
            await writeFileAtomic(filePath, migratedContent);
            content = migratedContent;
          } catch (error) {
            // If migration fails, continue with original content
            console.warn(`Failed to migrate ${filePath}:`, error);
          }
        }

        const date = file.replace('.md', '');
        const entries = parseTodoEntries(content);

        // Add date to each entry and filter to incomplete only
        const incompleteTodos = entries
          .filter(e => !e.completed)
          .map(e => ({ ...e, date }));

        allTodos.push(...incompleteTodos);
      }
    }
  } catch (_error) {
    // Todos directory doesn't exist or is empty
  }

  // Sort by priority (descending) then by date (ascending)
  return sortTodosByPriority(allTodos).sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // Higher priority first
    }
    // If priorities are equal, sort by date (older first)
    return (a.date || '').localeCompare(b.date || '');
  });
}

/**
 * Todo entry interface
 */
export interface TodoEntry {
  timestamp: string;
  text: string;
  completed: boolean;
  goal: string | null;
  priority: number;
  rawEntry: string;
  date?: string; // YYYY-MM-DD format, used when aggregating todos across dates
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
  let todoContent = checkboxMatch[2];

  // Extract priority if present: (Priority: N)
  const priorityMatch = todoContent.match(/\(Priority:\s*(\d+)\)/i);
  const priority = priorityMatch ? parseInt(priorityMatch[1], 10) : 0;
  if (priorityMatch) {
    todoContent = todoContent.replace(priorityMatch[0], '').trim();
  }

  // Extract goal if present: (Goal: codename)
  const goalMatch = todoContent.match(/\(Goal:\s+([a-z0-9-]+)\)\s*$/);
  const goal = goalMatch ? goalMatch[1] : null;
  const text = goalMatch ? todoContent.substring(0, goalMatch.index).trim() : todoContent;

  return {
    timestamp,
    text,
    completed,
    goal,
    priority,
    rawEntry: trimmed,
  };
}

/**
 * Parse a todo entry from YAML front matter format
 *
 * YAML format:
 * ---
 * timestamp: "09:15"
 * completed: false
 * priority: 3
 * goal: code-quality
 * ---
 *
 * - [ ] Todo text
 */
export function parseTodoEntryYaml(entry: string): TodoEntry | null {
  const parsed = parseYamlFrontMatter(entry);
  if (!parsed) return null;

  const [metadata, body] = parsed;

  // Extract and normalize schema version (for future version-specific parsing)
  normalizeSchemaVersion(metadata.schema_version as string | undefined);

  // Extract required fields
  const timestamp = metadata.timestamp as string;
  const completed = (metadata.completed as boolean) || false;

  if (!timestamp) return null;

  // Extract checkbox and text from body
  const checkboxMatch = body.trim().match(/^-\s+\[([ x])\]\s+(.+)$/m);
  if (!checkboxMatch) return null;

  const text = checkboxMatch[2].trim();

  // Extract optional fields from metadata
  const priority = (metadata.priority as number) || 0;
  const goal = (metadata.goal as string) || null;

  return {
    timestamp,
    text,
    completed,
    goal,
    priority,
    rawEntry: entry.trim(),
  };
}

/**
 * Serialize a todo entry to YAML front matter format
 */
export function serializeTodoEntryYaml(todo: TodoEntry): string {
  const metadata: Record<string, unknown> = {
    schema_version: '1.0',
    timestamp: todo.timestamp,
    completed: todo.completed,
  };

  if (todo.priority > 0) {
    metadata.priority = todo.priority;
  }
  if (todo.goal) {
    metadata.goal = todo.goal;
  }

  const checkbox = todo.completed ? '[x]' : '[ ]';
  const body = `- ${checkbox} ${todo.text}`;

  return serializeYamlFrontMatter(metadata, body);
}

/**
 * Parse a todo entry with automatic format detection
 */
export function parseTodoEntryAuto(entry: string): TodoEntry | null {
  const format = detectFormat(entry);

  if (format === 'yaml') {
    return parseTodoEntryYaml(entry);
  } else {
    return parseTodoEntry(entry);
  }
}

/**
 * Parse all todo entries from a markdown file content
 */
export function parseTodoEntries(content: string): TodoEntry[] {
  if (!content) return [];

  const format = detectFormat(content);

  if (format === 'yaml') {
    // YAML format: entries separated by --- delimiters
    const entries: string[] = [];
    const parts = content.split(/^---$/gm);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;

      // If this part starts with YAML keys, it's metadata - combine with next part
      if (i + 1 < parts.length && part.match(/^\w+:/m)) {
        const fullEntry = `---\n${part}\n---\n${parts[i + 1]}`;
        entries.push(fullEntry);
        i++; // Skip the next part since we've already processed it
      }
    }

    return entries.map(parseTodoEntryAuto).filter((e): e is TodoEntry => e !== null);
  } else {
    // Inline format: entries separated by ## headers
    const entries = content.split(/(?=^## )/gm).filter(e => e.trim());
    return entries.map(parseTodoEntryAuto).filter((e): e is TodoEntry => e !== null);
  }
}

/**
 * Build todo metadata suffix (priority and goal)
 */
function buildTodoMetadata(priority: number, goal: string | null): string {
  let metadata = '';
  if (priority > 0) {
    metadata += ` (Priority: ${priority})`;
  }
  if (goal) {
    metadata += ` (Goal: ${goal})`;
  }
  return metadata;
}

/**
 * Sort todos by priority (descending) then timestamp (ascending)
 */
export function sortTodosByPriority(todos: TodoEntry[]): TodoEntry[] {
  return [...todos].sort((a, b) => {
    // First by priority (higher priority first)
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    // Then by timestamp (earlier first)
    return a.timestamp.localeCompare(b.timestamp);
  });
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
  const metadata = buildTodoMetadata(todo.priority, todo.goal);
  const newEntry = `## ${todo.timestamp}\n\n- ${checkbox} ${todo.text}${metadata}`;

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
  const metadata = buildTodoMetadata(todo.priority, todo.goal);
  const newEntry = `## ${todo.timestamp}\n\n- ${checkbox} ${newText}${metadata}`;

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

/**
 * Update todo priority
 */
export async function updateTodoPriority(
  filePath: string,
  indexOrText: number | string,
  newPriority: number
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

  // Build updated entry with new priority
  const checkbox = todo.completed ? '[x]' : '[ ]';
  const metadata = buildTodoMetadata(newPriority, todo.goal);
  const newEntry = `## ${todo.timestamp}\n\n- ${checkbox} ${todo.text}${metadata}`;

  entries[todoIndex] = {
    ...todo,
    priority: newPriority,
    rawEntry: newEntry,
  };

  // Rebuild file content
  const newContent = entries.map(e => e.rawEntry).join('\n\n');
  await writeFile(filePath, newContent);

  return entries[todoIndex];
}

/**
 * Update todo goal linkage
 */
export async function updateTodoGoal(
  filePath: string,
  indexOrText: number | string,
  newGoal: string | null
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

  // Build updated entry with new goal
  const checkbox = todo.completed ? '[x]' : '[ ]';
  const metadata = buildTodoMetadata(todo.priority, newGoal);
  const newEntry = `## ${todo.timestamp}\n\n- ${checkbox} ${todo.text}${metadata}`;

  entries[todoIndex] = {
    ...todo,
    goal: newGoal,
    rawEntry: newEntry,
  };

  // Rebuild file content
  const newContent = entries.map(e => e.rawEntry).join('\n\n');
  await writeFile(filePath, newContent);

  return entries[todoIndex];
}

/**
 * Context entry interface (parsed from file content)
 */
export interface ContextItemEntry {
  timestamp: string;
  source: string;
  text: string;
  goal: string | null;
  rawEntry: string;
}

/**
 * Parse a context item entry from inline format
 *
 * Inline format:
 * ## HH:MM
 *
 * **Source:** File: meal-plan.txt
 *
 * Context text
 *
 * Goal: goal-codename
 */
export function parseContextItemEntry(entry: string): ContextItemEntry | null {
  const trimmed = entry.trim();
  if (!trimmed) return null;

  // Match header: ## HH:MM
  const headerMatch = trimmed.match(/^##\s+(\d{2}:\d{2})/);
  if (!headerMatch) return null;

  const timestamp = headerMatch[1];

  // Extract content after header
  const afterHeader = trimmed.substring(headerMatch[0].length).trim();

  // Extract source if present (at the beginning)
  const sourceMatch = afterHeader.match(/^\*\*Source:\*\*\s+(.+?)(?:\n\n|$)/);
  const source = sourceMatch ? sourceMatch[1] : 'Text';
  const afterSource = sourceMatch
    ? afterHeader.substring(sourceMatch[0].length).trim()
    : afterHeader;

  // Extract goal if present (at the end)
  const goalMatch = afterSource.match(/\n\nGoal:\s+([a-z0-9-]+)\s*$/);
  const goal = goalMatch ? goalMatch[1] : null;
  const text = goalMatch ? afterSource.substring(0, goalMatch.index).trim() : afterSource;

  return {
    timestamp,
    source,
    text,
    goal,
    rawEntry: trimmed,
  };
}

/**
 * Parse a context item entry from YAML front matter format
 *
 * YAML format:
 * ---
 * timestamp: "11:20"
 * source: "File: meal-plan.txt"
 * goal: healthy-eating
 * ---
 *
 * Context text
 */
export function parseContextItemEntryYaml(entry: string): ContextItemEntry | null {
  const parsed = parseYamlFrontMatter(entry);
  if (!parsed) return null;

  const [metadata, body] = parsed;

  // Extract and normalize schema version (for future version-specific parsing)
  normalizeSchemaVersion(metadata.schema_version as string | undefined);

  // Extract required fields
  const timestamp = metadata.timestamp as string;
  const source = (metadata.source as string) || 'Text';
  const text = body.trim();

  if (!timestamp || !text) return null;

  // Extract optional fields
  const goal = (metadata.goal as string) || null;

  return {
    timestamp,
    source,
    text,
    goal,
    rawEntry: entry.trim(),
  };
}

/**
 * Serialize a context item entry to YAML front matter format
 */
export function serializeContextItemEntryYaml(context: ContextItemEntry): string {
  const metadata: Record<string, unknown> = {
    schema_version: '1.0',
    timestamp: context.timestamp,
    source: context.source,
  };

  if (context.goal) {
    metadata.goal = context.goal;
  }

  return serializeYamlFrontMatter(metadata, context.text);
}

/**
 * Parse a context item entry with automatic format detection
 */
export function parseContextItemEntryAuto(entry: string): ContextItemEntry | null {
  const format = detectFormat(entry);

  if (format === 'yaml') {
    return parseContextItemEntryYaml(entry);
  } else {
    return parseContextItemEntry(entry);
  }
}

/**
 * Parse all context item entries from a markdown file content
 */
export function parseContextItemEntries(content: string): ContextItemEntry[] {
  if (!content) return [];

  // Split by ## headers
  const entries = content.split(/(?=^## )/gm).filter(e => e.trim());
  return entries.map(parseContextItemEntryAuto).filter((e): e is ContextItemEntry => e !== null);
}

// ============================================================================
// REFLECTION ENTRIES
// ============================================================================

/**
 * Reflection entry interface
 */
export interface ReflectionEntry {
  timestamp: string;
  text: string;
  goal: string | null;
  rawEntry: string;
}

/**
 * Serialize a reflection entry to YAML front matter format
 */
export function serializeReflectionEntryYaml(reflection: ReflectionEntry): string {
  const metadata: Record<string, unknown> = {
    schema_version: '1.0',
    timestamp: reflection.timestamp,
  };

  if (reflection.goal) {
    metadata.goal = reflection.goal;
  }

  return serializeYamlFrontMatter(metadata, reflection.text);
}

/**
 * Parse a reflection entry from YAML format
 */
export function parseReflectionEntryYaml(entry: string): ReflectionEntry | null {
  const result = parseYamlFrontMatter(entry);
  if (!result) return null;

  const [metadata, body] = result;

  normalizeSchemaVersion(metadata.schema_version as string | undefined);

  return {
    timestamp: metadata.timestamp as string,
    text: body.trim(),
    goal: (metadata.goal as string) || null,
    rawEntry: entry,
  };
}

/**
 * Parse a reflection entry from inline format
 *
 * Inline format:
 * ## Reflection at HH:MM
 *
 * [reflection content]
 *
 * Goal: goal-codename (optional)
 */
export function parseReflectionEntry(entry: string): ReflectionEntry | null {
  const headerMatch = entry.match(/^##\s+Reflection at\s+(\d{2}:\d{2})/);
  if (!headerMatch) return null;

  const timestamp = headerMatch[1];
  let content = entry.substring(headerMatch[0].length).trim();

  // Extract goal if present
  let goal: string | null = null;
  const goalMatch = content.match(/\n\nGoal:\s+([a-z0-9-]+)\s*$/);
  if (goalMatch) {
    goal = goalMatch[1];
    content = content.substring(0, goalMatch.index).trim();
  }

  return {
    timestamp,
    text: content,
    goal,
    rawEntry: entry,
  };
}

/**
 * Parse a reflection entry with automatic format detection
 */
export function parseReflectionEntryAuto(entry: string): ReflectionEntry | null {
  const format = detectFormat(entry);

  if (format === 'yaml') {
    return parseReflectionEntryYaml(entry);
  } else {
    return parseReflectionEntry(entry);
  }
}

/**
 * Parse all reflection entries from a markdown file content
 */
export function parseReflectionEntries(content: string): ReflectionEntry[] {
  if (!content) return [];

  const entries = splitEntries(content);
  return entries.map(parseReflectionEntryAuto).filter((e): e is ReflectionEntry => e !== null);
}

// ============================================================================
// BACKUP PATH RESOLUTION
// ============================================================================

/**
 * Get backup directory path from config or default
 * Priority: config.backup.defaultPath > ~/aissist-backups/
 */
export async function getBackupDirectory(storagePath?: string): Promise<string> {
  try {
    if (storagePath) {
      const config = await loadConfig(storagePath);
      if (config.backup?.defaultPath) {
        return config.backup.defaultPath;
      }
    }
  } catch {
    // Config doesn't exist or can't be loaded, use default
  }

  // Default backup directory
  return join(homedir(), 'aissist-backups');
}

/**
 * Get backup config with defaults
 */
export async function getBackupConfig(storagePath: string) {
  try {
    const config = await loadConfig(storagePath);
    return {
      defaultPath: config.backup?.defaultPath,
      autoBackup: {
        enabled: config.backup?.autoBackup?.enabled ?? false,
        intervalHours: config.backup?.autoBackup?.intervalHours ?? 24,
      },
      retention: {
        maxAgeDays: config.backup?.retention?.maxAgeDays,
        maxCount: config.backup?.retention?.maxCount,
      },
    };
  } catch {
    // Return defaults if config doesn't exist
    return {
      defaultPath: undefined,
      autoBackup: {
        enabled: false,
        intervalHours: 24,
      },
      retention: {
        maxAgeDays: undefined,
        maxCount: undefined,
      },
    };
  }
}

/**
 * Get last backup timestamp from cache
 */
export async function getLastBackupTime(storagePath: string): Promise<Date | null> {
  try {
    const cachePath = join(storagePath, 'cache', 'last-backup');
    const timestamp = await readFile(cachePath, 'utf-8');
    return new Date(timestamp);
  } catch {
    return null;
  }
}

/**
 * Update last backup timestamp in cache
 */
export async function setLastBackupTime(storagePath: string): Promise<void> {
  const cachePath = join(storagePath, 'cache', 'last-backup');
  await ensureDirectory(join(storagePath, 'cache'));
  await writeFile(cachePath, new Date().toISOString());
}

/**
 * Check if auto-backup is due based on interval configuration
 */
export async function shouldAutoBackup(storagePath: string): Promise<boolean> {
  const config = await getBackupConfig(storagePath);

  if (!config.autoBackup.enabled) {
    return false;
  }

  const lastBackup = await getLastBackupTime(storagePath);
  if (!lastBackup) {
    return true; // No backup yet, should backup
  }

  const hoursSinceLastBackup =
    (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastBackup >= config.autoBackup.intervalHours;
}

// ============================================================================
// PROGRESS FILE OPERATIONS
// ============================================================================

/**
 * Default directories to exclude when discovering child .aissist directories
 */
const DEFAULT_EXCLUDE_DIRS = ['node_modules', '.git', 'vendor', 'dist', 'build', 'target', '.next', '.cache'];

/**
 * Read progress file from storage path
 * Returns null if file doesn't exist or is invalid
 */
export async function readProgressFile(storagePath: string): Promise<ProgressFile | null> {
  const progressPath = join(storagePath, 'progress.json');
  try {
    const content = await readFile(progressPath, 'utf-8');
    const data = JSON.parse(content);
    return ProgressFileSchema.parse(data);
  } catch {
    return null;
  }
}

/**
 * Write progress file to storage path using atomic write
 */
export async function writeProgressFile(storagePath: string, progress: ProgressFile): Promise<void> {
  const progressPath = join(storagePath, 'progress.json');
  const content = JSON.stringify(progress, null, 2);
  await writeFileAtomic(progressPath, content);
}

/**
 * Create or update progress file with current goals
 * Merges new goal data with existing progress notes
 */
export async function updateProgressFile(storagePath: string): Promise<void> {
  const description = await loadDescription(storagePath);
  const activeGoals = await getActiveGoals(storagePath);
  const existingProgress = await readProgressFile(storagePath);

  // Build goals record, preserving existing progress notes
  const goals: Record<string, GoalProgress> = {};
  for (const goal of activeGoals) {
    if (!goal.codename) continue;

    // Preserve existing progress notes if available
    const existingGoal = existingProgress?.goals[goal.codename];
    goals[goal.codename] = {
      text: goal.text,
      status: 'active',
      deadline: goal.deadline,
      parent_goal: goal.parent_goal || null,
      completed_at: null,
      progress_notes: existingGoal?.progress_notes || [],
    };
  }

  const progress: ProgressFile = {
    schema_version: '1.0',
    instance_path: storagePath,
    description,
    last_updated: new Date().toISOString(),
    goals,
    children: existingProgress?.children, // Preserve aggregated children data
  };

  await writeProgressFile(storagePath, progress);
}

/**
 * Mark a goal as completed in progress file
 */
export async function markGoalCompleteInProgress(
  storagePath: string,
  codename: string
): Promise<void> {
  const progress = await readProgressFile(storagePath);
  if (!progress || !progress.goals[codename]) return;

  progress.goals[codename].status = 'completed';
  progress.goals[codename].completed_at = new Date().toISOString();
  progress.last_updated = new Date().toISOString();

  await writeProgressFile(storagePath, progress);
}

/**
 * Add a progress note to a goal
 */
export async function addProgressNote(
  storagePath: string,
  codename: string,
  noteText: string
): Promise<boolean> {
  const progress = await readProgressFile(storagePath);
  if (!progress) {
    // Initialize progress file first
    await updateProgressFile(storagePath);
    const newProgress = await readProgressFile(storagePath);
    if (!newProgress || !newProgress.goals[codename]) return false;

    newProgress.goals[codename].progress_notes.push({
      timestamp: new Date().toISOString(),
      text: noteText,
    });
    newProgress.last_updated = new Date().toISOString();
    await writeProgressFile(storagePath, newProgress);
    return true;
  }

  if (!progress.goals[codename]) return false;

  progress.goals[codename].progress_notes.push({
    timestamp: new Date().toISOString(),
    text: noteText,
  });
  progress.last_updated = new Date().toISOString();

  await writeProgressFile(storagePath, progress);
  return true;
}

/**
 * Discover child .aissist directories recursively
 * Respects depth limits and exclusion patterns
 */
export async function discoverChildDirectories(
  startPath: string,
  options?: { maxDepth?: number; exclude?: string[] }
): Promise<string[]> {
  const maxDepth = options?.maxDepth ?? 5;
  const customExclude = options?.exclude ?? [];
  const excludeDirs = new Set([...DEFAULT_EXCLUDE_DIRS, ...customExclude]);
  const discovered: string[] = [];

  async function walkDir(dirPath: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (excludeDirs.has(entry.name)) continue;

        const fullPath = join(dirPath, entry.name);

        // Check if this directory is a .aissist directory
        if (entry.name === '.aissist') {
          // Don't include the starting directory's own .aissist
          if (fullPath !== join(startPath, '.aissist')) {
            discovered.push(fullPath);
          }
          continue; // Don't recurse into .aissist directories
        }

        // Recurse into subdirectory
        await walkDir(fullPath, depth + 1);
      }
    } catch {
      // Skip directories we can't read
    }
  }

  await walkDir(startPath, 0);
  return discovered;
}

/**
 * Aggregate progress from child directories
 */
export async function aggregateChildProgress(storagePath: string): Promise<Record<string, ChildProgress>> {
  const config = await loadConfig(storagePath).catch(() => ({ sync: { maxDepth: 5, exclude: [] } }));
  const syncConfig = config.sync ?? { maxDepth: 5, exclude: [] };

  // Get the parent directory of the storage path to find siblings and children
  const projectPath = dirname(storagePath);
  const childDirs = await discoverChildDirectories(projectPath, {
    maxDepth: syncConfig.maxDepth,
    exclude: syncConfig.exclude,
  });

  const children: Record<string, ChildProgress> = {};

  for (const childPath of childDirs) {
    const childProgress = await readProgressFile(childPath);
    if (!childProgress) continue;

    // Use relative path or directory name as key
    const relativePath = childPath.replace(projectPath + '/', '');
    children[relativePath] = {
      instance_path: childPath,
      description: childProgress.description,
      last_updated: childProgress.last_updated,
      goals: childProgress.goals,
    };
  }

  return children;
}

/**
 * Sync progress: update local progress and aggregate from children
 */
export async function syncProgress(storagePath: string): Promise<{
  updated: boolean;
  childCount: number;
  linkedGoals: number;
}> {
  // First, update local progress file
  await updateProgressFile(storagePath);

  // Then aggregate child progress
  const children = await aggregateChildProgress(storagePath);
  const childCount = Object.keys(children).length;

  // Count goals linked to parent goals in this instance
  let linkedGoals = 0;
  const localProgress = await readProgressFile(storagePath);

  if (localProgress) {
    for (const child of Object.values(children)) {
      for (const goal of Object.values(child.goals)) {
        if (goal.parent_goal && localProgress.goals[goal.parent_goal]) {
          linkedGoals++;
        }
      }
    }

    // Update progress file with children data
    localProgress.children = children;
    localProgress.last_updated = new Date().toISOString();
    await writeProgressFile(storagePath, localProgress);
  }

  return { updated: true, childCount, linkedGoals };
}
