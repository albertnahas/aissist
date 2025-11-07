# Design Document: Contextual Hints System

## Overview
This document explains the architectural decisions for implementing a contextual hint system that suggests next steps after command execution.

## Architecture

### Component Structure
```
src/
├── config/
│   └── hints.json              # Static hint mappings
├── utils/
│   └── hints.ts                # Hint display & static lookup
├── llm/
│   └── hints.ts                # AI hint generation via Claude Code
└── commands/
    └── *.ts                    # Command integrations
```

### Data Flow

#### Static Hints Flow
```
Command completes → Check config.hints.enabled
                 → Load hints.json
                 → Lookup command name
                 → Display hint (if found)
                 → Return to shell
```

#### AI Hints Flow
```
Command completes → Check config.hints.enabled
                 → Check config.hints.strategy
                 → (if "ai") Gather context (goals, todos, history)
                 → Call Claude Code headless with prompt
                 → Wait up to 2s for response
                 → Validate response format
                 → Display hint
                 → (on timeout/error) Fallback to static hint
                 → Return to shell
```

## Key Decisions

### Decision 1: AI Strategy (Claude Code Headless)
**Context**: Need AI-powered hints that understand user context.

**Options Considered**:
1. Agent SDK with custom prompt
2. Claude Code headless mode with restricted tools
3. Embed Anthropic SDK directly

**Decision**: Use Claude Code headless mode (Option 2)

**Rationale**:
- Already used for `recall` and `propose` commands (consistency)
- Headless mode is fast and designed for CLI integration
- Can restrict tools to read-only (Grep, Read, Glob) for safety
- Graceful fallback when Claude Code unavailable
- No API key management (uses existing Claude Code auth)

**Trade-offs**:
- Requires Claude Code installation (acceptable, same as recall)
- Adds 1-2s latency (mitigated by timeout and async display)
- Limited to Claude Code's capabilities (sufficient for hints)

### Decision 2: Fallback Strategy (AI → Static → None)
**Context**: AI hints may fail or timeout.

**Decision**: Three-tier fallback system:
1. First attempt: AI hint (if enabled and strategy="ai")
2. Second attempt: Static hint from JSON
3. Final: No hint (prefer silence over noise)

**Rationale**:
- Ensures hints always provide value (static hints are curated)
- No blocking or hanging (2s timeout enforced)
- Graceful degradation for offline users
- No annoying "Could not generate hint" messages

**Trade-offs**:
- More complex implementation (acceptable, minimal code)
- Static hints may become stale (mitigated by JSON maintainability)

### Decision 3: Configuration Design
**Context**: Users need control over hint behavior.

**Config Schema**:
```typescript
{
  hints: {
    enabled: boolean;        // Master toggle
    strategy: "ai" | "static"; // Hint generation method
    timeout: number;         // AI hint timeout in ms (default: 2000)
  }
}
```

**Rationale**:
- `enabled` allows quick disable without losing strategy preference
- `strategy` lets users choose AI vs static based on their needs
- `timeout` configurable for different network conditions (advanced users)
- Sensible defaults (enabled=true, strategy="ai", timeout=2000)

### Decision 4: Static Hints Storage (JSON File)
**Context**: Need maintainable, version-controlled hint mappings.

**Options Considered**:
1. Hardcoded in TypeScript
2. JSON file in src/config/
3. External hints database

**Decision**: JSON file (Option 2)

**Rationale**:
- Easy to update without code changes
- Version controlled with codebase
- Can be extended by contributors without TS knowledge
- Simple structure: `{ "command.subcommand": "hint" }`

**Structure**:
```json
{
  "goal.add": "Try `aissist recall goals` to check progress",
  "todo.add": "Use `aissist todo list` to see all tasks",
  "history.log": "Run `aissist reflect` to review your day"
}
```

### Decision 5: Async Non-Blocking Display
**Context**: Hints should not delay command completion.

**Decision**: Display hints asynchronously after success messages, but before returning to shell prompt.

**Implementation**:
- Success message displays immediately
- Hint generation starts in background
- Hint displays when ready (or times out)
- Shell prompt appears after hint (or timeout)

**Rationale**:
- Perceived performance (success feels instant)
- Total time capped at 2s (acceptable for hint generation)
- Maintains CLI responsiveness
- Users can start typing next command (shell will buffer)

**Trade-offs**:
- Slightly delayed shell prompt (max 2s, acceptable for quality hints)
- More complex async handling (manageable with promises)

### Decision 6: Hint Display Format
**Context**: Hints must be visually distinct from command output.

