# hint-configuration Specification

## Purpose
Extends the config-command specification to support hint system configuration options.

## ADDED Requirements

### Requirement: Configuration Schema
The system SHALL extend the configuration schema to include hint settings.

#### Scenario: Hints configuration structure
- **WHEN** the config is loaded or created
- **THEN** it includes a `hints` object: `{ enabled: boolean, strategy: "ai" | "static", timeout: number }`

#### Scenario: Default hints configuration
- **WHEN** initializing a new config
- **THEN** hints default to: `{ enabled: true, strategy: "ai", timeout: 2000 }`

#### Scenario: Validate hints configuration
- **WHEN** loading config from disk
- **THEN** the Zod schema validates: `enabled` is boolean, `strategy` is "ai" or "static", `timeout` is a positive number

## ADDED Requirements

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
