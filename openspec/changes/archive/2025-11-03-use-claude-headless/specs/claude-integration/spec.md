# Claude Integration Specification

## REMOVED Requirements

### Requirement: Agent SDK Setup
The system SHALL use the @anthropic-ai/agent-sdk for all Claude AI interactions.

**Reason**: Replacing with Claude Code headless mode for simpler authentication
**Migration**: Users should install Claude CLI instead of managing API keys

### Requirement: API Authentication
The system SHALL authenticate with Claude using the ANTHROPIC_API_KEY environment variable.

**Reason**: Replacing with Claude CLI authentication
**Migration**: Users need to authenticate with `claude` CLI tool instead of setting environment variables

## MODIFIED Requirements

### Requirement: Claude CLI Integration
The system SHALL use Claude Code headless mode via the `claude` CLI command for all Claude AI interactions.

#### Scenario: Check CLI availability
- **WHEN** the system needs to use Claude for semantic recall
- **THEN** it checks if the `claude` command is available in PATH

#### Scenario: Handle missing CLI
- **WHEN** the `claude` command is not found
- **THEN** the system displays a clear error message instructing the user to install Claude Code

#### Scenario: Invoke Claude via subprocess
- **WHEN** executing a Claude query
- **THEN** the system spawns `claude -p "<prompt>"` as a subprocess and captures output

#### Scenario: Handle CLI authentication errors
- **WHEN** the Claude CLI is not authenticated
- **THEN** the system displays an error message instructing the user to run `claude login`

### Requirement: Claude Reasoning
The system SHALL use Claude to summarize and answer questions based on user's stored memories.

#### Scenario: Send context to Claude
- **WHEN** the system invokes Claude for semantic recall
- **THEN** it constructs a prompt containing:
  - The user's query
  - Relevant excerpts from matched Markdown files
  - Structured metadata about each excerpt

#### Scenario: Receive Claude response
- **WHEN** Claude processes the request via headless mode
- **THEN** the system captures stdout and displays the summarized answer

#### Scenario: Handle response errors
- **WHEN** the `claude` command exits with non-zero status
- **THEN** the system displays a meaningful error message and falls back to raw search results

### Requirement: Prompt Engineering
The system SHALL construct effective prompts for Claude to ensure high-quality responses.

#### Scenario: Structure recall prompt
- **WHEN** building a prompt for semantic recall
- **THEN** the system includes:
  - Clear instructions for Claude
  - The user's original question
  - All relevant excerpts with metadata
  - Guidance on synthesizing information

#### Scenario: Optimize for context
- **WHEN** multiple excerpts are found
- **THEN** the system organizes them logically (by date, by context type, etc.)

### Requirement: Subprocess Management
The system SHALL properly manage Claude CLI subprocess execution.

#### Scenario: Set appropriate timeouts
- **WHEN** spawning the Claude CLI subprocess
- **THEN** the system sets a reasonable timeout (e.g., 30 seconds) to prevent hanging

#### Scenario: Handle subprocess errors
- **WHEN** the subprocess fails or times out
- **THEN** the system displays an appropriate error message and falls back to raw results

#### Scenario: Stream output handling
- **WHEN** Claude generates a response
- **THEN** the system captures stdout completely before processing

### Requirement: API Usage Optimization
The system SHALL minimize Claude usage by optimizing requests.

#### Scenario: Filter excerpts before sending
- **WHEN** many text matches are found
- **THEN** the system selects the most relevant excerpts to send to Claude (e.g., top 10)

### Requirement: Offline Graceful Degradation
The system SHALL handle offline or unavailable CLI scenarios gracefully.

#### Scenario: CLI unavailable
- **WHEN** the Claude CLI is not installed or not in PATH
- **THEN** it displays the raw search results without AI summarization

#### Scenario: Authentication unavailable
- **WHEN** the user is not authenticated with Claude CLI
- **THEN** the system displays a clear message about authentication and shows raw search results as fallback

### Requirement: Response Formatting
The system SHALL format Claude's responses for optimal CLI display.

#### Scenario: Display formatted response
- **WHEN** Claude returns a response via stdout
- **THEN** the system formats it with:
  - Clear section headers
  - Proper line breaks
  - Colored output for readability (using chalk)

#### Scenario: Include source references
- **WHEN** displaying Claude's response
- **THEN** the system includes references to the source files and dates used
