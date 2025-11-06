#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { select } from '@inquirer/prompts';
import chalk from 'chalk';

// Helper function to execute commands and capture output
// NOTE: All commands are hardcoded strings with no user input interpolation
// This script runs in a controlled maintainer environment only
function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    }).trim();
  } catch (error) {
    if (options.ignoreError) {
      return null;
    }
    throw error;
  }
}

// Display help message
function showHelp() {
  console.log(`
${chalk.bold('aissist Release Script')}

${chalk.bold('Usage:')}
  npm run release
  node scripts/release.js

${chalk.bold('Description:')}
  Interactive script to create a new release. This will:
  1. Check pre-flight requirements (clean working dir, on main branch, up to date)
  2. Prompt for version bump type (major, minor, or patch)
  3. Bump version in package.json and create git tag
  4. Sync version across all plugin files
  5. Push commits and tag to GitHub
  6. Display GitHub Actions workflow URL for monitoring

${chalk.bold('Pre-flight Requirements:')}
  - Git working directory must be clean (no uncommitted changes)
  - Must be on 'main' branch
  - Local main must be up to date with origin/main

${chalk.bold('Version Bump Examples:')}
  - ${chalk.cyan('major')}: 1.2.3 → 2.0.0 (breaking changes)
  - ${chalk.cyan('minor')}: 1.2.3 → 1.3.0 (new features, backward-compatible)
  - ${chalk.cyan('patch')}: 1.2.3 → 1.2.4 (bug fixes, backward-compatible)

${chalk.bold('Options:')}
  --help    Show this help message
`);
}

// Helper function to increment version
function incrementVersion(version, type) {
  const parts = version.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${parts[0] + 1}.0.0`;
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch':
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    default:
      return version;
  }
}

// Check if --help flag is provided
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

console.log(chalk.bold.blue('\n🚀 aissist Release Script\n'));

// Pre-flight check: Clean working directory
console.log(chalk.cyan('→ Checking git working directory...'));
const gitStatus = exec('git status --porcelain', { silent: true });
if (gitStatus) {
  console.error(chalk.red('\n✗ Git working directory has uncommitted changes'));
  console.error(chalk.yellow('\nPlease commit or stash your changes before releasing:'));
  console.error(chalk.gray('  git add .'));
  console.error(chalk.gray('  git commit -m "your message"'));
  console.error(chalk.gray('\nOr stash them:'));
  console.error(chalk.gray('  git stash'));
  process.exit(1);
}
console.log(chalk.green('✓ Working directory is clean\n'));

// Pre-flight check: Current branch is main
console.log(chalk.cyan('→ Checking current branch...'));
const currentBranch = exec('git branch --show-current', { silent: true });
if (currentBranch !== 'main') {
  console.error(chalk.red(`\n✗ Release must be run from main branch`));
  console.error(chalk.yellow(`\nCurrent branch: ${currentBranch}`));
  console.error(chalk.yellow('\nPlease checkout main before releasing:'));
  console.error(chalk.gray('  git checkout main'));
  process.exit(1);
}
console.log(chalk.green('✓ On main branch\n'));

// Pre-flight check: Up to date with origin
console.log(chalk.cyan('→ Checking if main is up to date with origin...'));
exec('git fetch origin main', { silent: true });
const localCommit = exec('git rev-parse main', { silent: true });
const remoteCommit = exec('git rev-parse origin/main', { silent: true });
if (localCommit !== remoteCommit) {
  const behindCount = exec('git rev-list --count main..origin/main', { silent: true });
  const aheadCount = exec('git rev-list --count origin/main..main', { silent: true });

  if (parseInt(behindCount) > 0) {
    console.error(chalk.red('\n✗ Local main is behind origin/main'));
    console.error(chalk.yellow('\nPlease pull the latest changes:'));
    console.error(chalk.gray('  git pull origin main'));
    process.exit(1);
  }

  if (parseInt(aheadCount) > 0) {
    console.error(chalk.red('\n✗ Local main has unpushed commits'));
    console.error(chalk.yellow('\nPlease push your commits before releasing:'));
    console.error(chalk.gray('  git push origin main'));
    process.exit(1);
  }
}
console.log(chalk.green('✓ Main is up to date with origin\n'));

// Read current version
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const currentVersion = pkg.version;
console.log(chalk.gray(`Current version: ${currentVersion}\n`));

// Interactive version bump selection
const bumpType = await select({
  message: 'Select version bump type:',
  choices: [
    {
      name: `patch (${currentVersion} → ${incrementVersion(currentVersion, 'patch')}) - Bug fixes`,
      value: 'patch',
      description: 'Backward-compatible bug fixes'
    },
    {
      name: `minor (${currentVersion} → ${incrementVersion(currentVersion, 'minor')}) - New features`,
      value: 'minor',
      description: 'New features, backward-compatible'
    },
    {
      name: `major (${currentVersion} → ${incrementVersion(currentVersion, 'major')}) - Breaking changes`,
      value: 'major',
      description: 'Breaking changes, incompatible API changes'
    }
  ]
});

const newVersion = incrementVersion(currentVersion, bumpType);
console.log(chalk.blue(`\n→ Bumping version from ${currentVersion} to ${newVersion}...\n`));

// Execute npm version to bump package.json and create tag
console.log(chalk.cyan('→ Running npm version...'));
try {
  exec(`npm version ${bumpType} -m "chore(release): bump version to %s"`, { silent: false });
  console.log(chalk.green(`✓ Version bumped to ${newVersion}\n`));
} catch (error) {
  console.error(chalk.red('\n✗ npm version failed'));
  console.error(error.message);
  process.exit(1);
}

// Sync version files
console.log(chalk.cyan('→ Syncing version files...'));
try {
  exec(`node scripts/update-version.js ${newVersion}`, { silent: false });
  console.log(chalk.green('✓ Version files synced\n'));
} catch (error) {
  console.error(chalk.red('\n✗ Version sync failed'));
  console.error(error.message);
  process.exit(1);
}

// Commit version file updates
console.log(chalk.cyan('→ Committing version file updates...'));
try {
  exec('git add aissist-plugin/.claude-plugin/plugin.json aissist-plugin/.claude-plugin/marketplace.json', { silent: true });
  exec('git commit -m "chore(release): sync version files"', { silent: false });
  console.log(chalk.green('✓ Version files committed\n'));
} catch (error) {
  console.error(chalk.red('\n✗ Failed to commit version files'));
  console.error(error.message);
  process.exit(1);
}

// Push commits and tags
console.log(chalk.cyan('→ Pushing commits and tags to GitHub...'));
try {
  exec('git push origin main', { silent: false });
  exec('git push origin --tags', { silent: false });
  console.log(chalk.green('✓ Successfully pushed to GitHub\n'));
} catch (error) {
  console.error(chalk.red('\n✗ Failed to push to GitHub'));
  console.error(error.message);
  console.error(chalk.yellow('\nNote: Tag v' + newVersion + ' was created locally.'));
  console.error(chalk.yellow('You can push it manually with:'));
  console.error(chalk.gray('  git push origin main'));
  console.error(chalk.gray('  git push origin v' + newVersion));
  process.exit(1);
}

// Success message
console.log(chalk.bold.green('✅ Release initiated!\n'));
console.log(chalk.gray(`Tag: v${newVersion}`));
console.log(chalk.gray('Monitor release at:'));
console.log(chalk.blue('https://github.com/albertnahas/aissist/actions\n'));
