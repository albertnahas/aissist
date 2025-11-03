# semantic-recall Specification

## Purpose
Provides semantic memory recall using Claude Code with file analysis tools. Enables users to search their memories with natural language queries and receive AI-synthesized answers that understand related concepts and context.

## Requirements
### Requirement: Semantic File Analysis
The system SHALL use Claude Code with file analysis tools to perform semantic search instead of keyword-based search.

#### Scenario: Use Claude Code headless mode
- **WHEN** the user runs `aissist recall "what did I learn about React?"`
- **THEN** the system checks Claude Code availability, invokes it with Grep/Read/Glob tools, and Claude semantically analyzes memory files

#### Scenario: Semantic understanding
- **WHEN** the user searches for "productivity tips"
- **THEN** Claude Code finds related content using terms like "efficiency", "time management", "focus", etc., not just exact keyword matches

#### Scenario: Incremental file reading
- **WHEN** Claude Code analyzes memory files
- **THEN** it uses Grep to find potentially relevant files, reads only relevant ones, and analyzes content progressively without loading all files into memory

#### Scenario: Tool-restricted execution
- **WHEN** Claude Code runs in headless mode for recall
- **THEN** it only has access to Grep, Read, and Glob tools (no write, edit, bash, or file modification tools)

### Requirement: Fallback to Keyword Search
The system SHALL gracefully fall back to keyword search when Claude Code is unavailable.

#### Scenario: Claude Code not installed
- **WHEN** Claude Code is not installed or not in PATH
- **THEN** the system displays "Claude Code not found, using keyword search", performs keyword-based search, displays raw excerpts, and includes install instructions

#### Scenario: Claude Code not authenticated
- **WHEN** Claude Code is installed but user is not authenticated
- **THEN** the system displays "Please run 'claude login'", falls back to keyword search, and shows raw results

#### Scenario: Claude Code execution fails
- **WHEN** Claude Code encounters an error during execution
- **THEN** the system logs error details, falls back to keyword search, and shows raw results with error message

### Requirement: Performance and Scalability
The system SHALL handle large memory collections without timeout issues.

#### Scenario: Large memory sets
- **WHEN** the user has hundreds of memory files
- **THEN** Claude Code selectively reads relevant files, streams responses progressively, and completes without 30-second timeouts

#### Scenario: Progressive feedback
- **WHEN** Claude Code is analyzing files
- **THEN** the system displays a spinner with status updates (e.g., "Searching your memories...")

### Requirement: Claude Code Session Detection
The system SHALL detect Claude Code availability and authentication status.

#### Scenario: Check installation
- **WHEN** the recall command is invoked
- **THEN** the system checks if `claude` CLI is available in PATH

#### Scenario: Report status
- **WHEN** Claude Code is unavailable
- **THEN** the system displays a helpful message explaining how to install and authenticate

### Requirement: Tool-Enabled Prompt Construction
The system SHALL construct prompts that guide Claude Code to use file analysis tools effectively.

#### Scenario: Provide storage context
- **WHEN** invoking Claude Code
- **THEN** the prompt includes storage path, directory structure explanation, user's query, and instructions to use Grep/Read/Glob tools

#### Scenario: Encourage semantic analysis
- **WHEN** Claude Code receives the prompt
- **THEN** it's instructed to use semantic understanding, search for related concepts, read contextually relevant files, and synthesize information

