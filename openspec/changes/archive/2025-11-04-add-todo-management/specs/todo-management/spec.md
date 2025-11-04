# todo-management Specification

## Purpose
Enable users to manage small, actionable tasks with optional goal linkage and automatic history logging upon completion.

## ADDED Requirements

### Requirement: Add Todos
The system SHALL allow users to add todos to dated Markdown files with optional goal linking.

#### Scenario: Add todo with text
- **WHEN** the user runs `aissist todo add "Review PR #123"`
- **THEN** the system appends the todo to `todos/YYYY-MM-DD.md` with a checkbox format `- [ ] Review PR #123`
- **AND** the todo is timestamped with HH:MM format

#### Scenario: Add todo with goal keyword
- **WHEN** the user runs `aissist todo add "Review PR #123" --goal "review"`
- **THEN** the system performs keyword matching against active goals
- **AND** links to the matching goal if exactly one match is found
- **AND** stores the goal metadata inline: `- [ ] Review PR #123 (Goal: review-code-quality)`

#### Scenario: Add todo with --date flag
- **WHEN** the user runs `aissist todo add "Call dentist" --date 2025-11-05`
- **THEN** the system appends the todo to `todos/2025-11-05.md` instead of today's file
- **AND** validates the date format before proceeding

### Requirement: List Todos
The system SHALL allow users to view and interact with todos through a checkbox interface.

#### Scenario: List todos interactively
- **WHEN** the user runs `aissist todo list`
- **THEN** the system displays all incomplete todos from today with checkbox UI
- **AND** allows the user to select multiple todos to mark as complete
- **AND** updates the todo file with checkmarks: `- [x] Task`
- **AND** logs each completed todo to `history/YYYY-MM-DD.md` with timestamp and context

#### Scenario: List todos in plain mode
- **WHEN** the user runs `aissist todo list --plain`
- **THEN** the system displays todos as plain text without interactive UI
- **AND** includes both complete and incomplete todos

#### Scenario: List todos for specific date
- **WHEN** the user runs `aissist todo list --date 2025-11-03`
- **THEN** the system displays todos from `todos/2025-11-03.md`
- **AND** shows interactive or plain mode based on flags

#### Scenario: Filter todos by goal
- **WHEN** the user runs `aissist todo list --goal review-code-quality`
- **THEN** the system displays only todos linked to the specified goal
- **AND** filters by exact codename match

#### Scenario: No todos found
- **WHEN** no todos exist for the requested date
- **THEN** the system displays: "No todos found for YYYY-MM-DD"

### Requirement: Complete Todos
The system SHALL allow users to mark todos as completed and log them to history automatically.

#### Scenario: Complete todo by index
- **WHEN** the user runs `aissist todo done 1`
- **THEN** the system marks the first incomplete todo as complete: `- [x] Task`
- **AND** logs the completed todo to `history/YYYY-MM-DD.md` with timestamp
- **AND** includes the linked goal if present: "Goal: goal-codename"
- **AND** adds context: "Completed from TODO"

#### Scenario: Complete todo by text match
- **WHEN** the user runs `aissist todo done "Review PR"`
- **THEN** the system finds the first todo matching the text substring
- **AND** marks it as complete and logs to history
- **AND** displays: "Todo completed: Review PR #123"

#### Scenario: Complete todo with goal
- **WHEN** a completed todo has a linked goal
- **THEN** the history entry includes: "Goal: goal-codename"
- **AND** the goal codename is preserved from the todo metadata

### Requirement: Remove Todos
The system SHALL allow users to remove todos without logging them to history.

#### Scenario: Remove todo by index
- **WHEN** the user runs `aissist todo remove 2`
- **THEN** the system removes the second todo from the file
- **AND** does NOT log to history
- **AND** displays: "Todo removed: [task text]"

#### Scenario: Remove todo by text match
- **WHEN** the user runs `aissist todo remove "Call dentist"`
- **THEN** the system finds and removes the first matching todo
- **AND** displays: "Todo removed: Call dentist"

### Requirement: Edit Todos
The system SHALL allow users to edit todo text while preserving completion status and metadata.

#### Scenario: Edit todo by index
- **WHEN** the user runs `aissist todo edit 1`
- **THEN** the system prompts for new text with the current text as default
- **AND** updates the todo text while preserving checkbox status and goal link
- **AND** displays: "Todo updated: [new text]"

#### Scenario: Edit todo by text match
- **WHEN** the user runs `aissist todo edit "Review PR"`
- **THEN** the system finds the first matching todo
- **AND** prompts for new text
- **AND** updates the todo

### Requirement: Todo File Format
The system SHALL store todos in standard Markdown checkbox format with optional metadata.

#### Scenario: Format incomplete todo
- **WHEN** a todo is added
- **THEN** it follows the format: `## HH:MM\n\n- [ ] Todo text`
- **AND** if linked to a goal: `- [ ] Todo text (Goal: goal-codename)`

#### Scenario: Format completed todo
- **WHEN** a todo is marked complete
- **THEN** the checkbox is updated: `- [x] Todo text`
- **AND** goal metadata is preserved

#### Scenario: Parse todo entries
- **WHEN** reading a todo file
- **THEN** the system extracts checkbox status, text, timestamp, and goal metadata
- **AND** makes them available for filtering and operations

### Requirement: History Logging on Completion
The system SHALL automatically log completed todos to history with full context.

#### Scenario: Log completed todo to history
- **WHEN** a todo is marked complete
- **THEN** the system appends an entry to `history/YYYY-MM-DD.md`
- **AND** includes timestamp in HH:MM format
- **AND** includes the todo text
- **AND** includes: "Completed from TODO"
- **AND** includes goal link if present: "Goal: goal-codename"

#### Scenario: Batch completion logging
- **WHEN** multiple todos are completed via interactive list
- **THEN** each todo is logged separately to history
- **AND** each has its own timestamp
- **AND** each preserves its own goal linkage

### Requirement: Goal Integration
The system SHALL reuse the existing goal-matcher for todo-goal linking.

#### Scenario: Keyword match for todo
- **WHEN** the user adds a todo with `--goal "keyword"`
- **THEN** the system calls `linkToGoal()` with the keyword
- **AND** stores the resulting codename in the todo metadata
- **AND** displays the matched goal to the user

#### Scenario: Interactive goal selection for todo
- **WHEN** the user adds a todo with `--goal` (no keyword)
- **THEN** the system displays all active goals interactively
- **AND** allows the user to select or skip
- **AND** stores the selected codename

### Requirement: Propose Command Integration
The system SHALL offer to create todos after generating proposals in the propose command.

#### Scenario: Offer todo creation after proposal
- **WHEN** the propose command completes successfully
- **THEN** the system offers three options via interactive prompt:
  1. "Create TODO (recommended)"
  2. "Link to goal"
  3. "Create goal"
  4. "Skip"
- **AND** if user selects "Create TODO", parse proposal items and create todos
- **AND** link to the proposal's goal if one was specified

#### Scenario: Parse proposals into todos
- **WHEN** creating todos from a proposal
- **THEN** the system extracts numbered items (1., 2., 3., etc.)
- **AND** creates one todo per item
- **AND** preserves goal linkage from the proposal

#### Scenario: Skip todo creation
- **WHEN** user selects "Skip"
- **THEN** the propose command exits without creating todos or goals
- **AND** displays: "Proposal saved (no todos created)"
