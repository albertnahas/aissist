# todo-interactive-management Spec Delta

## Purpose
Provide a unified interactive interface for managing todos, allowing users to perform all todo operations from a single command.

## Relationship
Extends `todo-management` spec with interactive menu interface, inspired by `goal-management` interactive interface pattern.

---

## ADDED Requirements

### Requirement: Interactive Todo Management Command
The system SHALL provide a `todo manage` command that displays an interactive menu for all todo operations.

#### Scenario: Launch interactive todo management
- **WHEN** the user runs `aissist todo manage`
- **THEN** the system displays all incomplete todos from today in a selectable list
- **AND** each list item shows: priority, timestamp, codename (if any), text, and goal link (if any)
- **AND** the list is sorted by priority (descending) then timestamp
- **AND** includes a "← Back" option to exit

#### Scenario: Launch with date filter
- **WHEN** the user runs `aissist todo manage --date 2025-11-03`
- **THEN** the system displays todos from the specified date
- **AND** follows the same interactive interface

#### Scenario: Launch with goal filter
- **WHEN** the user runs `aissist todo manage --goal release-v2`
- **THEN** the system displays only todos linked to that goal
- **AND** follows the same interactive interface

#### Scenario: No todos to manage
- **WHEN** running `todo manage` with no incomplete todos
- **THEN** the system displays: "No todos to manage for YYYY-MM-DD"
- **AND** exits gracefully

### Requirement: Todo Selection and Action Menu
The system SHALL display an action menu after the user selects a todo.

#### Scenario: Select todo and show actions
- **WHEN** the user selects a todo from the interactive list
- **THEN** the system displays an action menu with options:
  - "✓ Complete" - mark as done and log to history
  - "✗ Delete" - remove without logging
  - "✏️ Edit" - modify todo text
  - "⚡ Set Priority" - update priority value
  - "🎯 Link Goal" - add or change goal linkage
  - "← Cancel" - return to todo list

#### Scenario: Cancel action selection
- **WHEN** the user selects "← Cancel"
- **THEN** the system returns to the todo selection list
- **AND** allows selecting another todo

#### Scenario: Exit from todo list
- **WHEN** the user selects "← Back" from the todo list
- **THEN** the system exits the interactive interface
- **AND** returns to command prompt

### Requirement: Complete Action in Interactive Mode
The system SHALL allow completing a todo from the interactive menu.

#### Scenario: Complete todo via interactive menu
- **WHEN** the user selects "✓ Complete" from the action menu
- **THEN** the system marks the todo as complete: `- [x] Task`
- **AND** logs it to `history/YYYY-MM-DD.md` with timestamp and context
- **AND** displays: "Todo completed: [task text]"
- **AND** plays completion animation
- **AND** returns to the updated todo list (completed item no longer shown)

#### Scenario: Complete todo with goal
- **WHEN** completing a todo linked to a goal
- **THEN** the history entry includes: "Goal: goal-codename"
- **AND** displays: "Linked to goal: goal-codename"

### Requirement: Delete Action in Interactive Mode
The system SHALL allow deleting a todo from the interactive menu.

#### Scenario: Delete todo via interactive menu
- **WHEN** the user selects "✗ Delete" from the action menu
- **THEN** the system removes the todo from the file
- **AND** does NOT log to history
- **AND** displays: "Todo deleted: [task text]"
- **AND** returns to the updated todo list (deleted item no longer shown)

### Requirement: Edit Action in Interactive Mode
The system SHALL allow editing todo text from the interactive menu.

#### Scenario: Edit todo via interactive menu
- **WHEN** the user selects "✏️ Edit" from the action menu
- **THEN** the system prompts: "Enter new todo text:" with current text as default
- **AND** updates the todo text while preserving priority, completion status, and goal
- **AND** displays: "Todo updated: [new text]"
- **AND** returns to the updated todo list

#### Scenario: Cancel edit
- **WHEN** the user cancels the text input prompt (ESC or Ctrl+C)
- **THEN** the system displays: "Edit cancelled"
- **AND** returns to the action menu without changes

#### Scenario: Edit with no changes
- **WHEN** the user submits the same text
- **THEN** the system displays: "No changes made"
- **AND** returns to the action menu

