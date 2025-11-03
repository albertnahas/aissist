# Semantic Recall Specification

## ADDED Requirements

### Requirement: Text-Based Search
The system SHALL search all Markdown files for text matching the user's query.

#### Scenario: Search all files
- **WHEN** the user runs `aissist recall "motivation tips"`
- **THEN** the system searches all .md files in the storage directory and its subdirectories

#### Scenario: Find matching excerpts
- **WHEN** matching text is found
- **THEN** the system extracts relevant excerpts with surrounding context

#### Scenario: No matches found
- **WHEN** no matching text is found
- **THEN** the system displays a message indicating no results were found

### Requirement: AI-Powered Summarization
The system SHALL use Claude AI to summarize and answer questions based on matching excerpts. (See **claude-integration** spec for authentication details.)

#### Scenario: Summarize search results
- **WHEN** the user runs `aissist recall "what did I say about productivity?"`
- **THEN** the system:
  1. Searches for matching text
  2. Sends matching excerpts to Claude via the Agent SDK
  3. Returns Claude's summarized answer

#### Scenario: Contextual understanding
- **WHEN** Claude receives multiple excerpts
- **THEN** it synthesizes information across all excerpts to provide a comprehensive answer

#### Scenario: Handle API errors
- **WHEN** the Claude API is unavailable or returns an error
- **THEN** the system displays an error message and shows the raw matching excerpts as fallback

### Requirement: Excerpt Context Preservation
The system SHALL preserve sufficient context around matching text for AI understanding.

#### Scenario: Include surrounding lines
- **WHEN** a text match is found
- **THEN** the system includes several lines before and after the match for context

#### Scenario: Include metadata
- **WHEN** excerpts are sent to Claude
- **THEN** the system includes:
  - File path
  - Date (from filename)
  - Entry type (goal, history, context, reflection)

### Requirement: Search Performance
The system SHALL perform searches efficiently even with large amounts of stored data.

#### Scenario: Search optimization
- **WHEN** the system performs a search
- **THEN** it uses efficient file reading methods and avoids loading entire files into memory unnecessarily

#### Scenario: Progressive loading
- **WHEN** searching through many files
- **THEN** the system provides feedback on search progress

### Requirement: Query Flexibility
The system SHALL support various query formats and natural language questions.

#### Scenario: Keyword search
- **WHEN** the user provides simple keywords
- **THEN** the system finds exact and partial matches

#### Scenario: Natural language question
- **WHEN** the user asks a question like "what did I learn about React?"
- **THEN** the system searches for relevant terms and uses Claude to understand the question intent

#### Scenario: Phrase search
- **WHEN** the user provides a quoted phrase
- **THEN** the system searches for the exact phrase
