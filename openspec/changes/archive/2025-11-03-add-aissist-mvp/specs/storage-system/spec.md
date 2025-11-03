# Storage System Specification

## ADDED Requirements

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
  - slash-commands/

#### Scenario: Initialize global storage
- **WHEN** the user runs `aissist init --global`
- **THEN** the system creates the storage structure at ~/.aissist/

#### Scenario: Initialize local storage
- **WHEN** the user runs `aissist init` without --global flag
- **THEN** the system creates the storage structure at ./.aissist/ in the current directory

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
The system SHALL maintain a configuration file (config.json) in the storage root using zod for schema validation.

#### Scenario: Create default configuration
- **WHEN** the user runs `aissist init`
- **THEN** the system creates a config.json file with default settings

#### Scenario: Validate configuration on load
- **WHEN** the system reads config.json
- **THEN** it validates the configuration against the defined schema and reports any errors

### Requirement: File System Permissions
The system SHALL handle file system permission errors gracefully.

#### Scenario: Permission denied for global storage
- **WHEN** the system cannot create or write to ~/.aissist/ due to permission errors
- **THEN** it displays a clear error message explaining the permission issue

#### Scenario: Permission denied for local storage
- **WHEN** the system cannot create or write to ./.aissist/ due to permission errors
- **THEN** it displays a clear error message explaining the permission issue
