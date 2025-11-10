# context-management Specification

## Purpose
TBD - created by archiving change add-aissist-mvp. Update Purpose after archive.
## Requirements
### Requirement: Context-Specific Logging
The system SHALL allow users to log information organized by context (e.g., work, diet, fitness) with optional custom date specification for retroactive logging.

**Changes**: Added support for `--date` flag to enable retroactive/retrospective logging to past dates.

#### Scenario: Log text to context for current date (default)
- **WHEN** the user runs `aissist context log work "Sprint planning meeting notes"`
- **THEN** the system appends the entry to context/work/YYYY-MM-DD.md for today's date with a timestamp
- **AND** supports optional goal linking via the `--goal` flag

#### Scenario: Log text to context for past date (ISO format)
- **WHEN** the user runs `aissist context log work "Meeting notes" --date 2025-11-05`
- **THEN** the system appends the entry to context/work/2025-11-05.md with current timestamp
- **AND** creates the date file if it doesn't exist
- **AND** supports goal linking via the `--goal` flag

#### Scenario: Log text to context for past date (natural language)
- **WHEN** the user runs `aissist context log diet "Meal log" --date "yesterday"`
- **THEN** the system parses "yesterday" to determine the target date
- **AND** appends the entry to the corresponding context file with current timestamp
- **AND** supports natural language like "yesterday", "last Monday", "last week"

#### Scenario: Log file contents to context for past date
- **WHEN** the user runs `aissist context log diet ./meal-plan.txt --date 2025-11-05`
- **THEN** the system reads the file contents and stores them in context/diet/2025-11-05.md
- **AND** includes the file path as the source indicator
- **AND** uses current timestamp for the entry

#### Scenario: Invalid date format for retroactive context logging
- **WHEN** the user provides an invalid date format via `--date`
- **THEN** the system displays an error message explaining the format
- **AND** suggests valid formats (YYYY-MM-DD, "yesterday", "last Monday", etc.)
- **AND** does not create a context entry

#### Scenario: Retroactive context logging preserves current timestamp
- **WHEN** the user logs a context entry to a past date
- **THEN** the entry's timestamp (HH:MM) reflects the current time, not the target date's time
- **AND** the entry is appended to the target date's file chronologically

#### Scenario: Retroactive context logging with goal linking
- **WHEN** the user logs a context entry to a past date with `--goal` flag
- **THEN** the system performs goal linking as usual
- **AND** the goal metadata is included in the retroactive entry
- **AND** the entry is logged to the specified past date's file

### Requirement: Context Isolation
The system SHALL maintain separate directories for each context to prevent data mixing.

#### Scenario: Isolated context storage
- **WHEN** entries are logged to different contexts
- **THEN** each context's data is stored in its own subdirectory under context/

#### Scenario: List available contexts
- **WHEN** the user runs `aissist context list`
- **THEN** the system displays all context directories that have been created

### Requirement: File Input Support
The system SHALL store file source information in YAML front matter.

**Changes**: Source metadata moved from inline `**Source:** ...` to YAML `source` field.

#### Scenario: Store file source in YAML
- **WHEN** logging context from a file
- **THEN** the system adds `source: "File: path/to/file.txt"` to YAML front matter
- **AND** does NOT include `**Source:** ...` in the content body
- **AND** the source is available for display and filtering

#### Scenario: Store text source in YAML
- **WHEN** logging context from direct text input
- **THEN** the system adds `source: "Text"` to YAML front matter
- **AND** does NOT include `**Source:** ...` in the content body

### Requirement: Context Entry Format
The system SHALL store context entries in structured Markdown format with YAML front matter including schema version for metadata.

**Changes**: Added mandatory `schema_version` field to YAML front matter for format versioning and future evolution.

#### Scenario: YAML front matter includes schema version
- **WHEN** a context entry is logged
- **THEN** the YAML front matter includes `schema_version: "1.0"` as the first field
- **AND** the schema version is a string in "MAJOR.MINOR" format
- **AND** the current schema version is "1.0"

