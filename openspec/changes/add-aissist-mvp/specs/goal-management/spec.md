# Goal Management Specification

## ADDED Requirements

### Requirement: Add Goals
The system SHALL allow users to add goals which are stored in dated Markdown files.

#### Scenario: Add goal with text argument
- **WHEN** the user runs `aissist goal add "Complete project proposal"`
- **THEN** the system appends the goal to goals/YYYY-MM-DD.md with a timestamp

#### Scenario: Add goal with multiline text
- **WHEN** the user runs `aissist goal add` with multiline text in quotes
- **THEN** the system preserves the multiline formatting in the Markdown file

#### Scenario: Add multiple goals same day
- **WHEN** the user adds multiple goals on the same day
- **THEN** each goal is appended as a separate entry with its own timestamp

### Requirement: Goal File Format
The system SHALL store goals in a structured Markdown format with timestamps and metadata.

#### Scenario: Format goal entry
- **WHEN** a goal is added
- **THEN** the entry includes:
  - A timestamp (HH:MM format)
  - The goal text
  - Markdown formatting for readability

### Requirement: Goal Visibility
The system SHALL allow users to view their stored goals.

#### Scenario: List today's goals
- **WHEN** the user runs `aissist goal list`
- **THEN** the system displays all goals from today's date

#### Scenario: List goals for specific date
- **WHEN** the user runs `aissist goal list --date YYYY-MM-DD`
- **THEN** the system displays all goals from the specified date

#### Scenario: No goals found
- **WHEN** no goals exist for the requested date
- **THEN** the system displays a message indicating no goals were found
