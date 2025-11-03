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
- Write clear commit messages:
  ```
  Add feature: Brief description

  Detailed explanation of what changed and why.
  Closes #123
  ```
- Rebase your branch on upstream main before submitting PR
- Squash commits if requested during review

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
