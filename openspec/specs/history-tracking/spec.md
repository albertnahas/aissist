# history-tracking Specification

## Purpose
TBD - created by archiving change add-aissist-mvp. Update Purpose after archive.
## Requirements
### Requirement: Log History Entries
The system SHALL allow users to log daily activities and events to dated Markdown files with optional goal linking and optional custom date specification for retroactive logging.

**Changes**: Added support for `--date` flag to enable retroactive/retrospective logging to past dates.

#### Scenario: Log history entry to current date (default)
- **WHEN** the user runs `aissist history log "Completed code review"`
- **THEN** the system appends the entry to history/YYYY-MM-DD.md for today's date with a timestamp
- **AND** supports optional goal linking via the `--goal` flag

#### Scenario: Log history entry to past date (ISO format)
- **WHEN** the user runs `aissist history log "Fixed bug" --date 2025-11-05`
- **THEN** the system appends the entry to history/2025-11-05.md with current timestamp
- **AND** creates the date file if it doesn't exist
- **AND** supports goal linking via the `--goal` flag

#### Scenario: Log history entry to past date (natural language)
- **WHEN** the user runs `aissist history log "Team meeting" --date "yesterday"`
- **THEN** the system parses "yesterday" to determine the target date
- **AND** appends the entry to the corresponding history file with current timestamp
- **AND** supports natural language like "yesterday", "last Monday", "last week"

#### Scenario: Invalid date format for retroactive logging
- **WHEN** the user provides an invalid date format via `--date`
- **THEN** the system displays an error message explaining the format
- **AND** suggests valid formats (YYYY-MM-DD, "yesterday", "last Monday", etc.)
- **AND** does not create a history entry

#### Scenario: Retroactive logging preserves current timestamp
- **WHEN** the user logs a history entry to a past date
- **THEN** the entry's timestamp (HH:MM) reflects the current time, not the target date's time
- **AND** the entry is appended to the target date's file chronologically

#### Scenario: Retroactive logging with multiline text
- **WHEN** the user logs a multiline history entry to a past date
- **THEN** the system preserves the multiline formatting
- **AND** logs to the specified date's file
- **AND** goal metadata (if present) appears after all entry text

#### Scenario: Multiple retroactive entries same date
- **WHEN** the user logs multiple entries to the same past date
- **THEN** each entry is appended chronologically with its own timestamp
- **AND** each entry can have its own independent goal link

### Requirement: History File Format
The system SHALL store history entries in structured Markdown format with YAML front matter including schema version for metadata.

**Changes**: Added mandatory `schema_version` field to YAML front matter for format versioning and future evolution.

#### Scenario: YAML front matter includes schema version
- **WHEN** a history entry is logged
- **THEN** the YAML front matter includes `schema_version: "1.0"` as the first field
- **AND** the schema version is a string in "MAJOR.MINOR" format
- **AND** the current schema version is "1.0"

#### Scenario: Example history entry with schema version
- **WHEN** a history entry is stored
- **THEN** it follows this format:
```markdown
---
schema_version: "1.0"
timestamp: "16:45"
goal: team-alignment
---

Completed sprint retrospective meeting
```

#### Scenario: Parse history with schema version
- **WHEN** reading a history entry with YAML front matter
- **THEN** the system extracts the `schema_version` field
- **AND** validates it against known versions ("1.0")
- **AND** uses the version to determine parsing behavior
- **AND** constructs a HistoryItemEntry object with all fields populated

#### Scenario: Parse history without schema version (backward compatibility)
- **WHEN** reading a history entry without `schema_version` field
- **THEN** the system defaults to schema version "1.0"
- **AND** parses the entry using v1.0 format
- **AND** does NOT log any warnings or errors
- **AND** the entry works identically to versioned entries

#### Scenario: Handle unknown schema version for history
- **WHEN** reading a history entry with an unknown schema version
- **THEN** the system logs a warning message indicating the unknown version
- **AND** falls back to parsing as schema version "1.0"
- **AND** continues processing without failing
- **AND** the history entry is still usable

