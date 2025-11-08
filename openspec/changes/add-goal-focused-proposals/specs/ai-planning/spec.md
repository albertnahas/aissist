# ai-planning Specification Delta

## MODIFIED Requirements

### Requirement: Link Proposals to Goals
The system SHALL allow users to optionally link AI-generated proposals to active goals through keyword matching or interactive selection, AND generate goal-focused proposals when a goal is specified.

#### Scenario: Generate goal-focused proposals without explicit timeframe
- **WHEN** the user runs `aissist propose --goal "project"` (no timeframe argument)
- **THEN** the system performs keyword matching to select a goal
- **AND** loads the full goal details (text, description, deadline)
- **AND** if goal has a deadline: calculates timeframe from now until deadline
- **AND** if goal has NO deadline: uses timeless planning mode
- **AND** builds a goal-focused prompt including goal context
- **AND** instructs Claude to generate proposals specifically to advance that goal

#### Scenario: Generate goal-focused proposals with explicit timeframe
- **WHEN** the user runs `aissist propose "this week" --goal "project"`
- **THEN** the system uses the explicit timeframe ("this week")
- **AND** performs keyword matching to select a goal
- **AND** loads the full goal details (text, description, deadline)
- **AND** builds a goal-focused prompt including goal context
- **AND** instructs Claude to generate proposals for that timeframe that advance the goal
- **AND** goal deadline is informational context (not the planning timeframe)

#### Scenario: Goal with deadline auto-timeframe calculation
- **WHEN** a goal has deadline "2025-12-31" and user runs `aissist propose --goal <codename>`
- **THEN** the system calculates timeframe from current date until 2025-12-31
- **AND** creates label like "Now until December 31, 2025"
- **AND** prompt emphasizes working backward from deadline

#### Scenario: Goal without deadline timeless planning
- **WHEN** a goal has no deadline and user runs `aissist propose --goal <codename>`
- **THEN** the system uses timeless planning mode
- **AND** creates label like "Comprehensive Plan"
- **AND** prompt emphasizes creating a strategic plan regardless of time constraints
- **AND** Claude generates milestone-based plan without time pressure

#### Scenario: Distinguish explicit vs default timeframe with goal
- **WHEN** user runs `aissist propose --goal X` (timeframe defaults to 'today')
- **THEN** the system treats this as "no explicit timeframe" and applies smart timeframe
- **WHEN** user runs `aissist propose today --goal X` (explicitly says 'today')
- **THEN** the system uses 'today' as the timeframe and adds goal focus

### Requirement: Claude-Powered Proposal Generation
The system SHALL use Claude Code CLI to generate intelligent, context-aware action proposals based on user data, AND support goal-focused generation.

#### Scenario: Build goal-focused prompt
- **WHEN** building a prompt with goal information
- **THEN** the prompt includes a "Goal Focus" section
- **AND** states the goal codename, text, and description (if available)
- **AND** mentions the goal deadline (if available)
- **AND** instructs Claude to "prioritize proposals that directly advance this goal"
- **AND** adapts instructions based on timeframe type (deadline-based, timeless, or regular)

## ADDED Requirements

### Requirement: Goal Details Loading
The system SHALL load full goal details by codename for goal-focused proposal generation.

#### Scenario: Load goal by codename
- **WHEN** the system needs to load goal details for proposal generation
- **THEN** it uses the goal codename from the linkToGoal result
- **AND** searches goal markdown files for matching codename
- **AND** returns goal entry with codename, text, description, and deadline
- **AND** returns null if goal with that codename does not exist

#### Scenario: Handle missing goal gracefully
- **WHEN** a goal codename is selected but the goal cannot be found
- **THEN** the system displays a warning
- **AND** falls back to generating proposals without goal focus
- **AND** does not crash or error fatally

### Requirement: Deadline-Based Timeframe Calculation
The system SHALL calculate proposal timeframes based on goal deadlines when appropriate.

#### Scenario: Create timeframe from deadline date
- **WHEN** creating a timeframe for a goal with deadline "2025-12-31"
- **THEN** the system sets start date to current date
- **AND** sets end date to the goal deadline
- **AND** creates a descriptive label like "Now until December 31, 2025"
- **AND** returns a valid TimeframeResult

#### Scenario: Handle past deadlines
- **WHEN** a goal deadline is in the past
- **THEN** the system still creates the timeframe (for retrospective analysis)
- **AND** optionally warns the user that the deadline has passed

#### Scenario: Handle same-day deadlines
- **WHEN** a goal deadline is today
- **THEN** the system creates a same-day timeframe
- **AND** generates urgent, immediate action proposals
