# goal-management Specification Delta

## MODIFIED Requirements

### Requirement: Goal File Format
The system SHALL store goals in a structured Markdown format with YAML front matter for metadata and markdown body for content.

**Changes**: Migrated from inline metadata format to YAML front matter. Auto-migrate old format on read.

#### Scenario: Format goal entry with YAML front matter
- **WHEN** a goal is added
- **THEN** the entry includes YAML front matter with:
  - `timestamp`: Time in HH:MM format
  - `codename`: Unique kebab-case codename
  - `deadline`: Optional ISO date string (YYYY-MM-DD)
  - `description`: Optional multiline description text
- **AND** the markdown body contains the goal text
- **AND** the format follows standard YAML front matter conventions

#### Scenario: Example goal entry format (new YAML format)
- **WHEN** a goal is stored
- **THEN** it follows this format:
```markdown
---
timestamp: "14:30"
codename: complete-project-proposal
deadline: "2025-11-15"
description: Detailed description of the proposal requirements
---

Complete the quarterly project proposal document
```

#### Scenario: Parse goal entry with YAML front matter
- **WHEN** reading a goal file with YAML front matter
- **THEN** the system uses a YAML parser to extract metadata
- **AND** extracts the markdown body as goal text
- **AND** constructs a GoalEntry object with all fields populated

#### Scenario: Auto-migrate legacy inline format
- **WHEN** reading a goal file with old inline format (no YAML front matter)
- **THEN** the system detects the inline format
- **AND** parses using the legacy inline parser
- **AND** automatically rewrites the file in YAML front matter format
- **AND** preserves all metadata (codename, deadline, description)
- **AND** logs a warning about the migration
- **AND** all subsequent reads use the new YAML format

#### Scenario: Preserve null values in YAML
- **WHEN** a goal has no deadline or description
- **THEN** the YAML front matter omits those fields (cleaner format)
- **AND** the parser treats missing fields as null
- **AND** the GoalEntry object has null for those fields

#### Scenario: Handle YAML parse errors gracefully
- **WHEN** YAML parsing fails due to malformed front matter
- **THEN** the system falls back to the legacy inline parser
- **AND** logs a warning about malformed YAML
- **AND** does NOT attempt auto-migration
- **AND** keeps the entry in its current format

#### Scenario: Batch migrate entire goal file
- **WHEN** a goal file contains multiple entries in inline format
- **THEN** the system migrates all entries in a single file rewrite
- **AND** preserves entry order
- **AND** uses atomic file write (temp file + rename)
- **AND** all entries are converted to YAML format

### Requirement: Goal Parsing and Search
The system SHALL parse goal entries from YAML front matter to extract codenames and metadata for management operations.

**Changes**: Updated to use YAML parser instead of regex-based inline parsing.

#### Scenario: Parse goal entry with YAML
- **WHEN** reading a goal file with YAML front matter
- **THEN** the system uses `js-yaml` to parse the front matter block
- **AND** extracts timestamp, codename, deadline, and description
- **AND** makes them available for search and filtering

#### Scenario: Find goal by codename (YAML format)
- **WHEN** a command references a goal by codename
- **THEN** the system parses all entries from the YAML format
- **AND** searches for matching codename
- **AND** returns the matching goal entry

### Requirement: Backward Compatibility
The system SHALL handle existing goal entries without YAML front matter gracefully through auto-migration.

**Changes**: Enhanced backward compatibility with automatic migration on read.

#### Scenario: Auto-migrate legacy goals on first read
- **WHEN** listing goals from files created before this change
- **THEN** the system detects inline format entries
- **AND** automatically rewrites the file in YAML format
- **AND** all subsequent operations use the new format
- **AND** no manual migration is needed

#### Scenario: Mixed format handling (during migration)
- **WHEN** a file somehow contains both YAML and inline format entries
- **THEN** the system parses both formats
- **AND** migrates the entire file to YAML format
- **AND** ensures consistency across all entries

## ADDED Requirements

### Requirement: YAML Serialization
The system SHALL serialize goal metadata to YAML front matter format when creating or updating goals.

#### Scenario: Serialize new goal to YAML
- **WHEN** a new goal is created
- **THEN** the system constructs YAML front matter with all metadata fields
- **AND** uses `js-yaml` to serialize to valid YAML
- **AND** appends the markdown body after the front matter delimiter
- **AND** writes the complete entry to the goal file

#### Scenario: Omit null fields in YAML output
- **WHEN** serializing a goal with null deadline or description
- **THEN** the YAML front matter omits those fields
- **AND** only includes non-null metadata
- **AND** produces cleaner, more readable YAML

#### Scenario: Escape special characters in YAML
- **WHEN** goal metadata contains special characters (quotes, colons, etc.)
- **THEN** the YAML serializer properly escapes them
- **AND** uses quoted strings when necessary
- **AND** ensures valid YAML syntax

#### Scenario: Multiline description formatting
- **WHEN** a goal has a multiline description
- **THEN** the YAML serializer uses the `|` literal block scalar
- **AND** preserves line breaks in the description
- **AND** ensures proper indentation

### Requirement: Migration Logging
The system SHALL log information about format migrations for user awareness and debugging.

#### Scenario: Log successful migration
- **WHEN** auto-migrating a goal file from inline to YAML format
- **THEN** the system logs an info message indicating migration occurred
- **AND** includes the file path in the log
- **AND** displays during verbose mode or debug logging

#### Scenario: Log migration failures
- **WHEN** auto-migration fails due to parse errors
- **THEN** the system logs a warning message
- **AND** indicates which entries could not be migrated
- **AND** advises user to check file format manually

#### Scenario: Track migration statistics
- **WHEN** migrating multiple entries
- **THEN** the system tracks count of successfully migrated entries
- **AND** tracks count of failed entries
- **AND** includes these counts in the log output
