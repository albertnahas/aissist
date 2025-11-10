# todo-management Specification

## Purpose
TBD - created by archiving change add-todo-management. Update Purpose after archive.
## Requirements
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
The system SHALL allow users to view and interact with todos through a checkbox interface, defaulting to all incomplete todos across all dates when no date filter is specified, and supporting natural language date expressions.

**Changes**: Updated default behavior to show all incomplete todos (not just today's), and added natural language date support for the `--date` flag to match behavior of other commands like `history`.

#### Scenario: List all incomplete todos by default
- **WHEN** the user runs `aissist todo list` without any flags
- **THEN** the system displays all incomplete todos from all dates
- **AND** sorts todos by priority (descending) then by date (ascending)
- **AND** displays each todo with its date: `YYYY-MM-DD | Priority | Todo text`
- **AND** allows the user to select multiple todos to mark as complete
- **AND** updates the correct date-specific file when todos are completed

#### Scenario: List todos interactively
- **WHEN** the user runs `aissist todo list`
- **THEN** the system displays all incomplete todos across all dates with checkbox UI
- **AND** allows the user to select multiple todos to mark as complete
- **AND** updates the todo file for the correct date with checkmarks: `- [x] Task`
- **AND** logs each completed todo to `history/YYYY-MM-DD.md` with timestamp and context

#### Scenario: List todos in plain mode
- **WHEN** the user runs `aissist todo list --plain`
- **THEN** the system displays todos as plain text without interactive UI
- **AND** includes both complete and incomplete todos
- **AND** shows todos from all dates

#### Scenario: List todos for specific date (ISO format)
- **WHEN** the user runs `aissist todo list --date 2025-11-03`
- **THEN** the system displays todos from `todos/2025-11-03.md` only
- **AND** shows interactive or plain mode based on flags
- **AND** validates the ISO date format (YYYY-MM-DD)

#### Scenario: List todos for specific date (natural language)
- **WHEN** the user runs `aissist todo list --date yesterday`
- **THEN** the system parses "yesterday" to the appropriate date using `parseNaturalDate`
- **AND** displays todos from that specific date
- **AND** shows interactive or plain mode based on flags

#### Scenario: List todos for timeframe (natural language)
- **WHEN** the user runs `aissist todo list --date "this week"`
- **THEN** the system parses "this week" to a date range
- **AND** displays all incomplete todos within that date range
- **AND** sorts by priority then by date
- **AND** includes date labels for each todo

#### Scenario: Invalid date format
- **WHEN** the user provides an invalid date format (e.g., `--date "invalid"`)
- **THEN** the system displays an error message explaining the format
- **AND** suggests valid formats: YYYY-MM-DD or natural language like "today", "yesterday", "this week"

#### Scenario: Filter todos by goal
- **WHEN** the user runs `aissist todo list --goal review-code-quality`
- **THEN** the system displays only todos linked to the specified goal
- **AND** filters by exact codename match
- **AND** shows todos from all dates by default

#### Scenario: No todos found
- **WHEN** no incomplete todos exist
- **THEN** the system displays: "No incomplete todos found"
- **OR** when filtering by date: "No todos found for YYYY-MM-DD"

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
The system SHALL store todos in structured Markdown format with YAML front matter including schema version for metadata and checkbox format for content.

**Changes**: Added mandatory `schema_version` field to YAML front matter for format versioning and future evolution.

#### Scenario: YAML front matter includes schema version
- **WHEN** a todo is added or updated
- **THEN** the YAML front matter includes `schema_version: "1.0"` as the first field
- **AND** the schema version is a string in "MAJOR.MINOR" format
- **AND** the current schema version is "1.0"

#### Scenario: Example todo entry with schema version
- **WHEN** a todo is stored
- **THEN** it follows this format:
```markdown
---
schema_version: "1.0"
timestamp: "09:15"
completed: false
priority: 3
goal: code-quality
---

- [ ] Review code changes
```

#### Scenario: Parse todo with schema version
- **WHEN** reading a todo entry with YAML front matter
- **THEN** the system extracts the `schema_version` field
- **AND** validates it against known versions ("1.0")
- **AND** uses the version to determine parsing behavior
- **AND** constructs a TodoEntry object with all fields populated

#### Scenario: Parse todo without schema version (backward compatibility)
- **WHEN** reading a todo entry without `schema_version` field
- **THEN** the system defaults to schema version "1.0"
- **AND** parses the entry using v1.0 format
- **AND** does NOT log any warnings or errors
- **AND** the entry works identically to versioned entries

#### Scenario: Handle unknown schema version for todos
- **WHEN** reading a todo entry with an unknown schema version
- **THEN** the system logs a warning message indicating the unknown version
- **AND** falls back to parsing as schema version "1.0"
- **AND** continues processing without failing
- **AND** the todo entry is still usable

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
- **AND** if user selects "Create TODO", parse proposal items and present multi-select checkbox
- **AND** link to the proposal's goal if one was specified

#### Scenario: Select proposals to convert to todos

- **WHEN** user selects "Create TODO" from the post-proposal menu
- **THEN** the system extracts numbered items (1., 2., 3., etc.) from the proposal
- **AND** displays them in a checkbox interface with all items selected by default
- **AND** allows user to deselect items using Space key
- **AND** creates todos only for the selected items when user confirms with Enter
- **AND** preserves goal linkage from the proposal for selected items

#### Scenario: Select proposals to convert to goals

- **WHEN** user selects "Save as goals" from the post-proposal menu
- **THEN** the system extracts numbered items from the proposal
- **AND** displays them in a checkbox interface with all items selected by default
- **AND** allows user to deselect items using Space key
- **AND** creates goals only for the selected items when user confirms with Enter
- **AND** preserves goal linkage from the proposal for selected items

#### Scenario: Cancel selection

- **WHEN** user cancels the checkbox selection (ESC or Ctrl+C)
- **THEN** the system displays "Selection cancelled"
- **AND** does not create any todos or goals
- **AND** exits gracefully

#### Scenario: No items selected

- **WHEN** user deselects all items and confirms
- **THEN** the system displays "No items selected"
- **AND** does not create any todos or goals

#### Scenario: Parse proposals into todos

- **WHEN** creating todos from selected proposals
- **THEN** the system creates one todo per selected item
- **AND** preserves goal linkage from the proposal
- **AND** displays count of todos created

#### Scenario: Skip todo creation

- **WHEN** user selects "Skip" from the post-proposal menu
- **THEN** the propose command exits without creating todos or goals
- **AND** displays: "Proposals not saved"

### Requirement: Cross-Date Todo Operations
The system SHALL support todo operations (complete, edit, remove) on todos from any date when using the default all-dates view.

#### Scenario: Complete todo from previous date
- **WHEN** the user selects a todo from yesterday in the all-dates list
- **THEN** the system updates the correct date-specific file (e.g., `todos/2025-11-06.md`)
- **AND** marks the todo as complete with `[x]`
- **AND** logs to history with today's timestamp
- **AND** preserves the goal linkage

#### Scenario: Display todos with date context
- **WHEN** listing todos from multiple dates
- **THEN** each todo displays its date in the format: `YYYY-MM-DD | [Priority] | Todo text`
- **AND** the date is visually distinct (e.g., colored or separated)
- **AND** helps users identify when todos were created

### Requirement: Natural Language Date Parsing for Todos
The system SHALL parse natural language date expressions for the `--date` flag using the same `parseNaturalDate` utility as other commands.

#### Scenario: Common natural language dates
- **WHEN** the user uses dates like "today", "yesterday", "tomorrow"
- **THEN** the system resolves them to YYYY-MM-DD format
- **AND** displays todos for that specific date

#### Scenario: Relative timeframes
- **WHEN** the user uses timeframes like "this week", "last week", "this month"
- **THEN** the system resolves them to date ranges
- **AND** displays all todos within that range
- **AND** sorts by priority then date

#### Scenario: Fallback to ISO format
- **WHEN** natural language parsing fails
- **AND** the input matches ISO format (YYYY-MM-DD)
- **THEN** the system uses the ISO date
- **AND** displays todos for that date

#### Scenario: Both parsing methods fail
- **WHEN** neither natural language nor ISO format parsing succeeds
- **THEN** the system displays: "Invalid date format: [input]"
- **AND** suggests: "Use YYYY-MM-DD format or natural language like 'today', 'yesterday', 'this week'"

### Requirement: Parse todo entries
The system SHALL extract metadata including schema version from YAML front matter and checkbox content from markdown body.

**Changes**: Updated to extract and validate `schema_version` field during parsing.

#### Scenario: Extract schema version from todo YAML
- **WHEN** reading a todo file with YAML front matter
- **THEN** the system parses `schema_version` as the first field
- **AND** normalizes missing version to "1.0"
- **AND** validates against known versions
- **AND** logs warning if unknown
- **AND** proceeds with parsing other metadata fields

### Requirement: YAML Serialization for Todos
The system SHALL serialize todo metadata to YAML front matter format when creating or updating todos.

#### Scenario: Serialize new todo to YAML
- **WHEN** a new todo is created
- **THEN** the system constructs YAML front matter with all metadata fields
- **AND** includes completed, priority, and goal fields
- **AND** appends the checkbox markdown after the front matter delimiter
- **AND** writes the complete entry to the todo file

#### Scenario: Omit default values in YAML output
- **WHEN** serializing a todo with priority 0 and no goal
- **THEN** the YAML front matter omits priority (if 0) and goal (if null)
- **AND** only includes non-default metadata
- **AND** produces cleaner, more readable YAML

#### Scenario: Update todo status in YAML
- **WHEN** marking a todo as complete
- **THEN** the system updates the `completed` field in YAML front matter
- **AND** updates the checkbox in the markdown body (`- [x]`)
- **AND** preserves all other metadata

#### Scenario: Update todo priority in YAML
- **WHEN** changing a todo's priority
- **THEN** the system updates the `priority` field in YAML front matter
- **AND** leaves the checkbox and text unchanged
- **AND** preserves goal linkage

### Requirement: Migration Logging for Todos
The system SHALL log information about todo format migrations for user awareness and debugging.

#### Scenario: Log successful todo migration
- **WHEN** auto-migrating a todo file from inline to YAML format
- **THEN** the system logs an info message indicating migration occurred
- **AND** includes the file path and count of migrated entries
- **AND** displays during verbose mode or debug logging

#### Scenario: Log todo migration failures
- **WHEN** auto-migration fails due to parse errors
- **THEN** the system logs a warning message
- **AND** indicates which entries could not be migrated
- **AND** advises user to check file format manually

