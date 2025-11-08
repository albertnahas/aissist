# Tasks for add-goal-focused-proposals

## Implementation Order

### Phase 1: Goal Loading and Smart Timeframe
1. - [x] **Add function to load goal details by codename** (src/utils/storage.ts)
   - [x] Create `getGoalByCodename(storagePath: string, codename: string)` function
   - [x] Return goal with codename, text, description, deadline fields
   - [x] Return null if goal not found
   - [x] Add unit tests for goal loading by codename
   - **Validation**: Can load goal details successfully

2. - [x] **Detect goal-only invocation and smart timeframe** (src/commands/propose.ts)
   - [x] Check if `--goal` is specified and timeframe argument is default ('today')
   - [x] Distinguish between `propose --goal X` (no timeframe) vs `propose today --goal X` (explicit)
   - [x] When goal-only: load full goal details after linkToGoal
   - [x] If goal has deadline: calculate timeframe from now to deadline date
   - [x] If goal has NO deadline: set special "timeless" label (e.g., "Comprehensive Plan")
   - [x] Override parsedTimeframe with calculated or timeless timeframe
   - **Validation**: `aissist propose --goal <codename>` resolves timeframe correctly

3. - [x] **Add helper for deadline-based timeframe** (src/utils/timeframe-parser.ts)
   - [x] Create `createTimeframeToDeadline(deadline: string)` helper function
   - [x] Calculate start (now) and end (deadline date)
   - [x] Create descriptive label like "Now until December 31, 2025"
   - [x] Add unit tests for deadline timeframe creation
   - **Validation**: Helper correctly creates timeframe from deadline

### Phase 2: Goal-Focused Prompt Generation
4. - [x] **Update proposal prompt interface** (src/prompts/proposal-prompt.ts)
   - [x] Add `goalInfo?: { codename: string; text: string; description?: string | null; deadline?: string | null }` to ProposalPromptOptions
   - [x] Add new section "## Goal Focus" in prompt when goalInfo is present
   - [x] Include goal text, description (if any), and deadline (if any)
   - [x] Instruct Claude to prioritize proposals that advance this specific goal
   - [x] For timeless timeframe: emphasize comprehensive strategic planning
   - [x] For deadline-based timeframe: emphasize working backwards from deadline
   - [x] For regular timeframe with goal: emphasize goal alignment within timeframe
   - **Validation**: Prompt includes goal context appropriately

5. - [x] **Pass goal information from command to prompt builder** (src/commands/propose.ts)
   - [x] When `--goal` is specified, load full goal details after linkToGoal
   - [x] Pass goal details to `buildProposalPrompt()` as goalInfo parameter
   - [x] Ensure goal loading happens before prompt building
   - [x] Handle case where goal codename is selected but goal details fail to load
   - **Validation**: Goal information flows through to prompt correctly

### Phase 3: Testing and Documentation
6. - [x] **Add unit tests for goal-focused features**
   - [x] Test goal loading by codename (src/utils/storage.test.ts)
   - [x] Test deadline-based timeframe creation (src/utils/timeframe-parser.test.ts)
   - [x] Test prompt includes goal info when provided
   - [x] Test timeless mode for goals without deadlines
   - **Validation**: All new tests pass (173 tests passing)

7. - [x] **Update command help and documentation**
   - [x] Update `propose --help` to clarify goal-focused behavior
   - [x] Add examples showing `propose --goal` without explicit timeframe
   - [x] Update README with goal-focused proposal examples
   - [x] Update plugin documentation (aissist-plugin/skills/aissist-cli/command-reference.md)
   - [x] Document the smart timeframe behavior
   - **Validation**: Documentation accurately reflects new behavior

8. - [ ] **Manual integration testing**
   - [ ] Test `aissist propose --goal <codename>` with deadline goal (should use deadline timeframe)
   - [ ] Test `aissist propose --goal <codename>` with no-deadline goal (should be timeless)
   - [ ] Test `aissist propose "this week" --goal <codename>` (explicit timeframe with goal focus)
   - [ ] Test `aissist propose today` without --goal (should work as before)
   - [ ] Verify Claude generates goal-focused proposals with proper context
   - **Validation**: All test scenarios work as expected

9. - [x] **Run build, lint, and test suite**
   - [x] Run `npm run build` successfully
   - [x] Run `npm run lint` successfully (0 errors, 4 pre-existing warnings)
   - [x] Run `npm test` successfully (173 tests passing)
   - **Validation**: No errors in build/lint/test

## Dependencies & Parallelization
- **Sequential execution required**:
  - Tasks 1-3 must complete before task 4 (need timeframe resolution)
  - Task 4 must complete before task 5 (need prompt interface)
  - Tasks 6-7 can run in parallel after tasks 1-5 complete
  - Task 8 requires all previous tasks
  - Task 9 is final validation

## Notes
- **Key simplification**: No new `dynamic` keyword—just smart behavior when `--goal` used without explicit timeframe
- Need to distinguish `propose --goal X` from `propose today --goal X` (check if timeframe is default)
- When goal has deadline: calculate "now to deadline" timeframe automatically
- When goal has no deadline: use "timeless" or "comprehensive" planning mode
- Existing behavior (non-goal proposals, regular timeframes) must not change
- Edge cases to handle:
  - Goal deadline in the past (warn user? or still generate plan?)
  - Goal deadline is today (same-day planning)
  - Very far future deadlines (years away)
  - Invalid goal codename (error gracefully)
