# hint-system Specification

## Purpose
TBD - created by archiving change add-contextual-hints. Update Purpose after archive.
## Requirements
### Requirement: Hint Display Infrastructure
The system SHALL display subtle, single-line hints after successful command execution.

#### Scenario: Display hint after command success
- **WHEN** a command completes successfully
- **THEN** the system displays a hint using a distinct visual style (e.g., dimmed text with a lightbulb icon)

#### Scenario: Hint does not block output
- **WHEN** rendering a hint
- **THEN** it appears after all command output and success messages, separated by a blank line

#### Scenario: Hints respect configuration
- **WHEN** hints are disabled in config
- **THEN** no hints are displayed regardless of command execution

#### Scenario: Hint display timeout
- **WHEN** generating a hint takes longer than the configured timeout
- **THEN** the system displays the command success without waiting and moves on

### Requirement: Static Hint Mapping
The system SHALL provide predefined hints for common command workflows stored in a maintainable JSON file.

#### Scenario: Load static hints from JSON
- **WHEN** the hint system initializes
- **THEN** it reads `src/config/hints.json` containing command → hint mappings

#### Scenario: Command-based hint lookup
- **WHEN** a command completes and static hints are needed
- **THEN** the system looks up the command name (e.g., "goal.add") in the hints mapping

#### Scenario: Fallback to generic hint
- **WHEN** no specific hint exists for a command
- **THEN** the system displays no hint (prefer silence over unhelpful generic messages)

#### Scenario: Hints JSON structure
- **WHEN** defining static hints
- **THEN** the JSON structure is: `{ "command.subcommand": "Hint text with suggested command in backticks" }`

### Requirement: AI-Powered Hint Generation
The system SHALL use Claude Code headless mode to generate context-aware hints when available.

#### Scenario: Attempt AI hint generation first
- **WHEN** hints are enabled and a command completes
- **THEN** the system first attempts to generate an AI hint via Claude Code

#### Scenario: AI hint prompt structure
- **WHEN** generating an AI hint
- **THEN** the prompt includes: command just executed, current date, recent goals/todos/history summary (last 3 days), and instructions to suggest ONE actionable next step

#### Scenario: AI hint timeout
- **WHEN** Claude Code doesn't respond within 2 seconds
- **THEN** the system cancels the AI hint request and falls back to static hints

#### Scenario: AI hint format validation
- **WHEN** Claude Code returns a hint
- **THEN** the system validates it's a single line (≤120 chars) and contains a suggested command in backticks

#### Scenario: Claude Code unavailable
- **WHEN** Claude Code is not installed or authenticated
- **THEN** the system skips AI hint generation and uses static hints immediately

### Requirement: Hint Configuration
The system SHALL allow users to control hint behavior through configuration.

#### Scenario: Enable hints via config
- **WHEN** a user runs `aissist config hints enable`
- **THEN** the system updates config.json to set `hints.enabled = true`

#### Scenario: Disable hints via config
- **WHEN** a user runs `aissist config hints disable`
- **THEN** the system updates config.json to set `hints.enabled = false`

#### Scenario: Configure hint strategy
- **WHEN** a user runs `aissist config hints strategy <ai|static>`
- **THEN** the system updates config.json to set `hints.strategy` to the specified value

#### Scenario: Default configuration
- **WHEN** no hint configuration exists
- **THEN** hints default to: `{ enabled: true, strategy: "ai", timeout: 2000 }`

### Requirement: Hint Integration with Commands
The system SHALL integrate hint display into existing command completion flows.

#### Scenario: Integrate with success utility
- **WHEN** a command uses the `success()` utility
- **THEN** the hint system can hook into command completion automatically

#### Scenario: Command-specific hint context
- **WHEN** a command completes and passes context data
- **THEN** the hint system receives metadata (e.g., goal codename, todo count) to inform AI hints

#### Scenario: Async hint rendering
- **WHEN** generating a hint (AI or static)
- **THEN** the hint renders asynchronously without blocking the command's return to the shell prompt

### Requirement: Hint Quality and UX
The system SHALL ensure hints are helpful, non-intrusive, and maintain CLI responsiveness.

#### Scenario: Single-line format
- **WHEN** displaying any hint
- **THEN** it is formatted as a single line with maximum 120 characters

#### Scenario: Visual distinction
- **WHEN** rendering a hint
- **THEN** it uses dimmed/gray text and a visual indicator (💡 or "Hint:") to distinguish it from command output

#### Scenario: Actionable suggestions
- **WHEN** a hint references a command
- **THEN** it includes the exact command in backticks (e.g., "Try `aissist todo list` to see your tasks")

#### Scenario: No hint repetition within session
- **WHEN** the same command is run multiple times in a session
- **THEN** hints can repeat (no session tracking required in initial implementation)

