# Tasks: Add Todo Management

## Implementation Order

### 1. Storage Infrastructure
- [x] Add `todos/` directory initialization in `storage.ts` `initializeStorage()`
- [x] Create `parseTodoEntries()` function to parse checkbox format and extract metadata
- [x] Create `updateTodoStatus()` function to toggle checkbox state
- [x] Create `removeTodoEntry()` function to remove todos by index/text
- [x] Create `updateTodoText()` function to edit todo text
- [x] Add unit tests for todo storage utilities

**Validation**: ✓ Run `npm test` and verify all storage utilities work correctly

### 2. Todo Command Module
- [x] Create `src/commands/todo.ts` with Commander setup
- [x] Implement `todo add` subcommand with `--goal` and `--date` flags
- [x] Implement `todo list` subcommand with `--plain`, `--date`, and `--goal` filters
- [x] Implement `todo done` subcommand with index/text matching
- [x] Implement `todo remove` subcommand with index/text matching
- [x] Implement `todo edit` subcommand with interactive input
- [x] Register todo command in `src/index.ts`

**Validation**: ✓ Test each subcommand manually with various inputs

### 3. Interactive List UI
- [x] Add `@inquirer/checkbox` to dependencies (if not already present)
- [x] Create interactive checkbox UI in `todo list` (non-plain mode)
- [x] Handle multi-select completion and update todo file
- [x] Add error handling for empty todo lists
- [x] Add visual formatting with chalk for completed/incomplete todos

**Validation**: ✓ Test interactive list with empty list, single todo, multiple todos

### 4. History Integration
- [x] Create `logTodoCompletion()` helper function
- [x] Log completed todos to history with "Completed from TODO" context
- [x] Preserve goal metadata in history entries
- [x] Add timestamp to history entries
- [x] Test history logging with and without goal links

**Validation**: ✓ Complete todos and verify history entries are correct

### 5. Goal Linking
- [x] Integrate `linkToGoal()` from `goal-matcher.ts` in `todo add`
- [x] Store goal metadata in todo file: `(Goal: codename)`
- [x] Parse goal metadata in `parseTodoEntries()`
- [x] Implement goal filtering in `todo list --goal`
- [x] Test keyword matching and interactive selection

**Validation**: ✓ Add todos with `--goal` flag and verify linkage

### 6. Propose Command Integration
- [x] Add post-proposal interactive prompt in `src/commands/propose.ts`
- [x] Offer options: "Create TODO", "Link to goal", "Create goal", "Skip"
- [x] Parse proposal numbered items into todo format
- [x] Create todos with goal linkage if proposal was linked
- [x] Test with various proposal outputs

**Validation**: ✓ Run `propose` command and test each post-proposal option

### 7. Testing
- [x] Add unit tests for `parseTodoEntries()`
- [x] Add unit tests for `updateTodoStatus()`
- [x] Add integration test for `todo add` → `todo list` → `todo done`
- [x] Add integration test for history logging
- [x] Add integration test for goal linking
- [x] Add test for `--date` flag functionality
- [x] Add test for edge cases (no todos, invalid index, etc.)

**Validation**: ✓ Run `npm test` and achieve >80% coverage for new code

### 8. Documentation
- [x] Update README.md with `todo` command examples
- [x] Add inline JSDoc comments for public functions
- [x] Update CLAUDE.md if needed for project conventions

**Validation**: ✓ Review docs for clarity and completeness

## Dependencies Between Tasks
- Task 2 depends on Task 1 (needs storage utilities)
- Task 3 depends on Task 2 (needs `list` command structure)
- Task 4 depends on Task 2 (needs `done` command)
- Task 5 depends on Task 2 (needs `add` command)
- Task 6 depends on Tasks 1-5 (needs full todo system)
- Task 7 can run in parallel with other tasks
- Task 8 should be last

## Parallel Work Opportunities
- Tasks 3, 4, 5 can be implemented in parallel after Task 2
- Task 7 (tests) can be written alongside implementation
- Task 8 (docs) can be drafted early and updated as implementation progresses

## Estimated Effort
- Task 1: 2-3 hours (storage infrastructure)
- Task 2: 3-4 hours (command module)
- Task 3: 1-2 hours (interactive UI)
- Task 4: 1-2 hours (history integration)
- Task 5: 1 hour (goal linking - reuses existing code)
- Task 6: 1-2 hours (propose integration)
- Task 7: 3-4 hours (comprehensive testing)
- Task 8: 1 hour (documentation)

**Total**: 13-19 hours

## Risks and Mitigations
- **Risk**: Checkbox parsing may not handle edge cases (malformed markdown)
  - **Mitigation**: Use robust regex and add validation tests
- **Risk**: Interactive UI may conflict with CI/CD (non-TTY environments)
  - **Mitigation**: Always provide `--plain` flag fallback
- **Risk**: History logging may create duplicate entries
  - **Mitigation**: Add timestamps and check for duplicates before appending
