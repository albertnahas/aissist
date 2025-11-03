# Add Aissist MVP

## Why

Users need a simple, local-first way to track goals, reflections, daily activities, and contextual information across multiple projects. Existing solutions either require cloud services (privacy concerns), use proprietary formats (vendor lock-in), or lack AI-powered semantic search capabilities. Aissist solves this by providing a CLI-native, Markdown-based personal assistant that works offline and integrates seamlessly with developer workflows.

## What Changes

This proposal introduces the complete MVP of Aissist with the following capabilities:

- **CLI Infrastructure**: Command-line interface using commander with interactive prompts
- **Storage System**: Dual-mode storage supporting both global (~/.aissist/) and local (./.aissist/) memory scopes
- **Goal Management**: Track and store personal goals with date-based organization
- **History Tracking**: Log daily activities and events
- **Context Management**: Organize information by context (work, diet, etc.) with support for text and file inputs
- **Reflection System**: Interactive guided reflection with structured prompts
- **Semantic Recall**: AI-powered search and summarization across all stored memories
- **Claude Integration**: Authentication and reasoning via @anthropic-ai/agent-sdk

All data is stored as human-readable Markdown files organized by date, making it Git-compatible and fully transparent to users.

## Impact

### Affected Specs
- **NEW**: cli-infrastructure
- **NEW**: storage-system
- **NEW**: goal-management
- **NEW**: history-tracking
- **NEW**: context-management
- **NEW**: reflection-system
- **NEW**: semantic-recall
- **NEW**: claude-integration

### Affected Code
This is a greenfield project. All code will be new:
- `bin/aissist.js` - CLI entry point
- `src/commands/*.ts` - Command handlers (init, goal, history, context, reflect, recall, path)
- `src/llm/claude.ts` - Claude SDK integration
- `src/utils/storage.ts` - Storage layer with global/local resolution
- `src/utils/date.ts` - Date formatting utilities
- `src/utils/search.ts` - File search utilities
- `package.json` - Dependencies and build configuration
- `tsconfig.json` - TypeScript configuration

### Dependencies Added
- commander (^12.0.0)
- @inquirer/core (^10.0.0)
- chalk (^5.3.0)
- ora (^8.0.0)
- @anthropic-ai/agent-sdk (latest)
- zod (^3.22.0)
- typescript (^5.3.0)
- vitest (^1.0.0) - dev dependency

### User Impact
- Users can start tracking their personal information immediately after running `aissist init`
- All data remains on the user's machine with full transparency
- Works offline except for AI-powered semantic recall
- Compatible with existing Git workflows
- Optional integration with Claude Code slash commands for enhanced productivity
