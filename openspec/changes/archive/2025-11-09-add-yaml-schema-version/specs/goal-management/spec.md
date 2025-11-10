# goal-management Specification Delta

## MODIFIED Requirements

### Requirement: Goal File Format
The system SHALL store goals in structured Markdown format with YAML front matter for metadata including schema version.

**Changes**: Added mandatory `schema_version` field to YAML front matter for format versioning and future evolution.

#### Scenario: YAML front matter includes schema version
- **WHEN** a goal is created or updated
- **THEN** the YAML front matter includes `schema_version: "1.0"` as the first field
- **AND** the schema version is a string in "MAJOR.MINOR" format
- **AND** the current schema version is "1.0"

#### Scenario: Example goal entry with schema version
- **WHEN** a goal is stored
- **THEN** it follows this format:
```markdown
---
schema_version: "1.0"
timestamp: "14:30"
codename: complete-project-proposal
deadline: "2025-11-15"
description: Detailed description of the proposal requirements
---

Complete the quarterly project proposal document
```

#### Scenario: Parse goal with schema version
- **WHEN** reading a goal entry with YAML front matter
- **THEN** the system extracts the `schema_version` field
- **AND** validates it against known versions ("1.0")
- **AND** uses the version to determine parsing behavior
- **AND** constructs a GoalEntry object with all fields populated

#### Scenario: Parse goal without schema version (backward compatibility)
- **WHEN** reading a goal entry without `schema_version` field
- **THEN** the system defaults to schema version "1.0"
- **AND** parses the entry using v1.0 format
- **AND** does NOT log any warnings or errors
- **AND** the entry works identically to versioned entries

#### Scenario: Handle unknown schema version
- **WHEN** reading a goal entry with an unknown schema version (e.g., "2.0", "99.9")
- **THEN** the system logs a warning message indicating the unknown version
- **AND** falls back to parsing as schema version "1.0"
- **AND** continues processing without failing
- **AND** the goal entry is still usable

#### Scenario: Schema version field ordering
- **WHEN** serializing a goal to YAML format
- **THEN** `schema_version` appears as the first field in the YAML front matter
- **AND** followed by `timestamp`, `codename`, `deadline`, `description` in order
- **AND** the ordering is consistent across all goal entries

## ADDED Requirements

### Requirement: Schema Version Validation
The system SHALL validate schema versions and provide clear feedback for known and unknown versions.

#### Scenario: Validate known schema versions
- **WHEN** parsing a goal entry
- **THEN** the system checks if `schema_version` is in the list of known versions
- **AND** known versions include: "1.0"
- **AND** known versions are validated before parsing

#### Scenario: Normalize missing schema version
- **WHEN** a goal entry has no `schema_version` field
- **THEN** the system normalizes it to "1.0" (default)
- **AND** proceeds with v1.0 parsing logic
- **AND** no warning or error is generated (backward compatibility)

#### Scenario: Log warning for unknown versions
- **WHEN** an unknown schema version is encountered (e.g., "2.0", "1.5")
- **THEN** the system logs a warning to console
- **AND** the warning includes the unknown version number
- **AND** indicates fallback to version "1.0"
- **AND** the warning format is: `Unknown schema version: <version>, treating as 1.0`

### Requirement: Schema Version Evolution Support
The system SHALL support future schema version evolution through explicit version tracking.

#### Scenario: Future version compatibility path
- **WHEN** a new schema version is introduced (hypothetical future)
- **THEN** the system can detect the version from YAML front matter
- **AND** route to version-specific parsing logic
- **AND** maintain backward compatibility with older versions
- **AND** provide clear migration paths between versions

#### Scenario: Version-specific parsing (future capability)
- **WHEN** multiple schema versions are supported (hypothetical future)
- **THEN** the parser reads `schema_version` field
- **AND** dispatches to version-specific parsing function
- **AND** each version has its own parsing implementation
- **AND** unknown versions fall back to latest known version with warning
