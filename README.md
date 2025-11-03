# Aissist

A local-first, AI-powered CLI personal assistant for tracking goals, reflections, history, and contextual information. All your data stays on your machine in human-readable Markdown files.

## Features

- **Local-First**: All data stored locally in Markdown files
- **Dual Storage**: Global (~/.aissist/) and project-specific (./.aissist/) modes
- **Goal Tracking**: Log and review your goals
- **History Logging**: Track daily activities and events
- **Context Management**: Organize information by context (work, diet, fitness, etc.)
- **Guided Reflection**: Interactive prompts for structured self-reflection
- **AI-Powered Recall**: Semantic search and summarization using Claude AI
- **Git-Compatible**: All data in Markdown, perfect for version control
- **Claude Code Integration**: Optional slash command support

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

Manage your goals.

**Subcommands:**
- `add <text>` - Add a new goal
- `list [--date <date>]` - List goals for today or specific date

**Examples:**
```bash
aissist goal add "Complete project proposal"
aissist goal list
aissist goal list --date 2024-01-15
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

AI-powered semantic search across all your memories.

**Arguments:**
- `<query>` - Your search question

**Examples:**
```bash
aissist recall "what did I learn about React hooks?"
aissist recall "fitness goals from last week"
aissist recall "work accomplishments this month"
```

**Note:** Requires Claude Code CLI to be installed and authenticated. Falls back to raw search results if Claude is unavailable.

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
│   └── YYYY-MM-DD.md
├── history/                 # Activity logs
│   └── YYYY-MM-DD.md
├── context/                 # Context-specific info
│   ├── work/
│   │   └── YYYY-MM-DD.md
│   ├── diet/
│   │   └── YYYY-MM-DD.md
│   └── [context-name]/
├── reflections/             # Daily reflections
│   └── YYYY-MM-DD.md
└── slash-commands/          # Claude Code integration
    └── aissist.json
```

## Claude AI Integration

To use AI-powered recall, you need Claude Code installed and authenticated:

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

Without Claude Code installed, `aissist recall` will still work but show raw search results instead of AI-summarized answers.

### Benefits of Claude Code Integration

- **No API Key Management**: Uses your existing Claude authentication
- **Seamless Experience**: Same auth as Claude Code
- **No Additional Costs**: Covered by your Claude subscription
- **Easy Setup**: Just install and login once

## Claude Code Slash Command

After running `aissist init`, a slash command manifest is created at `.aissist/slash-commands/aissist.json`. You can configure Claude Code to use this for `/aissist` commands.

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
