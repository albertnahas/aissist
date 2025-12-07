## ADDED Requirements

### Requirement: Parent Goal Linkage
The system SHALL support linking child goals to parent goals via an optional `parent_goal` field in goal metadata.

#### Scenario: Add goal with parent reference
- **GIVEN** a parent `.aissist` directory contains goal "launch-v2"
- **AND** the child `.aissist` has hierarchical read access enabled
- **WHEN** the user runs `aissist goal add "Build API endpoint" --parent launch-v2`
- **THEN** the system validates that "launch-v2" exists in an ancestor path
- **AND** stores `parent_goal: "launch-v2"` in the goal's YAML front matter
- **AND** updates `progress.json` with the parent linkage

#### Scenario: Goal YAML format with parent linkage
- **WHEN** a goal with parent linkage is stored
- **THEN** it follows this format:
```markdown
---
schema_version: "1.0"
timestamp: "14:30"
codename: build-api-endpoint
parent_goal: launch-v2
deadline: "2025-12-15"
---

Build API endpoint for user authentication
```

#### Scenario: List goals shows parent relationship
- **GIVEN** goals exist with `parent_goal` references
- **WHEN** the user runs `aissist goal list`
- **THEN** each linked goal displays its parent reference
- **AND** format shows: `[codename] (child of: parent-codename)`

#### Scenario: Parent goal not found warning
- **GIVEN** a goal references `parent_goal: "nonexistent"`
- **AND** no goal with codename "nonexistent" exists in ancestor paths
- **WHEN** the goal is displayed or listed
- **THEN** the system shows a warning: "Parent goal 'nonexistent' not found"
- **AND** the goal is still usable without the parent link

### Requirement: Progress Notes
The system SHALL allow adding progress notes to goals that are captured in the progress file for parent aggregation.

#### Scenario: Add progress note to goal
- **GIVEN** a goal "build-api" exists
- **WHEN** the user runs `aissist goal progress build-api "Completed endpoint design"`
- **THEN** the system appends a timestamped note to the goal's progress
- **AND** updates `progress.json` with the new note
- **AND** displays confirmation of the added note

#### Scenario: Progress note format in progress.json
- **GIVEN** a goal has progress notes
- **WHEN** `progress.json` is read
- **THEN** the notes array contains:
```json
{
  "progress_notes": [
    {
      "timestamp": "2025-12-07T10:30:00Z",
      "text": "Completed endpoint design"
    }
  ]
}
```

#### Scenario: View progress notes
- **GIVEN** a goal has progress notes
- **WHEN** the user runs `aissist goal show build-api`
- **THEN** the system displays the goal details
- **AND** shows all progress notes with timestamps
- **AND** notes are ordered chronologically (newest first)

### Requirement: Automatic Progress Sync on Goal Changes
The system SHALL automatically update `progress.json` when goals are modified.

#### Scenario: Progress updated on goal add
- **WHEN** the user adds a new goal
- **THEN** the system adds the goal to `progress.json`
- **AND** sets status to "active"
- **AND** updates `last_updated` timestamp

#### Scenario: Progress updated on goal complete
- **WHEN** the user completes a goal
- **THEN** the system updates the goal's status to "completed" in `progress.json`
- **AND** sets `completed_at` timestamp
- **AND** updates `last_updated` timestamp

#### Scenario: Progress updated on goal deadline change
- **WHEN** the user updates a goal's deadline
- **THEN** the system updates the deadline in `progress.json`
- **AND** updates `last_updated` timestamp
