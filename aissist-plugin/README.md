# Aissist Plugin for Claude Code

AI-powered personal assistant plugin that brings aissist's goal tracking, history logging, and semantic recall directly into your Claude Code workflow.

## Overview

The Aissist Plugin extends Claude Code with intelligent slash commands and skills for tracking your work, managing goals, and searching your personal memory. It integrates seamlessly with the [aissist CLI](../README.md) to provide AI-enhanced logging, GitHub activity import, semantic recall, and accomplishment reporting.

### Key Features

- **AI-Enhanced Logging**: Log work with automatic enhancement and goal linking
- **GitHub Integration**: Import commits and PRs as history entries
- **Semantic Recall**: Search your history with natural language queries
- **Accomplishment Reports**: Generate reports for standups, reviews, and more
- **Skill Activation**: Automatic aissist CLI integration when you mention goals or todos
- **Multimodal Support**: Log work with screenshots and images

## Installation

### Prerequisites

1. **Aissist CLI** must be installed and initialized:
   ```bash
   npm install -g aissist
   aissist init --global
   ```

2. **Claude Code** must be installed and authenticated:
   ```bash
   claude login
   ```

### Install Plugin

#### Production (Recommended)

Install from the GitHub marketplace:

```bash
claude plugin marketplace add albertnahas/aissist
claude plugin install aissist
```

#### Development (Local)

For plugin development or testing:

```bash
# From the aissist project root
claude plugin marketplace add ./aissist-plugin
claude plugin install aissist
```

### Verify Installation

```bash
claude plugin list
```

You should see `aissist` in the list of installed plugins.

## Quick Start

### Slash Commands

Use these commands directly in Claude Code conversations:

```
/aissist:log Fixed authentication bug, took 3 hours
/aissist:log-github "this week"
/aissist:recall "what did I work on last month?"
/aissist:report "this week" --purpose standup
```

### Skill Activation

The `aissist-cli` skill activates automatically when you:
- Mention goals, tasks, or todos
- Ask about progress tracking
- Want to log daily activities
- Search your work history

Example trigger phrases:
- "Add this to my todo list"
- "What are my current goals?"
- "Log what I did today"
- "Show my progress on the API project"

## Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/aissist:log` | AI-enhanced history logging with images | `/aissist:log Fixed bug in auth flow` |
| `/aissist:log-github` | Import GitHub activity | `/aissist:log-github "this week"` |
| `/aissist:recall` | Semantic search across history | `/aissist:recall "TypeScript learning"` |
| `/aissist:report` | Generate accomplishment reports | `/aissist:report "last month"` |

### `/aissist:log` - AI-Enhanced Logging

Log your work with AI enhancement and automatic goal linking. Claude rephrases rough notes into polished entries and analyzes images.

**Basic Usage:**
```
/aissist:log Completed user authentication module
```

**With Images:**
```
/aissist:log [attach screenshot] Updated dashboard design
```

**Multi-part Work:**
```
/aissist:log Fixed auth bug, refactored DB layer, updated tests
```
→ Automatically splits into 3 separate history entries

**Features:**
- AI rephrases rough notes into professional entries
- Preserves exact metrics and time estimates
- Analyzes attached images using vision capabilities
- Automatically links to relevant goals
- Intelligently routes to history (accomplishments) or context (notes)
- Splits multi-part work into granular entries

See [commands/log.md](./commands/log.md) for detailed documentation and routing examples.

### `/aissist:log-github` - GitHub Activity Import

Import GitHub commits and pull requests as history entries with semantic summarization.

**Usage:**
```
/aissist:log-github today
/aissist:log-github "this week"
/aissist:log-github "last month"
```

**Features:**
- Fetches commits and PRs from specified timeframe
- Semantically groups related changes
- Auto-links to relevant goals
- Requires GitHub CLI (`gh`) authentication

See [commands/log-github.md](./commands/log-github.md) for more details.

### `/aissist:recall` - Semantic Search

Search your history, goals, and reflections using natural language queries.

**Usage:**
```
/aissist:recall "what did I learn about TypeScript last month?"
/aissist:recall "show my fitness progress"
/aissist:recall "team decisions on authentication"
```

**Features:**
- Natural language understanding
- Semantic matching (finds related concepts, not just keywords)
- Searches across history, goals, todos, and context
- Returns relevant entries with dates and links

See [commands/recall.md](./commands/recall.md) for more details.

### `/aissist:report` - Generate Reports

Create accomplishment reports from your history for various purposes.

**Usage:**
```
/aissist:report "this week" --purpose standup
/aissist:report "last month" --purpose performance-review
/aissist:report "this sprint" --purpose team-update
/aissist:report "Q1 2024" --output report.md
```

**Report Types:**
- `standup`: Daily/weekly standup format
- `performance-review`: Detailed accomplishments for reviews
- `team-update`: Progress summary for team meetings
- `weekly-summary`: Week-in-review format

**Features:**
- AI-powered summarization and grouping
- Multiple output formats (Markdown, JSON)
- Customizable timeframes with natural language
- Goal-based organization

See [commands/report.md](./commands/report.md) for more details.

## Aissist CLI Skill

The plugin includes the `aissist-cli` skill that provides comprehensive CLI access within Claude Code conversations.

**When It Activates:**

The skill automatically activates when you mention:
- Goals or goal tracking
- Tasks, todos, or task management
- Progress tracking or accomplishments
- Daily logging or journaling
- Work history or activity tracking
- Context-specific notes (work, fitness, meals)
- Reflections or reviews

