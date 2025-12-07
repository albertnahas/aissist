# Aissist
![alt text](image.png)

**Connect your past, present, and future—all in Markdown.**

Aissist is a local-first, AI-powered CLI personal assistant that helps you track what you've done, manage what you're doing, and plan where you're going. Everything lives in human-readable Markdown files on your machine, with seamless Claude Code integration for AI-powered insights.

![alt text](demo.gif)

## Features

- **Claude Code Integration**: Seamlessly works with Claude Code for AI-powered recall, proposals, and semantic search
- **Connect Your Timeline**: Track your past (history), manage your present (todos), and plan your future (goals)—all interconnected
- **Local-First & Markdown**: All data stored in human-readable Markdown files on your machine
- **Dual Storage**: Global (~/.aissist/) and project-specific (./.aissist/) modes
- **Goal Tracking**: Log and review your goals with AI-generated codenames
- **Todo Management**: Track daily tasks with checkbox UI and automatic history logging
- **History Logging**: Track daily activities and events, creating a searchable timeline
- **Context Management**: Organize information by context (work, diet, fitness, etc.)
- **Guided Reflection**: Interactive prompts for structured self-reflection
- **AI-Powered Planning**: Generate action proposals based on your goals and history
- **Git-Compatible**: All data in Markdown, perfect for version control
- **Completion Animations**: Subtle, satisfying terminal animations when you complete tasks

## Installation

```bash
npm install -g aissist
```

Or use with npx without installation:

```bash
npx aissist init
```

## Quick Start

1. **Install and initialize**:

```bash
npm install -g aissist

# For project-specific storage (./.aissist/)
aissist init

# For global storage (~/.aissist/)
aissist init --global
```

2. **Set up Claude Code integration** (recommended):

```bash
# Install Claude Code if you haven't already
# https://claude.ai/download

# Login to enable AI features
claude login
```

3. **Track your goals**:

```bash
aissist goal add "Learn TypeScript"
aissist goal list
```

4. **Log your activities**:

```bash
aissist history log "Completed code review for PR #123"
aissist history show
```

5. **Get AI-powered insights**:

```bash
# Search your history semantically
aissist recall "what did I learn about TypeScript?"

# Generate action proposals
aissist propose "this week"

# Get immediate next action
aissist propose now
```

6. **Reflect and organize**:

```bash
# Guided reflection
aissist reflect

# Context-specific notes
aissist context log work "Sprint planning notes..."
```

## Commands

### `aissist init`

Initialize aissist storage structure.

**Options:**
- `-g, --global` - Initialize global storage in ~/.aissist/
- `-d, --description <text>` - Set instance description (Northstar) non-interactively

**Interactive Prompts:**
When initializing, you'll be asked to provide an optional one-line description of what this aissist instance is for (e.g., "Sprint tracking for Project Apollo"). This is saved as `DESCRIPTION.md` and helps contextualize your goals and history.

**Examples:**
```bash
aissist init              # Create ./.aissist/ in current directory (prompts for description)
aissist init --global     # Create ~/.aissist/ for global use
aissist init --description "Personal productivity tracking"  # Skip prompt, set description directly
```

### `aissist goal`

Manage your goals with AI-generated codenames, deadlines, and interactive management.

**Features:**
- **Auto-generated Codenames**: Each goal gets a unique, memorable kebab-case identifier (e.g., "complete-project-proposal")
- **Interactive List**: Select goals and perform actions (complete, delete, set deadline)
- **Completion Tracking**: Completed goals moved to `finished/` with completion dates
- **Deadline Management**: Set and track deadlines for time-sensitive goals
- **Backward Compatible**: Legacy goals without codenames continue to work

**Subcommands:**
- `add <text> [--deadline <date>] [--parent <codename>]` - Add a new goal with interactive deadline prompt
- `list [--date <date>] [--plain]` - List goals (interactive mode by default)
- `show <codename>` - Show goal details including progress notes
- `complete <codename>` - Mark a goal as completed
- `remove <codename>` - Remove a goal
- `deadline <codename> <date>` - Set or update a goal's deadline
- `progress <codename> <note>` - Add a progress note to a goal

