import ora from 'ora';
import chalk from 'chalk';
import { getStoragePath } from '../utils/storage.js';
import { searchMarkdownFiles, filterTopMatches } from '../utils/search.js';
import { checkClaudeCodeSession, recallWithClaudeCode } from '../llm/claude.js';
import { info, header } from '../utils/cli.js';

export async function recallCommand(query: string): Promise<void> {
  const spinner = ora('Searching your memories...').start();

  try {
    const storagePath = await getStoragePath();

    // Check if Claude Code is available and authenticated
    const sessionStatus = await checkClaudeCodeSession();

    if (sessionStatus.available && sessionStatus.authenticated) {
      // Use Claude Code with file analysis tools (primary method)
      spinner.text = 'Claude is analyzing your memories...';

      try {
        const answer = await recallWithClaudeCode(query, storagePath);
        spinner.succeed('Recall complete!');

        header('Answer');
        console.log(answer);

        console.log(chalk.dim('\n\nPowered by Claude Code with semantic file analysis'));
        return;
      } catch (claudeError) {
        // If Claude Code fails, fall back to keyword search
        spinner.warn('Claude Code failed, falling back to keyword search');
        console.log(chalk.dim(`Error: ${(claudeError as Error).message}\n`));
      }
    } else {
      // Claude Code not available or not authenticated
      spinner.warn(sessionStatus.error || 'Claude Code not available');
    }

    // Fallback: Use keyword search
    spinner.text = 'Searching with keyword matching...';
    const matches = await searchMarkdownFiles(storagePath, query, false);

    if (matches.length === 0) {
      spinner.stop();
      info(`No matches found for: "${query}"`);

      if (!sessionStatus.authenticated) {
        console.log(chalk.dim('\nTip: Install Claude Code and run "claude login" to enable AI-powered semantic search.'));
      }
      return;
    }

    // Filter to top matches
    const topMatches = filterTopMatches(matches, 10);
    spinner.succeed(`Found ${topMatches.length} matches`);

    header(`Search Results (${topMatches.length} keyword matches)`);

    for (const match of topMatches) {
      console.log(chalk.cyan(`\n[${match.date}] ${match.context} - ${match.relativeFilePath}:${match.lineNumber}`));
      console.log(chalk.dim(match.excerpt));
    }

    if (!sessionStatus.authenticated) {
      console.log(chalk.dim('\n\nTip: Install Claude Code and run "claude login" to enable AI-powered semantic search.'));
    }
  } catch (err) {
    spinner.fail('Recall failed');
    throw err;
  }
}
