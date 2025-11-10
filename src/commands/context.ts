import { Command } from 'commander';
import { join } from 'path';
import { readFile, readdir, access } from 'fs/promises';
import {
  getStoragePath,
  appendToMarkdown,
  readMarkdown,
  ensureDirectory,
  serializeContextItemEntryYaml,
  type ContextItemEntry,
} from '../utils/storage.js';
import { getCurrentDate, getCurrentTime, parseDate, formatDate } from '../utils/date.js';
import { success, error, info } from '../utils/cli.js';
import { linkToGoal } from '../utils/goal-matcher.js';
import { parseNaturalDate } from '../utils/date-parser.js';

const contextCommand = new Command('context');

async function isFile(path: string): Promise<boolean> {
  try {
    await access(path);
    const stat = await import('fs/promises').then(m => m.stat(path));
    return stat.isFile();
  } catch {
    return false;
  }
}

contextCommand
  .command('log')
  .description('Log context-specific information (use --date for retroactive logging)')
  .argument('<context>', 'Context name (e.g., work, diet, fitness)')
  .argument('<input>', 'Text or file path to log')
  .option('-g, --goal [keyword]', 'Link this context entry to a goal (optional keyword for matching)')
  .option('-d, --date <date>', 'Date for the entry (YYYY-MM-DD or natural language like "yesterday")')
  .action(async (context: string, input: string, options: { goal?: string | boolean; date?: string }) => {
    try {
      const storagePath = await getStoragePath();

      // Parse date if provided, otherwise use current date
      let date = getCurrentDate();
      if (options.date) {
        // Try parsing as natural language first
        const naturalDate = parseNaturalDate(options.date);
        if (naturalDate) {
          // Use the 'from' date from the range (start of period)
          date = formatDate(naturalDate.from);
        } else if (parseDate(options.date)) {
          // Fall back to ISO date parsing
          date = options.date;
        } else {
          error(`Invalid date format: ${options.date}`);
          info('Use YYYY-MM-DD format or natural language like "yesterday", "last Monday", etc.');
          return;
        }
      }

      const time = getCurrentTime();
      const contextPath = join(storagePath, 'context', context);
      await ensureDirectory(contextPath);

      const filePath = join(contextPath, `${date}.md`);

      // Handle goal linking if --goal flag is present
      const goalLinkResult = await linkToGoal({
        goalKeyword: options.goal,
        storagePath,
      });

      let content: string;
      let source: string;

      // Check if input is a file path
      if (await isFile(input)) {
        const fileContent = await readFile(input, 'utf-8');
        content = fileContent;
        source = `File: ${input}`;
      } else {
        content = input;
        source = 'Text';
      }

      // Build context entry using YAML format
      const contextEntry: ContextItemEntry = {
        timestamp: time,
        source,
        text: content,
        goal: goalLinkResult.codename || null,
        rawEntry: '', // Will be set by serializer
      };

      const entry = serializeContextItemEntryYaml(contextEntry);
      await appendToMarkdown(filePath, entry);

      if (goalLinkResult.codename) {
        success(`Context logged to "${context}" and linked to goal: ${goalLinkResult.codename}`);
      } else {
        if (options.goal && goalLinkResult.message !== 'No goal linking requested') {
          info(goalLinkResult.message);
        }
        success(`Context logged to "${context}"`);
      }
    } catch (err) {
      error(`Failed to log context: ${(err as Error).message}`);
      throw err;
    }
  });

contextCommand
  .command('list')
  .description('List available contexts')
  .action(async () => {
    try {
      const storagePath = await getStoragePath();
      const contextPath = join(storagePath, 'context');

      try {
        const contexts = await readdir(contextPath, { withFileTypes: true });
        const contextNames = contexts.filter(c => c.isDirectory()).map(c => c.name);

        if (contextNames.length === 0) {
          info('No contexts found. Create one with: aissist context log <context> <input>');
          return;
        }

        console.log('\nAvailable contexts:\n');
        contextNames.forEach(name => console.log(`  • ${name}`));
      } catch {
        info('No contexts found. Create one with: aissist context log <context> <input>');
      }
    } catch (err) {
      error(`Failed to list contexts: ${(err as Error).message}`);
      throw err;
    }
  });

contextCommand
  .command('show')
  .description('Show context entries')
  .argument('<context>', 'Context name')
  .option('-d, --date <date>', 'Show entries for specific date (YYYY-MM-DD)')
  .action(async (context: string, options) => {
    try {
      const storagePath = await getStoragePath();
      const date = options.date || getCurrentDate();

      if (options.date && !parseDate(options.date)) {
        error(`Invalid date format: ${options.date}. Use YYYY-MM-DD format.`);
        return;
      }

      const filePath = join(storagePath, 'context', context, `${date}.md`);
      const content = await readMarkdown(filePath);

      if (!content) {
        info(`No entries found for context "${context}" on ${date}`);
        return;
      }

      console.log(`\nContext "${context}" for ${date}:\n`);
      console.log(content);
    } catch (err) {
      error(`Failed to show context: ${(err as Error).message}`);
      throw err;
    }
  });

contextCommand
  .command('ingest')
  .description('Bulk ingest files from a directory')
  .argument('<context>', 'Context name')
  .argument('<directory>', 'Directory path to ingest')
  .action(async (context: string, directory: string) => {
    try {
      const storagePath = await getStoragePath();
      const contextPath = join(storagePath, 'context', context);
      await ensureDirectory(contextPath);

      const entries = await readdir(directory, { withFileTypes: true });
      let count = 0;

      for (const entry of entries) {
        if (entry.isFile()) {
          const fullPath = join(directory, entry.name);
          const fileContent = await readFile(fullPath, 'utf-8');

          const date = getCurrentDate();
          const time = getCurrentTime();
          const filePath = join(contextPath, `${date}.md`);

          const logEntry = `## ${time}\n\n**Source:** File: ${entry.name}\n\n${fileContent}`;
          await appendToMarkdown(filePath, logEntry);
          count++;
        }
      }

      success(`Ingested ${count} files into context "${context}"`);
    } catch (err) {
      error(`Failed to ingest directory: ${(err as Error).message}`);
      throw err;
    }
  });

export { contextCommand };
