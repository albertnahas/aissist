import { Command } from 'commander';
import { join } from 'path';
import { input } from '@inquirer/prompts';
import {
  getStoragePath,
  appendToMarkdown,
  getAllHistory,
  serializeHistoryItemEntryYaml,
  parseHistoryItemEntries,
  getActiveGoals,
  type HistoryItemEntry,
} from '../utils/storage.js';
import { getCurrentDate as getDate, getCurrentTime, parseDate, formatDate } from '../utils/date.js';
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
import { enhanceHistoryEntry } from '../llm/claude.js';

const historyCommand = new Command('history');

historyCommand
  .command('log')
  .description('Log a history entry (use --goal to link to a goal, --from to import from GitHub, --date for retroactive logging, --smart for AI enhancement)')
  .argument('[text]', 'History entry text (omit when using --from)')
  .option('-g, --goal [keyword]', 'Link this history entry to a goal (optional keyword for matching)')
  .option('-f, --from <timeframe>', 'Import GitHub activity from timeframe (e.g., "this week", "today")')
  .option('-d, --date <date>', 'Date for the entry (YYYY-MM-DD or natural language like "yesterday")')
  .option('-s, --smart', 'Use AI to clean up text and auto-link to goals')
  .action(async (text: string | undefined, options: { goal?: string | boolean; from?: string; date?: string; smart?: boolean }) => {
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

      // Parse date if provided, otherwise use current date
      let date = getDate();
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
      const filePath = join(storagePath, 'history', `${date}.md`);

      let finalText = text;
      let goalCodename: string | null = null;

      // Handle --smart flag: AI enhancement with auto goal-linking
      if (options.smart) {
        const spinner = ora('Enhancing with AI...').start();

        // Get active goals for potential linking (unless explicit --goal provided)
        const activeGoals = options.goal ? [] : await getActiveGoals(storagePath);
        const goalsForMatching = activeGoals.map(g => ({ codename: g.codename, text: g.text }));

        const result = await enhanceHistoryEntry(text, goalsForMatching);

        if (result.wasEnhanced) {
          spinner.succeed('Text enhanced');
          finalText = result.enhancedText;
          // Only use AI goal if --goal wasn't explicitly provided
          if (!options.goal && result.goalCodename) {
            goalCodename = result.goalCodename;
          }
        } else {
          spinner.warn(result.warning || 'Enhancement skipped');
        }
      }

      // Handle explicit --goal flag (takes precedence over smart auto-linking)
      if (options.goal) {
        const goalLinkResult = await linkToGoal({
          goalKeyword: options.goal,
          storagePath,
        });
        goalCodename = goalLinkResult.codename;
        if (options.goal && goalLinkResult.message !== 'No goal linking requested' && !goalLinkResult.codename) {
          info(goalLinkResult.message);
        }
      }

      // Build history entry using YAML format
      const historyEntry: HistoryItemEntry = {
        timestamp: time,
        text: finalText,
        goal: goalCodename,
        rawEntry: '', // Will be set by serializer
      };

      const entry = serializeHistoryItemEntryYaml(historyEntry);
      await appendToMarkdown(filePath, entry);

      if (goalCodename) {
        success(`History logged and linked to goal: ${goalCodename}`);
      } else {
        success(`History logged: "${finalText}"`);
      }
    } catch (err) {
      error(`Failed to log history: ${(err as Error).message}`);
      throw err;
    }
  });

historyCommand
  .command('show')
  .description('Show all history entries')
  .option('-d, --date <date>', 'Show history since date (supports natural language like "last week")')
  .action(async (options) => {
    try {
      const storagePath = await getStoragePath();

      let sinceDate: string | undefined;

      // Parse date if provided
      if (options.date) {
        // Try parsing as natural language first
        const naturalDate = parseNaturalDate(options.date);
        if (naturalDate) {
          // Use the 'from' date from the range (start of period)
          sinceDate = naturalDate.from.toISOString().split('T')[0];
        } else if (parseDate(options.date)) {
          // Fall back to ISO date parsing
          sinceDate = options.date;
        } else {
          error(`Invalid date format: ${options.date}`);
          info('Use YYYY-MM-DD format or natural language like "last week", "last month", etc.');
          return;
        }
      }

      // Get history (all or since date)
      const allHistory = await getAllHistory(storagePath, sinceDate);

      if (allHistory.length === 0) {
        if (sinceDate) {
          info(`No history found since ${sinceDate}`);
        } else {
          info('No history found');
        }
        info('Log history with: aissist history log <text>');
        return;
      }

      if (sinceDate) {
        console.log(`\nHistory since ${sinceDate}:\n`);
      } else {
        console.log('\nAll History:\n');
      }

      // Display with date separators
      for (const entry of allHistory) {
        console.log(`## ${entry.date}\n`);

        // Parse entries and format them in a human-readable way
        const historyItems = parseHistoryItemEntries(entry.content);

        for (const item of historyItems) {
          // Format: timestamp - text [goal: codename]
          // Replace newlines with spaces for cleaner single-line display
          const text = item.text.replace(/\n+/g, ' ').trim();
          let line = `${item.timestamp} - ${text}`;
          if (item.goal) {
            line += ` [goal: ${item.goal}]`;
          }
          console.log(line);
        }

        console.log('');
      }
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
        const dateEntries = entriesByDate.get(entry.date);
        if (dateEntries) {
          dateEntries.push(entry.content);
        }
      }

      for (const [date, contents] of entriesByDate) {
        const filePath = join(storagePath, 'history', `${date}.md`);
        const time = getCurrentTime();
        for (const content of contents) {
          const historyEntry: HistoryItemEntry = {
            timestamp: time,
            text: content,
            goal: null,
            rawEntry: '', // Will be set by serializer
          };
          const entry = serializeHistoryItemEntryYaml(historyEntry);
          await appendToMarkdown(filePath, entry);
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
