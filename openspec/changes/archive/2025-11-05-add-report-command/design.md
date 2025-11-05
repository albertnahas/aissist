# Report Command Design

## Overview

The report command aggregates data from multiple aissist sources and generates human-readable accomplishment reports suitable for professional contexts.

## Architecture

### Data Flow

```
User Command (with purpose)
    ↓
Parse Timeframe & Purpose
    ↓
Aggregate Data (Goals, History, Todos, Contexts)
    ↓
Group & Categorize
    ↓
Apply Purpose-Based Formatting
    ↓
Format Sections
    ↓
Generate Markdown
    ↓
Output (stdout or file)
```

### Command Signature

```typescript
report [options] [timeframe]
```

**Options:**
- `--output <file>` - Save to file instead of printing
- `--purpose <type>` - Report purpose (promotion, manager-update, brag-doc, status, general)
- `--context <name>` - Include specific context in report

**Timeframe Examples:**
- `aissist report` - Default to today
- `aissist report week` - Last 7 days
- `aissist report month` - Last 30 days
- `aissist report quarter` - Last 90 days
- `aissist report "last 2 weeks"` - Custom range

**Purpose Examples:**
- `aissist report quarter --purpose promotion` - Quarterly report for promotion case
- `aissist report week --purpose manager-update` - Weekly update for manager
- `aissist report month --purpose brag-doc` - Monthly achievements document
- `aissist report --purpose status` - Daily status update

## Data Aggregation

### Source 1: History Entries
**Location:** `history/YYYY-MM-DD.md`

**Extract:**
- All entries within timeframe
- Associated goals
- Timestamps
- Entry content

**Processing:**
- Filter by date range
- Group by goal if linked
- Preserve chronological order

### Source 2: Goals
**Location:** `goals/*.md`

**Extract:**
- Goals completed within timeframe
- Goal descriptions
- Completion dates
- Associated todos

**Processing:**
- Filter by completion date
- Include goal metadata (priority, deadline met/missed)

### Source 3: Todos (from history)
**Location:** Todos logged to history when completed

**Extract:**
- Completed todos within timeframe
- Goal associations
- Completion timestamps

**Processing:**
- Count completions
- Group by category or goal

### Source 4: Contexts (Optional)
**Location:** `contexts/<name>/YYYY-MM-DD.md`

**Extract:**
- Context-specific entries within timeframe
- Relevant for work/project reports

**Processing:**
- Filter by date and context name
- Summarize key activities

## Report Sections

### Section 1: Header
```markdown
# Accomplishment Report
**Period:** January 1 - January 31, 2024
**Generated:** February 1, 2024
**Storage:** Local Project / Global
```

### Section 2: Executive Summary (Optional, future)
Brief overview of key achievements and metrics.

### Section 3: Key Accomplishments
```markdown
## Key Accomplishments

- Completed authentication module for user management system
- Fixed critical production bug affecting 500+ users
- Led code review for 15 pull requests
- Mentored 2 junior developers on React best practices
```

**Source:** History entries
**Format:** Action-oriented bullet points
**Sorting:** Chronological or by impact

### Section 4: Goals Completed
```markdown
## Goals Completed

### learn-typescript-fundamentals
**Completed:** January 28, 2024
**Deadline:** January 31, 2024 (3 days ahead)

Completed comprehensive TypeScript learning path including handbook, exercises, and practical projects.

### build-user-authentication
**Completed:** January 15, 2024
**Deadline:** January 20, 2024 (5 days ahead)

Built and deployed secure authentication system with JWT tokens, refresh token rotation, and password reset functionality.
```

**Source:** Goals with status: completed
**Format:** Goal name, completion date, description
**Include:** Deadline tracking (ahead/behind schedule)

### Section 5: Skills Developed
```markdown
## Skills Developed

- **TypeScript:** Advanced type system, generics, utility types
- **React Testing Library:** Component testing, mocking, integration tests
- **Authentication:** JWT tokens, OAuth2, session management
```

**Source:** Derived from history entries and goal descriptions
**Format:** Skill name with brief context
**Processing:** Extract technical terms and patterns

