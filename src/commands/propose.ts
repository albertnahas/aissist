import { Command } from 'commander';
import { join } from 'path';
import { input, select, checkbox } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { getStoragePath, appendToMarkdown, getGoalByCodename, serializeTodoEntryYaml, type TodoEntry, serializeGoalEntryYaml, type GoalEntry, getExistingCodenames, serializeReflectionEntryYaml, type ReflectionEntry, serializeContextItemEntryYaml, type ContextItemEntry } from '../utils/storage.js';
import { getCurrentDate, getCurrentTime } from '../utils/date.js';
import { parseTimeframe, createTimeframeToDeadline, createTimelessTimeframe } from '../utils/timeframe-parser.js';
import { loadProposalData, hasData, getDataSummary } from '../utils/data-aggregator.js';
import { buildProposalPrompt } from '../prompts/proposal-prompt.js';
import { checkClaudeCodeSession, executeClaudeCodeWithTools, generateGoalCodename } from '../llm/claude.js';
import { success, error, info, warn, withSpinner } from '../utils/cli.js';
import { linkToGoal } from '../utils/goal-matcher.js';
import { renderMarkdown } from '../utils/markdown.js';

const proposeCommand = new Command('propose');

proposeCommand
  .description('Generate AI-powered action proposals based on your goals and history')
  .argument('[timeframe]', 'Timeframe for proposals (e.g., "today", "this week", "next quarter", "2026 Q1"). When --goal is used without explicit timeframe, automatically uses goal deadline or timeless planning.', 'today')
  .option('--reflect', 'Prompt for a quick reflection before generating proposals')
  .option('--debug', 'Display debug information (prompt, data summary)')
  .option('--context', 'Include context files in the analysis')
  .option('--tag <tag>', 'Filter by specific tag (e.g., "work", "fitness")')
  .option('-g, --goal [keyword]', 'Focus proposals on a specific goal (optional keyword for matching). Without explicit timeframe, uses goal deadline or comprehensive planning.')
  .option('--raw', 'Output raw Markdown (for piping or AI consumption)')
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

          const reflectionEntry: ReflectionEntry = {
            timestamp: time,
            text: reflection,
            goal: null,
            rawEntry: '', // Will be set by serializer
          };

          const entry = serializeReflectionEntryYaml(reflectionEntry);
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

      // Handle goal linking if --goal flag is present
      const goalLinkResult = await linkToGoal({
        goalKeyword: options.goal,
        storagePath,
      });

      // Load full goal details and apply smart timeframe if goal is specified
      let goalInfo: { codename: string; text: string; description: string | null; deadline: string | null } | undefined;
      const isGoalOnlyInvocation = options.goal && timeframe === 'today';

      if (goalLinkResult.codename) {
        const goal = await getGoalByCodename(storagePath, goalLinkResult.codename);

        if (goal) {
          goalInfo = {
            codename: goal.codename,
            text: goal.text,
            description: goal.description,
            deadline: goal.deadline,
          };

          // Smart timeframe: if user didn't explicitly provide timeframe, use goal's timeframe
          if (isGoalOnlyInvocation) {
            if (goal.deadline) {
              // Goal has deadline: calculate "now until deadline" timeframe
              try {
                parsedTimeframe = createTimeframeToDeadline(goal.deadline);
                info(`Using goal deadline: ${parsedTimeframe.label}`);
              } catch (err) {
                warn(`Invalid goal deadline, using default timeframe: ${(err as Error).message}`);
              }
            } else {
              // Goal has no deadline: use timeless planning mode
              parsedTimeframe = createTimelessTimeframe();
              info(`No deadline set - using comprehensive planning mode`);
            }
          }

          info(`Proposals focused on goal: ${goalLinkResult.codename}`);
        } else {
          warn(`Goal "${goalLinkResult.codename}" not found, proceeding without goal focus`);
        }
      } else if (options.goal && goalLinkResult.message !== 'No goal linking requested') {
        info(goalLinkResult.message);
      }

      // Debug mode: show data summary
      if (options.debug) {
        console.log(chalk.cyan('\n=== Debug Information ==='));
        console.log(chalk.dim(`Timeframe: ${parsedTimeframe.label}`));
        console.log(chalk.dim(`Data: ${getDataSummary(data)}`));
        if (options.tag) {
          console.log(chalk.dim(`Tag filter: #${options.tag}`));
        }
        if (goalInfo) {
          console.log(chalk.dim(`Goal: ${goalInfo.codename} - ${goalInfo.text}`));
        }
        console.log();
      }

      // Build prompt (now with optional goal info)
      const prompt = buildProposalPrompt({
        timeframe: parsedTimeframe,
        data,
        storagePath,
        tag: options.tag,
        goalInfo,
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

        // Display the response (rendered or raw based on --raw flag)
        const output = renderMarkdown(response, options.raw);
        console.log('\n' + output);
        console.log(chalk.dim('\n\nPowered by Claude Code'));

        // Skip interactive prompt if --raw flag is used (for non-interactive/testing scenarios)
        if (options.raw) {
          return;
        }

        // Offer post-proposal actions
        console.log();
        const action = await select({
          message: 'What would you like to do with these proposals?',
          choices: [
            { name: 'Create TODOs (recommended)', value: 'todo' },
            { name: 'Save as goals', value: 'goal' },
            { name: 'Save as Markdown', value: 'markdown' },
            { name: 'Skip', value: 'skip' },
          ],
          default: 'todo',
        });

        if (action === 'todo') {
          await saveProposalsAsTodos(response, storagePath, goalLinkResult.codename);
        } else if (action === 'goal') {
          await saveProposalsAsGoals(response, storagePath, goalLinkResult.codename);
        } else if (action === 'markdown') {
          await saveProposalAsMarkdown(response, storagePath, parsedTimeframe.label, options.tag, goalLinkResult.codename);
        } else {
          info('Proposals not saved');
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
 * Extract numbered proposal items from response text
 */
function parseProposalItems(response: string): string[] {
  const lines = response.split('\n');
  const proposals: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*\d+\.\s+(.+)/);
    if (match) {
      proposals.push(match[1].trim());
    }
  }

  return proposals;
}

/**
 * Parse and save proposal items as todos
 */
async function saveProposalsAsTodos(response: string, storagePath: string, linkedGoalCodename: string | null = null): Promise<void> {
  try {
    // Extract numbered items from the response
    const proposals = parseProposalItems(response);

    if (proposals.length === 0) {
      warn('No numbered proposals found to save');
      return;
    }

    // Show interactive selection with all items checked by default
    const choices = proposals.map((text, index) => ({
      name: text,
      value: index,
      checked: true,
    }));

    const selectedIndices = await checkbox({
      message: 'Select proposals to create as todos (Space to toggle, Enter to confirm):',
      choices,
    });

    if (selectedIndices.length === 0) {
      info('No items selected');
      return;
    }

    // Save selected proposals as todos
    const spinner = ora('Saving proposals as todos...').start();
    const date = getCurrentDate();
    const time = getCurrentTime();
    const filePath = join(storagePath, 'todos', `${date}.md`);

    for (const index of selectedIndices) {
      const proposal = proposals[index];
      const todoEntry: TodoEntry = {
        timestamp: time,
        text: proposal,
        completed: false,
        goal: linkedGoalCodename || null,
        priority: 0,
        rawEntry: '', // Will be set by serializer
      };
      const entry = serializeTodoEntryYaml(todoEntry);
      await appendToMarkdown(filePath, entry);
    }

    spinner.succeed(`Saved ${selectedIndices.length} proposal(s) as todos!`);
  } catch (err) {
    if ((err as Error).name === 'ExitPromptError') {
      info('Selection cancelled');
      return;
    }
    error(`Failed to save proposals as todos: ${(err as Error).message}`);
  }
}

/**
 * Parse and save proposal items as goals
 */
async function saveProposalsAsGoals(response: string, storagePath: string, linkedGoalCodename: string | null = null): Promise<void> {
  try {
    // Extract numbered items from the response
    const proposals = parseProposalItems(response);

    if (proposals.length === 0) {
      warn('No numbered proposals found to save');
      return;
    }

    // Show interactive selection with all items checked by default
    const choices = proposals.map((text, index) => ({
      name: text,
      value: index,
      checked: true,
    }));

    const selectedIndices = await checkbox({
      message: 'Select proposals to save as goals (Space to toggle, Enter to confirm):',
      choices,
    });

    if (selectedIndices.length === 0) {
      info('No items selected');
      return;
    }

    // Save selected proposals as goals
    const spinner = ora('Saving proposals as goals...').start();
    const date = getCurrentDate();
    const time = getCurrentTime();
    const filePath = join(storagePath, 'goals', `${date}.md`);

    // Get existing codenames to ensure uniqueness
    const existingCodenames = await getExistingCodenames(filePath);

    // Create individual goal entries with codenames
    let savedCount = 0;
    for (const index of selectedIndices) {
      const proposalText = proposals[index];

      try {
        // Generate unique codename for this goal
        const codename = await withSpinner(
          generateGoalCodename(proposalText, existingCodenames),
          'Generating codename...'
        );
        existingCodenames.push(codename);

        // Create goal entry
        const goalEntry: GoalEntry = {
          timestamp: time,
          codename,
          text: proposalText,
          description: linkedGoalCodename ? `Related to: ${linkedGoalCodename}` : null,
          deadline: null,
          parent_goal: null,
          rawEntry: '', // Will be set by serializer
        };

        const entry = serializeGoalEntryYaml(goalEntry);
        await appendToMarkdown(filePath, entry);
        savedCount++;
      } catch (err) {
        error(`Failed to generate codename for goal: ${(err as Error).message}`);
        // Continue with remaining goals
      }
    }

    spinner.succeed(`Saved ${savedCount} proposal(s) as goals!`);
  } catch (err) {
    if ((err as Error).name === 'ExitPromptError') {
      info('Selection cancelled');
      return;
    }
    error(`Failed to save proposals as goals: ${(err as Error).message}`);
  }
}

/**
 * Save full proposal as Markdown file
 */
async function saveProposalAsMarkdown(
  response: string,
  storagePath: string,
  timeframe: string,
  tag: string | undefined,
  linkedGoalCodename: string | null
): Promise<void> {
  try {
    const spinner = ora('Saving proposal as Markdown...').start();
    const date = getCurrentDate();
    const time = getCurrentTime();
    const filePath = join(storagePath, 'proposals', `${date}.md`);

    // Build proposal text with metadata and response
    let proposalText = `**Timeframe:** ${timeframe}`;
    if (tag) {
      proposalText += `\n**Tag:** #${tag}`;
    }
    if (linkedGoalCodename) {
      proposalText += `\n**Goal:** ${linkedGoalCodename}`;
    }
    proposalText += `\n\n${response}`;

    // Create context entry (proposals are stored similar to context)
    const contextEntry: ContextItemEntry = {
      timestamp: time,
      text: proposalText,
      source: 'proposal',
      goal: linkedGoalCodename,
      rawEntry: '', // Will be set by serializer
    };

    const entry = serializeContextItemEntryYaml(contextEntry);
    await appendToMarkdown(filePath, entry);

    spinner.succeed(`Proposal saved to proposals/${date}.md`);
  } catch (err) {
    if ((err as Error).name === 'ExitPromptError') {
      info('Cancelled');
      return;
    }
    error(`Failed to save proposal as Markdown: ${(err as Error).message}`);
  }
}

export { proposeCommand };
