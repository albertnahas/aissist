# report-command Specification

## Purpose

Provide users with a way to generate professional, human-readable accomplishment reports from their aissist data for various purposes including brag documents, promotion cases, manager updates, and status reports.

This is implemented as a **slash-command-only** feature (`/aissist:report`) where Claude orchestrates the report generation by directly reading and analyzing aissist data files. There is no standalone CLI command - Claude handles timeframe parsing, data aggregation, language transformation, and formatting based on the specified purpose.
## Requirements
### Requirement: Command Interface

The report command MUST be accessible as a Claude Code slash command where Claude orchestrates report generation directly.

**Slash Command:**
```
/aissist:report [timeframe] [options]
```

**Implementation:**
Claude directly reads and analyzes aissist data files (no CLI command). Uses `aissist path` to locate storage, then reads markdown files directly.

**Parameters:**
- `timeframe` (optional) - Natural language timeframe, defaults to "today"
- `--output <file>` (optional) - Save to file path
- `--context <name>` (optional) - Include specific context
- `--purpose <type>` (optional) - Report purpose (promotion, manager-update, brag-doc, status), defaults to "general"

**Note:** This is a slash-command-only feature. There is NO `aissist report` CLI command. Claude orchestrates all report generation by reading data files, parsing timeframes, aggregating data, and formatting output.

**MUST:**
- Accept timeframe as positional argument or via --from flag
- Support natural language timeframes (today, week, month, quarter)
- Support ISO date strings and date ranges
- Default to "today" if no timeframe specified
- Allow optional file output via --output flag
- Accept purpose parameter (promotion, manager-update, brag-doc, status, general)
- Default purpose to "general" if not specified
- Adjust language and tone based on purpose
- Validate timeframe before processing
- Show help with --help flag

#### Scenario: Generate today's report
WHEN using `/report` without timeframe
THEN invoke CLI and generate report for current day

#### Scenario: Generate weekly report
WHEN using `/report week`
THEN invoke CLI and generate report for last 7 days

#### Scenario: Generate monthly report
WHEN using `/report month`
THEN invoke CLI and generate report for last 30 days

#### Scenario: Generate custom range report
WHEN using `/report "last 2 weeks"`
THEN invoke CLI and generate report for last 14 days

#### Scenario: Save report to file
WHEN using `/report --output report.md`
THEN invoke CLI to generate and save report to file

#### Scenario: Generate quarterly report with file output
WHEN using `/report quarter --output Q1-2024.md`
THEN invoke CLI to generate 90-day report and save to file

#### Scenario: Handle invalid timeframe
WHEN using `/report invalid`
THEN CLI shows error message with valid format examples

#### Scenario: Generate promotion report
WHEN using `/report quarter --purpose promotion`
THEN invoke CLI to format with leadership emphasis and impact metrics

#### Scenario: Generate manager update
WHEN using `/report week --purpose manager-update`
THEN invoke CLI to format with business value and team collaboration focus

#### Scenario: Generate brag document
WHEN using `/report month --purpose brag-doc`
THEN invoke CLI to format with personal achievements and growth highlights

#### Scenario: Generate status report
WHEN using `/report --purpose status`
THEN invoke CLI to format with concise bullet points for daily standup

#### Scenario: Default general purpose
WHEN using `/report` without --purpose
THEN invoke CLI with general-purpose formatting

---

### Requirement: Data Aggregation

The report command MUST aggregate data from multiple sources.

**Data Sources:**
1. History entries (`history/YYYY-MM-DD.md`)
2. Completed goals (`goals/*.md` with status: completed)
3. Completed todos (from history)
4. Context logs (if --context specified)

**MUST:**
- Read all history files within date range
- Parse goal completion dates and filter by timeframe
- Extract completed todos from history
- Group entries by goal when linked
- Handle missing or empty files gracefully
- Respect storage location (global vs local)

#### Scenario: Aggregate all available data
WHEN all data sources have entries within timeframe
THEN aggregate from history, goals, todos, contexts

#### Scenario: Handle partial data
WHEN some data sources are empty
THEN aggregate only from available sources

#### Scenario: Handle uninitialized storage
WHEN storage is not initialized
THEN show error message prompting to run init

#### Scenario: Aggregate across date range
WHEN multiple history files exist in timeframe
THEN read and aggregate all matching files

#### Scenario: Filter goals by completion date
WHEN filtering completed goals
THEN only include goals completed within timeframe

#### Scenario: Extract goal-linked entries
WHEN history entries are linked to goals
THEN group entries by their associated goal

#### Scenario: Handle malformed markdown
WHEN markdown files contain invalid syntax
THEN skip invalid entries and continue processing

---

### Requirement: Report Formatting

The report command MUST generate human-readable, professionally formatted markdown.

**Sections:**
1. Header (period, generated date)
2. Key Accomplishments (from history)
3. Goals Completed (from goals)
4. Skills Developed (derived from content)
5. Projects & Contributions (grouped entries)
6. Metrics (counts and statistics)

