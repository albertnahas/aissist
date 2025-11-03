# claude-integration Specification Delta

## MODIFIED Requirements

### Requirement: Claude Code Headless Execution
The system SHALL use Claude Code CLI in headless mode with restricted file analysis tools.

#### Scenario: Execute with file tools
- **WHEN** the system invokes Claude Code for recall
- **THEN** it executes: `claude -p "<prompt>" --allowedTools 'Grep,Read,Glob'`

#### Scenario: Tool restriction for security
- **WHEN** invoking Claude Code
- **THEN** the allowed tools are strictly limited to:
  - `Grep` - Search file contents
  - `Read` - Read file contents
  - `Glob` - Find files by pattern
  - NO other tools (Bash, Write, Edit, etc.)

#### Scenario: Streaming response
- **WHEN** Claude Code processes the recall request
- **THEN** the system:
  1. Receives stdout progressively
  2. Displays a spinner during processing
  3. Shows the complete response when done

### Requirement: Session Management
The system SHALL detect and verify Claude Code availability and authentication.

#### Scenario: Check Claude Code installation
- **WHEN** the system starts a recall operation
- **THEN** it checks if `claude` CLI exists in PATH using `which claude`

#### Scenario: Verify authentication status
- **WHEN** Claude Code is installed
- **THEN** the system:
  1. Attempts a test invocation (e.g., `claude -p "test" --allowedTools ''`)
  2. Checks for authentication errors in output
  3. Returns authentication status

#### Scenario: Handle authentication failure
- **WHEN** Claude Code returns "not authenticated" error
- **THEN** the system displays: "Please run: claude login"

### Requirement: Error Handling and Fallback
The system SHALL handle Claude Code errors gracefully with appropriate fallbacks.

#### Scenario: Claude Code not found
- **WHEN** `claude` CLI is not in PATH
- **THEN** the system:
  1. Logs warning: "Claude Code not found"
  2. Falls back to keyword search
  3. Displays install instructions

#### Scenario: Timeout handling
- **WHEN** Claude Code takes longer than expected
- **THEN** the system:
  1. Continues waiting (no artificial timeout)
  2. Shows spinner with elapsed time
  3. Allows user to cancel with Ctrl+C

#### Scenario: Subprocess error
- **WHEN** the Claude Code subprocess fails
- **THEN** the system:
  1. Captures stderr output
  2. Logs the error
  3. Falls back to keyword search
  4. Displays error message to user

### Requirement: Prompt Engineering for File Analysis
The system SHALL construct prompts that optimize Claude Code's file analysis capabilities.

#### Scenario: Context-rich prompts
- **WHEN** building a recall prompt
- **THEN** the system includes:
  - Storage directory path
  - Directory structure explanation
  - User's natural language query
  - Instructions for using Grep/Read/Glob tools
  - Guidance on semantic analysis

#### Scenario: Tool usage guidance
- **WHEN** Claude Code receives the prompt
- **THEN** it's instructed to:
  1. Start with Grep to discover relevant files
  2. Use Read to analyze file contents
  3. Use Glob to find files by pattern
  4. Synthesize information semantically

## REMOVED Requirements

### ~~Requirement: Agent SDK Setup~~
~~The system SHALL use the @anthropic-ai/agent-sdk for all Claude AI interactions.~~

**Reason**: No longer using Agent SDK. Using Claude Code CLI with tools instead.

### ~~Requirement: API Authentication~~
~~The system SHALL authenticate with Claude using the ANTHROPIC_API_KEY environment variable.~~

**Reason**: Authentication now handled by Claude Code CLI (`claude login`), not API keys.

### ~~Requirement: API Usage Optimization~~
~~The system SHALL minimize API costs by optimizing requests to Claude.~~

**Reason**: Claude Code handles API optimization internally. We don't manage API calls directly.

### ~~Requirement: Prompt Engineering~~
~~The system SHALL construct effective prompts for Claude to ensure high-quality responses.~~

**Reason**: Still relevant but significantly changed. Prompts now guide tool usage, not excerpt summarization. See new "Prompt Engineering for File Analysis" requirement.

## ADDED Requirements

### Requirement: Tool-Based File Discovery
The system SHALL enable Claude Code to discover and analyze files using tools rather than pre-selected excerpts.

#### Scenario: Grep-first discovery
- **WHEN** Claude Code starts analyzing a query
- **THEN** it typically:
  1. Uses Grep to search for relevant terms across files
  2. Identifies candidate files from Grep results
  3. Reads promising files with Read tool
  4. Synthesizes findings

#### Scenario: Semantic file selection
- **WHEN** deciding which files to read
- **THEN** Claude Code:
  1. Considers file paths (goals/, history/, reflections/, context/)
  2. Uses Grep results to gauge relevance
  3. Reads files that are contextually related, not just keyword matches
  4. Can follow relationships between files

### Requirement: Security Constraints
The system SHALL enforce strict security constraints on Claude Code's capabilities.

#### Scenario: Read-only access
- **WHEN** Claude Code is invoked for recall
- **THEN** it:
  1. Cannot modify files (no Write, Edit, Delete tools)
  2. Cannot execute shell commands (no Bash tool)
  3. Cannot access network (no WebFetch tool)
  4. Can only read and search files

#### Scenario: Path restriction
- **WHEN** constructing the prompt
- **THEN** the system specifies the storage directory path
- **AND** Claude Code should only access files within that directory

### Requirement: Performance Monitoring
The system SHALL provide feedback on Claude Code's analysis progress.

#### Scenario: Show progress indicator
- **WHEN** Claude Code is analyzing files
- **THEN** the system displays:
  - A spinner or progress indicator
  - Status text (e.g., "Searching your memories...")
  - Option to cancel with Ctrl+C

#### Scenario: Handle cancellation
- **WHEN** the user presses Ctrl+C during recall
- **THEN** the system:
  1. Kills the Claude Code subprocess
  2. Displays "Cancelled" message
  3. Exits gracefully
