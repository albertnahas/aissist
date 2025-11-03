# context-management Specification

## Purpose
TBD - created by archiving change add-aissist-mvp. Update Purpose after archive.
## Requirements
### Requirement: Context-Specific Logging
The system SHALL allow users to log information organized by context (e.g., work, diet, fitness).

#### Scenario: Log text to context
- **WHEN** the user runs `aissist context log work "Sprint planning meeting notes"`
- **THEN** the system appends the entry to context/work/YYYY-MM-DD.md with a timestamp

#### Scenario: Log file contents to context
- **WHEN** the user runs `aissist context log diet ./meal-plan.txt`
- **THEN** the system reads the file contents and stores them in context/diet/YYYY-MM-DD.md

#### Scenario: Create new context directory
- **WHEN** the user logs to a context that doesn't exist yet
- **THEN** the system creates the context directory (e.g., context/work/) automatically

### Requirement: Context Isolation
The system SHALL maintain separate directories for each context to prevent data mixing.

#### Scenario: Isolated context storage
- **WHEN** entries are logged to different contexts
- **THEN** each context's data is stored in its own subdirectory under context/

#### Scenario: List available contexts
- **WHEN** the user runs `aissist context list`
- **THEN** the system displays all context directories that have been created

### Requirement: File Input Support
The system SHALL support reading file contents for context logging.

#### Scenario: Read file successfully
- **WHEN** the user provides a valid file path
- **THEN** the system reads the file contents and stores them in the context log

#### Scenario: Handle missing file
- **WHEN** the user provides a file path that doesn't exist
- **THEN** the system displays an error message indicating the file was not found

#### Scenario: Handle unreadable file
- **WHEN** the user provides a file path without read permissions
- **THEN** the system displays an error message explaining the permission issue

### Requirement: Context Entry Format
The system SHALL store context entries in a structured Markdown format with timestamps.

#### Scenario: Format context entry
- **WHEN** a context entry is logged
- **THEN** the entry includes:
  - A timestamp (HH:MM format)
  - The source indicator (text or file path)
  - The entry content
  - Proper Markdown formatting

### Requirement: Context Retrieval
The system SHALL allow users to view entries from specific contexts.

#### Scenario: View context entries for today
- **WHEN** the user runs `aissist context show work`
- **THEN** the system displays all work context entries from today

#### Scenario: View context entries for specific date
- **WHEN** the user runs `aissist context show work --date YYYY-MM-DD`
- **THEN** the system displays all work context entries from the specified date

