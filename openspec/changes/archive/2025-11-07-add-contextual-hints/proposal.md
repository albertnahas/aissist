# Proposal: Add Contextual Hints

## Summary
Add a subtle hint system that suggests the next logical step after each command completion, enhancing discoverability and improving user workflow without being intrusive. The system will support both AI-powered hints (via Claude Code headless integration) and fallback static hints from a JSON configuration file.

## Why
Users frequently complete commands successfully but don't know what logical step to take next, leading to:
- Reduced productivity (searching documentation or help text)
- Poor feature discoverability (users don't learn about related commands)
- Broken workflow momentum (context switching to look up commands)

Contextual hints solve this by providing subtle, just-in-time suggestions that guide users through natural workflows without interrupting their flow.

## What Changes

This change introduces a contextual hints system with the following components:

**New Specifications:**
- `hint-system` - Core hint display infrastructure and static hint mapping
- `hint-configuration` - Configuration commands for managing hints

**Modified Specifications:**
- `cli-infrastructure` - Extended with hint display utilities
- `config-command` - Added hints configuration subcommands
- `storage-system` - Extended config schema with hints settings

**New Files:**
- `src/utils/hints.ts` - Hint utility functions and static hints constant

**Modified Files:**
- `src/utils/storage.ts` - Config schema with hints property
- `src/commands/config.ts` - Hints configuration commands
- `src/commands/goal.ts` - Integrated hints into goal add/complete
- `src/commands/todo.ts` - Integrated hints into todo add/done

**Key Features:**
- Static hints stored as TypeScript constant (12 curated hints)
- Configuration: enable/disable, strategy (ai/static), timeout
- Visual styling: dim text with 💡 icon
- Zero runtime overhead (no file I/O)
- Ready for future AI hint integration (Phase 3)

## Motivation
Users often complete a command but may not know what logical action comes next. For example:
- After `aissist goal add`, they might want to check progress with `aissist recall goals`
- After `aissist todo add`, they could list todos with `aissist todo list`
- After `aissist history log`, they might want to reflect with `aissist reflect`

This proposal introduces contextual hints that:
1. Guide users through natural workflows
2. Improve CLI discoverability
3. Remain subtle and non-intrusive (unlike full help text)
4. Leverage Claude Code when available for intelligent, context-aware suggestions
5. Fall back to predefined hints when Claude Code is unavailable

## User Stories

### Story 1: New User Learning Workflow
As a new user, after adding my first goal, I want to see a subtle hint suggesting how to track my progress, so I can learn the CLI naturally without reading extensive documentation.

### Story 2: Experienced User with AI Hints
As an experienced user with Claude Code configured, I want the hint system to analyze my current context (recent goals, todos, history) and suggest the most relevant next action, so I can work more efficiently.

### Story 3: Offline User
As a user working offline without Claude Code access, I want to still receive helpful (but static) hints after commands, so I can maintain productivity without AI features.

## Scope

### In Scope
- Hint display infrastructure (CLI utility function)
- Configuration option to enable/disable hints
- Static hint mapping (JSON file with command → hint pairs)
- AI-powered hints using Claude Code headless mode
- Integration with existing commands (goal, todo, history, recall, etc.)
- Fallback mechanism (AI → static → disabled)

### Out of Scope
- Interactive hint selection (this is about subtle suggestions, not menus)
- Hint history or tracking
- Personalized hint learning (beyond Claude Code's context awareness)
- Multi-step hint chains (one hint per command execution)

## Dependencies
- Extends `cli-infrastructure` spec (new hint utility function)
- Extends `claude-integration` spec (new hint generation capability)
- Extends `config-command` spec (new hints configuration)
- Modifies multiple command specs (goal-management, todo-management, history-tracking, etc.)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Hints become annoying/verbose | Medium | Make them subtle, single-line, and easily disabled via config |
| AI hint latency disrupts UX | High | Short timeout (2s), instant fallback to static hints |
| Static hints become stale | Low | Store in JSON for easy maintenance, include in documentation reviews |
| Increased command completion time | Medium | Render hints asynchronously, don't block command success output |

## Success Metrics
- Hints are displayed successfully after command execution
- AI hints respond within 2 seconds or fall back gracefully
- Users can disable hints via `aissist config hints disable`
- Static fallback works reliably when Claude Code is unavailable

## Open Questions
1. Should we use a separate Claude Code prompt for hints, or integrate with existing recall infrastructure?
   - **Proposed Answer**: Use dedicated lightweight hint prompt for speed, separate from semantic recall

2. What's the optimal hint timeout before falling back to static?
   - **Proposed Answer**: 2 seconds (fast enough to feel instant, long enough for Claude Code to respond)

3. Should hints be contextual per-user (e.g., "you haven't logged history in 3 days")?
   - **Proposed Answer**: Phase 1 will use command-based hints only; context-aware hints can be added later if AI hints prove valuable

4. Should we support custom user-defined hints?
   - **Proposed Answer**: Not in initial implementation; focus on built-in hints first
