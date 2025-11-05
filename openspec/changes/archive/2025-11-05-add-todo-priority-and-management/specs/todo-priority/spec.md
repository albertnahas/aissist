# todo-priority Spec Delta

## Purpose
Enable users to prioritize todos using numeric values that control display order, similar to CSS z-index.

## Relationship
Extends `todo-management` spec with priority field and sorting behavior.

---

## ADDED Requirements

### Requirement: Priority Field Storage
The system SHALL store an optional priority value with each todo entry.

#### Scenario: Add todo with priority flag
- **WHEN** the user runs `aissist todo add "Fix critical bug" --priority 10`
- **THEN** the system stores the todo with priority value 10
- **AND** formats it inline: `- [ ] Fix critical bug (Priority: 10)`
- **AND** displays confirmation: "Todo added with priority 10: Fix critical bug"

#### Scenario: Add todo without priority
- **WHEN** the user runs `aissist todo add "Review docs"`
- **THEN** the system stores the todo with default priority 0
- **AND** formats it without priority metadata: `- [ ] Review docs`
- **OR** formats it with explicit priority: `- [ ] Review docs (Priority: 0)`

#### Scenario: Add todo with goal and priority
- **WHEN** the user runs `aissist todo add "Deploy feature" --goal release --priority 8`
- **THEN** the system stores both goal and priority metadata
- **AND** formats it as: `- [ ] Deploy feature (Priority: 8) (Goal: release-v2)`
- **AND** maintains consistent metadata ordering: priority before goal

#### Scenario: Priority value validation
- **WHEN** the user provides a priority value
- **THEN** the system accepts any integer (positive, negative, or zero)
- **AND** treats higher numbers as higher priority
- **AND** allows decimal values but truncates to integer

### Requirement: Priority-Based Sorting
The system SHALL sort todos by priority (descending) then by timestamp when displaying.

#### Scenario: List todos sorted by priority
- **WHEN** the user runs `aissist todo list`
- **THEN** the system displays todos sorted by priority (highest first)
- **AND** within the same priority level, sorts by timestamp (earliest first)
- **AND** todos without priority (priority 0) appear after higher-priority todos

#### Scenario: Mixed priority todos
- **WHEN** today's todos include priorities: 10, 5, 0, 5, 3
- **THEN** the display order is: 10 → 5 (first by time) → 5 (second by time) → 3 → 0
- **AND** timestamps break ties for equal priorities

#### Scenario: Plain mode respects priority sorting
- **WHEN** the user runs `aissist todo list --plain`
- **THEN** the output is plain text but still sorted by priority
- **AND** shows priority values in parentheses when present

#### Scenario: Interactive mode respects priority sorting
- **WHEN** the user runs `aissist todo list` (interactive)
- **THEN** the checkbox list is sorted by priority
- **AND** users see high-priority tasks at the top

### Requirement: Priority Parsing
The system SHALL parse priority values from todo markdown entries.

#### Scenario: Parse priority from inline metadata
- **WHEN** reading a todo entry: `- [ ] Task (Priority: 7)`
- **THEN** the system extracts priority as integer 7
- **AND** makes it available in `TodoEntry.priority`

#### Scenario: Parse priority with goal metadata
- **WHEN** reading: `- [ ] Task (Priority: 5) (Goal: goal-name)`
- **THEN** the system extracts both priority (5) and goal (goal-name)
- **AND** populates both fields in `TodoEntry`

#### Scenario: Handle missing priority
- **WHEN** reading: `- [ ] Task without priority`
- **THEN** the system defaults `TodoEntry.priority` to 0
- **AND** treats it as lowest priority for sorting

#### Scenario: Handle malformed priority
- **WHEN** reading: `- [ ] Task (Priority: abc)`
- **THEN** the system defaults priority to 0
- **AND** logs a warning or silently ignores the invalid value

### Requirement: Priority Display
The system SHALL display priority values in todo lists when present.

#### Scenario: Show priority in interactive list
- **WHEN** displaying todos in interactive mode
- **THEN** the system shows priority as a visual indicator
- **AND** uses color coding: high (≥5) in red/yellow, low (<5) in gray
- **OR** shows priority number inline: `[P:10] Task text`

#### Scenario: Show priority in plain list
- **WHEN** displaying todos with `--plain` flag
- **THEN** the system includes priority in parentheses: `1. [ ] Task (Priority: 7)`
- **AND** omits priority display for priority 0 tasks

#### Scenario: Completion message includes priority
- **WHEN** a user completes a todo with priority
- **THEN** the success message includes: "Todo completed (Priority: 5): Task text"

### Requirement: TodoEntry Interface Extension
The system SHALL extend the `TodoEntry` interface to include priority.

#### Scenario: TodoEntry contains priority field
- **WHEN** parsing todo entries
- **THEN** each `TodoEntry` object has a `priority: number` field
- **AND** the field defaults to 0 if not present in markdown
- **AND** the field is used for sorting operations

#### Scenario: Preserve priority on update operations
- **WHEN** editing todo text with `todo edit`
- **THEN** the system preserves the existing priority value
- **AND** does not remove or reset priority during text updates

#### Scenario: Preserve priority on completion
- **WHEN** marking a todo complete
- **THEN** the system preserves priority in the completed entry: `- [x] Task (Priority: 8)`
- **AND** logs priority to history if relevant

---

## MODIFIED Requirements

### Requirement: Todo File Format (from todo-management)
The system SHALL store todos with optional priority and goal metadata in standard Markdown checkbox format.

#### Scenario: Format todo with priority and goal
- **WHEN** a todo has both priority and goal
- **THEN** it follows: `## HH:MM\n\n- [ ] Todo text (Priority: N) (Goal: goal-name)`
- **AND** priority comes before goal in metadata ordering

#### Scenario: Format completed todo with priority
- **WHEN** a todo with priority is marked complete
- **THEN** the checkbox updates: `- [x] Todo text (Priority: N)`
- **AND** priority metadata is preserved

---

## REMOVED Requirements

None.