### Requirement: Set Priority Action in Interactive Mode
The system SHALL allow updating todo priority from the interactive menu.

#### Scenario: Set priority via interactive menu
- **WHEN** the user selects "⚡ Set Priority" from the action menu
- **THEN** the system prompts: "Enter priority (number, higher = more urgent):" with current priority as default
- **AND** validates input is an integer
- **AND** updates the todo with new priority: `- [ ] Task (Priority: N)`
- **AND** displays: "Priority set to N for '[task text]'"
- **AND** returns to the updated todo list (now re-sorted by priority)

#### Scenario: Set priority to zero
- **WHEN** the user sets priority to 0
- **THEN** the system removes priority metadata: `- [ ] Task`
- **OR** keeps it explicit: `- [ ] Task (Priority: 0)`
- **AND** the todo moves to the bottom (lowest priority)

#### Scenario: Invalid priority input
- **WHEN** the user enters non-numeric input
- **THEN** the system displays: "Invalid priority. Please enter a number."
- **AND** re-prompts for input

#### Scenario: Cancel priority change
- **WHEN** the user cancels the priority prompt
- **THEN** the system displays: "Priority change cancelled"
- **AND** returns to the action menu without changes

### Requirement: Link Goal Action in Interactive Mode
The system SHALL allow linking or changing goal association from the interactive menu.

#### Scenario: Link goal via interactive menu
- **WHEN** the user selects "🎯 Link Goal" from the action menu
- **THEN** the system prompts: "Enter goal keyword for matching (or leave empty for interactive selection):"
- **AND** calls `linkToGoal()` with the keyword (or without for interactive mode)
- **AND** updates the todo with goal metadata: `- [ ] Task (Goal: goal-codename)`
- **AND** displays: "Todo linked to goal: goal-codename"
- **AND** returns to the updated todo list

#### Scenario: Remove goal link
- **WHEN** the user enters "none" or "remove" when prompted
- **THEN** the system removes goal metadata from the todo
- **AND** displays: "Goal link removed"

#### Scenario: No goals available
- **WHEN** no active goals exist
- **THEN** the system displays: "No active goals found. Create a goal first."
- **AND** returns to the action menu without changes

#### Scenario: Cancel goal linking
- **WHEN** the user cancels the goal selection
- **THEN** the system displays: "Goal linking cancelled"
- **AND** returns to the action menu without changes

### Requirement: Interactive Display Format
The system SHALL display todos in an informative format for easy selection.

#### Scenario: Display todo with all metadata
- **WHEN** displaying a todo with priority and goal in the interactive list
- **THEN** the format is: `HH:MM | [P:N] | Task text (Goal: goal-name)`
- **AND** priority is color-coded: ≥5 is red/yellow, <5 is gray
- **AND** overdue goals (if deadlines exist) are highlighted in red

#### Scenario: Display todo with partial metadata
- **WHEN** displaying a todo with only priority
- **THEN** the format is: `HH:MM | [P:N] | Task text`

#### Scenario: Display todo with minimal metadata
- **WHEN** displaying a todo without priority or goal
- **THEN** the format is: `HH:MM | Task text`

#### Scenario: Truncate long task text
- **WHEN** task text exceeds 60 characters
- **THEN** the system truncates with ellipsis: "Long task text that..."
- **AND** shows full text in the description field (below the choice)

### Requirement: Manage Command Integration with List Command
The system SHALL allow users to access management via `todo list` or `todo manage`.

#### Scenario: Access interactive management via `todo list`
- **WHEN** the user runs `aissist todo list` (no --plain flag)
- **THEN** the system displays todos with checkbox selection (current behavior)
- **AND** optionally offers a menu item: "Manage todos individually" to switch to manage mode

#### Scenario: Dedicated manage command
- **WHEN** the user runs `aissist todo manage`
- **THEN** the system skips checkbox mode and goes directly to single-todo selection with action menu
- **AND** provides full CRUD operations

---

## MODIFIED Requirements

### Requirement: List Todos (from todo-management)
The system SHALL allow users to view and interact with todos through checkbox interface OR management interface.

#### Scenario: List with manage option
- **WHEN** the user runs `aissist todo list`
- **THEN** the system displays the checkbox interface for batch completion
- **OR** provides a way to switch to individual todo management

---

## REMOVED Requirements

None.
