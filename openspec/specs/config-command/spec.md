# config-command Specification

## Purpose
TBD - created by archiving change enable-hierarchical-config-discovery. Update Purpose after archive.
## Requirements
### Requirement: Hierarchy Configuration Management
The system SHALL provide runtime commands to enable or disable hierarchical read access without requiring re-initialization.

#### Scenario: Enable hierarchy at runtime
- **GIVEN** the user is in a directory with `.aissist` storage initialized in isolated mode
- **AND** parent `.aissist` directories exist in ancestor paths
- **WHEN** the user runs `aissist config hierarchy enable`
- **THEN** the system discovers all parent `.aissist` directories
- **AND** updates `config.json` to include discovered paths in `readPaths`
- **AND** displays a confirmation message listing the enabled paths
- **AND** indicates "Read access enabled for N parent directories"

#### Scenario: Disable hierarchy at runtime
- **GIVEN** hierarchical configuration is currently enabled
- **WHEN** the user runs `aissist config hierarchy disable`
- **THEN** the system updates `config.json` to set `readPaths` to an empty array
- **AND** displays a confirmation message: "Hierarchical read access disabled (sandbox mode)"
- **AND** subsequent commands read only from the local `.aissist` directory

#### Scenario: Show current hierarchy status
- **GIVEN** the user wants to check hierarchy configuration
- **WHEN** the user runs `aissist config hierarchy status` or `aissist config hierarchy`
- **THEN** the system displays the current status:
  - If enabled: "Hierarchical read access: enabled (N parent paths)"
  - If disabled: "Hierarchical read access: disabled (sandbox mode)"
- **AND** if enabled, lists all configured read paths with relative depth

#### Scenario: Enable hierarchy when no parents found
- **GIVEN** the user runs `aissist config hierarchy enable`
- **AND** no `.aissist` directories exist in ancestor paths (except current)
- **WHEN** the system searches for parents
- **THEN** it finds no additional directories to add
- **AND** displays a message: "No parent directories found. Hierarchy remains disabled."
- **AND** does NOT modify `config.json`

#### Scenario: Enable hierarchy in non-initialized directory
- **GIVEN** the user runs `aissist config hierarchy enable`
- **AND** no `.aissist` directory exists in the current path or parents
- **WHEN** the command executes
- **THEN** the system displays an error: "No aissist storage found. Run 'aissist init' first."
- **AND** exits with error status

#### Scenario: Idempotent enable operation
- **GIVEN** hierarchical configuration is already enabled
- **WHEN** the user runs `aissist config hierarchy enable` again
- **THEN** the system rediscovers parent paths (in case directory structure changed)
- **AND** updates `readPaths` with the current parent directories
- **AND** displays: "Hierarchical read access updated (N parent paths)"

#### Scenario: Idempotent disable operation
- **GIVEN** hierarchical configuration is already disabled
- **WHEN** the user runs `aissist config hierarchy disable` again
- **THEN** the system confirms hierarchy is already disabled
- **AND** displays: "Hierarchical read access already disabled"
- **AND** does NOT modify `config.json` unnecessarily