**Interactive Deadline Prompt:**
When adding a goal, you'll be prompted to set a deadline with natural language support:
- **Default**: Press Enter to use "Tomorrow" as the deadline
- **Natural Language**: Enter "next week", "this month", "next 7 days", etc.
- **ISO Date**: Enter specific dates like "2025-12-31"
- **Skip**: Enter an empty string or "skip" to add goal without deadline
- **Flag**: Use `-d` flag to skip the prompt and set deadline directly

**Examples:**
```bash
# Add goals with interactive deadline prompt
aissist goal add "Complete project proposal"
# → Prompts for deadline (default: Tomorrow)
# → Accept default, enter "next week", or skip

# Add goal with deadline flag (no prompt)
aissist goal add "Launch MVP" --deadline 2025-11-15

# List all active goals (interactive mode)
aissist goal list

# List all active goals (plain text)
aissist goal list --plain

# Filter goals by deadline
aissist goal list --deadline 2025-12-01
aissist goal list --deadline "next week"

# Direct commands
aissist goal complete complete-project-proposal
aissist goal deadline launch-mvp 2025-12-01
aissist goal remove launch-mvp

# Link child goal to parent goal (for hierarchical workflows)
aissist goal add "Implement API endpoint" --parent launch-mvp

# Add progress notes to track incremental work
aissist goal progress launch-mvp "Completed user flow design"
aissist goal progress launch-mvp "API endpoints 50% done"

# View goal details including progress notes
aissist goal show launch-mvp

# Natural language deadline examples
aissist goal add "Quarterly review"        # Then enter: this quarter
aissist goal add "Weekly team sync"        # Then enter: next week
aissist goal add "Monthly report"          # Then enter: 2026 Q1
```

**Goal Format:**
Goals are stored with YAML front matter containing codenames and metadata:
```markdown
---
schema_version: "1.0"
timestamp: "14:30"
codename: complete-project-proposal
parent_goal: launch-mvp
deadline: "2025-11-15"
---

Complete project proposal
```

**Completed Goals:**
Finished goals are stored in `goals/finished/` with completion dates:
```markdown
---
schema_version: "1.0"
timestamp: "14:30"
codename: complete-project-proposal
deadline: "2025-11-15"
completed: "2025-11-10"
---

Complete project proposal
```

### `aissist history`

Track daily activities and events with support for retroactive logging.

**Subcommands:**
- `log <text> [--date <date>]` - Log a history entry (supports retroactive dates)
- `show [--date <date>]` - Show all history entries (or specific date)

**Examples:**
```bash
# Log to today (default)
aissist history log "Fixed bug in authentication flow"

# Log to a past date (ISO format)
aissist history log "Completed design review" --date 2025-11-05

# Log to a past date (natural language)
aissist history log "Team standup" --date yesterday
aissist history log "Sprint planning" --date "last Monday"

# Show all history entries
aissist history show

# View history since specific date
aissist history show --date 2025-01-01
aissist history show --date "last week"
aissist history show --date "last month"
```

![Developer Progress Tracking](demos/demo-1-progress.gif)

### `aissist todo`

Manage small, actionable tasks with optional goal linkage. Completed todos are automatically logged to history.

**Features:**
- **Quick Task Capture**: Add todos with minimal friction
- **Interactive Completion**: Checkbox UI for batch completion
- **Auto History Logging**: Completed todos logged to history with timestamp
- **Goal Linking**: Link todos to goals via keyword matching or interactive selection
- **Date-Specific**: Organize todos by date

**Subcommands:**
- `add <text> [--goal [keyword]] [--date <date>]` - Add a new todo
- `list [--date <date>] [--plain] [--goal <codename>]` - List todos (interactive by default)
- `done <indexOrText>` - Mark a todo as complete and log to history
- `remove <indexOrText>` - Remove a todo without logging to history
- `edit <indexOrText>` - Edit a todo's text

**Examples:**
```bash
# Add simple todos
aissist todo add "Review PR #123"
aissist todo add "Write documentation"

# Add todo with goal linking
aissist todo add "Fix login bug" --goal "auth"
aissist todo add "Update README" --goal  # Prompts for goal selection

# Add todo for specific date
aissist todo add "Call dentist" --date 2025-11-05

# List todos (interactive checkbox UI)
aissist todo list

# List in plain text mode
aissist todo list --plain

# Filter by goal
aissist todo list --goal complete-mvp

# Mark todos as complete (by index or text)
aissist todo done 1
aissist todo done "Review PR"

# Edit todo
aissist todo edit 2

# Remove todo
aissist todo remove 3
```

