# Aissist

A local-first, AI-powered CLI personal assistant for tracking goals, reflections, history, and contextual information. All your data stays on your machine in human-readable Markdown files.

## Features

- **Local-First**: All data stored locally in Markdown files
- **Dual Storage**: Global (~/.aissist/) and project-specific (./.aissist/) modes
- **Goal Tracking**: Log and review your goals with AI-generated codenames
- **Todo Management**: Track daily tasks with checkbox UI and automatic history logging
- **Completion Animations**: Subtle, satisfying terminal animations when you complete tasks and goals
- **History Logging**: Track daily activities and events
- **Context Management**: Organize information by context (work, diet, fitness, etc.)
- **Guided Reflection**: Interactive prompts for structured self-reflection
- **AI-Powered Recall**: Semantic search and summarization using Claude AI
- **Git-Compatible**: All data in Markdown, perfect for version control

## Installation

```bash
npm install -g aissist
```

Or use with npx without installation:

```bash
npx aissist init
```

## Quick Start

1. **Initialize storage**:

```bash
# For project-specific storage (./.aissist/)
aissist init

# For global storage (~/.aissist/)
aissist init --global
```

2. **Track your goals**:

```bash
aissist goal add "Learn TypeScript"
aissist goal list
```

3. **Log your activities**:

```bash
aissist history log "Completed code review for PR #123"
aissist history show
```

4. **Add context-specific information**:

```bash
aissist context log work "Sprint planning notes..."
aissist context log diet "Meal prep for the week"
aissist context list
```

5. **Reflect on your day**:

```bash
aissist reflect
```

6. **Search your memories** (requires Claude Code):

```bash
# First-time setup
claude login

# Then use recall
aissist recall "what did I learn about TypeScript?"
```

## Commands

### `aissist init`

Initialize aissist storage structure.

**Options:**
- `-g, --global` - Initialize global storage in ~/.aissist/

**Examples:**
```bash
aissist init              # Create ./.aissist/ in current directory
aissist init --global     # Create ~/.aissist/ for global use
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
- `add <text> [--deadline <date>]` - Add a new goal with interactive deadline prompt
- `list [--date <date>] [--plain]` - List goals (interactive mode by default)
- `complete <codename>` - Mark a goal as completed
- `remove <codename>` - Remove a goal
- `deadline <codename> <date>` - Set or update a goal's deadline

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

# Interactive list (select goal and choose action)
aissist goal list

# Plain text view (for legacy goals)
aissist goal list --plain

# Direct commands
aissist goal complete complete-project-proposal
aissist goal deadline launch-mvp 2025-12-01
aissist goal remove launch-mvp

# View goals from specific date
aissist goal list --date 2024-01-15

# Natural language deadline examples
aissist goal add "Quarterly review"        # Then enter: this quarter
aissist goal add "Weekly team sync"        # Then enter: next week
aissist goal add "Monthly report"          # Then enter: 2026 Q1
```

**Goal Format:**
Goals are stored with codenames and metadata:
```markdown
## 14:30 - complete-project-proposal

Complete project proposal

Deadline: 2025-11-15
```

**Completed Goals:**
Finished goals are stored in `goals/finished/` with completion dates:
```markdown
## 14:30 - complete-project-proposal

Complete project proposal

Deadline: 2025-11-15

Completed: 2025-11-10
```

### `aissist history`

Track daily activities and events.

**Subcommands:**
- `log <text>` - Log a history entry
- `show [--date <date>]` - Show history for today or specific date

**Examples:**
```bash
aissist history log "Fixed bug in authentication flow"
aissist history show
aissist history show --date 2024-01-15
```

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
Todos are stored in checkbox format:
```markdown
## 14:30

- [ ] Review PR #123

## 14:32

- [ ] Write documentation (Goal: complete-mvp)
```

When completed, todos are marked with `[x]` and logged to history:
```markdown
## 16:45

Review PR #123

Completed from TODO

Goal: complete-mvp
```

### `aissist context`

Manage context-specific information.

**Subcommands:**
- `log <context> <input>` - Log text or file to a context
- `list` - List all contexts
- `show <context> [--date <date>]` - Show entries for a context
- `ingest <context> <directory>` - Bulk ingest files from directory

**Examples:**
```bash
aissist context log work "Sprint planning meeting notes"
aissist context log diet ./meal-plan.txt
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

### `aissist recall`

AI-powered semantic search across all your memories using Claude Code's file analysis capabilities.

**Arguments:**
- `<query>` - Your search question (natural language)

**How it works:**
- Claude Code uses Grep, Read, and Glob tools to semantically analyze your memory files
- Finds related concepts, not just keyword matches (e.g., searching "productivity" also finds "efficiency", "time management")
- No timeout issues - handles large memory collections efficiently
- Falls back to keyword search if Claude Code is unavailable

**Examples:**
```bash
# Semantic queries - finds related concepts
aissist recall "what did I learn about React hooks?"
aissist recall "fitness goals from last week"
aissist recall "work accomplishments this month"

# Complex queries
aissist recall "compare my goals from last week to this week"
aissist recall "what are my thoughts on productivity?"
```

**Note:** Requires Claude Code CLI to be installed and authenticated. Falls back to keyword-based search if Claude Code is unavailable.

### `aissist path`

Show the current storage path and whether it's global or local.

**Example:**
```bash
aissist path
```

## Storage Structure

```
.aissist/                    # or ~/.aissist/ for global
├── config.json              # Configuration
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
