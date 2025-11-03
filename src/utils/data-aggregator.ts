import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { subDays, isAfter, isBefore, parseISO } from 'date-fns';

export interface ProposalData {
  goals: GoalFile[];
  history: HistoryFile[];
  reflections: ReflectionFile[];
  context: ContextFile[];
}

export interface GoalFile {
  path: string;
  date: string;
  content: string;
}

export interface HistoryFile {
  path: string;
  date: string;
  content: string;
}

export interface ReflectionFile {
  path: string;
  date: string;
  content: string;
}

export interface ContextFile {
  path: string;
  name: string;
  content: string;
}

export interface LoadDataOptions {
  startDate?: Date;
  endDate?: Date;
  lookbackDays?: number;
  includeContext?: boolean;
  tag?: string;
}

/**
 * Load all relevant data for proposal generation
 */
export async function loadProposalData(
  storagePath: string,
  options: LoadDataOptions = {}
): Promise<ProposalData> {
  const {
    lookbackDays = 30,
    includeContext = false,
    tag
  } = options;

  const now = new Date();
  const lookbackStart = subDays(now, lookbackDays);

  // Load all goals (not date-filtered)
  const goals = await loadGoals(storagePath, tag);

  // Load recent history logs
  const history = await loadHistory(storagePath, lookbackStart, now, tag);

  // Load recent reflections
  const reflections = await loadReflections(storagePath, lookbackStart, now);

  // Optionally load context files
  const context = includeContext ? await loadContext(storagePath, tag) : [];

  return {
    goals,
    history,
    reflections,
    context
  };
}

/**
 * Load all goal files
 */
async function loadGoals(storagePath: string, tag?: string): Promise<GoalFile[]> {
  const goalsDir = join(storagePath, 'goals');
  const goals: GoalFile[] = [];

  try {
    const files = await readdir(goalsDir);
    const mdFiles = files.filter(f => f.endsWith('.md')).sort().reverse();

    for (const file of mdFiles) {
      const filePath = join(goalsDir, file);
      const content = await readFile(filePath, 'utf-8');

      // Filter by tag if specified
      if (tag && !content.toLowerCase().includes(`#${tag.toLowerCase()}`)) {
        continue;
      }

      const date = file.replace('.md', '');
      goals.push({
        path: filePath,
        date,
        content
      });
    }
  } catch (error) {
    // Goals directory doesn't exist or is empty
  }

  return goals;
}

/**
 * Load history logs within date range
 */
async function loadHistory(
  storagePath: string,
  startDate: Date,
  endDate: Date,
  tag?: string
): Promise<HistoryFile[]> {
  const historyDir = join(storagePath, 'history');
  const history: HistoryFile[] = [];

  try {
    const files = await readdir(historyDir);
    const mdFiles = files.filter(f => f.endsWith('.md')).sort().reverse();

    for (const file of mdFiles) {
      const date = file.replace('.md', '');
      const fileDate = parseISO(date);

      // Skip if outside date range
      if (isBefore(fileDate, startDate) || isAfter(fileDate, endDate)) {
        continue;
      }

      const filePath = join(historyDir, file);
      const content = await readFile(filePath, 'utf-8');

      // Filter by tag if specified
      if (tag && !content.toLowerCase().includes(`#${tag.toLowerCase()}`)) {
        continue;
      }

      history.push({
        path: filePath,
        date,
        content
      });
    }
  } catch (error) {
    // History directory doesn't exist or is empty
  }

  return history;
}

/**
 * Load reflections within date range
 */
async function loadReflections(
  storagePath: string,
  startDate: Date,
  endDate: Date
): Promise<ReflectionFile[]> {
  const reflectionsDir = join(storagePath, 'reflections');
  const reflections: ReflectionFile[] = [];

  try {
    const files = await readdir(reflectionsDir);
    const mdFiles = files.filter(f => f.endsWith('.md')).sort().reverse();

    for (const file of mdFiles) {
      const date = file.replace('.md', '');
      const fileDate = parseISO(date);

      // Skip if outside date range
      if (isBefore(fileDate, startDate) || isAfter(fileDate, endDate)) {
        continue;
      }

      const filePath = join(reflectionsDir, file);
      const content = await readFile(filePath, 'utf-8');

      reflections.push({
        path: filePath,
        date,
        content
      });
    }
  } catch (error) {
    // Reflections directory doesn't exist or is empty
  }

  return reflections;
}

/**
 * Load context files
 */
async function loadContext(storagePath: string, tag?: string): Promise<ContextFile[]> {
  const contextDir = join(storagePath, 'context');
  const context: ContextFile[] = [];

  try {
    const entries = await readdir(contextDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Load files from context subdirectories
        const subDir = join(contextDir, entry.name);
        const files = await readdir(subDir);
        const mdFiles = files.filter(f => f.endsWith('.md'));

        for (const file of mdFiles) {
          const filePath = join(subDir, file);
          const content = await readFile(filePath, 'utf-8');

          // Filter by tag if specified
          if (tag && entry.name !== tag && !content.toLowerCase().includes(`#${tag.toLowerCase()}`)) {
            continue;
          }

          context.push({
            path: filePath,
            name: `${entry.name}/${file}`,
            content
          });
        }
      }
    }
  } catch (error) {
    // Context directory doesn't exist or is empty
  }

  return context;
}

/**
 * Check if any data exists
 */
export function hasData(data: ProposalData): boolean {
  return data.goals.length > 0 ||
         data.history.length > 0 ||
         data.reflections.length > 0 ||
         data.context.length > 0;
}

/**
 * Get summary statistics for data
 */
export function getDataSummary(data: ProposalData): string {
  const parts: string[] = [];

  if (data.goals.length > 0) {
    parts.push(`${data.goals.length} goal file(s)`);
  }
  if (data.history.length > 0) {
    parts.push(`${data.history.length} history log(s)`);
  }
  if (data.reflections.length > 0) {
    parts.push(`${data.reflections.length} reflection(s)`);
  }
  if (data.context.length > 0) {
    parts.push(`${data.context.length} context file(s)`);
  }

  return parts.length > 0 ? parts.join(', ') : 'No data';
}