**Todo Format:**
Todos are stored with YAML front matter in checkbox format:
```markdown
---
schema_version: "1.0"
timestamp: "14:30"
---

- [ ] Review PR #123

---
schema_version: "1.0"
timestamp: "14:32"
goal: complete-mvp
---

- [ ] Write documentation
```

When completed, todos are marked with `[x]` and logged to history:
```markdown
---
schema_version: "1.0"
timestamp: "16:45"
goal: complete-mvp
---

Review PR #123

Completed from TODO
```

![Goal & Todo Management](demos/demo-3-todos.gif)

### `aissist context`

Manage context-specific information with support for retroactive logging.

**Subcommands:**
- `log <context> <input> [--date <date>]` - Log text or file to a context (supports retroactive dates)
- `list` - List all contexts
- `show <context> [--date <date>]` - Show entries for a context
- `ingest <context> <directory>` - Bulk ingest files from directory

**Examples:**
```bash
# Log to today (default)
aissist context log work "Sprint planning meeting notes"
aissist context log diet ./meal-plan.txt

# Log to a past date (ISO format)
aissist context log work "Design review notes" --date 2025-11-05

# Log to a past date (natural language)
aissist context log fitness "Morning run" --date yesterday
aissist context log diet ./old-meal-plan.txt --date "last Monday"

# Other commands
aissist context list
aissist context show work
aissist context ingest work ./project-docs
```

### `aissist reflect`

Guided reflection session with interactive prompts.

**Subcommands:**
- (default) - Start reflection session
- `show [--date <date>]` - View past reflections

**Examples:**
```bash
aissist reflect           # Start new reflection
aissist reflect show      # View today's reflections
aissist reflect show --date 2024-01-15
```

### `aissist propose`

Generate AI-powered action proposals based on your goals, history, and reflections using Claude Code.

**Arguments:**
- `[timeframe]` - Timeframe for proposals (default: "today")
  - Examples: "today", "this week", "next quarter", "2026 Q1"
  - When using `--goal` without explicit timeframe, automatically uses goal deadline or comprehensive planning

**Options:**
- `--reflect` - Prompt for a quick reflection before generating proposals
- `--debug` - Display debug information (prompt, data summary)
- `--context` - Include context files in the analysis
- `--tag <tag>` - Filter by specific tag (e.g., "work", "fitness")
- `-g, --goal [keyword]` - Focus proposals on a specific goal (optional keyword for matching). Without explicit timeframe, uses goal deadline or comprehensive planning.
- `--raw` - Output raw Markdown without terminal formatting (for piping or AI consumption)

**How it works:**
- Analyzes your goals, history, todos, and reflections from the past 30 days
- Uses Claude Code to generate contextual action proposals
- When `--goal` is used without timeframe: automatically plans based on goal deadline or uses comprehensive strategic planning
- Offers to save proposals as todos, goals, or markdown
- Output is beautifully formatted for terminal viewing by default

**Examples:**
```bash
# Generate proposals for today
aissist propose

# Generate proposals for a specific timeframe
aissist propose "this week"
aissist propose "next quarter"
aissist propose "2026 Q1"

# Goal-focused proposals with smart timeframe
aissist propose --goal "launch-mvp"  # Uses goal deadline or comprehensive planning

# Goal-focused proposals for specific timeframe
aissist propose "this week" --goal "launch-mvp"  # Combine explicit timeframe + goal focus

# Include a quick reflection before proposing
aissist propose --reflect

# Filter by tag
aissist propose --tag work

# Raw output for AI agents or piping
aissist propose --raw > proposals.md
```

**Note:** Requires Claude Code CLI to be installed and authenticated.

### `aissist recall`

AI-powered semantic search across all your memories using Claude Code's file analysis capabilities.

**Arguments:**
- `<query>` - Your search question (natural language)

**Options:**
- `--raw` - Output raw Markdown without terminal formatting (for piping or AI consumption)