**MUST:**
- Use clear markdown headings
- Format dates consistently (YYYY-MM-DD or "Month Day, Year")
- Use bullet points for lists
- Use bold for emphasis
- Write in past tense
- Use action verbs
- Avoid technical jargon
- Group related items logically

#### Scenario: Generate complete report
WHEN all sections have data
THEN include header, accomplishments, goals, skills, projects, metrics

#### Scenario: Omit empty sections
WHEN some sections have no data
THEN omit those sections from output

#### Scenario: Format goal completions with deadline tracking
WHEN goals have deadlines
THEN show whether completed ahead/behind schedule

#### Scenario: Format accomplishments with action verbs
WHEN formatting history entries
THEN start bullets with action verbs (Completed, Led, Built)

#### Scenario: Extract skills from content
WHEN parsing history and goal descriptions
THEN identify and list technical skills developed

#### Scenario: Group entries by project
WHEN history entries relate to projects
THEN group and organize by project/theme

#### Scenario: Calculate accurate metrics
WHEN generating metrics section
THEN count goals, todos, entries correctly with percentages

#### Scenario: Handle large datasets
WHEN timeframe includes many entries (100+)
THEN format efficiently without truncation

#### Scenario: Handle special markdown characters
WHEN content includes special characters
THEN escape properly to maintain valid markdown

---

### Requirement: Professional Language

The report command MUST use professional, non-technical language.

**Language Rules:**
- Start bullets with action verbs (Completed, Led, Built, Implemented)
- Be specific and concrete
- Quantify when possible (numbers, dates, impact)
- Write in past tense
- Avoid passive voice
- Remove technical implementation details
- Use friendly but professional tone

**MUST:**
- Transform technical logs into professional statements
- Preserve key details while removing code references
- Use industry-standard terminology when appropriate
- Maintain consistent tone across all sections

#### Scenario: Transform technical bug fixes
WHEN entry says "Fixed bug in AuthService.ts"
THEN output "Resolved authentication issue affecting user login"

#### Scenario: Transform pull request references
WHEN entry says "Merged PR #123"
THEN output "Completed code review and integration of feature X"

#### Scenario: Flag vague entries
WHEN entry says "Worked on stuff"
THEN flag as vague and suggest more specific description

#### Scenario: Transform technical commands
WHEN entry says "npm install react"
THEN output "Integrated React framework into project"

#### Scenario: Preserve professional language
WHEN entry says "Led team of 5 developers"
THEN keep as-is (already professional)

#### Scenario: Transform domain jargon
WHEN entry includes context-specific jargon
THEN replace with industry-standard terminology

---

### Requirement: Purpose-Based Formatting

The report command MUST adjust language and tone based on the specified purpose.

**Purpose Types:**
- **promotion**: Emphasize leadership, impact, and career growth
- **manager-update**: Focus on business value and team collaboration
- **brag-doc**: Highlight personal achievements and skills developed
- **status**: Concise bullet points for quick updates
- **general** (default): Balanced professional format

**MUST:**
- Accept --purpose parameter with valid purpose types
- Adjust section emphasis based on purpose
- Modify language tone to match purpose context
- Maintain professional standards across all purposes
- Default to "general" when purpose not specified
- Validate purpose parameter and show error for invalid values

#### Scenario: Promotion format emphasizes leadership
WHEN purpose is "promotion"
THEN highlight leadership actions, team impact, strategic contributions

#### Scenario: Manager update focuses on business value
WHEN purpose is "manager-update"
THEN emphasize deliverables, blockers resolved, team collaboration

#### Scenario: Brag doc highlights personal growth
WHEN purpose is "brag-doc"
THEN focus on skills developed, challenges overcome, personal wins

#### Scenario: Status report is concise
WHEN purpose is "status"
THEN use brief bullet points, focus on completed/in-progress items

#### Scenario: General format is balanced
WHEN purpose is "general" or not specified
THEN use balanced tone suitable for multiple audiences

#### Scenario: Invalid purpose shows error
WHEN purpose is not in valid list
THEN show error with valid purpose options

---

### Requirement: Timeframe Parsing

The report command MUST parse natural language timeframes.

**Supported Formats:**
- Keywords: today, yesterday, week, month, quarter, year
- Relative: "last X days/weeks/months"
- Specific: ISO dates (YYYY-MM-DD)
- Ranges: "2024-01-01 to 2024-01-31"

**MUST:**
- Reuse existing `parseNaturalDate()` utility
- Return start and end dates
- Handle timezone correctly (use local timezone)
- Validate date ranges (end >= start)
- Show clear error for invalid formats

#### Scenario: Parse today keyword
WHEN parsing "today"
THEN return 00:00:00 to 23:59:59 of current day

#### Scenario: Parse week keyword
WHEN parsing "week"
THEN return last 7 days date range

#### Scenario: Parse month keyword
WHEN parsing "month"
THEN return last 30 days date range

#### Scenario: Parse quarter keyword
WHEN parsing "quarter"
THEN return last 90 days date range

#### Scenario: Parse ISO date
WHEN parsing "2024-01-15"
THEN return single day range for that date

#### Scenario: Parse relative timeframe
WHEN parsing "last 2 weeks"
THEN return 14 days ago to today

