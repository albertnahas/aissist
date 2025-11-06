# cli-infrastructure Specification

## Purpose
TBD - created by archiving change add-aissist-mvp. Update Purpose after archive.
## Requirements
### Requirement: Command-Line Interface
The system SHALL provide a command-line interface using the commander framework with support for subcommands, options, and flags, including the `propose` command for AI-powered action planning.

#### Scenario: Display help information
- **WHEN** the user runs `aissist --help` or `aissist -h`
- **THEN** the system displays a list of all available commands with descriptions

#### Scenario: Display version information
- **WHEN** the user runs `aissist --version` or `aissist -V`
- **THEN** the system displays the current version number

#### Scenario: Execute subcommand
- **WHEN** the user runs `aissist <command>` with a valid command name
- **THEN** the system executes the specified command handler

#### Scenario: Execute propose command
- **WHEN** the user runs `aissist propose [<timeframe>]`
- **THEN** the system invokes the propose command handler with optional timeframe argument

### Requirement: Interactive Prompts
The system SHALL provide interactive command-line prompts using @inquirer/core for user input.

#### Scenario: Collect user input
- **WHEN** a command requires user input
- **THEN** the system displays an interactive prompt and waits for user response

#### Scenario: Handle prompt cancellation
- **WHEN** the user cancels a prompt (Ctrl+C)
- **THEN** the system exits gracefully without error

### Requirement: Visual Feedback
The system SHALL provide visual feedback using chalk for colored output and ora for loading indicators.

#### Scenario: Display success message
- **WHEN** a command completes successfully
- **THEN** the system displays a success message in green

#### Scenario: Display error message
- **WHEN** a command encounters an error
- **THEN** the system displays an error message in red

#### Scenario: Display loading indicator
- **WHEN** a command performs a long-running operation
- **THEN** the system displays a spinner with a descriptive message

### Requirement: Binary Executable
The system SHALL provide an executable binary that can be invoked globally after installation.

#### Scenario: Global installation
- **WHEN** the user installs the package globally with `npm install -g aissist`
- **THEN** the `aissist` command becomes available in their PATH

#### Scenario: Local execution
- **WHEN** the user runs `npx aissist` without global installation
- **THEN** the system executes the CLI tool directly

### Requirement: Path Command Enhancements
The system SHALL provide a `path` command to display current storage paths with support for hierarchical configuration.

#### Scenario: Display write path
- **WHEN** the user runs `aissist path`
- **THEN** the system displays the local `.aissist` directory path
- **AND** indicates it is the write path
- **AND** displays "Storage path (writes): /home/user/project/.aissist"

#### Scenario: Display read hierarchy
- **GIVEN** hierarchical configuration is enabled with 2 parent paths
- **WHEN** the user runs `aissist path --hierarchy` or `aissist path -v`
- **THEN** the system displays the write path
- **AND** lists all configured read paths with relative depth indicators
- **AND** shows:
  ```
  Storage path (writes): /home/user/project/.aissist

  Read hierarchy:
    • /home/user/project/.aissist (local)
    • /home/user/monorepo/.aissist (2 levels up)
    • /home/user/.aissist (global)
  ```

#### Scenario: Display path in isolated mode
- **GIVEN** hierarchical configuration is NOT enabled
- **WHEN** the user runs `aissist path --hierarchy`
- **THEN** the system displays only the local path
- **AND** indicates "No hierarchical configuration (isolated mode)"

