# storage-system Specification Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