### Requirement: History Retrieval
The system SHALL allow users to view their history logs, defaulting to all history entries, with optional date range filtering using natural language or ISO dates.

**Changes**: Changed `--date` flag behavior from "show specific date" to "show since this date". Added natural language support for date filtering.

#### Scenario: View all history by default
- **WHEN** the user runs `aissist history show`
- **THEN** the system displays all history entries from all dates
- **AND** sorts entries chronologically (newest first)
- **AND** includes date separators for readability (e.g., "## 2025-11-06")

#### Scenario: View history since specific date (ISO format)
- **WHEN** the user runs `aissist history show --date 2025-11-01`
- **THEN** the system displays history entries from 2025-11-01 onwards (inclusive)
- **AND** sorts entries chronologically (newest first)
- **AND** includes date separators

#### Scenario: View history since date (natural language)
- **WHEN** the user runs `aissist history show --date "last week"`
- **THEN** the system parses "last week" to determine the start date
- **AND** displays history entries from that date onwards (inclusive)
- **AND** sorts entries chronologically (newest first)

#### Scenario: Natural language timeframe examples
- **WHEN** the user provides natural language timeframes
- **THEN** the system supports:
  - "last week" - entries since start of last week
  - "last month" - entries since start of last month
  - "last quarter" - entries since start of last quarter
  - "this week" - entries since start of this week
  - "this month" - entries since start of this month

#### Scenario: Invalid date format
- **WHEN** the user provides an invalid date format
- **THEN** the system displays an error message explaining the format
- **AND** suggests valid formats (YYYY-MM-DD, "last week", "last month", etc.)

#### Scenario: No history found since date
- **WHEN** no history exists since the specified date
- **THEN** the system displays a message indicating no history was found
- **AND** suggests logging history with `aissist history log`

### Requirement: Link History Entries to Goals
The system SHALL store goal linkage in YAML front matter instead of inline text.

**Changes**: Goal metadata moved from inline `Goal: codename` to YAML `goal: codename` field.

#### Scenario: Store goal link in YAML
- **WHEN** logging a history entry with goal linkage
- **THEN** the system adds `goal: codename` to YAML front matter
- **AND** does NOT append `Goal: codename` to the text body
- **AND** the goal is available for filtering and recall

#### Scenario: Parse goal link from YAML
- **WHEN** reading a history entry with YAML front matter
- **THEN** the system extracts the `goal` field from YAML
- **AND** associates it with the history entry
- **AND** makes it available for goal-filtered history queries

### Requirement: YAML Serialization for History
The system SHALL serialize history metadata to YAML front matter format when creating or updating history entries.

#### Scenario: Serialize new history entry to YAML
- **WHEN** a new history entry is logged
- **THEN** the system constructs YAML front matter with timestamp and optional goal
- **AND** appends the history text after the front matter delimiter
- **AND** writes the complete entry to the history file

#### Scenario: Omit null goal in YAML output
- **WHEN** serializing a history entry without goal linkage
- **THEN** the YAML front matter omits the `goal` field
- **AND** only includes timestamp
- **AND** produces cleaner, more readable YAML

#### Scenario: Multiline history text formatting
- **WHEN** a history entry contains multiline text
- **THEN** the markdown body preserves line breaks
- **AND** YAML front matter is cleanly separated
- **AND** the entry is properly formatted

### Requirement: Migration Logging for History
The system SHALL log information about history format migrations for user awareness and debugging.

#### Scenario: Log successful history migration
- **WHEN** auto-migrating a history file from inline to YAML format
- **THEN** the system logs an info message indicating migration occurred
- **AND** includes the file path and count of migrated entries
- **AND** displays during verbose mode or debug logging

#### Scenario: Log history migration failures
- **WHEN** auto-migration fails due to parse errors
- **THEN** the system logs a warning message
- **AND** indicates which entries could not be migrated
- **AND** advises user to check file format manually

