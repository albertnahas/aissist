## ADDED Requirements

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
