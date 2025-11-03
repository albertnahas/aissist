import { Command } from 'commander';
import { join } from 'path';
import { confirm, input } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { getStoragePath, appendToMarkdown } from '../utils/storage.js';
import { getCurrentDate, getCurrentTime } from '../utils/date.js';
import { parseTimeframe } from '../utils/timeframe-parser.js';
import { loadProposalData, hasData, getDataSummary } from '../utils/data-aggregator.js';
import { buildProposalPrompt } from '../prompts/proposal-prompt.js';
import { checkClaudeCodeSession, executeClaudeCodeWithTools } from '../llm/claude.js';
import { success, error, info, warn } from '../utils/cli.js';

const proposeCommand = new Command('propose');

proposeCommand
  .description('Generate AI-powered action proposals based on your goals and history')
  .argument('[timeframe]', 'Timeframe for proposals (e.g., "today", "this week", "next quarter", "2026 Q1")', 'today')
  .option('--reflect', 'Prompt for a quick reflection before generating proposals')
  .option('--debug', 'Display debug information (prompt, data summary)')
  .option('--context', 'Include context files in the analysis')
  .option('--tag <tag>', 'Filter by specific tag (e.g., "work", "fitness")')
  .action(async (timeframe: string, options) => {
    try {
      const storagePath = await getStoragePath();

      // Parse timeframe
      let parsedTimeframe;
      try {
        parsedTimeframe = parseTimeframe(timeframe);
      } catch (err) {
        error((err as Error).message);
        return;
      }

      // Handle --reflect flag
      if (options.reflect) {
        info('Quick reflection before generating proposals...\n');

        const reflection = await input({
          message: 'What\'s on your mind? (brief reflection)',
        });

        if (reflection.trim()) {
          const date = getCurrentDate();
          const time = getCurrentTime();
          const filePath = join(storagePath, 'reflections', `${date}.md`);
          const entry = `## Quick Reflection at ${time}\n\n${reflection}`;
          await appendToMarkdown(filePath, entry);
          success('Reflection saved!\n');
        }
      }

      // Check Claude Code availability
      const sessionStatus = await checkClaudeCodeSession();
      if (!sessionStatus.available || !sessionStatus.authenticated) {
        error(sessionStatus.error || 'Claude Code not available');
        console.log(chalk.dim('\nThe propose command requires Claude Code to be installed and authenticated.'));
        console.log(chalk.dim('Install from: https://claude.ai/download'));
        console.log(chalk.dim('Then run: claude login'));
        return;
      }

      // Load data
      const spinner = ora('Loading your data...').start();
      const data = await loadProposalData(storagePath, {
        lookbackDays: 30,
        includeContext: options.context,
        tag: options.tag,
      });

      spinner.stop();

      // Check if we have any data
      if (!hasData(data)) {
        warn('No data found to generate proposals from.');
        console.log(chalk.dim('\nTry adding some goals, history, or reflections first:'));
        console.log(chalk.dim('  aissist goal add "Your goal"'));
        console.log(chalk.dim('  aissist history add "What you did today"'));
        console.log(chalk.dim('  aissist reflect'));
        return;
      }

      // Debug mode: show data summary
      if (options.debug) {
        console.log(chalk.cyan('\n=== Debug Information ==='));
        console.log(chalk.dim(`Timeframe: ${parsedTimeframe.label}`));
        console.log(chalk.dim(`Data: ${getDataSummary(data)}`));
        if (options.tag) {
          console.log(chalk.dim(`Tag filter: #${options.tag}`));
        }
        console.log();
      }

      // Build prompt
      const prompt = buildProposalPrompt({
        timeframe: parsedTimeframe,
        data,
        storagePath,
        tag: options.tag,
      });

      // Debug mode: show raw prompt
      if (options.debug) {
        console.log(chalk.cyan('=== Prompt for Claude ==='));
        console.log(chalk.dim(prompt));
        console.log(chalk.cyan('========================\n'));
      }

      // Generate proposals with Claude Code
      spinner.start(`Claude is analyzing your data for ${parsedTimeframe.label}...`);

      try {
        const response = await executeClaudeCodeWithTools(prompt, storagePath, ['Grep', 'Read', 'Glob']);
        spinner.succeed('Proposals generated!');

        // Display the response
        console.log('\n' + response);
        console.log(chalk.dim('\n\nPowered by Claude Code'));

        // Offer to save proposals as goals
        console.log();
        const shouldSave = await confirm({
          message: 'Want to save these proposals as goals?',
          default: false,
        });

        if (shouldSave) {
          await saveProposalsAsGoals(response, storagePath);
        }

      } catch (claudeError) {
        spinner.fail('Failed to generate proposals');
        error((claudeError as Error).message);
        return;
      }

    } catch (err) {
      if ((err as Error).name === 'ExitPromptError') {
        info('\nCancelled.');
        return;
      }
      error(`Failed to generate proposals: ${(err as Error).message}`);
      throw err;
    }
  });

/**
 * Parse and save proposal items as goals
 */
async function saveProposalsAsGoals(response: string, storagePath: string): Promise<void> {
  const spinner = ora('Saving proposals as goals...').start();

  try {
    // Extract numbered items from the response
    // Look for lines starting with "1.", "2.", etc.
    const lines = response.split('\n');
    const proposals: string[] = [];

    for (const line of lines) {
      const match = line.match(/^\s*\d+\.\s+(.+)/);
      if (match) {
        proposals.push(match[1].trim());
      }
    }

    if (proposals.length === 0) {
      spinner.warn('No numbered proposals found to save');
      return;
    }

    // Save each proposal as a goal
    const date = getCurrentDate();
    const time = getCurrentTime();
    const filePath = join(storagePath, 'goals', `${date}.md`);

    const goalsText = proposals.map((p, i) => `${i + 1}. ${p}`).join('\n');
    const entry = `## Proposed Goals (${time})\n\n${goalsText}`;
    await appendToMarkdown(filePath, entry);

    spinner.succeed(`Saved ${proposals.length} proposal(s) as goals!`);
  } catch (err) {
    spinner.fail('Failed to save proposals as goals');
    error((err as Error).message);
  }
}

export { proposeCommand };