#### Scenario: Example context entry with schema version
- **WHEN** a context entry is stored
- **THEN** it follows this format:
```markdown
---
schema_version: "1.0"
timestamp: "11:20"
source: "File: meal-plan.txt"
goal: healthy-eating
---

[content here]
```

#### Scenario: Parse context with schema version
- **WHEN** reading a context entry with YAML front matter
- **THEN** the system extracts the `schema_version` field
- **AND** validates it against known versions ("1.0")
- **AND** uses the version to determine parsing behavior
- **AND** constructs a ContextItemEntry object with all fields populated

#### Scenario: Parse context without schema version (backward compatibility)
- **WHEN** reading a context entry without `schema_version` field
- **THEN** the system defaults to schema version "1.0"
- **AND** parses the entry using v1.0 format
- **AND** does NOT log any warnings or errors
- **AND** the entry works identically to versioned entries

#### Scenario: Handle unknown schema version for context
- **WHEN** reading a context entry with an unknown schema version
- **THEN** the system logs a warning message indicating the unknown version
- **AND** falls back to parsing as schema version "1.0"
- **AND** continues processing without failing
- **AND** the context entry is still usable

### Requirement: Context Retrieval
The system SHALL allow users to view entries from specific contexts.

#### Scenario: View context entries for today
- **WHEN** the user runs `aissist context show work`
- **THEN** the system displays all work context entries from today

#### Scenario: View context entries for specific date
- **WHEN** the user runs `aissist context show work --date YYYY-MM-DD`
- **THEN** the system displays all work context entries from the specified date

### Requirement: Link Context Entries to Goals
The system SHALL store goal linkage in YAML front matter instead of inline text.

**Changes**: Goal metadata moved from inline `Goal: codename` to YAML `goal: codename` field.

#### Scenario: Store goal link in YAML
- **WHEN** logging a context entry with goal linkage
- **THEN** the system adds `goal: codename` to YAML front matter
- **AND** does NOT append `Goal: codename` to the content body
- **AND** the goal is available for filtering and recall

#### Scenario: Parse goal link from YAML
- **WHEN** reading a context entry with YAML front matter
- **THEN** the system extracts the `goal` field from YAML
- **AND** associates it with the context entry
- **AND** makes it available for goal-filtered context queries

### Requirement: YAML Serialization for Context
The system SHALL serialize context metadata to YAML front matter format when creating or updating context entries.

#### Scenario: Serialize new context entry to YAML
- **WHEN** a new context entry is logged
- **THEN** the system constructs YAML front matter with timestamp, source, and optional goal
- **AND** appends the context content after the front matter delimiter
- **AND** writes the complete entry to the context file

#### Scenario: Omit null goal in YAML output
- **WHEN** serializing a context entry without goal linkage
- **THEN** the YAML front matter omits the `goal` field
- **AND** only includes timestamp and source
- **AND** produces cleaner, more readable YAML

#### Scenario: Escape file paths in YAML
- **WHEN** serializing a context entry with file source
- **THEN** the YAML serializer properly quotes the file path
- **AND** handles special characters in paths
- **AND** ensures valid YAML syntax

#### Scenario: Multiline context content formatting
- **WHEN** a context entry contains multiline content
- **THEN** the markdown body preserves line breaks and formatting
- **AND** YAML front matter is cleanly separated
- **AND** the entry is properly formatted

### Requirement: Migration Logging for Context
The system SHALL log information about context format migrations for user awareness and debugging.

#### Scenario: Log successful context migration
- **WHEN** auto-migrating a context file from inline to YAML format
- **THEN** the system logs an info message indicating migration occurred
- **AND** includes the file path and count of migrated entries
- **AND** displays during verbose mode or debug logging

#### Scenario: Log context migration failures
- **WHEN** auto-migration fails due to parse errors
- **THEN** the system logs a warning message
- **AND** indicates which entries could not be migrated
- **AND** advises user to check file format manually

