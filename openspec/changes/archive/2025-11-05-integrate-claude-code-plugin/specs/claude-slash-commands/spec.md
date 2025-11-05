# claude-slash-commands Specification

## Purpose
Provides custom Claude Code slash commands that integrate aissist functionality into Claude Code workflows.

## ADDED Requirements

### Requirement: Slash Command Structure
The system SHALL provide slash commands following Claude Code conventions.

#### Scenario: Frontmatter configuration
- **WHEN** a command file is created
- **THEN** it includes YAML frontmatter with description, argument-hint, and allowed-tools

#### Scenario: Command documentation
- **WHEN** a command file is created
- **THEN** it includes markdown documentation explaining usage and examples

#### Scenario: Argument interpolation
- **WHEN** a command receives arguments
- **THEN** it uses `$ARGUMENTS` or positional variables like `$1`, `$2`

### Requirement: Log Command Slash Implementation
The system SHALL provide a `/aissist:log` command to import GitHub history.

#### Scenario: Command metadata
- **WHEN** defining /aissist:log
- **THEN** it includes description: "Import work history from GitHub" and argument-hint: "[timeframe]"

#### Scenario: Tool permissions
- **WHEN** defining /aissist:log
- **THEN** allowed-tools includes: `Bash(git:*)`, `Bash(gh:*)`, `Bash(aissist history log:*)`

#### Scenario: Command execution
- **WHEN** user runs `/aissist:log "this week"`
- **THEN** the command invokes: `aissist history log --from "this week"`

#### Scenario: Interactive mode
- **WHEN** user runs `/aissist:log` without arguments
- **THEN** the command prompts for timeframe interactively

#### Scenario: Error display
- **WHEN** GitHub authentication fails
- **THEN** the command displays the aissist CLI error message to the user

### Requirement: Recall Command Slash Implementation
The system SHALL provide a `/aissist:recall` command for semantic search.

#### Scenario: Command metadata
- **WHEN** defining /aissist:recall
- **THEN** it includes description: "Semantic search across your aissist memory" and argument-hint: "<query>"

#### Scenario: Tool permissions
- **WHEN** defining /aissist:recall
- **THEN** allowed-tools includes: `Bash(aissist recall:*)`, `Grep`, `Read`, `Glob`

#### Scenario: Command execution
- **WHEN** user runs `/aissist:recall "what did I work on last week?"`
- **THEN** the command invokes: `aissist recall "what did I work on last week?"`

#### Scenario: File exploration
- **WHEN** recall requires exploring files
- **THEN** Claude Code can use Grep, Read, and Glob tools to analyze aissist storage

#### Scenario: Missing query handling
- **WHEN** user runs `/aissist:recall` without a query
- **THEN** the command displays: "Usage: /aissist:recall <query>"

### Requirement: Goal Command Slash Implementation
The system SHALL provide a `/aissist:goal` command for goal management.

#### Scenario: Command metadata
- **WHEN** defining /aissist:goal
- **THEN** it includes description: "Manage goals interactively" and argument-hint: "[subcommand]"

#### Scenario: Tool permissions
- **WHEN** defining /aissist:goal
- **THEN** allowed-tools includes: `Bash(aissist goal:*)`, `Bash(aissist goal add:*)`, `Bash(aissist goal list:*)`, `Bash(aissist goal complete:*)`

#### Scenario: Subcommand delegation
- **WHEN** user runs `/aissist:goal add "Learn Rust"`
- **THEN** the command invokes: `aissist goal add "Learn Rust"`

#### Scenario: Interactive mode
- **WHEN** user runs `/aissist:goal` without subcommand
- **THEN** the command invokes: `aissist goal` (which presents interactive menu)

#### Scenario: List goals
- **WHEN** user runs `/aissist:goal list`
- **THEN** the command displays all goals with their status

### Requirement: Command Help Integration
The system SHALL ensure commands appear in Claude Code's help system.

#### Scenario: Help listing
- **WHEN** user runs `/help` in Claude Code
- **THEN** aissist commands appear under "(project)" category

#### Scenario: Command descriptions
- **WHEN** viewing help
- **THEN** each command shows its description from frontmatter

#### Scenario: Argument hints
- **WHEN** viewing help
- **THEN** each command shows expected arguments

### Requirement: Error Handling in Commands
The system SHALL handle errors gracefully within slash commands.

#### Scenario: CLI not found
- **WHEN** aissist CLI is not in PATH
- **THEN** the command displays: "aissist CLI not found. Please install: npm install -g aissist"

#### Scenario: Storage not initialized
- **WHEN** aissist storage doesn't exist
- **THEN** the command displays: "Run 'aissist init' first to set up storage."

#### Scenario: Invalid arguments
- **WHEN** a command receives invalid arguments
- **THEN** the command displays usage instructions and examples

#### Scenario: Subprocess timeout
- **WHEN** an aissist command takes too long
- **THEN** the system displays: "Command timed out. Try a more specific query or timeframe."

### Requirement: Output Formatting
The system SHALL format command output for readability in Claude Code.

#### Scenario: Preserve CLI formatting
- **WHEN** aissist CLI returns colored output
- **THEN** the command preserves ANSI color codes for display

#### Scenario: Structure large outputs
- **WHEN** output is lengthy (>50 lines)
- **THEN** the command adds section headers and separators

#### Scenario: Link preservation
- **WHEN** output contains URLs (GitHub links)
- **THEN** the command preserves URLs as clickable links
