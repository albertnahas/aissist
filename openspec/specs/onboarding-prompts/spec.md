# onboarding-prompts Specification

## Purpose
Provide interactive guidance at key workflow transition points to help users discover features, reduce friction, and build productive habits. This capability enables contextual prompts that guide users from initialization to their first goal, and from goal creation to linked todo management.
## Requirements
### Requirement: Post-Initialization Goal Prompt
After successful storage initialization, the system SHALL prompt the user to create their first goal with an option to proceed or skip.

#### Scenario: User accepts first goal prompt
- **GIVEN** the user runs `aissist init` or `aissist init --global`
- **AND** storage initialization completes successfully
- **AND** the user has completed or skipped the Claude Code integration prompt
- **WHEN** the system displays the post-initialization prompt "Would you like to set your first goal?"
- **AND** the user selects "Yes" or presses Enter (default: Yes)
- **THEN** the system launches the interactive goal creation flow
- **AND** prompts "Enter your goal:"
- **AND** after the user enters goal text, proceeds with codename generation and deadline prompt
- **AND** completes the goal creation as per `goal-management` spec
- **AND** triggers the post-goal-creation todo prompt (see next requirement)

#### Scenario: User declines first goal prompt
- **GIVEN** the user runs `aissist init`
- **AND** storage initialization completes successfully
- **WHEN** the system displays "Would you like to set your first goal?"
- **AND** the user selects "No"
- **THEN** the system displays the standard quick start guide
- **AND** exits the init command
- **AND** does NOT prompt for todo creation

#### Scenario: User cancels first goal prompt with Ctrl+C
- **GIVEN** the user runs `aissist init`
- **AND** storage initialization completes successfully
- **WHEN** the system displays "Would you like to set your first goal?"
- **AND** the user presses Ctrl+C
- **THEN** the system exits gracefully
- **AND** displays the standard quick start guide before exiting

#### Scenario: Post-initialization prompt appears after Claude Code integration
- **GIVEN** the user runs `aissist init`
- **AND** Claude Code is installed on the system
- **AND** the user completes the Claude Code integration prompt (accepts or declines)
- **WHEN** the Claude Code integration flow completes
- **THEN** the system displays the post-initialization goal prompt
- **AND** maintains the logical flow: init → Claude Code → first goal → first todo

#### Scenario: Skip prompt when storage already exists
- **GIVEN** the user runs `aissist init`
- **AND** storage already exists at the target path
- **WHEN** the system displays "Storage already exists" warning
- **THEN** the system does NOT display the post-initialization goal prompt
- **AND** exits after showing the storage skip message

### Requirement: Post-Goal-Creation Todo Prompt
After successfully adding a goal, the system SHALL prompt the user to create a todo and link it to the newly created goal.

#### Scenario: User accepts first todo prompt with goal linking
- **GIVEN** the user has just added a goal with codename "project-apollo"
- **AND** the goal creation succeeded
- **WHEN** the system displays "Would you like to add a todo and link it to this goal?"
- **AND** the user selects "Yes" or presses Enter (default: Yes)
- **THEN** the system launches the interactive todo creation flow
- **AND** prompts "Enter your todo:"
- **AND** after the user enters todo text, automatically sets the goal link to "project-apollo"
- **AND** prompts for priority (default: medium)
- **AND** completes the todo creation with the goal link pre-populated
- **AND** displays "Todo added with priority: [priority]" and "Linked to goal: project-apollo"

#### Scenario: User declines first todo prompt
- **GIVEN** the user has just added a goal with codename "research-task"
- **WHEN** the system displays "Would you like to add a todo and link it to this goal?"
- **AND** the user selects "No"
- **THEN** the system completes the goal add command
- **AND** exits without creating a todo

#### Scenario: User cancels todo prompt with Ctrl+C
- **GIVEN** the user has just added a goal
- **WHEN** the system displays the post-goal-creation todo prompt
- **AND** the user presses Ctrl+C
- **THEN** the system exits gracefully
- **AND** the goal remains saved (todo creation cancelled)

#### Scenario: Post-goal prompt triggered from init flow
- **GIVEN** the user accepted the post-initialization goal prompt
- **AND** successfully created their first goal "learn-typescript"
- **WHEN** the goal creation completes
- **THEN** the system displays "Would you like to add a todo and link it to this goal?"
- **AND** if accepted, pre-links the todo to "learn-typescript"
- **AND** completes the full onboarding flow: init → first goal → first todo

#### Scenario: Post-goal prompt triggered from direct goal add
- **GIVEN** the user runs `aissist goal add "Complete documentation"`
- **AND** the goal is successfully created with codename "docs-sprint"
- **WHEN** the goal creation completes
- **THEN** the system displays "Would you like to add a todo and link it to this goal?"
- **AND** maintains the same todo linking behavior as the init flow

#### Scenario: Skip todo prompt when goal add has errors
- **GIVEN** the user runs `aissist goal add "New goal"`
- **WHEN** the goal creation fails (e.g., codename generation error, file write error)
- **THEN** the system displays the error message
- **AND** does NOT display the post-goal-creation todo prompt
- **AND** exits with error status

### Requirement: Prompt Confirmation Defaults
Interactive onboarding prompts SHALL use sensible defaults to minimize friction and guide users toward productive actions.

#### Scenario: Default to "Yes" for post-initialization goal prompt
- **GIVEN** the user completes storage initialization
- **WHEN** the system displays "Would you like to set your first goal?"
- **THEN** the default selection is "Yes"
- **AND** pressing Enter without selection accepts "Yes"

#### Scenario: Default to "Yes" for post-goal-creation todo prompt
- **GIVEN** the user completes goal creation
- **WHEN** the system displays "Would you like to add a todo and link it to this goal?"
- **THEN** the default selection is "Yes"
- **AND** pressing Enter without selection accepts "Yes"

### Requirement: Non-Interactive Mode Compatibility
Onboarding prompts SHALL NOT appear when commands are run in non-interactive contexts or with programmatic flags.

#### Scenario: Skip prompts when running in CI/non-TTY environment
- **GIVEN** the command is executed in a non-TTY environment (e.g., CI pipeline)
- **WHEN** `aissist init` completes
- **THEN** the system does NOT display interactive prompts
- **AND** completes with standard success messages only

#### Scenario: Skip prompts when piping input
- **GIVEN** the user runs `echo "Learn Rust" | aissist goal add`
- **WHEN** the goal creation completes
- **THEN** the system does NOT display the post-goal-creation todo prompt
- **AND** exits normally after goal creation

#### Scenario: Future flag support for skipping prompts
- **NOTE**: This scenario documents expected behavior for future flag implementation
- **GIVEN** the user runs `aissist init --no-prompts` (flag not yet implemented)
- **WHEN** storage initialization completes
- **THEN** the system should skip all onboarding prompts
- **AND** display only the standard quick start guide

