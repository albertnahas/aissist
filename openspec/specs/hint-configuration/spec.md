# hint-configuration Specification

## Purpose
TBD - created by archiving change add-contextual-hints. Update Purpose after archive.
## Requirements
### Requirement: Hints Configuration Commands
The system SHALL provide CLI commands to manage hint settings.

#### Scenario: Enable hints command
- **WHEN** a user runs `aissist config hints enable`
- **THEN** the system sets `config.hints.enabled = true` and confirms with "✓ Hints enabled"

#### Scenario: Disable hints command
- **WHEN** a user runs `aissist config hints disable`
- **THEN** the system sets `config.hints.enabled = false` and confirms with "✓ Hints disabled"

#### Scenario: Set hints strategy
- **WHEN** a user runs `aissist config hints strategy ai`
- **THEN** the system sets `config.hints.strategy = "ai"` and confirms with "✓ Hints strategy set to: ai"

#### Scenario: Set hints strategy to static
- **WHEN** a user runs `aissist config hints strategy static`
- **THEN** the system sets `config.hints.strategy = "static"` and confirms with "✓ Hints strategy set to: static"

#### Scenario: Invalid hints strategy
- **WHEN** a user runs `aissist config hints strategy invalid`
- **THEN** the system displays error: "✗ Invalid strategy. Use 'ai' or 'static'"

#### Scenario: Show current hints config
- **WHEN** a user runs `aissist config show` or `aissist config hints`
- **THEN** the system displays the current hints configuration including enabled status, strategy, and timeout

