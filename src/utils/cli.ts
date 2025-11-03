import chalk from 'chalk';

/**
 * Display success message
 */
export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

/**
 * Display error message
 */
export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

/**
 * Display info message
 */
export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Display warning message
 */
export function warn(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

/**
 * Display section header
 */
export function header(message: string): void {
  console.log(chalk.bold.cyan(`\n${message}\n`));
}

/**
 * Handle command errors
 */
export function handleError(err: unknown): never {
  const errorMessage = err instanceof Error ? err.message : String(err);
  error(errorMessage);
  process.exit(1);
}
