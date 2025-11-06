# hierarchical-storage Specification

## Purpose
Enable users to optionally inherit read access to parent `.aissist` directories while keeping write operations isolated to the local directory. This capability supports monorepo workflows, nested projects, and context-rich development environments where accessing parent-level goals and history enhances productivity without polluting parent configurations.

## Requirements

### Requirement: Hierarchical Path Discovery
The system SHALL detect all `.aissist` directories in ancestor paths during initialization and offer the user an option to enable read access to them.

#### Scenario: Discover parent directories during init
- **GIVEN** the user runs `aissist init` in a directory at `/home/user/monorepo/packages/api`
- **AND** `.aissist` directories exist at:
  - `/home/user/monorepo/.aissist`
  - `/home/user/.aissist`
- **WHEN** the initialization process begins
- **THEN** the system walks upward from the current directory to the filesystem root
- **AND** collects all absolute paths to `.aissist` directories found
- **AND** stores the discovered paths for use in the hierarchy prompt

#### Scenario: No parent directories found
- **GIVEN** the user runs `aissist init` in `/home/user/new-project`
- **AND** no `.aissist` directories exist in any ancestor paths
- **WHEN** the initialization process begins
- **THEN** the system completes without prompting for hierarchical configuration
- **AND** proceeds with standard initialization

#### Scenario: Only global directory found
- **GIVEN** the user runs `aissist init` in `/home/user/projects/experiment`
- **AND** only `~/.aissist` exists (no intermediate parent directories)
- **WHEN** the initialization process begins
- **THEN** the system discovers the global directory
- **AND** prompts the user to include it for reading

### Requirement: Hierarchical Configuration Prompt
When parent `.aissist` directories are discovered, the system SHALL prompt the user to opt into hierarchical read access with clear context about the implications.

#### Scenario: User accepts hierarchical configuration
- **GIVEN** parent directories were discovered during init
- **WHEN** the system displays "Would you like to include parent directories for reading?"
- **AND** lists the discovered paths with their relative depth (e.g., "2 levels up", "global")
- **AND** the user selects "Yes"
- **THEN** the system stores the discovered paths in `config.json` under the `readPaths` field
- **AND** displays a confirmation message indicating read access is enabled
- **AND** clarifies that all changes will be saved to the local directory only

#### Scenario: User declines hierarchical configuration
- **GIVEN** parent directories were discovered during init
- **WHEN** the system displays the hierarchy prompt
- **AND** the user selects "No"
- **THEN** the system initializes with an empty `readPaths` array in `config.json`
- **AND** operates in isolated mode (current behavior)

#### Scenario: Non-interactive mode skips hierarchy prompt
- **GIVEN** the command is executed in a non-TTY environment
- **WHEN** `aissist init` completes
- **THEN** the system does NOT display the hierarchy prompt
- **AND** initializes with an empty `readPaths` array (isolated mode)

### Requirement: Configuration Schema Extension
The system SHALL extend the `config.json` schema to support hierarchical read paths.

#### Scenario: Store read paths in configuration
- **GIVEN** the user accepts hierarchical configuration
- **WHEN** the configuration is saved
- **THEN** the `config.json` file includes a `readPaths` field
- **AND** `readPaths` is an array of absolute path strings
- **AND** the array contains all discovered parent `.aissist` directories
- **AND** paths are ordered from closest parent to farthest (e.g., local parent before global)

#### Scenario: Validate configuration with readPaths
- **GIVEN** a `config.json` file includes a `readPaths` field
- **WHEN** the system loads the configuration
- **THEN** it validates `readPaths` as an optional array of strings using the zod schema
- **AND** defaults to an empty array if not present
- **AND** reports validation errors if `readPaths` is not an array or contains non-string values

#### Scenario: Backward compatibility with existing configs
- **GIVEN** an existing `config.json` without a `readPaths` field
- **WHEN** the system loads the configuration
- **THEN** the schema defaults `readPaths` to an empty array
- **AND** the system operates in isolated mode (current behavior)
- **AND** no errors or warnings are displayed