**How it works:**
- Claude Code uses Grep, Read, and Glob tools to semantically analyze your memory files
- Finds related concepts, not just keyword matches (e.g., searching "productivity" also finds "efficiency", "time management")
- No timeout issues - handles large memory collections efficiently
- Falls back to keyword search if Claude Code is unavailable
- Output is beautifully formatted for terminal viewing by default

**Examples:**
```bash
# Semantic queries - finds related concepts
aissist recall "what did I learn about React hooks?"
aissist recall "fitness goals from last week"
aissist recall "work accomplishments this month"

# Complex queries
aissist recall "compare my goals from last week to this week"
aissist recall "what are my thoughts on productivity?"

# Raw output for piping or AI agents
aissist recall "my TypeScript learning" --raw | pbcopy
```

**Note:** Requires Claude Code CLI to be installed and authenticated. Falls back to keyword-based search if Claude Code is unavailable.

![Semantic Memory Search](demos/demo-2-memory.gif)

### `aissist path`

Show the current storage path and whether it's global or local.

**Example:**
```bash
aissist path

# Show read hierarchy (if enabled)
aissist path --hierarchy
```

### `aissist sync`

Synchronize progress between parent and child `.aissist` directories. This command enables hierarchical goal tracking across monorepos and nested projects.

**Features:**
- **Progress File**: Maintains `progress.json` with goal status, progress notes, and timestamps
- **Child Discovery**: Recursively finds child `.aissist` directories
- **Parent-Child Linking**: Child goals can reference parent goals via `parent_goal` field
- **Aggregation**: Parents aggregate progress data from all child instances

**Options:**
- `-v, --verbose` - Show detailed output including child directories and linked goals

**How it works:**
1. Updates local `progress.json` with current goal status
2. Discovers child `.aissist` directories in subdirectories
3. Aggregates progress from children into parent's `progress.json`
4. Calculates linked goals (child goals that reference parent goals)

**Examples:**
```bash
# Basic sync - update progress.json and aggregate children
aissist sync

# Verbose output - show all discovered children and linked goals
aissist sync --verbose
```

**Progress File Format (`progress.json`):**
```json
{
  "schema_version": "1.0",
  "instance_path": "/path/to/.aissist",
  "description": "Project description",
  "last_updated": "2025-12-07T10:30:00Z",
  "goals": {
    "goal-codename": {
      "text": "Goal description",
      "status": "active",
      "deadline": "2025-12-15",
      "parent_goal": "parent-codename",
      "completed_at": null,
      "progress_notes": [
        { "timestamp": "2025-12-05T14:00:00Z", "text": "Started work" }
      ]
    }
  },
  "children": {
    "subproject/.aissist": {
      "instance_path": "/path/to/subproject/.aissist",
      "description": "Subproject description",
      "last_updated": "2025-12-07T09:00:00Z",
      "goals": { ... }
    }
  }
}
```

**Configuration:**
Configure sync behavior in `config.json`:
```json
{
  "sync": {
    "maxDepth": 5,
    "exclude": ["custom-ignored-dir"]
  }
}
```

**Use Cases:**
- **Monorepo workflows**: Track progress across multiple packages
- **Goal decomposition**: Break parent goals into child goals in subdirectories
- **Team visibility**: Aggregate progress from team member directories

### `aissist config hierarchy`

Manage hierarchical configuration for reading from parent directories.

**Commands:**
```bash
# Show current hierarchy status
aissist config hierarchy status

# Enable hierarchical read access
aissist config hierarchy enable

# Disable hierarchical read access
aissist config hierarchy disable
```

### `aissist config update-check`

Manage automatic version update checks.

By default, Aissist automatically checks for new versions once per day when you run any command. This ensures you're always notified of important updates, bug fixes, and new features.

**Commands:**
```bash
# Show update check status
aissist config update-check

# Enable automatic update checks (default)
aissist config update-check enable

# Disable automatic update checks
aissist config update-check disable
```

**How it works:**
- Checks npm registry for latest version on CLI startup
- Non-blocking: doesn't slow down command execution
- Cached: only checks once per 24 hours to minimize network requests
- Graceful: silently fails if network is unavailable
- Displays update notification after command completes when update is available

