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

### Requirement: Progress File Format
The system SHALL maintain a `progress.json` file in each `.aissist` directory to expose goal progress for parent aggregation.

#### Scenario: Progress file created on goal activity
- **GIVEN** a `.aissist` directory exists
- **WHEN** a goal is added, completed, or updated
- **THEN** the system writes/updates `progress.json` in the same directory
- **AND** the file contains a JSON object with goal progress data
- **AND** the file is human-readable and Git-friendly

#### Scenario: Progress file schema
- **GIVEN** a `progress.json` file exists
- **WHEN** the file is read
- **THEN** it contains the following structure:
```json
{
  "schema_version": "1.0",
  "instance_path": "/absolute/path/to/.aissist",
  "description": "Optional instance description from DESCRIPTION.md",
  "last_updated": "2025-12-07T10:30:00Z",
  "goals": {
    "goal-codename": {
      "text": "Goal description",
      "status": "active|completed",
      "deadline": "2025-12-15",
      "parent_goal": "parent-codename",
      "completed_at": null,
      "progress_notes": []
    }
  }
}
```

#### Scenario: Progress file updates atomically
- **GIVEN** the system needs to update `progress.json`
- **WHEN** writing the updated content
- **THEN** the system uses atomic write (write to temp file, then rename)
- **AND** concurrent reads never see partial content
- **AND** filesystem operations are crash-safe

### Requirement: Progress Aggregation from Children
The system SHALL support reading progress from child `.aissist` directories to aggregate status into a parent view.

#### Scenario: Discover child directories
- **GIVEN** a parent `.aissist` directory at `/project/.aissist`
- **AND** child directories exist at `/project/api/.aissist` and `/project/web/.aissist`
- **WHEN** the user runs `aissist sync` in `/project`
- **THEN** the system discovers all child `.aissist` directories recursively
- **AND** reads `progress.json` from each discovered directory
- **AND** does NOT traverse into `node_modules`, `.git`, or other ignored directories

#### Scenario: Aggregate child progress into parent view
- **GIVEN** a parent goal "launch-v2" exists in the parent directory
- **AND** child directories have goals with `parent_goal: "launch-v2"`
- **WHEN** the user runs `aissist sync`
- **THEN** the system collects all child goals linked to "launch-v2"
- **AND** stores aggregated data in parent's `progress.json` under `children` key
- **AND** calculates completion percentage based on child goal status

#### Scenario: Handle missing or invalid progress files
- **GIVEN** a child directory exists but has no `progress.json`
- **WHEN** the system attempts to aggregate progress
- **THEN** the system skips that directory gracefully
- **AND** logs a warning (in verbose mode only)
- **AND** continues processing other child directories

### Requirement: Child Discovery Configuration
The system SHALL support configuration for controlling child directory discovery behavior.

#### Scenario: Configure discovery depth
- **GIVEN** `config.json` contains `sync.maxDepth: 3`
- **WHEN** the system discovers child directories
- **THEN** it only traverses up to 3 levels deep from the current directory
- **AND** deeper directories are ignored

#### Scenario: Configure excluded directories
- **GIVEN** `config.json` contains `sync.exclude: ["vendor", "tmp"]`
- **WHEN** the system discovers child directories
- **THEN** it skips directories named "vendor" or "tmp"
- **AND** default exclusions still apply (`node_modules`, `.git`, etc.)

#### Scenario: Default discovery behavior
- **GIVEN** no sync configuration exists in `config.json`
- **WHEN** the system discovers child directories
- **THEN** it uses default max depth of 5
- **AND** excludes common non-project directories: `node_modules`, `.git`, `vendor`, `dist`, `build`, `target`

