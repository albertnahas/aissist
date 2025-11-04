# Proposal: Add Todo Management

## Problem
Users need a lightweight way to track small, actionable tasks alongside their goals. Currently, aissist focuses on high-level goals but lacks support for daily, granular task management. Users want to:
- Quickly capture todos with minimal friction
- Mark todos as complete and log them to history automatically
- Link todos to goals for better context and tracking
- Manage todos interactively (complete, edit, remove)

## Solution
Add a `todo` command with subcommands for managing small, actionable tasks. Todos will be stored in dated Markdown files (`todos/YYYY-MM-DD.md`), similar to goals and history. When todos are completed, they'll be automatically marked in the todo file and logged to history with timestamps and goal links.

## Scope
This change adds:
1. **Todo storage**: New `todos/` directory with dated Markdown files
2. **Todo commands**: `add`, `list`, `done`, `remove`, `edit` subcommands
3. **Interactive completion**: Checkbox UI in `list` command for batch completion
4. **History integration**: Completed todos automatically logged to history
5. **Goal linking**: Optional `--goal` flag for keyword matching or interactive selection

## Out of Scope
- Recurring todos
- Todo priorities or categories (can use existing goal linkage)
- Cross-day todo management (todos are date-specific)
- Todo dependencies or subtasks

## Impact
- **Users**: Simpler task tracking with automatic history logging
- **Codebase**: New command module, storage utilities, interactive UI
- **Testing**: Unit tests for todo operations, integration tests for history logging

## Dependencies
- Reuses existing `goal-matcher.ts` for goal keyword matching
- Reuses existing storage utilities (`appendToMarkdown`, `readMarkdown`)
- Uses `@inquirer/prompts` for interactive UI (checkbox)

## Related Changes
- Integrates with `propose` command: after generating proposals, offer to create todos
- Complements existing goal management: todos are smaller, short-term actions

## Open Questions
None identified. Requirements are clear and implementation patterns are established in the codebase.
