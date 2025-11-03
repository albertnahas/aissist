## MODIFIED Requirements

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
