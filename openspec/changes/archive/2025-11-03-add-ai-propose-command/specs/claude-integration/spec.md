## MODIFIED Requirements

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