## Hierarchical Configuration for Monorepos

Aissist supports hierarchical configuration, allowing you to access goals and data from parent directories while keeping writes isolated to your local directory. This is perfect for monorepos and nested projects.

### How It Works

- **Read from parents**: Access history, goals, and context from parent `.aissist` directories
- **Write locally**: All changes are saved to your local `.aissist` directory only
- **Opt-in**: Enable during initialization or anytime with `aissist config hierarchy enable`

### Use Cases

1. **Monorepo workflows**: Access organization-level goals while working in package subdirectories
2. **Nested projects**: Inherit context from parent projects without polluting them
3. **Team collaboration**: Share goals at the repo level while maintaining personal local notes

### Example Flow

```bash
# Initialize in a subdirectory of a monorepo
cd ~/monorepo/packages/api
aissist init

# Aissist detects parent directories:
# ✓ Detected .aissist directories in parent paths:
#   • ~/monorepo/.aissist (2 levels up)
#   • ~/.aissist (global)
#
# ? Would you like to include these directories for reading? (Y/n)

# Choose yes to enable hierarchy
# Now you can see goals from all levels:
aissist goal list  # Shows goals from local, monorepo, and global

# But writes stay local:
aissist goal add "Build API v2"  # Saved to ~/monorepo/packages/api/.aissist/
```

### Runtime Configuration

Toggle hierarchical access anytime without re-initializing:

```bash
# Enable hierarchy
aissist config hierarchy enable

# Check status
aissist config hierarchy status

# Disable (sandbox mode)
aissist config hierarchy disable
```

## Storage Structure

```
.aissist/                    # or ~/.aissist/ for global
├── config.json              # Configuration
├── DESCRIPTION.md           # Optional instance description (Northstar)
├── progress.json            # Progress file for parent-child sync
├── goals/                   # Goal tracking
│   ├── YYYY-MM-DD.md        # Active goals with codenames
│   └── finished/            # Completed goals archive
│       └── YYYY-MM-DD.md
├── history/                 # Activity logs
│   └── YYYY-MM-DD.md
├── todos/                   # Task management
│   └── YYYY-MM-DD.md        # Daily todos with checkbox format
├── context/                 # Context-specific info
│   ├── work/
│   │   └── YYYY-MM-DD.md
│   ├── diet/
│   │   └── YYYY-MM-DD.md
│   └── [context-name]/
└── reflections/             # Daily reflections
    └── YYYY-MM-DD.md
```

## Configuration

Aissist stores its configuration in `config.json` within your storage directory (`.aissist/` or `~/.aissist/`).

### Configuration Options

#### Animations

Control the completion animations that play when you finish todos or goals.

```json
{
  "animations": {
    "enabled": true
  }
}
```

**Settings:**
- `enabled` (boolean, default: `true`) - Enable or disable completion animations

**To disable animations:**

1. Edit your config file:
   ```bash
   # For local storage
   vim .aissist/config.json

   # For global storage
   vim ~/.aissist/config.json
   ```

2. Set `animations.enabled` to `false`:
   ```json
   {
     "version": "1.0.0",
     "createdAt": "2025-11-04T12:00:00.000Z",
     "lastModified": "2025-11-04T12:00:00.000Z",
     "animations": {
       "enabled": false
     }
   }
   ```

When animations are disabled, completion actions show simple success messages instead of animated feedback.

## Claude AI Integration

To use AI-powered semantic recall, you need Claude Code installed and authenticated:

1. **Install Claude Code:**
   - Download from [https://claude.ai/download](https://claude.ai/download)
   - Or install via package manager (if available)

2. **Authenticate with Claude:**

```bash
claude login
```

3. **Verify installation:**

```bash
claude --version
```

Without Claude Code installed, `aissist recall` will still work but show keyword-based search results instead of semantic analysis.

### Benefits of Claude Code Integration

- **Semantic Understanding**: Finds related concepts, not just keyword matches
- **File Analysis Tools**: Uses Grep, Read, and Glob for intelligent file discovery
- **No Timeout Issues**: Handles large memory collections efficiently
- **No API Key Management**: Uses your existing Claude authentication
- **Seamless Experience**: Same auth as Claude Code
- **No Additional Costs**: Covered by your Claude subscription
- **Tool Restrictions**: Only uses safe, read-only tools (Grep, Read, Glob) for security

### How Semantic Recall Works

When you run `aissist recall "your query"`:

1. **Session Check**: Verifies Claude Code is installed and authenticated
2. **File Analysis**: Claude Code uses tools to search and analyze your memory files:
   - **Grep**: Searches for relevant keywords across all markdown files
   - **Read**: Reads promising files to gather detailed information
   - **Glob**: Finds files by patterns (e.g., goals/2024-*.md)
3. **Semantic Understanding**: Claude interprets your query and finds related concepts
4. **Synthesized Answer**: Provides a comprehensive answer with dates and file references

**Example**: Searching for "productivity" will also find files mentioning "efficiency", "time management", "focus", etc.

### Troubleshooting Claude Code Integration

**"Claude Code not found"**
- Install Claude Code from https://claude.ai/download
- Verify installation: `which claude` (should show path to claude binary)

**"Not authenticated. Run: claude login"**
- Run `claude login` to authenticate
- Follow the prompts to complete authentication

**"Claude Code failed, falling back to keyword search"**
- Check Claude Code is working: `claude -p "test" --allowedTools ''`
- Ensure you have an active Claude subscription
- Check your internet connection

**Recall is slow or timing out**
- This should not happen with the new file analysis approach
- If it does, please report as an issue with details about your memory size

## Local vs Global Storage

Aissist supports two storage modes:

- **Local Storage (./.aissist/)**: Project-specific memories. Perfect for work projects, personal projects, etc.
- **Global Storage (~/.aissist/)**: System-wide memories. Good for personal goals, fitness tracking, etc.

Aissist automatically detects local storage by searching up from your current directory. If no `.aissist/` is found, it falls back to global storage.

## Examples

### Daily Workflow

```bash
# Morning
aissist goal add "Finish feature implementation"
aissist goal add "Review team's PRs"

# During the day
aissist history log "Implemented user authentication"
aissist context log work "API design discussion notes"

# Evening
aissist reflect
aissist goal list
```

### Project-Specific Tracking

```bash
cd ~/projects/my-app
aissist init
aissist context log architecture "System design decisions..."
aissist context ingest docs ./documentation
```

### Search and Recall

```bash
# Find specific information
aissist recall "authentication implementation"
aissist recall "what are my fitness goals?"
aissist recall "team meeting notes from last week"
```

## Privacy & Data

- **100% Local**: All data stays on your machine
- **No Tracking**: No analytics or telemetry
- **Human-Readable**: Everything in Markdown format
- **Git-Friendly**: Version control your memories
- **Open Source**: Full transparency

## Requirements

- Node.js >= 20.19.0
- Optional: Claude Code CLI for AI-powered recall features

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/aissist.git
cd aissist

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js init
```

## Claude Code Plugin

Aissist provides a Claude Code plugin for seamless integration with your AI-powered coding workflow.

### Features

- **AI-Enhanced Logging**: Quick work logging with automatic enhancement and goal linking
- **GitHub Integration**: Import commits and PRs as history entries
- **Semantic Recall**: Search your history with natural language
- **Accomplishment Reports**: Generate reports for standups and reviews
- **Skill Integration**: Automatic CLI access when you mention goals or todos

### Installation

```bash
# Install from marketplace
claude plugin marketplace add albertnahas/aissist
claude plugin install aissist
```

### Quick Commands

```
/aissist:log Fixed auth bug, took 3 hours
/aissist:log-github "this week"
/aissist:recall "what did I work on last month?"
/aissist:report "this week" --purpose standup
```

See [aissist-plugin/README.md](./aissist-plugin/README.md) for complete plugin documentation.

## Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.

## License

MIT License - see LICENSE file for details.

## Support

- Issues: [GitHub Issues](https://github.com/yourusername/aissist/issues)
- Documentation: This README
- Claude Code: [Download](https://claude.ai/download)

## Acknowledgments

Built with:
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
- [Ora](https://github.com/sindresorhus/ora) - Spinners
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) - Interactive prompts
- [Anthropic Claude](https://www.anthropic.com/) - AI capabilities
- [Zod](https://github.com/colinhacks/zod) - Schema validation
