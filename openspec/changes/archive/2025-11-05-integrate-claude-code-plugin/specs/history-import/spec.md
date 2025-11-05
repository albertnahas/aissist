# history-import Specification

## Purpose
Provides functionality to import work history from GitHub as aissist history entries with semantic summarization.

## ADDED Requirements

### Requirement: Log Command Interface
The system SHALL provide a command to import GitHub activity as history entries.

#### Scenario: Command invocation
- **WHEN** user runs `aissist history log --from <timeframe>`
- **THEN** the system prompts for a timeframe if not provided

#### Scenario: Interactive timeframe prompt
- **WHEN** no timeframe is provided
- **THEN** the system asks: "From when should we start logging? (e.g., 'today', 'this week', 'this month', or a date like '2024-01-15')"

#### Scenario: Default timeframe
- **WHEN** user presses Enter without input
- **THEN** the system defaults to "today"

### Requirement: Natural Language Date Parsing
The system SHALL parse natural language date inputs into date ranges.

#### Scenario: Parse relative dates
- **WHEN** user inputs "today", "yesterday", "this week", "this month", "last week", or "last month"
- **THEN** the system converts to appropriate date range

#### Scenario: Parse ISO dates
- **WHEN** user inputs "2024-01-15"
- **THEN** the system uses that as the start date (through today)

#### Scenario: Invalid date handling
- **WHEN** user inputs an unrecognized date format
- **THEN** the system displays: "Unable to parse date. Please use formats like 'this week' or '2024-01-15'" and re-prompts

#### Scenario: Date range display
- **WHEN** a date is successfully parsed
- **THEN** the system displays: "Fetching activity from YYYY-MM-DD to YYYY-MM-DD"

### Requirement: GitHub Authentication
The system SHALL authenticate with GitHub to fetch user activity.

#### Scenario: Use gh CLI credentials
- **WHEN** `gh` CLI is installed and authenticated
- **THEN** the system uses its credentials automatically

#### Scenario: Token fallback
- **WHEN** `gh` CLI is not authenticated
- **THEN** the system prompts: "GitHub token required. Create one at https://github.com/settings/tokens"

#### Scenario: Authentication validation
- **WHEN** credentials are provided
- **THEN** the system makes a test API call to validate authentication

#### Scenario: Authentication failure
- **WHEN** authentication fails
- **THEN** the system displays: "Authentication failed. Please check your credentials."

### Requirement: GitHub Activity Fetching
The system SHALL retrieve relevant GitHub activity for the specified timeframe.

#### Scenario: Fetch user commits
- **WHEN** fetching activity
- **THEN** the system retrieves commits authored by the authenticated user

#### Scenario: Fetch pull requests
- **WHEN** fetching activity
- **THEN** the system retrieves PRs opened by the authenticated user

#### Scenario: Repository detection
- **WHEN** running in a Git repository
- **THEN** the system prioritizes commits from the current repository

#### Scenario: Multi-repository support
- **WHEN** the user has activity across multiple repositories
- **THEN** the system fetches activity from all accessible repositories

#### Scenario: Progress indicator
- **WHEN** fetching large amounts of activity
- **THEN** the system displays a spinner with: "Fetching GitHub activity..."

### Requirement: Semantic Summarization
The system SHALL semantically group and summarize GitHub activity.

#### Scenario: Group related commits
- **WHEN** multiple commits relate to the same feature or fix
- **THEN** the system groups them into a single logical entry

#### Scenario: Enhance commit messages
- **WHEN** commit messages are terse or unclear
- **THEN** the system generates descriptive summaries based on changes

#### Scenario: Preserve important details
- **WHEN** summarizing activity
- **THEN** the system includes repository name, branch, and PR links when relevant

#### Scenario: Batch processing
- **WHEN** processing many commits
- **THEN** the system processes in batches of 20-50 to avoid API rate limits

### Requirement: History Entry Creation
The system SHALL create properly formatted history entries from GitHub activity.

#### Scenario: One entry per logical unit
- **WHEN** writing history entries
- **THEN** the system creates one entry per semantic grouping (not one per commit)

#### Scenario: Include metadata
- **WHEN** creating entries
- **THEN** each entry includes the date, repository, and GitHub URL

#### Scenario: Date-based file organization
- **WHEN** multiple activities occur on the same date
- **THEN** the system appends to the existing YYYY-MM-DD.md file

#### Scenario: Entry format
- **WHEN** writing an entry
- **THEN** it follows format: "- {semantic summary} ({repo}#PR-number)"

### Requirement: Rate Limiting and Error Handling
The system SHALL handle GitHub API rate limits and errors gracefully.

#### Scenario: Rate limit detection
- **WHEN** approaching GitHub API rate limit
- **THEN** the system displays: "Approaching rate limit (X requests remaining). Slowing down..."

#### Scenario: Rate limit exceeded
- **WHEN** rate limit is exceeded
- **THEN** the system displays: "Rate limit reached. Please try again in X minutes."

#### Scenario: Network errors
- **WHEN** GitHub API is unreachable
- **THEN** the system retries up to 3 times with exponential backoff

#### Scenario: Partial import success
- **WHEN** some repositories fail to fetch
- **THEN** the system logs warnings but continues with successful fetches

### Requirement: User Feedback
The system SHALL provide clear feedback throughout the import process.

#### Scenario: Activity summary
- **WHEN** import completes
- **THEN** the system displays: "Imported X activities from GitHub (Y commits, Z PRs)"

#### Scenario: No activity found
- **WHEN** no GitHub activity exists for the timeframe
- **THEN** the system displays: "No GitHub activity found for the specified timeframe."

#### Scenario: Entry preview
- **WHEN** entries are created
- **THEN** the system shows a preview of the first 3 entries created

#### Scenario: File locations
- **WHEN** import completes
- **THEN** the system displays: "History entries written to .aissist/history/"
