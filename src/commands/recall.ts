import ora from 'ora';
import chalk from 'chalk';
import { getStoragePath } from '../utils/storage.js';
import { searchMarkdownFiles, filterTopMatches } from '../utils/search.js';
import { summarizeExcerpts } from '../llm/claude.js';
import { error, info, header } from '../utils/cli.js';

export async function recallCommand(query: string): Promise<void> {
  const spinner = ora('Searching your memories...').start();

  try {
    const storagePath = await getStoragePath();

    // Search for matches
    const matches = await searchMarkdownFiles(storagePath, query, false);

    if (matches.length === 0) {
      spinner.stop();
      info(`No matches found for: "${query}"`);
      return;
    }

    spinner.text = `Found ${matches.length} matches, asking Claude...`;

    // Filter to top matches
    const topMatches = filterTopMatches(matches, 10);

    // Try to use Claude for summarization
    try {
      const summary = await summarizeExcerpts(query, topMatches);
      spinner.succeed('Recall complete!');

      header('Answer');
      console.log(summary);

      console.log(chalk.dim(`\n\nBased on ${topMatches.length} excerpts from your memories`));
    } catch (claudeError) {
      // Fallback to raw results if Claude fails
      spinner.warn('Claude unavailable, showing raw results');

      header(`Search Results (${topMatches.length} matches)`);

      for (const match of topMatches) {
        console.log(chalk.cyan(`\n[${match.date}] ${match.context} - ${match.relativeFilePath}:${match.lineNumber}`));
        console.log(chalk.dim(match.excerpt));
      }

      error(`\nClaude error: ${(claudeError as Error).message}`);
      info('Install Claude Code and run "claude login" to enable AI summarization.');
    }
  } catch (err) {
    spinner.fail('Search failed');
    throw err;
  }
}
