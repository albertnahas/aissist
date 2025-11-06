# Contributing to Aissist

Thank you for your interest in contributing to Aissist! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/aissist.git
   cd aissist
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/aissist.git
   ```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Link the CLI for local testing:
   ```bash
   npm link
   ```

4. Run tests:
   ```bash
   npm test
   ```

5. Watch mode for development:
   ```bash
   npm run dev
   ```

## Project Structure

```
aissist/
├── src/
│   ├── commands/      # CLI command implementations
│   │   ├── init.ts
│   │   ├── goal.ts
│   │   ├── history.ts
│   │   ├── context.ts
│   │   ├── reflect.ts
│   │   ├── recall.ts
│   │   └── path.ts
│   ├── llm/          # Claude API integration
│   │   └── claude.ts
│   ├── utils/        # Utility functions
│   │   ├── storage.ts
│   │   ├── date.ts
│   │   ├── search.ts
│   │   └── cli.ts
│   └── index.ts      # CLI entry point
├── bin/
│   └── aissist.js    # Executable entry point
├── tests/            # Test files
└── dist/             # Compiled output
```

## Making Changes

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the [coding standards](#coding-standards)

3. Write or update tests as needed

4. Ensure all tests pass:
   ```bash
   npm test
   ```

5. Build the project to ensure no compilation errors:
   ```bash
   npm run build
   ```

6. Test your changes manually:
   ```bash
   aissist <your-command>
   ```

## Testing

We use Vitest for testing. Tests are located in `src/**/*.test.ts` files.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run tests with UI
npm run test:ui
```

### Writing Tests

- Place test files next to the code they test with `.test.ts` extension
- Use descriptive test names that explain what is being tested
- Follow the AAA pattern: Arrange, Act, Assert
- Mock external dependencies when appropriate
- Test both success and error cases

Example:
```typescript
import { describe, it, expect } from 'vitest';

describe('myFunction', () => {
  it('should return expected value for valid input', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

## Submitting Changes

1. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "Add feature: description of your changes"
   ```

2. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. Create a Pull Request on GitHub with:
   - A clear title describing the change
   - A detailed description of what was changed and why
   - References to any related issues
   - Screenshots or examples if applicable

4. Wait for review and address any feedback

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode in `tsconfig.json`
- Provide type annotations for function parameters and return values
- Avoid using `any` type unless absolutely necessary
- Use interfaces for object shapes and types for unions/primitives

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons at the end of statements
- Follow existing code formatting
- Run linting before committing:
  ```bash
  npm run lint
  ```

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for classes and types/interfaces
- Use UPPER_SNAKE_CASE for constants
- Use descriptive, meaningful names

### Comments and Documentation

- Add JSDoc comments for public functions:
  ```typescript
  /**
   * Brief description of function
   * @param paramName - Description of parameter
   * @returns Description of return value
   */
  ```
- Use inline comments sparingly, only when code intent is not clear
- Update README.md if adding new features or changing behavior

### Error Handling

- Use try-catch blocks for async operations
- Provide clear error messages to users
- Log errors with appropriate context
- Don't expose sensitive information in error messages

### Git Workflow

- Keep commits atomic (one logical change per commit)
- Use conventional commit format (see below)
- Rebase your branch on upstream main before submitting PR
- Squash commits if requested during review

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated changelog generation and semantic versioning.

**Format**: `<type>(<scope>): <description>`

**Types**:
- `feat`: New feature (triggers minor version bump)
- `fix`: Bug fix (triggers patch version bump)
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates, etc.

**Breaking Changes**: Add `!` after type or include `BREAKING CHANGE:` in footer (triggers major version bump)

**Examples**:
```bash
# New feature
git commit -m "feat(chat): add conversational assistant command"

# Bug fix
git commit -m "fix(todo): resolve priority sorting issue"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api)!: change storage format to JSON"
git commit -m "refactor(cli): restructure command interface

BREAKING CHANGE: Command syntax has changed. See migration guide."

# With scope
git commit -m "feat(goal): add deadline support"
git commit -m "fix(recall): improve search accuracy"

# Without scope
git commit -m "chore: update dependencies"
git commit -m "test: add integration tests"
```

**Scopes** (optional but recommended):
- `cli`: CLI infrastructure
- `goal`: Goal management
- `todo`: Todo management
- `history`: History logging
- `context`: Context management
- `recall`: Semantic recall
- `reflect`: Reflection system
- `plugin`: Claude Code plugin
- `chat`: Chat command
- `log`: Logging commands

## Release Process

### For Maintainers

