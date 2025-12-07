import { Command } from 'commander';
import chalk from 'chalk';
import {
  getStoragePath,
  syncProgress,
  readProgressFile,
  loadDescription,
} from '../utils/storage.js';
import { success, error, info } from '../utils/cli.js';

const syncCommand = new Command('sync');

syncCommand
  .description('Sync progress with child directories')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const storagePath = await getStoragePath();
      const description = await loadDescription(storagePath);

      info(`Syncing progress for: ${description || storagePath}`);

      const result = await syncProgress(storagePath);

      if (result.updated) {
        success('Progress file updated');

        if (result.childCount > 0) {
          info(`Found ${result.childCount} child ${result.childCount === 1 ? 'directory' : 'directories'}`);

          if (result.linkedGoals > 0) {
            info(`${result.linkedGoals} child ${result.linkedGoals === 1 ? 'goal links' : 'goals link'} to parent goals`);
          }

          if (options.verbose) {
            // Show aggregated children details
            const progress = await readProgressFile(storagePath);
            if (progress?.children) {
              console.log(chalk.bold('\nChild Directories:'));
              for (const [path, child] of Object.entries(progress.children)) {
                const goalCount = Object.keys(child.goals).length;
                const completedCount = Object.values(child.goals).filter(g => g.status === 'completed').length;
                console.log(`  ${chalk.cyan(path)}`);
                if (child.description) {
                  console.log(chalk.gray(`    ${child.description}`));
                }
                console.log(`    Goals: ${completedCount}/${goalCount} completed`);

                // Show goals linked to parent
                const linkedGoals = Object.entries(child.goals).filter(
                  ([, g]) => g.parent_goal && progress.goals[g.parent_goal]
                );
                if (linkedGoals.length > 0) {
                  console.log(chalk.gray(`    Linked to parent goals:`));
                  for (const [codename, goal] of linkedGoals) {
                    const statusIcon = goal.status === 'completed' ? chalk.green('✓') : chalk.yellow('○');
                    console.log(`      ${statusIcon} ${codename} → ${goal.parent_goal}`);
                  }
                }
              }
            }
          }
        } else {
          info('No child directories found');
        }
      }

      // Show summary of local goals
      const progress = await readProgressFile(storagePath);
      if (progress && options.verbose) {
        const localGoals = Object.keys(progress.goals).length;
        const completedGoals = Object.values(progress.goals).filter(g => g.status === 'completed').length;
        console.log(chalk.bold('\nLocal Progress:'));
        console.log(`  Goals: ${completedGoals}/${localGoals} completed`);

        // Show goals with children linked
        if (progress.children) {
          const goalsWithChildren: Record<string, string[]> = {};
          for (const [childPath, child] of Object.entries(progress.children)) {
            for (const [codename, goal] of Object.entries(child.goals)) {
              if (goal.parent_goal && progress.goals[goal.parent_goal]) {
                if (!goalsWithChildren[goal.parent_goal]) {
                  goalsWithChildren[goal.parent_goal] = [];
                }
                goalsWithChildren[goal.parent_goal].push(`${childPath}:${codename}`);
              }
            }
          }

          if (Object.keys(goalsWithChildren).length > 0) {
            console.log(chalk.bold('\n  Goals with Child Contributions:'));
            for (const [parentGoal, children] of Object.entries(goalsWithChildren)) {
              const parentData = progress.goals[parentGoal];
              console.log(`    ${chalk.cyan(parentGoal)}: ${parentData.text.substring(0, 50)}...`);
              for (const child of children) {
                console.log(chalk.gray(`      ← ${child}`));
              }
            }
          }
        }
      }

      console.log('');
    } catch (err) {
      error(`Failed to sync: ${(err as Error).message}`);
      throw err;
    }
  });

export { syncCommand };
