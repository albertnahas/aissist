# goal-management Specification

## Purpose
TBD - created by archiving change add-aissist-mvp. Update Purpose after archive.
## Requirements
### Requirement: Add Goals
The system SHALL allow users to add goals with auto-generated unique codenames and store them with metadata.

#### Scenario: Add goal with text argument generates codename
- **WHEN** the user runs `aissist goal add "Complete project proposal"`
- **THEN** the system generates a unique kebab-case codename using Claude AI (e.g., "complete-project-proposal")
- **AND** appends the goal to goals/YYYY-MM-DD.md with timestamp, codename, and text
- **AND** displays the generated codename to the user

#### Scenario: Add goal with multiline text preserves formatting
- **WHEN** the user runs `aissist goal add` with multiline text in quotes
- **THEN** the system generates a unique codename
- **AND** preserves the multiline formatting in the Markdown file
- **AND** stores the codename in the goal metadata

#### Scenario: Add multiple goals same day with unique codenames
- **WHEN** the user adds multiple goals on the same day
- **THEN** each goal is appended with its own timestamp and unique codename
- **AND** Claude ensures codename uniqueness by checking existing goals for the day

#### Scenario: Codename generation handles conflicts
- **WHEN** a generated codename would conflict with an existing goal's codename
- **THEN** the system appends a numeric suffix (e.g., "project-proposal-2")
- **OR** generates a more specific codename to avoid conflicts

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

### Requirement: Goal Visibility
The system SHALL allow users to view their stored goals, defaulting to all active goals, with optional deadline-based filtering using natural language or ISO dates.

**Changes**: Replaced `--date` flag (filter by creation date) with `--deadline` flag (filter by deadline). Added natural language support for deadline filtering.

#### Scenario: List all active goals by default
- **WHEN** the user runs `aissist goal list`
- **THEN** the system displays all active (unfinished) goals from all dates
- **AND** sorts goals by deadline (earliest first, no deadline goes last)
- **AND** includes goals with codenames across all goal files

#### Scenario: Filter goals by deadline (ISO date)
- **WHEN** the user runs `aissist goal list --deadline 2025-12-01`
- **THEN** the system displays only goals with deadlines on or before 2025-12-01
- **AND** excludes goals without deadlines
- **AND** sorts by deadline (earliest first)

#### Scenario: Filter goals by deadline (natural language)
- **WHEN** the user runs `aissist goal list --deadline "next week"`
- **THEN** the system parses "next week" to determine the end date
- **AND** displays goals with deadlines on or before that date
- **AND** excludes goals without deadlines

#### Scenario: Invalid deadline format
- **WHEN** the user provides an invalid deadline format
- **THEN** the system displays an error message explaining the format
- **AND** suggests valid formats (YYYY-MM-DD, "next week", "tomorrow", etc.)

#### Scenario: No goals match deadline filter
- **WHEN** no active goals have deadlines matching the filter
- **THEN** the system displays a message indicating no goals were found
- **AND** suggests viewing all goals with `aissist goal list`

### Requirement: Interactive Deadline Entry During Goal Creation
The system SHALL prompt users to enter a deadline when adding a goal, with natural language support and "Tomorrow" as the default.

#### Scenario: User accepts default deadline
- **WHEN** the user runs `aissist goal add "Complete project proposal"`
- **AND** the system prompts for a deadline with default "Tomorrow"
- **AND** the user presses Enter without typing anything
- **THEN** the system sets the deadline to tomorrow's date in YYYY-MM-DD format
- **AND** displays the goal confirmation with the deadline

#### Scenario: User enters natural language deadline
- **WHEN** the user runs `aissist goal add "Review quarterly goals"`
- **AND** the system prompts for a deadline
- **AND** the user enters a natural language timeframe like "next week"
- **THEN** the system parses the input to a date in YYYY-MM-DD format
- **AND** stores the deadline with the goal

#### Scenario: User enters ISO date deadline
- **WHEN** the user runs `aissist goal add "Submit report"`
- **AND** the system prompts for a deadline
- **AND** the user enters an ISO date like "2025-12-31"
- **THEN** the system accepts the date and stores it as the deadline

#### Scenario: User skips deadline with empty input
- **WHEN** the user runs `aissist goal add "Explore new ideas"`
- **AND** the system prompts for a deadline
- **AND** the user enters an empty string or "skip"
- **THEN** the system adds the goal without a deadline

#### Scenario: User provides deadline via -d flag
- **WHEN** the user runs `aissist goal add "Finish coding" -d 2025-11-10`
- **THEN** the system does NOT prompt for a deadline interactively
- **AND** uses the provided flag value as the deadline

### Requirement: Codename Generation
The system SHALL use Claude AI to generate meaningful, unique kebab-case codenames for goals with visual feedback during processing.

**Changes**: Added requirement for loading indicator during generation process.

#### Scenario: Generate codename from goal text
- **WHEN** a new goal is added
- **THEN** the system displays a loading indicator with message "Generating unique codename..."
- **AND** sends the goal text to Claude with instructions to generate a short, meaningful kebab-case identifier
- **AND** ensures the codename is unique within the day's goals
- **AND** stops the loading indicator once generation completes
- **AND** stores the codename with the goal

#### Scenario: Codename length constraint
- **WHEN** generating a codename
- **THEN** the codename should be 1-4 words in kebab-case
- **AND** should capture the core meaning of the goal
- **AND** should be memorable and easy to type

#### Scenario: Codename uniqueness check
- **WHEN** generating a codename
- **THEN** the system checks existing goals in the day's file
- **AND** if the codename exists, instructs Claude to generate an alternative
- **OR** appends a numeric suffix

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

### Requirement: Loading Indicator During Codename Generation
The system SHALL display a loading indicator while generating unique codenames to provide user feedback during AI processing.

#### Scenario: Display spinner during codename generation
- **WHEN** the user runs `aissist goal add "Complete project proposal"`
- **THEN** the system displays a loading indicator with message "Generating unique codename..."
- **AND** the indicator is shown immediately after goal text is captured
- **AND** the indicator stops before prompting for deadline
- **AND** the generated codename is displayed after the indicator completes

#### Scenario: Respect animation config during codename loading
- **WHEN** the user has disabled animations via config (`animations.enabled = false`)
- **AND** the user adds a goal
- **THEN** the system skips the visual spinner
- **AND** still generates the codename normally
- **AND** provides simple text feedback or no feedback during generation

#### Scenario: Handle fast API responses gracefully
- **WHEN** the Claude API responds quickly (< 500ms)
- **THEN** the loading indicator appears briefly without flickering
- **AND** the user experience remains smooth
- **AND** the codename result is displayed normally

#### Scenario: Handle slow API responses with feedback
- **WHEN** the Claude API takes longer than expected (> 5 seconds)
- **THEN** the loading indicator continues spinning
- **AND** provides reassurance that the system is still working
- **AND** does not timeout prematurely

#### Scenario: Loading indicator stops on error
- **WHEN** the codename generation fails due to API error
- **THEN** the loading indicator stops immediately
- **AND** an error message is displayed
- **AND** the user is informed that codename generation failed

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

