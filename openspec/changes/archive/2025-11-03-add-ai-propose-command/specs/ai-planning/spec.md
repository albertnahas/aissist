## ADDED Requirements

### Requirement: Timeframe Parsing
The system SHALL parse natural language timeframe expressions into date ranges for proposal scoping.

#### Scenario: Default to today
- **WHEN** the user runs `aissist propose` without arguments
- **THEN** the system uses today's date as the default timeframe

#### Scenario: Parse relative week expressions
- **WHEN** the user runs `aissist propose "this week"` or `"next week"`
- **THEN** the system calculates the ISO week boundaries and returns the date range

#### Scenario: Parse quarter expressions
- **WHEN** the user runs `aissist propose "this quarter"`, `"next quarter"`, or `"2026 Q1"`
- **THEN** the system calculates the quarter start and end dates

#### Scenario: Parse month expressions
- **WHEN** the user runs `aissist propose "November 2025"` or `"next month"`
- **THEN** the system calculates the month boundaries

#### Scenario: Parse relative day expressions
- **WHEN** the user runs `aissist propose "tomorrow"` or `"next 3 days"`
- **THEN** the system calculates the appropriate date range from today

#### Scenario: Invalid timeframe expression
- **WHEN** the user provides an unparseable timeframe
- **THEN** the system displays an error message with example formats and exits

### Requirement: Data Aggregation for Proposals
The system SHALL load and aggregate relevant data from storage based on the specified timeframe.

#### Scenario: Load all goals
- **WHEN** building a proposal
- **THEN** the system loads all goal files from `.aissist/goals/*.md`

#### Scenario: Load recent history logs
- **WHEN** building a proposal for a future timeframe
- **THEN** the system loads history logs from the past 30 days (or configurable lookback period)

#### Scenario: Load available reflections
- **WHEN** building a proposal
- **THEN** the system attempts to load reflection files from `.aissist/reflections/` for the past 30 days

#### Scenario: Include context files optionally
- **WHEN** the user passes `--context` flag
- **THEN** the system includes relevant context files from `.aissist/context/`

#### Scenario: Filter by tag
- **WHEN** the user passes `--tag <focus>`
- **THEN** the system filters loaded goals and data to entries matching the specified tag

#### Scenario: No data available
- **WHEN** no goals, history, or reflections exist
- **THEN** the system displays a message suggesting to use `aissist goal add`, `aissist history add`, or `aissist reflect` first

### Requirement: Claude-Powered Proposal Generation
The system SHALL generate actionable proposals using Claude Code CLI with file analysis tools.

#### Scenario: Build context-rich prompt
- **WHEN** invoking Claude for proposal generation
- **THEN** the system constructs a prompt including:
  - Timeframe context (e.g., "planning for Q1 2026")
  - Summary of goals (count and key themes)
  - Recent history patterns (frequency, topics)
  - Available reflections
  - Instruction to analyze data and propose 3-5 actionable items

#### Scenario: Invoke Claude Code with file tools
- **WHEN** generating a proposal
- **THEN** the system executes: `claude -p "<prompt>" --allowedTools 'Grep,Read,Glob'` with the storage directory in scope

#### Scenario: Stream proposal output
- **WHEN** Claude Code processes the proposal request
- **THEN** the system displays a spinner and streams the response to the user

#### Scenario: Handle Claude Code unavailable
- **WHEN** Claude Code CLI is not installed or not authenticated
- **THEN** the system displays an error message with installation/authentication instructions and exits

#### Scenario: Proposal generation error
- **WHEN** the Claude Code subprocess fails or returns an error
- **THEN** the system logs the error and displays a user-friendly message

### Requirement: Interactive Proposal Follow-up
The system SHALL offer interactive actions after displaying the proposal.

#### Scenario: Offer to save as goals
- **WHEN** a proposal is successfully generated
- **THEN** the system prompts: "Want to save this as a new goal list? (Y/n)"

#### Scenario: User accepts goal saving
- **WHEN** the user confirms goal saving
- **THEN** the system parses proposed items and creates dated goal entries using `aissist goal add` logic

#### Scenario: User declines goal saving
- **WHEN** the user declines or cancels
- **THEN** the system exits without modifying storage

### Requirement: Structured Proposal Output
The system SHALL format proposal output in a clear, actionable structure.

#### Scenario: Display proposal header
- **WHEN** outputting a proposal
- **THEN** the system displays a header: `🎯 Proposed Plan for <timeframe>:`

#### Scenario: Display numbered action items
- **WHEN** Claude generates proposal items
- **THEN** the system displays them as a numbered list (e.g., "1. Finalize MVP", "2. Start learning path")

#### Scenario: Include context or reasoning
- **WHEN** Claude provides reasoning for proposals
- **THEN** the system includes brief explanations or highlights from the analysis

### Requirement: Optional Reflection Integration
The system SHALL support optional reflection prompts before generating proposals.

#### Scenario: Reflect before proposing
- **WHEN** the user passes `--reflect` flag
- **THEN** the system prompts the user for a quick reflection input before loading data

#### Scenario: Save reflection with timestamp
- **WHEN** the user provides reflection input
- **THEN** the system saves it to `.aissist/reflections/YYYY-MM-DD.md` with a timestamp before continuing

### Requirement: Debug Mode
The system SHALL support debug output for prompt inspection.

#### Scenario: Display raw prompt
- **WHEN** the user passes `--debug` flag
- **THEN** the system prints the constructed Claude prompt before invoking Claude Code

#### Scenario: Display data summary
- **WHEN** `--debug` is enabled
- **THEN** the system prints the count and file paths of loaded goals, history, and reflections
