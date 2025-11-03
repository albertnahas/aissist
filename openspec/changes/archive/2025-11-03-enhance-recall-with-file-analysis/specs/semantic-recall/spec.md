# semantic-recall Specification Delta

## MODIFIED Requirements

### Requirement: Semantic File Analysis
The system SHALL use Claude Code with file analysis tools to perform semantic search instead of keyword-based search.

#### Scenario: Use Claude Code headless mode
- **WHEN** the user runs `aissist recall "what did I learn about React?"`
- **THEN** the system:
  1. Checks if Claude Code is available and authenticated
  2. Invokes Claude Code in headless mode with Grep, Read, and Glob tools enabled
  3. Passes the query and storage path to Claude
  4. Claude uses tools to semantically search and analyze memory files
  5. Returns Claude's synthesized answer

#### Scenario: Semantic understanding
- **WHEN** the user searches for "productivity tips"
- **THEN** Claude Code finds related content using terms like "efficiency", "time management", "focus", etc., not just exact keyword matches

#### Scenario: Incremental file reading
- **WHEN** Claude Code analyzes memory files
- **THEN** it:
  1. Uses Grep to find potentially relevant files
  2. Reads only the files it deems relevant
  3. Analyzes content progressively without loading all files into memory
  4. Avoids timeout issues

#### Scenario: Tool-restricted execution
- **WHEN** Claude Code runs in headless mode for recall
- **THEN** it only has access to:
  - Grep tool (for searching file contents)
  - Read tool (for reading file contents)
  - Glob tool (for finding files by pattern)
  - NO write, edit, bash, or file modification tools

### Requirement: Fallback to Keyword Search
The system SHALL gracefully fall back to keyword search when Claude Code is unavailable.

#### Scenario: Claude Code not installed
- **WHEN** Claude Code is not installed or not in PATH
- **THEN** the system:
  1. Displays a message: "Claude Code not found, using keyword search"
  2. Performs keyword-based search using `searchMarkdownFiles()`
  3. Displays raw matching excerpts
  4. Includes instructions for installing Claude Code

#### Scenario: Claude Code not authenticated
- **WHEN** Claude Code is installed but user is not authenticated
- **THEN** the system:
  1. Displays a message: "Please run 'claude login' to enable AI-powered recall"
  2. Falls back to keyword search
  3. Shows raw results

#### Scenario: Claude Code execution fails
- **WHEN** Claude Code encounters an error during execution
- **THEN** the system:
  1. Logs the error details
  2. Falls back to keyword search
  3. Shows raw results with error message

### Requirement: Performance and Scalability
The system SHALL handle large memory collections without timeout issues.

#### Scenario: Large memory sets
- **WHEN** the user has hundreds of memory files
- **THEN** Claude Code:
  1. Selectively reads relevant files (not all files)
  2. Streams responses progressively
  3. Completes the query without 30-second timeouts

#### Scenario: Progressive feedback
- **WHEN** Claude Code is analyzing files
- **THEN** the system displays a spinner with status updates (e.g., "Searching your memories...")

## REMOVED Requirements

### ~~Requirement: Text-Based Search~~
~~The system SHALL search all Markdown files for text matching the user's query.~~

**Reason**: Replaced by semantic file analysis. Keyword search is kept only as fallback, not primary approach.

### ~~Requirement: AI-Powered Summarization~~
~~The system SHALL use Claude AI to summarize and answer questions based on matching excerpts.~~

**Reason**: Replaced by Claude Code with file tools. Instead of: search → excerpts → summarize, we now do: Claude Code with tools → direct semantic analysis.

### ~~Requirement: Excerpt Context Preservation~~
~~The system SHALL preserve sufficient context around matching text for AI understanding.~~

**Reason**: Claude Code reads full file contents using the Read tool, so manual excerpt extraction is no longer needed. Claude decides what context is relevant.

## ADDED Requirements

### Requirement: Claude Code Session Detection
The system SHALL detect Claude Code availability and authentication status.

#### Scenario: Check installation
- **WHEN** the recall command is invoked
- **THEN** the system checks if `claude` CLI is available in PATH

#### Scenario: Verify authentication
- **WHEN** Claude Code is installed
- **THEN** the system verifies the user is authenticated (e.g., by running a test command)

#### Scenario: Report status
- **WHEN** Claude Code is unavailable
- **THEN** the system displays a helpful message explaining how to install and authenticate

### Requirement: Tool-Enabled Prompt Construction
The system SHALL construct prompts that guide Claude Code to use file analysis tools effectively.

#### Scenario: Provide storage context
- **WHEN** invoking Claude Code
- **THEN** the prompt includes:
  - The storage path location
  - Directory structure explanation (goals/, history/, reflections/, context/)
  - The user's query
  - Instructions to use Grep, Read, and Glob tools

#### Scenario: Encourage semantic analysis
- **WHEN** Claude Code receives the prompt
- **THEN** it's instructed to:
  - Use semantic understanding, not keyword matching
  - Search for related concepts and synonyms
  - Read files that are contextually relevant
  - Synthesize information across multiple files
