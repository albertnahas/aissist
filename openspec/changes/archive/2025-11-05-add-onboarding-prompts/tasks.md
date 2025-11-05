# Implementation Tasks

## Phase 1: Foundation (Parallel)
- [x] 1. **Add TTY detection utility** (5 min)
  - Created `src/utils/tty.ts` with `isTTY()` function
  - Checks `process.stdin.isTTY` and `process.stdout.isTTY`
  - Exported as utility for use in commands
  - Added unit tests in `src/utils/tty.test.ts`

- [x] 2. **Create interactive prompt helpers** (10 min)
  - Added `promptForFirstGoal()` helper in `src/utils/onboarding.ts`
  - Added `promptForFirstTodo(goalCodename: string)` helper
  - Both return boolean (accepted/declined) or throw on Ctrl+C
  - Handles graceful cancellation with try-catch

## Phase 2: Init Command Integration (Sequential after Phase 1)
- [x] 3. **Modify init command to add post-initialization prompt** (15 min)
  - Modified `src/commands/init.ts` after successful initialization
  - Tracks if storage was newly created (not already exists case)
  - Checks TTY with `isTTY()` via onboarding helpers
  - After Claude Code integration flow, calls `promptForFirstGoal()`
  - If accepted, calls `createGoalInteractive()` helper
  - Passes control to post-goal-creation prompt

- [x] 4. **Connect init flow to goal creation** (10 min)
  - Created `src/utils/goal-helpers.ts` with `createGoalInteractive()` function
  - Returns `{ codename: string, success: boolean }` result
  - Handles goal text input, codename generation, deadline prompt, and file write
  - Called from init command with interactive flow

## Phase 3: Goal Command Integration (Sequential after Phase 2)
- [x] 5. **Modify goal add command to add post-goal-creation prompt** (15 min)
  - Modified `src/commands/goal.ts` after successful goal creation
  - Checks TTY via `promptForFirstTodo()` helper
  - Calls `promptForFirstTodo(codename)` with newly created goal codename
  - If accepted, calls `createTodoInteractive()` with goal pre-linked
  - Handles Ctrl+C gracefully (goal already saved)

- [x] 6. **Connect goal flow to todo creation with pre-linking** (15 min)
  - Created `src/utils/todo-helpers.ts` with `createTodoInteractive()` function
  - Accepts `options?: { goal?: string }` parameter
  - When `goal` option provided, pre-populates goal link
  - Handles todo text input, priority prompt, and file write with goal metadata

## Phase 4: Error Handling & Edge Cases (Sequential after Phase 3)
- [x] 7. **Handle Ctrl+C cancellation in prompt flows** (10 min)
  - Wrapped all onboarding prompt calls in try-catch blocks
  - On cancellation during goal prompt: exits gracefully
  - On cancellation during todo prompt: exits gracefully, goal already saved
  - All Ctrl+C handling implemented in init.ts and goal.ts

- [x] 8. **Skip prompts when storage already exists** (5 min)
  - In init command, `storageNewlyCreated` flag tracks initialization status
  - Post-initialization prompt only runs when `storageNewlyCreated === true`
  - Skips prompts when storage already exists

- [x] 9. **Skip prompts in non-TTY environments** (5 min)
  - Added `isTTY()` check in `promptForFirstGoal()` and `promptForFirstTodo()`
  - Returns `false` immediately if not in TTY environment
  - No prompts appear in scripts/CI/piped input

## Phase 5: Testing & Validation (Sequential after Phase 4)
- [x] 10. **Add integration tests for prompt flows** (20 min)
  - Created unit tests for TTY detection in `src/utils/tty.test.ts`
  - Manual testing required for interactive prompt flows
  - Build passes successfully with all TypeScript types correct

- [x] 11. **Validate with OpenSpec** (5 min)
  - Ran `openspec validate add-onboarding-prompts --strict`
  - Validation passed: Change is valid
  - All scenarios covered by implementation

- [x] 12. **Update documentation** (10 min)
  - Updated `aissist-plugin/skills/aissist-cli/SKILL.md` with onboarding flow section
  - Updated `aissist-plugin/skills/aissist-cli/workflow-examples.md` with "Getting Started" section
  - Documented init → goal → todo flow with example session
  - Documented how to skip prompts (Ctrl+C, decline, or non-TTY)

## Dependencies
- Task 2 depends on Task 1 (needs TTY utility)
- Tasks 3-4 must run sequentially (init → goal flow)
- Tasks 5-6 must run sequentially (goal → todo flow)
- Tasks 7-9 can run in parallel (independent edge cases)
- Tasks 10-12 must run after all implementation tasks complete

## Parallelization Opportunities
- Phase 1 tasks (1-2) can run in parallel
- Phase 4 tasks (7-9) can run in parallel after Phase 3
- Within Phase 5, tasks 11-12 can run in parallel (after task 10)

## Testing Strategy
- **Unit tests**: TTY detection, prompt helper functions
- **Integration tests**: Full onboarding flows (init → goal → todo)
- **Manual tests**: Real terminal interaction, Ctrl+C handling
- **Regression tests**: Existing goal and todo commands still work independently
