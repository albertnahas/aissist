# Add AI-Powered Propose Command

## Why

Users accumulate goals, history logs, and reflections in `.aissist/` but lack intelligent guidance on **what to focus on next**. Without AI-powered analysis of past patterns, timelines, and goal progress, users must manually review scattered data to plan their actions. The `propose` command addresses this by synthesizing goals, history, and reflections into actionable, time-aware recommendations using Claude AI.

## What Changes

- Add new `aissist propose [<timeframe>]` CLI command
- Parse natural language timeframes (e.g., "this week", "next quarter", "2026 Q1")
- Load and aggregate relevant data from goals, history, and reflections based on timeframe
- Build context-rich prompts for Claude Code CLI with file analysis tools
- Generate structured, actionable proposals with optional goal-saving workflow
- Support optional flags: `--reflect`, `--debug`, `--context`, `--tag <focus>`

## Impact

**Affected specs:**
- `cli-infrastructure` (MODIFIED: adds new command)
- `claude-integration` (MODIFIED: adds proposal generation use case)
- `ai-planning` (ADDED: new capability for intelligent action proposals)

**Affected code:**
- Add `src/commands/propose.ts` - main command handler
- Add `src/utils/timeframe-parser.ts` - natural language date parsing
- Add `src/prompts/proposal-prompt.ts` - Claude prompt builder
- Update `src/index.ts` - register new command
- Update package dependencies if using `chrono-node` or similar

**User Impact:**
- Provides proactive planning assistance
- Reduces manual data review overhead
- Surfaces patterns and insights from historical data
- Encourages reflection-driven action