### Section 6: Projects & Contributions
```markdown
## Projects & Contributions

### User Authentication System
- Implemented JWT-based authentication
- Added password reset functionality
- Integrated OAuth2 providers
- Wrote comprehensive test suite

### Code Reviews & Mentoring
- Reviewed 15 pull requests
- Mentored 2 junior developers
- Led architecture discussions
```

**Source:** History entries, context logs
**Format:** Project name with bullet points
**Grouping:** By project or theme

### Section 7: Metrics (Optional)
```markdown
## Productivity Metrics

- **Goals Completed:** 5
- **History Entries Logged:** 47
- **Todos Completed:** 32
- **Active Days:** 18/20 working days
```

**Source:** Aggregated counts
**Format:** Simple key-value metrics
**Purpose:** Quantify activity

## Formatting Principles

### Language Style

**DO:**
- Use action verbs (Completed, Implemented, Led, Built)
- Be specific and concrete
- Quantify when possible (numbers, dates, impact)
- Write in past tense
- Use professional but friendly tone

**DON'T:**
- Use technical jargon unnecessarily
- Write vague statements ("worked on stuff")
- Include implementation details (code snippets, file names)
- Use passive voice
- Include failed attempts or abandoned work

### Examples

**Good:**
> "Led authentication module implementation serving 10,000+ users, reducing login time by 40%"

**Bad:**
> "Modified the AuthService.ts file to implement JWT tokens using the jsonwebtoken library"

**Good:**
> "Mentored 2 junior developers on React best practices through code reviews and pair programming sessions"

**Bad:**
> "Helped some people with React stuff when they asked questions"

### Purpose-Based Formatting

The report language and emphasis adapts based on the specified purpose:

#### Purpose: promotion
**Emphasis:** Leadership, impact, career growth
**Language:** Strategic, quantified impact, scope of influence
**Sections Priority:** Goals Completed, Key Accomplishments (leadership), Skills Developed
**Example Transformations:**
- "Fixed bug" → "Resolved critical production issue affecting 1000+ users, demonstrating technical leadership under pressure"
- "Code review" → "Led architecture review process, establishing best practices adopted by team of 10"

#### Purpose: manager-update
**Emphasis:** Business value, deliverables, team collaboration
**Language:** Results-focused, blocker resolution, cross-team work
**Sections Priority:** Key Accomplishments (deliverables), Projects & Contributions, Metrics
**Example Transformations:**
- "Implemented feature" → "Delivered user authentication feature on schedule, unblocking mobile team sprint"
- "Helped colleague" → "Collaborated with design team to resolve integration blockers, accelerating release timeline"

#### Purpose: brag-doc
**Emphasis:** Personal achievements, skills developed, challenges overcome
**Language:** Growth-focused, learning highlights, personal wins
**Sections Priority:** Skills Developed, Key Accomplishments (personal), Goals Completed
**Example Transformations:**
- "Learned TypeScript" → "Mastered TypeScript fundamentals through hands-on project work, now mentoring junior developers"
- "Fixed issue" → "Debugged complex race condition independently, expanding debugging toolkit and problem-solving skills"

#### Purpose: status
**Emphasis:** Concise updates, completed/in-progress items
**Language:** Brief bullet points, action-oriented, blockers
**Sections Priority:** Key Accomplishments (today only), minimal formatting
**Example Transformations:**
- Use only bullet points, no elaboration
- "Completed X, Y, Z" format
- Include "Blocked on:" or "Next:" sections

#### Purpose: general (default)
**Emphasis:** Balanced, multi-purpose
**Language:** Professional, suitable for various audiences
**Sections Priority:** All sections with equal weight
**Example Transformations:**
- Balanced between technical and non-technical
- Moderate detail level
- Suitable for self-review, sharing with peers, or general documentation

## Technical Implementation

### Core Types

```typescript
type ReportPurpose = 'promotion' | 'manager-update' | 'brag-doc' | 'status' | 'general';

interface ReportOptions {
  timeframe?: string;
  output?: string;
  purpose?: ReportPurpose;
  context?: string;
}

interface ReportData {
  period: { start: Date; end: Date };
  goals: CompletedGoal[];
  history: HistoryEntry[];
  todos: CompletedTodo[];
  contexts?: ContextEntry[];
}

interface ReportSection {
  title: string;
  content: string;
  priority: number;
}

interface Report {
  header: string;
  sections: ReportSection[];
  footer?: string;
}
```

