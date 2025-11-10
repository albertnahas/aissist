# history-tracking Specification Delta

## NEW Requirements

### Requirement: Parse History Entries
The system SHALL extract metadata including schema version from YAML front matter and text content from markdown body.

**Changes**: Added requirement to extract and validate `schema_version` field during parsing.

#### Scenario: Extract schema version from history YAML
- **WHEN** reading a history file with YAML front matter
- **THEN** the system parses `schema_version` as the first field
- **AND** normalizes missing version to "1.0"
- **AND** validates against known versions
- **AND** logs warning if unknown
- **AND** proceeds with parsing other metadata fields

## MODIFIED Requirements

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
