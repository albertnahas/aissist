# smart-history-logging Specification

## Purpose
TBD - created by archiving change add-smart-history-flag. Update Purpose after archive.
## Requirements
### Requirement: Smart Flag Option
The `history log` command SHALL accept an optional `--smart` (or `-s`) flag that enables AI-enhanced logging.

#### Scenario: User logs with smart flag
- **GIVEN** the user has Claude CLI installed and authenticated
- **WHEN** the user runs `aissist history log --smart "fixd auth bug took 2hrs"`
- **THEN** the system sends the text to Claude Haiku for enhancement
- **AND** logs the cleaned-up text (e.g., "Fixed authentication bug (2 hours)")
- **AND** displays success message with the enhanced text

#### Scenario: User logs without smart flag
- **GIVEN** the user runs `aissist history log "fixd auth bug"`
- **WHEN** the `--smart` flag is not provided
- **THEN** the system logs the text as-is (current behavior unchanged)
- **AND** no AI processing occurs

#### Scenario: Short flag alias
- **GIVEN** the user wants a quick way to use smart logging
- **WHEN** the user runs `aissist history log -s "quick note"`
- **THEN** the `-s` flag behaves identically to `--smart`

### Requirement: Text Enhancement
When the `--smart` flag is used, the system SHALL clean up the input text using Claude Haiku while preserving meaning and key details.

#### Scenario: Correct spelling and grammar
- **GIVEN** the user provides text with typos
- **WHEN** the user runs `aissist history log --smart "implmented new featur for usr profiles"`
- **THEN** the system corrects to "Implemented new feature for user profiles"
- **AND** preserves the core meaning

#### Scenario: Preserve metrics and numbers
- **GIVEN** the user includes specific metrics or times
- **WHEN** the user runs `aissist history log --smart "reduced load time 500ms to 120ms"`
- **THEN** the enhanced text preserves exact numbers: "Reduced load time from 500ms to 120ms"
- **AND** does not alter or round numeric values

#### Scenario: Minimal rephrasing
- **GIVEN** the user provides rough but understandable text
- **WHEN** the system enhances the text
- **THEN** changes are minimal (fix errors, improve clarity)
- **AND** the system does not add unnecessary elaboration
- **AND** the enhanced text remains concise

#### Scenario: Handle already-clean text
- **GIVEN** the user provides well-written text
- **WHEN** the user runs `aissist history log --smart "Completed API documentation"`
- **THEN** the text is returned largely unchanged
- **AND** no unnecessary modifications are made

### Requirement: Automatic Goal Linking
When the `--smart` flag is used, the system SHALL automatically link to the most relevant goal if a confident semantic match exists.

#### Scenario: Confident goal match found
- **GIVEN** the user has an active goal "improve-performance" about optimizing app speed
- **WHEN** the user runs `aissist history log --smart "optimized database queries"`
- **THEN** the system identifies "improve-performance" as a confident match
- **AND** logs the entry with `--goal improve-performance` automatically
- **AND** displays confirmation showing the goal link

#### Scenario: No confident match
- **GIVEN** the user has goals but none strongly match the entry content
- **WHEN** the user runs `aissist history log --smart "updated README typo"`
- **THEN** the system determines no goal is a confident match
- **AND** logs the entry without goal linking
- **AND** does not prompt the user to select a goal

#### Scenario: No active goals exist
- **GIVEN** the user has no active goals
- **WHEN** the user runs `aissist history log --smart "completed task"`
- **THEN** the system skips goal matching entirely
- **AND** logs the enhanced entry without goal linking

#### Scenario: Multiple potential matches resolved automatically
- **GIVEN** the user has multiple goals that could match
- **WHEN** the system analyzes the entry
- **THEN** it picks the single best match based on semantic similarity
- **AND** does not prompt for user selection
- **AND** only links if confidence is high enough

### Requirement: Graceful Degradation
The system SHALL handle failures gracefully and fall back to logging the original text.

#### Scenario: Claude CLI unavailable
- **GIVEN** the Claude CLI is not installed or not in PATH
- **WHEN** the user runs `aissist history log --smart "some text"`
- **THEN** the system logs the original text as-is
- **AND** displays a warning that smart enhancement was skipped
- **AND** the command succeeds (non-blocking failure)

#### Scenario: Claude CLI not authenticated
- **GIVEN** the Claude CLI is installed but not authenticated
- **WHEN** the user runs `aissist history log --smart "some text"`
- **THEN** the system logs the original text as-is
- **AND** displays a warning about authentication
- **AND** the command succeeds

#### Scenario: Network timeout
- **GIVEN** the AI request times out
- **WHEN** the user runs `aissist history log --smart "some text"`
- **THEN** the system logs the original text after timeout
- **AND** displays a warning that enhancement timed out
- **AND** the command completes without blocking

### Requirement: Combination with Other Flags
The `--smart` flag SHALL work correctly with other existing flags.

#### Scenario: Smart with explicit goal flag
- **GIVEN** the user provides both `--smart` and `--goal`
- **WHEN** the user runs `aissist history log --smart --goal my-goal "did stuff"`
- **THEN** the explicit `--goal` flag takes precedence
- **AND** auto goal-linking from smart is skipped
- **AND** text enhancement still occurs

#### Scenario: Smart with date flag
- **GIVEN** the user wants to log a past entry with smart enhancement
- **WHEN** the user runs `aissist history log --smart --date yesterday "fixd bug"`
- **THEN** the text is enhanced as usual
- **AND** the entry is logged to yesterday's date file
- **AND** both flags work together correctly

