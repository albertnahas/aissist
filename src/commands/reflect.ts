import { Command } from 'commander';
import { join } from 'path';
import { input } from '@inquirer/prompts';
import { getStoragePath, appendToMarkdown, readMarkdown } from '../utils/storage.js';
import { getCurrentDate, getCurrentTime, parseDate } from '../utils/date.js';
import { success, error, info } from '../utils/cli.js';

const reflectCommand = new Command('reflect');

const REFLECTION_QUESTIONS = [
  'What went well today?',
  'What could have gone better?',
  'What did you learn?',
  'What are you grateful for?',
  'What will you focus on tomorrow?',
];

reflectCommand
  .description('Start a reflection session')
  .action(async () => {
    try {
      const storagePath = await getStoragePath();
      const date = getCurrentDate();
      const time = getCurrentTime();
      const filePath = join(storagePath, 'reflections', `${date}.md`);

      info('Starting reflection session...\n');

      const responses: string[] = [];

      for (const question of REFLECTION_QUESTIONS) {
        const answer = await input({
          message: question,
        });

        if (answer.trim()) {
          responses.push(`### ${question}\n\n${answer}`);
        }
      }

      if (responses.length === 0) {
        info('No reflections recorded.');
        return;
      }

      const entry = `## Reflection at ${time}\n\n${responses.join('\n\n')}`;
      await appendToMarkdown(filePath, entry);

      success('Reflection saved!');
    } catch (err) {
      if ((err as Error).name === 'ExitPromptError') {
        info('\nReflection cancelled.');
        return;
      }
      error(`Failed to save reflection: ${(err as Error).message}`);
      throw err;
    }
  });

reflectCommand
  .command('show')
  .description('Show past reflections')
  .option('-d, --date <date>', 'Show reflections for specific date (YYYY-MM-DD)')
  .action(async (options) => {
    try {
      const storagePath = await getStoragePath();
      const date = options.date || getCurrentDate();

      if (options.date && !parseDate(options.date)) {
        error(`Invalid date format: ${options.date}. Use YYYY-MM-DD format.`);
        return;
      }

      const filePath = join(storagePath, 'reflections', `${date}.md`);
      const content = await readMarkdown(filePath);

      if (!content) {
        info(`No reflections found for ${date}`);
        return;
      }

      console.log(`\nReflections for ${date}:\n`);
      console.log(content);
    } catch (err) {
      error(`Failed to show reflections: ${(err as Error).message}`);
      throw err;
    }
  });

export { reflectCommand };