#### Scenario: Handle invalid format
WHEN parsing invalid format
THEN show error with valid format examples

---

### Requirement: Output Options

The report command MUST support multiple output destinations.

**Modes:**
1. stdout (default) - Print to terminal
2. File - Save to specified path

**MUST:**
- Print to stdout by default for easy copy/paste
- Write to file when --output specified
- Create parent directories if needed
- Overwrite existing files with confirmation
- Show success message with file path
- Preserve markdown formatting in both modes

#### Scenario: Print to stdout
WHEN --output not specified
THEN print formatted report to terminal

#### Scenario: Save to file
WHEN --output report.md specified
THEN write report to file successfully

#### Scenario: Create parent directories
WHEN --output path/to/new/dir/report.md specified
THEN create parent directories and save file

#### Scenario: Overwrite confirmation
WHEN saving to existing file
THEN prompt for confirmation before overwriting

#### Scenario: Handle write errors
WHEN saving to read-only location
THEN show permission denied error

#### Scenario: Show success message
WHEN file saved successfully
THEN show message with file path

---

### Requirement: Empty Data Handling

The report command MUST handle cases with no data gracefully.

**MUST:**
- Show helpful message when no history entries found
- Show helpful message when no goals completed
- Suggest logging actions or adjusting timeframe
- Still generate report with available data
- Include all sections, mark empty ones as "None" or omit them

#### Scenario: No history entries
WHEN no history entries exist
THEN show message suggesting to log activities

#### Scenario: No completed goals
WHEN no goals completed in timeframe
THEN omit goals section from report

#### Scenario: No data at all
WHEN no data exists in any source
THEN show comprehensive help message with setup suggestions

#### Scenario: Partial data available
WHEN only some data sources have entries
THEN generate report with available sections only

#### Scenario: Uninitialized storage
WHEN storage not initialized
THEN show error suggesting to run aissist init

---

### Requirement: Error Handling

The report command MUST handle errors gracefully with helpful messages.

**Error Types:**
- Storage not initialized
- Invalid timeframe format
- File write permission errors
- Malformed markdown files
- No data found

**MUST:**
- Show clear error messages
- Suggest corrective actions
- Provide examples when applicable
- Exit with appropriate status codes
- Log errors for debugging (not user-facing)

#### Scenario: Storage not initialized
WHEN storage not found
THEN show "Run: aissist init" error message

#### Scenario: Invalid timeframe format
WHEN timeframe format invalid
THEN show "Valid formats: today, week, month..." with examples

#### Scenario: File write permission error
WHEN cannot write to output file
THEN show "Cannot write to [path]: permission denied"

#### Scenario: Malformed markdown file
WHEN markdown file has syntax errors
THEN skip invalid entry, log warning, continue processing

#### Scenario: Network failure
WHEN future AI features fail due to network
THEN gracefully degrade to basic formatting

---

### Requirement: Performance

The report command MUST generate reports efficiently.

**MUST:**
- Complete in under 5 seconds for typical timeframes (30 days)
- Stream large files instead of loading entirely
- Limit processing to specified date range
- Cache parsed data when multiple reads needed
- Show spinner during long operations

#### Scenario: Fast daily report
WHEN generating 1-day report
THEN complete in under 1 second

#### Scenario: Fast monthly report
WHEN generating 30-day report
THEN complete in under 3 seconds

#### Scenario: Reasonable yearly report
WHEN generating 365-day report
THEN complete in under 10 seconds

#### Scenario: Handle large datasets
WHEN processing 1000+ history entries
THEN stream data without memory issues

#### Scenario: Show progress indicator
WHEN operation takes over 1 second
THEN display spinner with progress message

---

### Requirement: Integration with Slash Command

The report command MUST be accessible via Claude Code slash command.

**MUST:**
- Create slash command file: `aissist-plugin/commands/report.md`
- Follow Claude Code slash command standards
- Include YAML frontmatter with `allowed-tools: Bash(aissist:*)`
- Use `!` prefix with backticks to execute `aissist report` and capture output
- Use `$ARGUMENTS` variable to forward all parameters to CLI
- Include short description in frontmatter
- Include argument-hint in frontmatter
- Add prompt instructing Claude to present the report

**Slash Command Components:**
- YAML frontmatter with allowed-tools, description, argument-hint
- Bash execution section with `!` prefix
- Task prompt for Claude to format and present report

#### Scenario: Valid slash command file
WHEN slash command file created
THEN file exists at aissist-plugin/commands/report.md with valid YAML frontmatter

#### Scenario: CLI tool permission
WHEN allowed-tools specified
THEN includes `Bash(aissist:*)` to permit aissist CLI invocation

#### Scenario: Bash execution with output
WHEN using `!` prefix
THEN bash command executes and output is included in context

#### Scenario: Parameter forwarding
WHEN using `$ARGUMENTS`
THEN all slash command parameters are passed to CLI

#### Scenario: Short description
WHEN description written
THEN description is under 60 characters and clear

#### Scenario: Argument hint provided
WHEN argument-hint specified
THEN shows expected parameter format for user guidance

---