### Key Functions

```typescript
// Parse timeframe into date range
function parseTimeframe(input: string): { start: Date; end: Date }

// Aggregate data from all sources
async function aggregateReportData(
  storagePath: string,
  dateRange: { start: Date; end: Date },
  options: ReportOptions
): Promise<ReportData>

// Generate report sections
function buildReport(data: ReportData, options: ReportOptions): Report

// Format to markdown
function formatReportMarkdown(report: Report): string

// Main command handler
async function reportCommand(
  timeframe?: string,
  options?: ReportOptions
): Promise<void>
```

### Utility Functions to Reuse

- `parseNaturalDate()` - Already exists for date parsing
- `readMarkdown()` - Read markdown files
- `getStoragePath()` - Resolve storage location
- `getActiveGoals()` - Load goals (extend for completed)
- `formatDateRange()` - Format date ranges

### New Utility Functions Needed

```typescript
// Extract action items from history entries
function extractAccomplishments(entries: HistoryEntry[]): string[]

// Group entries by project/theme
function groupByProject(entries: HistoryEntry[]): Map<string, HistoryEntry[]>

// Extract skills from text
function extractSkills(text: string): string[]

// Calculate productivity metrics
function calculateMetrics(data: ReportData): Metrics

// Apply purpose-based formatting transformations
function applyPurposeFormatting(
  text: string,
  purpose: ReportPurpose,
  context: 'accomplishment' | 'goal' | 'skill'
): string

// Get section priority based on purpose
function getSectionPriority(purpose: ReportPurpose): {
  accomplishments: number;
  goals: number;
  skills: number;
  projects: number;
  metrics: number;
}
```

## Output Options

### Option 1: stdout (Default)
Print formatted markdown to terminal for copy/paste.

**Use Case:** Quick sharing, one-time reports

### Option 2: File Output
Save to specified file path.

**Use Case:** Archiving, version control, multiple formats

```bash
aissist report month --output ~/Documents/report-jan-2024.md
```

### Option 3: Future - PDF/HTML
Generate polished PDF or HTML report.

**Use Case:** Executive presentations, formal submissions

## Error Handling

### No Data Found
```
No activity found for the specified timeframe.
Try logging some history first with: aissist history log
```

### Invalid Timeframe
```
Invalid timeframe: "xyz"
Valid formats: today, week, month, quarter, or dates like "2024-01-01"
```

### Storage Not Initialized
```
Aissist storage not initialized.
Run: aissist init (local) or aissist init --global
```

## Testing Strategy

### Unit Tests
- Date range parsing
- Data aggregation from markdown
- Section formatting
- Accomplishment extraction

### Integration Tests
- End-to-end report generation
- Multiple timeframes
- Different storage states
- Edge cases (empty data, large datasets)

### Manual Testing
- Generate reports for different timeframes
- Verify markdown formatting
- Check professional language quality
- Test with real user data

## Future Enhancements

### Phase 2: AI-Powered Summaries
- Use Claude API to generate executive summaries
- Auto-categorize accomplishments
- Suggest impact statements

### Phase 3: Templates
- Custom report templates
- Organization-specific formats
- Configurable sections

### Phase 4: Rich Formats
- PDF export with styling
- HTML with charts
- Interactive web reports

### Phase 5: Collaboration
- Compare reports across team members
- Aggregate team reports
- Manager view of direct reports

## Risks & Considerations

### Data Quality
**Risk:** Reports depend on consistent logging
**Mitigation:** Remind users to log regularly, provide examples

### Formatting Consistency
**Risk:** Different data types may produce inconsistent sections
**Mitigation:** Strict formatting templates, fallback to sensible defaults

### Performance
**Risk:** Large date ranges may slow generation
**Mitigation:** Limit default ranges, add pagination/summarization

### Privacy
**Risk:** Reports may contain sensitive information
**Mitigation:** Add warning before sharing, support context filtering

## Success Criteria

1. Reports generate in < 5 seconds for typical timeframes
2. Format requires minimal editing before sharing
3. Language is professional and non-technical
4. Users report increased efficiency in creating status updates
5. Zero user complaints about formatting or content organization
