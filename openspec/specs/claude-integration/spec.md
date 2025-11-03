# claude-integration Specification

## Purpose
Provides integration with Claude Code CLI using headless mode with file analysis tools for semantic memory recall. Replaced Agent SDK approach with tool-enabled subprocess execution for better performance and semantic understanding.
## Requirements
### Requirement: Claude Code Headless Execution
The system SHALL use Claude Code CLI in headless mode with restricted file analysis tools.

#### Scenario: Execute with file tools
- **WHEN** the system invokes Claude Code for recall
- **THEN** it executes: `claude -p "<prompt>" --allowedTools 'Grep,Read,Glob'`

#### Scenario: Tool restriction for security
- **WHEN** invoking Claude Code
- **THEN** the allowed tools are strictly limited to Grep, Read, and Glob (read-only)

#### Scenario: Streaming response
- **WHEN** Claude Code processes the recall request
- **THEN** the system receives stdout progressively and displays results

### Requirement: Session Management
The system SHALL detect and verify Claude Code availability and authentication.

#### Scenario: Check Claude Code installation
- **WHEN** the system starts a recall operation
- **THEN** it checks if `claude` CLI exists in PATH

#### Scenario: Handle authentication failure
- **WHEN** Claude Code returns authentication error
- **THEN** the system displays: "Please run: claude login"

#### Scenario: Graceful degradation
- **WHEN** Claude Code is not available
- **THEN** the system falls back to keyword search

### Requirement: Prompt Engineering for File Analysis
The system SHALL construct prompts that optimize Claude Code's file analysis capabilities for both semantic recall and proposal generation.

#### Scenario: Context-rich prompts
- **WHEN** building a recall prompt
- **THEN** the system includes storage path, directory structure, and user query

#### Scenario: Tool usage guidance
- **WHEN** Claude Code receives the prompt
- **THEN** it's instructed to use Grep for discovery, Read for analysis, and think semantically

#### Scenario: Proposal generation prompt
- **WHEN** building a proposal generation prompt
- **THEN** the system includes timeframe context, data summaries (goals, history, reflections), and instructions to propose 3-5 actionable items

#### Scenario: Prompt includes data locations
- **WHEN** building a proposal prompt
- **THEN** the system specifies file paths for goals, history, and reflections directories so Claude can explore them

### Requirement: Tool-Based File Discovery
The system SHALL enable Claude Code to discover and analyze files using tools rather than pre-selected excerpts.

#### Scenario: Grep-first discovery
- **WHEN** Claude Code starts analyzing
- **THEN** it uses Grep to search for relevant terms and identifies candidate files

#### Scenario: Semantic file selection
- **WHEN** deciding which files to read
- **THEN** Claude Code considers file paths, uses Grep results to gauge relevance, and reads contextually related files

### Requirement: Security Constraints
The system SHALL enforce strict security constraints on Claude Code's capabilities.

#### Scenario: Read-only access
- **WHEN** Claude Code is invoked for recall
- **THEN** it can only use Grep, Read, and Glob tools (no Write, Edit, Delete, or Bash)

#### Scenario: Path restriction
- **WHEN** constructing the prompt
- **THEN** the system specifies the storage directory and Claude Code should only access files within that directory

### Requirement: Error Handling and Fallback
The system SHALL handle Claude Code errors gracefully with appropriate fallbacks.

#### Scenario: Claude Code not found
- **WHEN** `claude` CLI is not in PATH
- **THEN** the system logs warning, falls back to keyword search, and displays install instructions

#### Scenario: Subprocess error
- **WHEN** the Claude Code subprocess fails
- **THEN** the system captures stderr, logs error, falls back to keyword search, and displays error message

### Requirement: Performance Monitoring
The system SHALL provide feedback on Claude Code's analysis progress.

#### Scenario: Show progress indicator
- **WHEN** Claude Code is analyzing files
- **THEN** the system displays a spinner with status text

#### Scenario: Handle cancellation
- **WHEN** the user presses Ctrl+C during recall
- **THEN** the system kills the Claude Code subprocess and exits gracefully

