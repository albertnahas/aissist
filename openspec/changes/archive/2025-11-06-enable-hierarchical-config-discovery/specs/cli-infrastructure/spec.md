# cli-infrastructure Specification Delta

## ADDED Requirements

### Requirement: Init Command with Hierarchy Detection
The system SHALL provide an `init` command to initialize storage with optional hierarchical configuration.

#### Scenario: Standard initialization with no parents
- **WHEN** the user runs `aissist init` in a directory with no `.aissist` ancestors
- **THEN** the system initializes storage structure at the current path
- **AND** skips the hierarchical configuration prompt
- **AND** operates in isolated mode (no `readPaths` configured)

#### Scenario: Initialization with parent discovery
- **GIVEN** `.aissist` directories exist in ancestor paths
- **WHEN** the user runs `aissist init`
- **THEN** the system discovers all parent `.aissist` directories up to the filesystem root
- **AND** displays a prompt: "Would you like to include parent directories for reading?"
- **AND** lists discovered paths with relative context (e.g., "2 levels up", "global")
- **AND** explains that writes will remain local while reads can include parents
- **AND** stores the user's choice in `config.json` as `readPaths`

## ADDED Requirements

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
