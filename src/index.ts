#!/usr/bin/env node

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { handleError } from './utils/cli.js';
import { printBrand } from './utils/brand.js';

// Import commands
import { initCommand } from './commands/init.js';
import { goalCommand } from './commands/goal.js';
import { historyCommand } from './commands/history.js';
import { contextCommand } from './commands/context.js';
import { reflectCommand } from './commands/reflect.js';
import { recallCommand } from './commands/recall.js';
import { pathCommand } from './commands/path.js';
import { proposeCommand } from './commands/propose.js';
import { todoCommand } from './commands/todo.js';
import { clearCommand } from './commands/clear.js';
import { configCommand } from './commands/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json for version
const packageJsonPath = join(__dirname, '..', 'package.json');
let version = '1.0.0';
try {
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
  version = packageJson.version;
} catch {
  // Use default version if package.json can't be read
}

// Print brand logo
printBrand();

const program = new Command();

program
  .name('aissist')
  .description('A local-first, AI-powered CLI personal assistant')
  .version(version);

// Register commands
program
  .command('init')
  .description('Initialize aissist storage (use --global for ~/.aissist/)')
  .option('-g, --global', 'Initialize global storage in ~/.aissist/')
  .action(async (options) => {
    try {
      await initCommand(options);
    } catch (error) {
      handleError(error);
    }
  });

program.addCommand(goalCommand);
program.addCommand(historyCommand);
program.addCommand(contextCommand);
program.addCommand(reflectCommand);
program.addCommand(proposeCommand);
program.addCommand(todoCommand);
program.addCommand(clearCommand);
program.addCommand(configCommand);

program
  .command('recall')
  .description('AI-powered semantic search')
  .argument('<query>', 'Search query')
  .action(async (query) => {
    try {
      await recallCommand(query);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('path')
  .description('Show current storage path')
  .option('--hierarchy', 'Show read hierarchy (including parent paths)')
  .action(async (options) => {
    try {
      await pathCommand(options);
    } catch (error) {
      handleError(error);
    }
  });

program.parse();
