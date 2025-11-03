import { Command } from 'commander';
import { join } from 'path';
import { getStoragePath, appendToMarkdown, readMarkdown } from '../utils/storage.js';
import { getCurrentDate, getCurrentTime, parseDate } from '../utils/date.js';
import { success, error, info } from '../utils/cli.js';

const goalCommand = new Command('goal');

goalCommand
  .command('add')
  .description('Add a new goal')
  .argument('<text>', 'Goal text')
  .action(async (text: string) => {
    try {
      const storagePath = await getStoragePath();
      const date = getCurrentDate();
      const time = getCurrentTime();
      const filePath = join(storagePath, 'goals', `${date}.md`);

      const entry = `## ${time}\n\n${text}`;
      await appendToMarkdown(filePath, entry);

      success(`Goal added: "${text}"`);
    } catch (err) {
      error(`Failed to add goal: ${(err as Error).message}`);
      throw err;
    }
  });

goalCommand
  .command('list')
  .description('List goals')
  .option('-d, --date <date>', 'Show goals for specific date (YYYY-MM-DD)')
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

      console.log(`\nGoals for ${date}:\n`);
      console.log(content);
    } catch (err) {
      error(`Failed to list goals: ${(err as Error).message}`);
      throw err;
    }
  });

export { goalCommand };
