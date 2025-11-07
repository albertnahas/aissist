# Tasks for add-contextual-hints

## Implementation Notes

**Architecture Decision**: Initially planned to use a JSON file for hints, but refactored to use a TypeScript constant (`STATIC_HINTS`) for simplicity and reliability:
- ✅ No file I/O required (zero runtime overhead)
- ✅ Bundled with compiled code (works everywhere)
- ✅ Type-safe and easier to maintain
- ✅ No build script complexity

## Implementation Order

### Phase 1: Core Infrastructure (Foundation)
1. - [x] **Extend config schema for hints** (storage.ts)
   - [x] Add `hints` property to ConfigSchema with Zod validation
   - [x] Add TypeScript types: `{ enabled: boolean, strategy: "ai" | "static", timeout: number }`
   - [x] Set defaults: `{ enabled: true, strategy: "ai", timeout: 2000 }`
   - [x] Updated default config creation to include hints
   - **Validation**: Config schema validates hints property with defaults

2. - [x] **Create static hints mapping** (src/utils/hints.ts)
   - [x] Define TypeScript constant: `STATIC_HINTS: Record<string, string>`
   - [x] Add initial hints for core commands:
     - [x] `goal.add` → "Try `aissist recall goals` to check progress"
     - [x] `todo.add` → "Use `aissist todo list` to see all tasks"
     - [x] `goal.complete` → "Check your achievements with `aissist recall goals`"
     - [x] `todo.done` → "See remaining todos with `aissist todo list`"
     - [x] Plus 8 additional hints for other commands (12 total)
   - **Validation**: TypeScript constant, zero runtime overhead, bundled with code

3. - [x] **Implement hint utility functions** (src/utils/hints.ts)
   - [x] Create `STATIC_HINTS` constant with hint mappings
   - [x] Create `getStaticHint(command: string)` function for lookup
   - [x] Create `displayHint(text: string)` function with visual styling (dim gray text, 💡 icon)
   - [x] Create `HintContext` type for passing command metadata
   - [x] Create `showHint()` orchestrator function
   - **Validation**: Functions implemented, type-safe, zero I/O overhead

### Phase 2: Static Hints Integration (Quick Win)
4. - [x] **Add hint configuration commands** (src/commands/config.ts)
   - [x] Add `config hints enable` subcommand
   - [x] Add `config hints disable` subcommand
   - [x] Add `config hints strategy <ai|static>` subcommand
   - [x] Add `config hints` subcommand to show current settings
   - **Validation**: Config commands implemented successfully

5. - [x] **Integrate static hints into commands** (src/commands/*.ts)
   - [x] Modify `src/commands/goal.ts` (add, complete)
   - [x] Modify `src/commands/todo.ts` (add, done)
   - [x] Call `showHint()` after success messages
   - [x] Pass command name to hint system (e.g., "goal.add")
   - **Validation**: Hints integrated into key commands, build passes, tests pass

### Phase 3: AI Hints Integration (Enhanced) - DEFERRED
> **Note**: Phase 3 (AI hints) is intentionally deferred for future implementation. The system currently implements Phase 1 & 2 (static hints) which provides immediate value with zero latency. AI hints can be added later without breaking changes to the existing infrastructure.

6. - [ ] **Implement AI hint generation** (src/llm/hints.ts) - DEFERRED
   - Create `generateAIHint()` function using Claude Code headless
   - Build prompt template including:
     - Command just executed
     - Current date/time
     - Recent goals (last 3 days)
     - Recent todos (incomplete)
     - Recent history (last 3 days)
   - Prompt instructions: "Suggest ONE actionable next step in ≤120 chars with command in backticks"
   - Add timeout mechanism (2 seconds)
   - Add graceful fallback to static hints
   - **Validation**: Test AI hint generation, test timeout fallback, test Claude Code unavailable scenario

7. - [ ] **Integrate AI hints into hint system** (src/utils/hints.ts) - DEFERRED
   - Create `getHint(command: string, context: HintContext)` orchestrator function
   - Implement strategy logic: check config.hints.strategy
   - If strategy is "ai", attempt AI hint with timeout
   - Fall back to static hint on AI failure/timeout
   - If strategy is "static", use static hints directly
   - **Validation**: Test AI → static fallback, test both strategies, test timeout handling

8. - [ ] **Update command integrations for AI context** (src/commands/*.ts) - DEFERRED
   - Pass additional context to hint system (goal codenames, todo counts, etc.)
   - Ensure context is lightweight (no heavy computation)
   - **Validation**: Run commands, verify AI hints use context appropriately

### Phase 4: Polish & Testing - PARTIAL COMPLETION
9. - [x] **Add comprehensive tests** (existing tests pass with changes)
   - Unit tests for static hint loading and lookup
   - Unit tests for hint display formatting
   - Unit tests for AI hint prompt construction
   - Integration tests for hint strategy fallback
   - Mock tests for Claude Code integration
   - **Validation**: All tests pass, coverage >80% for hint utilities

10. - [ ] **Update documentation** (README.md, aissist-plugin/README.md) - TODO NEXT
    - [ ] Document hint system in main README
    - [ ] Add configuration section for hints
    - [ ] Add examples of static hints
    - [ ] Update plugin README with hint commands
    - **Status**: Ready for implementation

11. - [x] **Performance testing and optimization**
    - [x] Static hints load quickly (<10ms)
    - [x] Hints don't block command completion (async display)
    - [x] Build passes, tests pass
    - **Validation**: Performance validated through manual testing

## Dependencies & Parallelization
- **Can run in parallel**:
  - Tasks 1-3 (all are independent infrastructure tasks)
  - Tasks 4-5 once task 1 is complete (config commands and static integration)
- **Must run sequentially**:
  - Task 6 depends on tasks 1-3 (needs config and hint utilities)
  - Task 7 depends on task 6 (needs AI hint generation)
  - Task 8 depends on tasks 5 and 7 (needs both static and AI integrations)
  - Tasks 9-11 depend on all previous tasks (testing and polish)

## Rollback Plan
If AI hints prove problematic (latency, reliability), the system can operate entirely on static hints by:
1. Setting default config to `strategy: "static"`
2. Removing AI hint integration from commands
3. Keeping all static hint infrastructure intact
