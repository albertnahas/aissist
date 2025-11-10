# context-management Specification Delta

## MODIFIED Requirements

### Requirement: Context Entry Format
The system SHALL store context entries in a structured Markdown format with YAML front matter for metadata and markdown body for content.

**Changes**: Migrated from inline metadata format (`**Source:** ...`, `Goal: codename`) to YAML front matter. Auto-migrate old format on read.

#### Scenario: Format context entry with YAML front matter
- **WHEN** a context entry is logged
- **THEN** the entry includes YAML front matter with:
  - `timestamp`: Time in HH:MM format
  - `source`: Source description (text or file path)
  - `goal`: Optional goal codename
- **AND** the markdown body contains the context content
- **AND** metadata is NOT inline in the text

#### Scenario: Example context entry format (new YAML format)
- **WHEN** a context entry is stored
- **THEN** it follows this format:
```markdown
---
timestamp: "11:20"
source: "File: meal-plan.txt"
goal: healthy-eating
---

[context content here]
```

#### Scenario: Auto-migrate legacy inline format
- **WHEN** reading a context file with old inline format (`**Source:** ...`, `Goal: codename`)
- **THEN** the system detects the inline metadata
- **AND** parses using the legacy inline parser
- **AND** automatically rewrites the file in YAML front matter format
- **AND** extracts source and goal from inline format to YAML fields
- **AND** removes inline metadata markers from text
- **AND** all subsequent reads use the new YAML format

#### Scenario: Parse context entry with YAML front matter
- **WHEN** reading a context file with YAML front matter
- **THEN** the system uses a YAML parser to extract metadata
- **AND** extracts the markdown body as context content
- **AND** constructs a ContextEntry object with all fields populated

#### Scenario: Handle YAML parse errors gracefully
- **WHEN** YAML parsing fails due to malformed front matter
- **THEN** the system falls back to the legacy inline parser
- **AND** logs a warning about malformed YAML
- **AND** does NOT attempt auto-migration
- **AND** keeps the entry in its current format

#### Scenario: Batch migrate entire context file
- **WHEN** a context file contains multiple entries in inline format
- **THEN** the system migrates all entries in a single file rewrite
- **AND** preserves entry order
- **AND** uses atomic file write (temp file + rename)
- **AND** all entries are converted to YAML format

#### Scenario: Context entry without goal
- **WHEN** a context entry has no goal linkage
- **THEN** the YAML front matter omits the `goal` field
- **AND** only timestamp and source are included
- **AND** the entry is valid and parseable

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

## ADDED Requirements

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
