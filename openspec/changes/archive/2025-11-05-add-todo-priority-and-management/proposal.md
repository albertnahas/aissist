# Proposal: add-todo-priority-and-management

## Overview

Add priority-based ordering to todos with z-index-style numerical values, and introduce an interactive `todo manage` command that provides a comprehensive interface for all todo operations, similar to the existing goal management interface.

## Context

Currently, todos are stored and displayed in chronological order (by timestamp). There's no way to prioritize urgent tasks over less important ones. Additionally, while individual commands exist for todo operations (add, done, remove, edit), there's no unified interactive interface like the one available for goal management (`goal list` interactive mode).

## Problem Statement

1. **No Priority System**: Users cannot mark certain todos as more important or urgent, leading to difficulty in task prioritization
2. **No Unified Management Interface**: Users must remember and execute separate commands for each todo operation, whereas goals have a convenient interactive menu

## Proposed Solution

### 1. Priority Field for Todos

- Add an optional `priority` field to `TodoEntry` interface (numeric, default: 0)
- Support `--priority <number>` flag on `todo add` command
- Store priority inline in markdown format: `- [ ] Task text (Priority: 5) (Goal: goal-name)`
- When listing todos, sort by priority (descending) then by timestamp

### 2. Interactive Todo Management Command

Add `todo manage` command (or enhance `todo list` interactive mode) with the following operations:

- **✓ Complete**: Mark todo as done and log to history
- **✗ Delete**: Remove todo without logging
- **✏️ Edit**: Modify todo text
- **⚡ Set Priority**: Update priority value
- **🎯 Link Goal**: Add or change goal linkage
- **← Cancel**: Exit without changes

This mirrors the existing goal management interface in `goal.ts:230-359`.

## User Stories

1. **As a user**, I want to assign priority values to my todos so that urgent tasks appear at the top of my list
2. **As a user**, I want to run `todo manage` to see an interactive list where I can perform any operation on any todo without remembering specific command syntax
3. **As a user**, I want my todo list to automatically sort by priority so I focus on what matters most

## Benefits

- **Better Task Prioritization**: High-priority tasks surface to the top automatically
- **Improved UX**: Single interactive command for all todo operations reduces cognitive load
- **Consistency**: Matches the existing goal management interaction pattern
- **Flexibility**: Priority is optional; existing workflows remain unchanged

## Risks & Mitigations

- **Breaking Change**: Existing todos without priority still work (default priority: 0)
- **File Format Change**: Priority is stored inline but parsed gracefully; old entries remain valid
- **Migration**: No migration needed; new field is optional and backward-compatible

## Related Specs

- `todo-management`: Will be extended with priority requirements
- `goal-management`: Serves as the reference for interactive management UX

## Success Criteria

1. `todo add "Task" --priority 10` successfully stores priority
2. `todo list` displays todos sorted by priority (high to low), then timestamp
3. `todo manage` provides interactive menu with all operations
4. Existing todos without priority continue to work (default: 0)
5. All tests pass with priority field present
