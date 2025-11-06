# storage-system Specification

## Purpose
TBD - created by archiving change add-aissist-mvp. Update Purpose after archive.
## Requirements
### Requirement: Dual-Mode Storage Resolution
The system SHALL support both global (~/.aissist/) and local (./.aissist/) storage modes with automatic path resolution.

#### Scenario: Detect local storage
- **WHEN** a .aissist/ directory exists in the current working directory or any parent directory
- **THEN** the system uses that local storage path for all operations

#### Scenario: Fallback to global storage
- **WHEN** no .aissist/ directory is found in the current working directory or any parent directory
- **THEN** the system uses ~/.aissist/ as the storage path

#### Scenario: Report current storage path
- **WHEN** the user runs `aissist path`
- **THEN** the system displays the currently active storage path

### Requirement: Storage Directory Structure
The system SHALL create and maintain a consistent directory structure for all storage locations.

#### Scenario: Initialize storage structure
- **WHEN** the user runs `aissist init`
- **THEN** the system creates the following directories:
  - config.json
  - goals/
  - history/
  - context/
  - reflections/

**Changes**: Removed `slash-commands/` directory from the storage structure. This directory will no longer be created or maintained during initialization.

**Rationale**: Slash-command support is being removed for future redesign. The feature was not widely used and adds unnecessary complexity to the storage layer. By removing it now, we simplify the codebase and reduce maintenance burden until a better integration approach is developed.

**Impact**: Users with existing `slash-commands/` directories will retain them, but they will no longer be updated or maintained by the system. This is a non-breaking change as the directory was optional and not relied upon by core functionality.

### Requirement: Markdown File Management
The system SHALL store all user data as Markdown files organized by date using the YYYY-MM-DD.md format.

#### Scenario: Create dated file
- **WHEN** the system needs to store data for a specific date
- **THEN** it creates or appends to a file named YYYY-MM-DD.md in the appropriate directory

#### Scenario: Append to existing file
- **WHEN** a dated file already exists for the current date
- **THEN** the system appends new entries to the existing file with appropriate separators

#### Scenario: Handle missing directories
- **WHEN** a required directory does not exist
- **THEN** the system creates it automatically before writing data

### Requirement: Configuration Management
The system SHALL maintain a configuration file (config.json) in the storage root using zod for schema validation, with optional support for hierarchical read paths.

**Changes**: Extended configuration schema to support optional `readPaths` field for hierarchical configuration.

#### Scenario: Create default configuration
- **WHEN** the user runs `aissist init`
- **THEN** the system creates a config.json file with default settings
- **AND** includes an empty `readPaths` array by default (isolated mode)

#### Scenario: Validate configuration on load
- **WHEN** the system reads config.json
- **THEN** it validates the configuration against the defined schema and reports any errors
- **AND** validates that `readPaths` (if present) is an array of strings
- **AND** defaults `readPaths` to an empty array if not present

### Requirement: File System Permissions
The system SHALL handle file system permission errors gracefully.

#### Scenario: Permission denied for global storage
- **WHEN** the system cannot create or write to ~/.aissist/ due to permission errors
- **THEN** it displays a clear error message explaining the permission issue

#### Scenario: Permission denied for local storage
- **WHEN** the system cannot create or write to ./.aissist/ due to permission errors
- **THEN** it displays a clear error message explaining the permission issue

### Requirement: Proposals Folder Storage
The system SHALL provide a dedicated storage location for AI-generated proposal documents.

#### Scenario: Initialize proposals folder
- **WHEN** the user runs `aissist init` or first saves a proposal
- **THEN** the system creates a `proposals/` subdirectory in `.aissist/`
- **AND** the folder is structured for date-based Markdown files

#### Scenario: Store proposals as dated Markdown files
- **WHEN** a proposal is saved
- **THEN** the system stores it in `.aissist/proposals/YYYY-MM-DD.md`
- **AND** the file follows the same date-based naming convention as other storage types
- **AND** the file is human-readable Markdown format
- **AND** multiple proposals on the same day are appended to the same file

#### Scenario: Proposal file format
- **WHEN** writing a proposal to a Markdown file
- **THEN** the file includes:
  - A level-2 heading with timestamp (e.g., `## Proposal at 14:30`)
  - Metadata section with timeframe, tag filters, and goal links
  - The complete proposal text from Claude
  - A horizontal rule separator if appending to existing content

### Requirement: Multi-Path Storage Resolution
The system SHALL support reading from multiple storage paths (local plus ancestors) while keeping writes isolated to the local path.

#### Scenario: Resolve read paths from configuration
- **GIVEN** a config.json with `readPaths: ["/home/user/monorepo/.aissist", "/home/user/.aissist"]`
- **WHEN** the system needs to read data (goals, history, context, etc.)
- **THEN** it resolves a list of read paths: `[local, ...readPaths]`
- **AND** reads from all paths in order (local first, then parents)

#### Scenario: Resolve write path (unchanged behavior)
- **GIVEN** hierarchical configuration is enabled
- **WHEN** the system needs to write data
- **THEN** it resolves the write path as the local `.aissist` directory
- **AND** writes ONLY to the local path (no changes to parent directories)

#### Scenario: Handle absolute path storage
- **GIVEN** `readPaths` contains absolute filesystem paths
- **WHEN** the user moves the project directory to a different location
- **THEN** the configured `readPaths` may become invalid (paths no longer exist)
- **AND** the system handles this gracefully by skipping missing paths during reads
- **AND** continues to operate with remaining valid paths

### Requirement: Parallel File Reads for Performance
The system SHALL optimize multi-path read operations using parallel file I/O to minimize latency.

#### Scenario: Read from multiple paths concurrently
- **GIVEN** hierarchical configuration with 3 read paths
- **WHEN** a command reads goals from all paths
- **THEN** the system uses `Promise.all()` to read files concurrently
- **AND** merges results after all reads complete
- **AND** completes in approximately the time of the slowest read (not sequential accumulation)

