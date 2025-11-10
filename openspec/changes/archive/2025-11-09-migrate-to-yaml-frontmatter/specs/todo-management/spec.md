# todo-management Specification Delta

## MODIFIED Requirements

### Requirement: Todo File Format
The system SHALL store todos in structured Markdown format with YAML front matter for metadata and checkbox format for content.

**Changes**: Migrated from inline metadata format (`(Priority: N) (Goal: codename)`) to YAML front matter. Auto-migrate old format on read.

#### Scenario: Format todo entry with YAML front matter
- **WHEN** a todo is added
- **THEN** the entry includes YAML front matter with:
  - `timestamp`: Time in HH:MM format
  - `completed`: Boolean checkbox state
  - `priority`: Integer priority (default 0)
  - `goal`: Optional goal codename
- **AND** the markdown body contains the checkbox and todo text
- **AND** metadata is NOT inline in the checkbox line

#### Scenario: Example todo entry format (new YAML format)
- **WHEN** a todo is stored
- **THEN** it follows this format:
```markdown
---
timestamp: "09:15"
completed: false
priority: 3
goal: code-quality
---

- [ ] Review code changes
```

#### Scenario: Completed todo format with YAML
- **WHEN** a todo is marked complete
- **THEN** the YAML front matter sets `completed: true`
- **AND** the checkbox updates to `- [x]`
- **AND** metadata is preserved in YAML front matter

#### Scenario: Auto-migrate legacy inline format
- **WHEN** reading a todo file with old inline format (`(Priority: N) (Goal: codename)`)
- **THEN** the system detects the inline metadata
- **AND** parses using the legacy inline parser
- **AND** automatically rewrites the file in YAML front matter format
- **AND** extracts priority and goal from inline format to YAML fields
- **AND** removes inline metadata from checkbox line
- **AND** all subsequent reads use the new YAML format

#### Scenario: Parse todo entry with YAML front matter
- **WHEN** reading a todo file with YAML front matter
- **THEN** the system uses a YAML parser to extract metadata
- **AND** parses checkbox state from markdown body
- **AND** constructs a TodoEntry object with all fields populated

#### Scenario: Handle YAML parse errors gracefully
- **WHEN** YAML parsing fails due to malformed front matter
- **THEN** the system falls back to the legacy inline parser
- **AND** logs a warning about malformed YAML
- **AND** does NOT attempt auto-migration
- **AND** keeps the entry in its current format

#### Scenario: Batch migrate entire todo file
- **WHEN** a todo file contains multiple entries in inline format
- **THEN** the system migrates all entries in a single file rewrite
- **AND** preserves entry order and completion status
- **AND** uses atomic file write (temp file + rename)
- **AND** all entries are converted to YAML format

## ADDED Requirements

### Requirement: Parse todo entries
The system SHALL extract metadata from YAML front matter and checkbox content from markdown body.

#### Scenario: Extract todo metadata from YAML
- **WHEN** reading a todo file with YAML front matter
- **THEN** the system parses timestamp, completed, priority, and goal from YAML
- **AND** parses checkbox and text from markdown body
- **AND** combines into TodoEntry object

#### Scenario: Default values for missing YAML fields
- **WHEN** YAML front matter omits optional fields (priority, goal)
- **THEN** the system uses default values (priority: 0, goal: null)
- **AND** the parser does not fail
- **AND** constructs a valid TodoEntry

### Requirement: YAML Serialization for Todos
The system SHALL serialize todo metadata to YAML front matter format when creating or updating todos.

#### Scenario: Serialize new todo to YAML
- **WHEN** a new todo is created
- **THEN** the system constructs YAML front matter with all metadata fields
- **AND** includes completed, priority, and goal fields
- **AND** appends the checkbox markdown after the front matter delimiter
- **AND** writes the complete entry to the todo file

#### Scenario: Omit default values in YAML output
- **WHEN** serializing a todo with priority 0 and no goal
- **THEN** the YAML front matter omits priority (if 0) and goal (if null)
- **AND** only includes non-default metadata
- **AND** produces cleaner, more readable YAML

#### Scenario: Update todo status in YAML
- **WHEN** marking a todo as complete
- **THEN** the system updates the `completed` field in YAML front matter
- **AND** updates the checkbox in the markdown body (`- [x]`)
- **AND** preserves all other metadata

#### Scenario: Update todo priority in YAML
- **WHEN** changing a todo's priority
- **THEN** the system updates the `priority` field in YAML front matter
- **AND** leaves the checkbox and text unchanged
- **AND** preserves goal linkage

### Requirement: Migration Logging for Todos
The system SHALL log information about todo format migrations for user awareness and debugging.

#### Scenario: Log successful todo migration
- **WHEN** auto-migrating a todo file from inline to YAML format
- **THEN** the system logs an info message indicating migration occurred
- **AND** includes the file path and count of migrated entries
- **AND** displays during verbose mode or debug logging

#### Scenario: Log todo migration failures
- **WHEN** auto-migration fails due to parse errors
- **THEN** the system logs a warning message
- **AND** indicates which entries could not be migrated
- **AND** advises user to check file format manually