**Design**:
```
✓ Goal added with codename: alpha-bravo

💡 Try `aissist recall goals` to check progress
```

**Elements**:
- Blank line separator before hint
- 💡 icon (or "Hint:" text) for visual distinction
- Dimmed/gray text (chalk.dim or chalk.gray)
- Command in backticks for clarity
- Single line, max 120 characters

**Rationale**:
- Clear visual separation prevents confusion with output
- Subtle styling (dim) makes hints non-intrusive
- Backticked commands are easy to copy-paste
- Short format respects terminal real estate

## Performance Considerations

### Latency Budget
- Static hint lookup: <10ms (JSON read + lookup)
- Static hint display: <50ms (formatting + console output)
- AI hint generation: <2000ms (timeout enforced)
- Total max latency: 2050ms (acceptable for quality suggestions)

### Optimization Strategies
1. **Lazy load hints.json**: Load once on first hint request, cache in memory
2. **Async AI calls**: Don't block command completion
3. **Context gathering optimization**: Only read recent files (last 3 days)
4. **Short timeout**: 2s is enough for Claude Code, prevents hanging

## Security Considerations

### Claude Code Tool Restrictions
When invoking Claude Code for hint generation:
- **Allowed tools**: Grep, Read, Glob (read-only)
- **Blocked tools**: Write, Edit, Delete, Bash (prevent modification)
- **Path restriction**: Limit to storage directory only

### Prompt Injection Prevention
- User input (goal codenames, todo text) is NOT passed directly to AI prompt
- Only metadata (counts, dates) and sanitized summaries are included
- Hints are display-only, no execution or evaluation

## Testing Strategy

### Unit Tests
- Config schema validation (hints property)
- Static hint loading and lookup
- Hint display formatting
- AI prompt construction

### Integration Tests
- AI → static fallback on timeout
- AI → static fallback on Claude Code unavailable
- Hints disabled via config
- Strategy switching (ai ↔ static)

### Manual Testing
- Run commands with hints enabled/disabled
- Test with Claude Code installed/uninstalled
- Verify hint quality and relevance
- Test performance (perceived and actual)

## Future Enhancements

### Phase 2 Possibilities (Out of Scope for Initial Implementation)
1. **Context-aware hints**: "You haven't logged history in 3 days"
2. **Multi-command workflows**: Hint chains for complex tasks
3. **Personalized hints**: Learn from user behavior over time
4. **Hint feedback**: Users can rate hints (👍/👎) to improve quality
5. **Custom user hints**: Allow users to add their own hints in config

### Extensibility
The design supports these enhancements through:
- `HintContext` type can be extended with more metadata
- AI prompts can be enhanced without breaking static fallback
- Config schema can be extended (backward compatible defaults)
- New hint strategies can be added ("personalized", "workflow", etc.)

## Migration & Rollout

### Phase 1: Static Hints Only
- Implement core infrastructure
- Add static hints to main commands
- Allow users to test and provide feedback
- **Risk**: Low (no external dependencies)

### Phase 2: AI Hints with Fallback
- Add AI hint generation
- Enable by default (strategy="ai")
- Monitor for issues (latency, quality)
- **Risk**: Medium (requires Claude Code, adds latency)

### Phase 3: Optimization & Enhancement
- Refine AI prompts based on feedback
- Add more static hints
- Performance tuning
- **Risk**: Low (iterative improvements)

## Success Metrics

### Quantitative
- Hint display latency <2s in 95th percentile
- Fallback rate <10% (AI hints succeed 90%+ when enabled)
- No increase in command error rates

### Qualitative
- User feedback: "Hints helped me discover commands"
- User feedback: "Hints are not annoying"
- Contributor feedback: "Easy to add new hints"

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| AI hints too slow | Medium | High | 2s timeout, async display, static fallback |
| AI hints low quality | Low | Medium | Curated prompt, static fallback, user can disable |
| Users find hints annoying | Low | Medium | Easy to disable, subtle styling, single line |
| Static hints become stale | Medium | Low | JSON easy to update, community contributions |
| Claude Code unavailable | High | Low | Graceful fallback to static hints |

## Conclusion

This design balances:
- **User value**: Helpful suggestions without being intrusive
- **Performance**: Fast fallback, async display, timeout protection
- **Reliability**: Static fallback ensures hints always work
- **Maintainability**: JSON hints, clear separation of concerns
- **Extensibility**: Can evolve to context-aware, personalized hints

The three-tier fallback (AI → static → none) ensures the system degrades gracefully, providing value even when AI is unavailable while maintaining CLI responsiveness.
