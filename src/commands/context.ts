import { Command } from 'commander';
import { join } from 'path';
import { readFile, readdir, access } from 'fs/promises';
import { getStoragePath, appendToMarkdown, readMarkdown, ensureDirectory } from '../utils/storage.js';
import { getCurrentDate, getCurrentTime, parseDate } from '../utils/date.js';
import { success, error, info } from '../utils/cli.js';

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
  .description('Log context-specific information')
  .argument('<context>', 'Context name (e.g., work, diet, fitness)')
  .argument('<input>', 'Text or file path to log')
  .action(async (context: string, input: string) => {
    try {
      const storagePath = await getStoragePath();
      const date = getCurrentDate();
      const time = getCurrentTime();
      const contextPath = join(storagePath, 'context', context);
      await ensureDirectory(contextPath);

      const filePath = join(contextPath, `${date}.md`);

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

      const entry = `## ${time}\n\n**Source:** ${source}\n\n${content}`;
      await appendToMarkdown(filePath, entry);

      success(`Context logged to "${context}"`);
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