Aissist uses automated GitHub Actions workflows to handle releases. When you push a version tag, the system automatically:
- Updates version numbers across all files
- Generates a changelog from commits
- Builds and tests the code
- Publishes to npm
- Creates a GitHub release

#### Creating a Release

**Quick Start** (Recommended):

Simply run the release command and follow the interactive prompts:

```bash
npm run release
```

The script will:
1. Verify your environment is ready (clean working directory, on main branch, up to date)
2. Prompt you to select version bump type (major, minor, or patch)
3. Update all version files automatically
4. Create git tag and push to GitHub
5. Display the GitHub Actions workflow URL to monitor progress

That's it! The automated workflow will handle building, testing, publishing to npm, and creating the GitHub release.

---

**Advanced: Manual Release Process**

If you need manual control, you can create releases the traditional way:

1. **Ensure main branch is ready**:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Verify tests pass locally**:
   ```bash
   npm test
   npm run build
   npm run lint
   ```

3. **Create and push a version tag**:
   ```bash
   # For a new feature release (minor version)
   git tag -a v1.1.0 -m "Release 1.1.0"

   # For a bug fix release (patch version)
   git tag -a v1.0.1 -m "Release 1.0.1"

   # For a breaking change (major version)
   git tag -a v2.0.0 -m "Release 2.0.0"

   # Push the tag to trigger the release
   git push origin v1.1.0
   ```

4. **Monitor the release workflow**:
   - Go to GitHub Actions tab
   - Watch the "Release" workflow progress
   - Verify all steps complete successfully

5. **Verify the release**:
   - Check npm: `npm view aissist@latest version`
   - Check GitHub Releases page
   - Test installation: `npm install -g aissist@<version>`

#### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (v2.0.0): Breaking changes, incompatible API changes
- **MINOR** (v1.1.0): New features, backward-compatible
- **PATCH** (v1.0.1): Bug fixes, backward-compatible

Pre-release versions:
```bash
git tag -a v1.1.0-beta.1 -m "Beta release 1.1.0-beta.1"
git tag -a v1.1.0-rc.1 -m "Release candidate 1.1.0-rc.1"
```

#### Required Secrets

The release workflow requires the following GitHub repository secrets:

**NPM_TOKEN** (required for npm publishing):
1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Go to Access Tokens → Generate New Token
3. Select "Automation" token type
4. Copy the generated token
5. In GitHub repository: Settings → Secrets and variables → Actions
6. Click "New repository secret"
7. Name: `NPM_TOKEN`
8. Value: paste the token
9. Click "Add secret"

**GITHUB_TOKEN** (automatically provided):
- GitHub automatically provides this token
- No manual configuration needed
- Used for creating GitHub releases

#### Troubleshooting Releases

**Release script (`npm run release`) fails**:

*Dirty working directory error*:
- Commit or stash your changes: `git add . && git commit -m "your message"`
- Or stash: `git stash`

*Not on main branch error*:
- Checkout main: `git checkout main`

*Behind origin/main error*:
- Pull latest changes: `git pull origin main`

*Unpushed commits error*:
- Push your commits first: `git push origin main`

*Push failed error*:
- Check network connection
- Verify you have push permissions
- Tag was created locally, you can push manually:
  ```bash
  git push origin main
  git push origin v1.2.3
  ```

**Release workflow fails at npm publish**:
- Verify NPM_TOKEN secret is configured
- Check token has publish permissions
- Ensure package name isn't taken
- Verify version doesn't already exist on npm

**Release workflow fails at tests**:
- Run tests locally: `npm test`
- Fix failing tests before retrying
- Delete the tag: `git tag -d v1.0.0 && git push origin :refs/tags/v1.0.0`
- Fix issues and create tag again

**Version mismatch between files**:
- The `scripts/update-version.js` script ensures synchronization
- Manually verify: `package.json`, `aissist-plugin/.claude-plugin/plugin.json`, `aissist-plugin/.claude-plugin/marketplace.json`

**Rolling back a release**:
```bash
# Delete the git tag locally and remotely
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Deprecate the npm package (don't unpublish)
npm deprecate aissist@1.0.0 "This version has been deprecated"

# Delete GitHub release (via GitHub UI or gh CLI)
gh release delete v1.0.0
```

## Feature Requests and Bug Reports

- Use GitHub Issues to report bugs or request features
- For bugs, include:
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Environment details (OS, Node version, etc.)
- For features, include:
  - Use case description
  - Proposed solution
  - Alternative solutions considered

## Questions?

If you have questions about contributing, feel free to:
- Open a GitHub issue
- Check existing issues and discussions
- Review the README.md for usage information

Thank you for contributing to Aissist!
