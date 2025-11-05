# Project Context

## Purpose
Aissist is a local-first, AI-powered CLI personal assistant that helps users track goals, reflections, history, and context logs. It provides semantic recall using Claude AI and works across multiple scoped directories with full Git compatibility.

## Tech Stack
- **Language**: TypeScript (Node.js >= 20.19.0)
- **CLI Framework**: commander
- **UI/Prompts**: @inquirer/core, chalk, ora
- **File I/O**: Native fs, path modules
- **AI Integration**: @anthropic-ai/agent-sdk
- **Schema Validation**: zod
- **Testing**: vitest (optional)
- **Package Manager**: npm/pnpm

## Project Conventions

### Code Style
- Use TypeScript with strict mode enabled
- Follow standard ESLint configuration
- Use kebab-case for file names
- Use PascalCase for class names, camelCase for functions/variables
- Prefer async/await over callbacks
- Use descriptive variable names
- Keep functions small and focused (single responsibility)

### Architecture Patterns
- **Modular Command Pattern**: Each CLI command is a separate module in `src/commands/`
- **Storage Abstraction**: Centralized storage logic in `src/utils/storage.ts` that resolves global vs local paths
- **Markdown-First**: All data stored as dated Markdown files for human readability and Git compatibility
- **Layered Architecture**:
  - CLI layer (command handlers)
  - Service layer (business logic)
  - Storage layer (file I/O)
  - LLM layer (AI integration)

### Testing Strategy
- Unit tests for utility functions
- Integration tests for CLI commands
- Manual testing for interactive prompts
- Test with both global and local storage modes
- Validate Markdown file structure

### Git Workflow
- Main branch for stable releases
- Feature branches for new capabilities
- Conventional commits (feat:, fix:, docs:, etc.)
- All user data (.aissist/) should be .gitignore'd by default

## Domain Context
- **Memory Scope**: Users can have global memory (~/.aissist/) and per-project memory (./.aissist/)
- **Date-Based Storage**: All entries organized by YYYY-MM-DD.md files
- **Context Isolation**: Different contexts (e.g., work, diet) are stored in separate subdirectories
- **Semantic Search**: Uses Claude to summarize and answer questions from matched text excerpts

## Important Constraints
- Must work offline except for AI-powered recall
- No databases or complex dependencies
- All data must be human-readable Markdown
- Must respect user privacy (local-first)

## External Dependencies
- **Claude API**: Via @anthropic-ai/agent-sdk for semantic recall
- **Claude Code**: Used for AI-powered recall and propose commands
- No other external services required
