import { Command } from 'commander';
import { join } from 'path';
import { input } from '@inquirer/prompts';
import { getStoragePath, appendToMarkdown, readMarkdown } from '../utils/storage.js';
import { getCurrentDate as getDate, getCurrentTime, parseDate } from '../utils/date.js';
import { success, error, info } from '../utils/cli.js';
import { linkToGoal } from '../utils/goal-matcher.js';
import { parseNaturalDate, formatDateRange, getDateExamples } from '../utils/date-parser.js';
import {
  checkGitHubAuth,
  fetchCommits,
  fetchPullRequests,
  groupActivities,
  summarizeActivities,
  formatActivityForHistory,
} from '../utils/github.js';
import ora from 'ora';

const historyCommand = new Command('history');

historyCommand
  .command('log')
  .description('Log a history entry (use --goal to link to a goal, --from to import from GitHub)')
  .argument('[text]', 'History entry text (omit when using --from)')
  .option('-g, --goal [keyword]', 'Link this history entry to a goal (optional keyword for matching)')
  .option('-f, --from <timeframe>', 'Import GitHub activity from timeframe (e.g., "this week", "today")')
  .action(async (text: string | undefined, options: { goal?: string | boolean; from?: string }) => {
    // Handle GitHub import
    if (options.from) {
      await importFromGitHub(options.from);
      return;
    }

    if (!text) {
      error('Text argument is required when not using --from flag');
      return;
    }
    try {
      const storagePath = await getStoragePath();
      const date = getDate();
      const time = getCurrentTime();
      const filePath = join(storagePath, 'history', `${date}.md`);

      let entry = `## ${time}\n\n${text}`;

      // Handle goal linking if --goal flag is present
      const goalLinkResult = await linkToGoal({
        goalKeyword: options.goal,
        storagePath,
      });

      if (goalLinkResult.codename) {
        entry += `\n\nGoal: ${goalLinkResult.codename}`;
      }

      await appendToMarkdown(filePath, entry);

      if (goalLinkResult.codename) {
        success(`History logged and linked to goal: ${goalLinkResult.codename}`);
      } else {
        if (options.goal && goalLinkResult.message !== 'No goal linking requested') {
          info(goalLinkResult.message);
        }
        success(`History logged: "${text}"`);
      }
    } catch (err) {
      error(`Failed to log history: ${(err as Error).message}`);
      throw err;
    }
  });

historyCommand
  .command('show')
  .description('Show history entries')
  .option('-d, --date <date>', 'Show history for specific date (YYYY-MM-DD)')
  .action(async (options) => {
    try {
      const storagePath = await getStoragePath();
      const date = options.date || getCurrentDate();

      if (options.date && !parseDate(options.date)) {
        error(`Invalid date format: ${options.date}. Use YYYY-MM-DD format.`);
        return;
      }

      const filePath = join(storagePath, 'history', `${date}.md`);
      const content = await readMarkdown(filePath);

      if (!content) {
        info(`No history found for ${date}`);
        return;
      }

      console.log(`\nHistory for ${date}:\n`);
      console.log(content);
    } catch (err) {
      error(`Failed to show history: ${(err as Error).message}`);
      throw err;
    }
  });

/**
 * Import GitHub activity as history entries
 */
async function importFromGitHub(timeframeInput: string): Promise<void> {
  try {
    const storagePath = await getStoragePath();

    // Parse timeframe
    let timeframe = timeframeInput;
    if (!timeframe || timeframe.trim() === '') {
      timeframe = await input({
        message: 'From when should we start logging?',
        default: 'today',
      });
    }

    const dateRange = parseNaturalDate(timeframe);
    if (!dateRange) {
      error(`Unable to parse date: "${timeframe}"`);
      info('Supported formats: ' + getDateExamples().join(', '));
      return;
    }

    info(`Fetching activity from ${formatDateRange(dateRange)}...`);

    // Check GitHub authentication
    const authStatus = await checkGitHubAuth();
    if (!authStatus.authenticated) {
      error('GitHub authentication required. Please run: gh auth login');
      return;
    }

    info(`Authenticated as: ${authStatus.username}`);

    // Fetch activities
    const spinner = ora('Fetching GitHub activity...').start();

    try {
      const [commits, prs] = await Promise.all([
        fetchCommits(dateRange.from, dateRange.to, authStatus.username),
        fetchPullRequests(dateRange.from, dateRange.to, authStatus.username),
      ]);

      const allActivities = [...commits, ...prs].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      if (allActivities.length === 0) {
        spinner.info('No GitHub activity found for the specified timeframe');
        return;
      }

      spinner.text = `Processing ${allActivities.length} activities...`;

      // Group and summarize activities
      const groups = await groupActivities(allActivities);
      const entries: Array<{ date: string; content: string }> = [];

      for (const group of groups) {
        const summary = await summarizeActivities(group);
        const formattedEntry = formatActivityForHistory(summary, group);
        const date = getCurrentDate(group[0].date);

        entries.push({
          date,
          content: formattedEntry,
        });
      }

      // Write entries to history files
      const entriesByDate = new Map<string, string[]>();
      for (const entry of entries) {
        if (!entriesByDate.has(entry.date)) {
          entriesByDate.set(entry.date, []);
        }
        entriesByDate.get(entry.date)!.push(entry.content);
      }

      for (const [date, contents] of entriesByDate) {
        const filePath = join(storagePath, 'history', `${date}.md`);
        for (const content of contents) {
          await appendToMarkdown(filePath, `## GitHub Import\n\n${content}`);
        }
      }

      spinner.succeed(
        `Imported ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} from GitHub`
      );

      // Show preview
      if (entries.length > 0) {
        info('\nPreview (first 3 entries):');
        entries.slice(0, 3).forEach((entry) => {
          info(`  [${entry.date}] ${entry.content}`);
        });
      }

      info(`\nHistory entries written to ${join(storagePath, 'history')}/`);
    } catch (err) {
      spinner.fail('Failed to fetch GitHub activity');
      throw err;
    }
  } catch (err) {
    error(`Failed to import from GitHub: ${(err as Error).message}`);
    throw err;
  }
}

// Helper function to get current date from a Date object
function getCurrentDate(date?: Date): string {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export { historyCommand };
