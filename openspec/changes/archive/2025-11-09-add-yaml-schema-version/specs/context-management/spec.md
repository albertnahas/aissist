# context-management Specification Delta

## NEW Requirements

### Requirement: Parse Context Entries
The system SHALL extract metadata including schema version from YAML front matter and text content from markdown body.

**Changes**: Added requirement to extract and validate `schema_version` field during parsing.

#### Scenario: Extract schema version from context YAML
- **WHEN** reading a context file with YAML front matter
- **THEN** the system parses `schema_version` as the first field
- **AND** normalizes missing version to "1.0"
- **AND** validates against known versions
- **AND** logs warning if unknown
- **AND** proceeds with parsing other metadata fields

## MODIFIED Requirements

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
