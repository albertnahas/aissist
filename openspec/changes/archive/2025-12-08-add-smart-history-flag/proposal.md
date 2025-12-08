# Proposal: Add Smart History Logging Flag

## Summary
Add an optional `--smart` flag to the `aissist history log` CLI command that uses Claude Haiku to clean up input text and automatically link to the most relevant goal.

## Motivation
Users often log history entries quickly with typos, incomplete phrasing, or casual language. The `--smart` flag provides a lightweight AI enhancement that:
1. Corrects spelling/grammar mistakes
2. Converts rough notes into minimal, well-phrased entries
3. Automatically links to the most relevant goal (if a confident match exists)

This is a CLI-native feature complementing the more comprehensive `/aissist:log` plugin command.

## Scope
- **In scope**: `--smart` flag on `history log` command, Haiku-based text cleanup, automatic goal linking
- **Out of scope**: Multi-log splitting, history vs context routing, image analysis (these remain in the plugin spec)

## User Experience

### Basic usage
```bash
# Without --smart (current behavior)
aissist history log "fixd the auth bug, took 2hrs"
# Logs: "fixd the auth bug, took 2hrs"

# With --smart
aissist history log --smart "fixd the auth bug, took 2hrs"
# Logs: "Fixed authentication bug (2 hours)" --goal improve-auth
```

### Behavior
- Text is sent to Claude Haiku for minimal cleanup
- If a goal matches with high confidence, it's auto-linked (no prompt)
- If no confident match, entry is logged without goal
- Original meaning and metrics are preserved
- Flag is optional; default behavior unchanged

## Technical Approach
- Reuse existing `executeClaudeCommand()` with Haiku model
- Add new function `enhanceHistoryEntry()` in `src/llm/claude.ts`
- Modify `history log` command to check for `--smart` flag
- Goal matching uses semantic analysis, not keyword search

## Dependencies
- Claude CLI must be available and authenticated
- Requires network connectivity when `--smart` is used