### Requirement: Multi-Path Read Operations
The system SHALL read data from all configured paths (local plus parents) and merge results with local data taking precedence over parent data.

#### Scenario: Read goals from multiple paths
- **GIVEN** hierarchical configuration is enabled with read paths `[local, parent, global]`
- **WHEN** the user runs `aissist goal list`
- **THEN** the system reads goals from the local `.aissist/goals/` directory first
- **AND** reads goals from each parent path in order
- **AND** merges results with local goals taking precedence (same codename = local wins)
- **AND** displays all unique goals sorted by date (most recent first)

#### Scenario: Precedence for conflicting codenames
- **GIVEN** local `.aissist/goals/` contains a goal with codename "launch-v2"
- **AND** parent `.aissist/goals/` also contains a goal with codename "launch-v2"
- **WHEN** the user runs `aissist goal list`
- **THEN** the system includes only the local "launch-v2" goal in the results
- **AND** the parent "launch-v2" goal is shadowed and not displayed

#### Scenario: Merge history from multiple paths
- **GIVEN** hierarchical configuration is enabled
- **WHEN** the user runs `aissist history show`
- **THEN** the system reads history entries from local and all parent paths
- **AND** merges all entries chronologically (no deduplication needed)
- **AND** displays the combined history sorted by date and time

#### Scenario: Handle missing parent paths gracefully
- **GIVEN** `config.json` includes a parent path `/home/user/old-project/.aissist`
- **AND** that directory has been deleted or is inaccessible
- **WHEN** the user runs a read command (e.g., `aissist goal list`)
- **THEN** the system attempts to read from the configured path
- **AND** catches the access error and skips that path
- **AND** continues reading from other configured paths
- **AND** does NOT display an error to the user (graceful degradation)

### Requirement: Write Isolation
All write operations SHALL remain exclusive to the local `.aissist` directory, regardless of hierarchical configuration.

#### Scenario: Add goal writes to local only
- **GIVEN** hierarchical configuration is enabled with parent paths
- **WHEN** the user runs `aissist goal add "New goal"`
- **THEN** the system writes the new goal to the local `.aissist/goals/` directory
- **AND** does NOT write to any parent directories

#### Scenario: Add history writes to local only
- **GIVEN** hierarchical configuration is enabled
- **WHEN** the user runs `aissist history log "Completed task"`
- **THEN** the system writes the entry to the local `.aissist/history/` directory
- **AND** does NOT write to any parent directories

#### Scenario: Update operations write to local only
- **GIVEN** hierarchical configuration is enabled
- **AND** a goal with codename "research" exists in a parent path
- **WHEN** the user runs `aissist goal update research --deadline 2025-12-31`
- **THEN** the system creates a local copy of "research" with the updated deadline in local `.aissist/goals/`
- **AND** the parent "research" goal remains unchanged
- **AND** future reads show the local version (shadowing parent)

### Requirement: Storage Path Reporting
The system SHALL clearly communicate which paths are being used for reading and writing when hierarchical configuration is enabled.

#### Scenario: Display current write path
- **GIVEN** hierarchical configuration is enabled
- **WHEN** the user runs `aissist path`
- **THEN** the system displays the local `.aissist` directory as the write path
- **AND** indicates "Writes: /home/user/project/.aissist"

#### Scenario: Display configured read paths
- **GIVEN** hierarchical configuration is enabled with 2 parent paths
- **WHEN** the user runs `aissist path --verbose` or `aissist path --hierarchy`
- **THEN** the system displays the local path and all configured read paths
- **AND** indicates "Reads: /home/user/project/.aissist, /home/user/monorepo/.aissist, ~/.aissist"
- **AND** shows relative depth for each path (e.g., "local", "2 levels up", "global")

#### Scenario: Path reporting in isolated mode
- **GIVEN** hierarchical configuration is NOT enabled (`readPaths` is empty)
- **WHEN** the user runs `aissist path`
- **THEN** the system displays only the local `.aissist` directory
- **AND** does NOT mention read/write distinction (both use the same path)
