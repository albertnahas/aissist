# history-tracking Specification Delta

## MODIFIED Requirements

### Requirement: History File Format
The system SHALL store history entries in a structured Markdown format with YAML front matter for metadata and markdown body for content.

**Changes**: Migrated from inline metadata format (`Goal: codename`) to YAML front matter. Auto-migrate old format on read.

#### Scenario: Format history entry with YAML front matter
- **WHEN** a history entry is logged
- **THEN** the entry includes YAML front matter with:
  - `timestamp`: Time in HH:MM format
  - `goal`: Optional goal codename
- **AND** the markdown body contains the history text
- **AND** metadata is NOT inline in the text

#### Scenario: Example history entry format (new YAML format)
- **WHEN** a history entry is stored
- **THEN** it follows this format:
```markdown
---
timestamp: "16:45"
goal: team-alignment
---

Completed sprint retrospective meeting
```

#### Scenario: Auto-migrate legacy inline format
- **WHEN** reading a history file with old inline format (`Goal: codename`)
- **THEN** the system detects the inline goal metadata
- **AND** parses using the legacy inline parser
- **AND** automatically rewrites the file in YAML front matter format
- **AND** extracts goal from inline format to YAML field
- **AND** removes inline goal metadata from text
- **AND** all subsequent reads use the new YAML format

#### Scenario: Parse history entry with YAML front matter
- **WHEN** reading a history file with YAML front matter
- **THEN** the system uses a YAML parser to extract metadata
- **AND** extracts the markdown body as history text
- **AND** constructs a HistoryEntry object with all fields populated

#### Scenario: Handle YAML parse errors gracefully
- **WHEN** YAML parsing fails due to malformed front matter
- **THEN** the system falls back to the legacy inline parser
- **AND** logs a warning about malformed YAML
- **AND** does NOT attempt auto-migration
- **AND** keeps the entry in its current format

#### Scenario: Batch migrate entire history file
- **WHEN** a history file contains multiple entries in inline format
- **THEN** the system migrates all entries in a single file rewrite
- **AND** preserves entry order
- **AND** uses atomic file write (temp file + rename)
- **AND** all entries are converted to YAML format

#### Scenario: History entry without goal
- **WHEN** a history entry has no goal linkage
- **THEN** the YAML front matter omits the `goal` field
- **AND** only timestamp is included
- **AND** the entry is valid and parseable

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

## ADDED Requirements

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