**What It Provides:**

Full access to aissist CLI commands:
```bash
aissist goal add "Learn Rust"
aissist todo add "Review PR #123"
aissist history log "Completed auth implementation"
aissist context log work "Sprint planning notes"
aissist reflect
```

**Example Activation:**

```
You: "I want to track my progress on learning TypeScript"
Claude: [aissist-cli skill activates]
         Let me help you set that up as a goal...
         [runs: aissist goal add "Learn TypeScript"]
```

See [skills/aissist-cli/SKILL.md](./skills/aissist-cli/SKILL.md) for complete documentation.

## Directory Structure

```
aissist-plugin/
├── .claude-plugin/
│   ├── plugin.json           # Plugin metadata
│   └── marketplace.json      # Marketplace configuration
├── commands/                 # Slash commands
│   ├── log.md               # /aissist:log
│   ├── log-github.md        # /aissist:log-github
│   ├── recall.md            # /aissist:recall
│   └── report.md            # /aissist:report
├── skills/                   # Agent skills
│   └── aissist-cli/
│       ├── SKILL.md         # Main skill documentation
│       ├── command-reference.md
│       ├── workflow-examples.md
│       └── storage-model.md
└── README.md                # This file
```

## Requirements

- **Node.js** >= 20.19.0
- **Aissist CLI** installed and initialized (`aissist init --global`)
- **Claude Code** installed and authenticated (`claude login`)
- **GitHub CLI** (optional, for `/aissist:log-github` command)

## Troubleshooting

### Plugin Not Found

If Claude Code doesn't recognize aissist commands:

1. Verify plugin installation:
   ```bash
   claude plugin list
   ```

2. If not installed, add the marketplace and install:
   ```bash
   claude plugin marketplace add albertnahas/aissist
   claude plugin install aissist
   ```

3. Restart Claude Code if necessary

### Aissist CLI Not Found

If commands fail with "aissist: command not found":

1. Verify aissist CLI is installed:
   ```bash
   aissist --version
   ```

2. If not installed:
   ```bash
   npm install -g aissist
   aissist init --global
   ```

### Commands Not Working

If slash commands execute but fail:

1. Check aissist is initialized:
   ```bash
   aissist path
   ```

2. Initialize if needed:
   ```bash
   aissist init --global
   ```

3. Verify Claude Code authentication:
   ```bash
   claude login
   ```

### GitHub Import Fails

If `/aissist:log-github` doesn't work:

1. Install GitHub CLI:
   ```bash
   # macOS
   brew install gh

   # Other platforms: https://github.com/cli/cli#installation
   ```

2. Authenticate:
   ```bash
   gh auth login
   ```

## Developer Guide

### Plugin Architecture

The plugin follows Claude Code's standard structure:

- **Commands** (`commands/*.md`): Slash commands with frontmatter configuration
- **Skills** (`skills/*/SKILL.md`): Agent skills with activation triggers
- **Plugin Manifest** (`.claude-plugin/plugin.json`): Metadata and versioning

### Contributing New Commands

1. Create a new command file in `commands/`:
   ```markdown
   ---
   description: Your command description
   argument-hint: <args>
   allowed-tools: Bash(aissist:*)
   ---

   # Your Command Title

   Documentation content...

   $ARGUMENTS
   ```

2. Document usage, examples, and features

3. Test locally:
   ```bash
   claude plugin marketplace add ./aissist-plugin
   claude plugin install aissist --force
   ```

4. Use the command in Claude Code:
   ```
   /aissist:your-command
   ```

### Updating the Skill

To modify the `aissist-cli` skill:

1. Edit `skills/aissist-cli/SKILL.md`
2. Update activation triggers in the frontmatter
3. Add or modify command documentation
4. Test with Claude Code
5. Update supporting documentation files as needed

### Testing Guidelines

**Local Testing:**
1. Make changes to plugin files
2. Reinstall plugin: `claude plugin install aissist --force`
3. Test commands in Claude Code conversation
4. Verify skill activation with trigger phrases

**Command Testing:**
- Test with various argument formats
- Verify error handling
- Check output formatting
- Ensure links and references work

**Skill Testing:**
- Test activation with various trigger phrases
- Verify CLI command execution
- Check error messages
- Test with local and global storage

### Adding Documentation

When adding or updating features:

1. Update relevant command `.md` files
2. Update skill documentation if CLI behavior changes
3. Add examples to this README
4. Update troubleshooting section if needed
5. Link to detailed documentation files

## Related Documentation

- **Main Aissist CLI**: [../README.md](../README.md)
- **Contributing Guide**: [../CONTRIBUTING.md](../CONTRIBUTING.md)
- **Claude Code Plugins**: [https://docs.claude.com/en/docs/claude-code/plugins](https://docs.claude.com/en/docs/claude-code/plugins)
- **Command Reference**: [skills/aissist-cli/command-reference.md](./skills/aissist-cli/command-reference.md)
- **Workflow Examples**: [skills/aissist-cli/workflow-examples.md](./skills/aissist-cli/workflow-examples.md)

## Support

- **Issues**: [GitHub Issues](https://github.com/albertnahas/aissist/issues)
- **Aissist CLI Docs**: [Main README](../README.md)
- **Claude Code Docs**: [https://docs.claude.com](https://docs.claude.com)

## License

MIT License - see [../LICENSE](../LICENSE) file for details.
