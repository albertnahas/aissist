# Reflection System Specification

## ADDED Requirements

### Requirement: Interactive Reflection Prompts
The system SHALL provide an interactive reflection experience with guided questions.

#### Scenario: Start reflection session
- **WHEN** the user runs `aissist reflect`
- **THEN** the system presents a series of reflection questions using interactive prompts

#### Scenario: Answer reflection questions
- **WHEN** the user responds to each reflection prompt
- **THEN** the system captures the responses and moves to the next question

#### Scenario: Cancel reflection session
- **WHEN** the user cancels a reflection session (Ctrl+C)
- **THEN** the system exits gracefully without saving partial responses

### Requirement: Reflection Questions
The system SHALL provide meaningful reflection questions to guide user introspection.

#### Scenario: Present standard questions
- **WHEN** a reflection session begins
- **THEN** the system presents questions such as:
  - "What went well today?"
  - "What could have gone better?"
  - "What did you learn?"
  - "What are you grateful for?"
  - "What will you focus on tomorrow?"

### Requirement: Reflection Storage
The system SHALL store completed reflections in dated Markdown files.

#### Scenario: Save completed reflection
- **WHEN** the user completes all reflection questions
- **THEN** the system saves the responses to reflections/YYYY-MM-DD.md with timestamps

#### Scenario: Format reflection entry
- **WHEN** a reflection is saved
- **THEN** the entry includes:
  - A timestamp
  - Each question and its answer
  - Proper Markdown formatting with headers and paragraphs

### Requirement: Reflection History
The system SHALL allow users to view their past reflections.

#### Scenario: View today's reflection
- **WHEN** the user runs `aissist reflect show`
- **THEN** the system displays the reflection for today if it exists

#### Scenario: View reflection for specific date
- **WHEN** the user runs `aissist reflect show --date YYYY-MM-DD`
- **THEN** the system displays the reflection from the specified date

#### Scenario: No reflection found
- **WHEN** no reflection exists for the requested date
- **THEN** the system displays a message indicating no reflection was found

### Requirement: Reflection Frequency
The system SHALL allow users to create multiple reflections per day if desired.

#### Scenario: Multiple reflections same day
- **WHEN** the user runs `aissist reflect` multiple times in one day
- **THEN** each reflection is appended to the daily file with its own timestamp
