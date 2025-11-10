# Tasks: Migrate to YAML Front Matter

## Overview
This change migrates all entry types (goals, todos, history, context) from inline metadata format to YAML front matter, with automatic migration on read.

## Task List

### Phase 1: Dependencies and Core Utilities

1. **Add js-yaml dependency**
   - Install `js-yaml` and `@types/js-yaml` packages
   - Verify TypeScript types are working
   - **Validation**: Run `npm list js-yaml` and check types

2. **Create YAML utility functions**
   - Create `src/utils/yaml-helpers.ts` with parsing and serialization utilities
   - Add `parseYamlFrontMatter(content: string)` function
   - Add `serializeYamlFrontMatter(metadata: object, body: string)` function
   - Add `detectFormat(content: string): 'yaml' | 'inline'` function
   - **Validation**: Unit tests for YAML parsing and serialization

3. **Create migration utility functions**
   - Create `src/utils/migration.ts` with migration logic
   - Add `migrateFile(filePath: string, parser: Function, serializer: Function)` function
   - Add atomic file write with temp files
   - Add error handling and rollback
   - **Validation**: Unit tests for migration functions

### Phase 2: Goal Management Migration

4. **Update GoalEntry interface**
   - Add JSDoc comments describing YAML format
   - Ensure interface matches YAML field structure
   - **Validation**: TypeScript compilation passes

5. **Implement YAML parser for goals**
   - Create `parseGoalEntryYaml(entry: string)` in `src/utils/storage.ts`
   - Parse YAML front matter to extract: timestamp, codename, deadline, description
   - Parse markdown body for goal text
   - Handle null/missing fields gracefully
   - **Validation**: Unit tests with various goal YAML formats

6. **Implement YAML serializer for goals**
   - Create `serializeGoalEntryYaml(entry: GoalEntry)` in `src/utils/storage.ts`
   - Serialize metadata to YAML front matter
   - Omit null fields for cleaner output
   - Format multiline descriptions with `|` indicator
   - **Validation**: Unit tests for serialization

7. **Update parseGoalEntry with format detection**
   - Detect YAML vs inline format
   - Route to appropriate parser
   - Fall back to inline parser on YAML errors
   - **Validation**: Unit tests with both formats

8. **Update goal creation to use YAML format**
   - Modify `createGoalInteractive` in `src/utils/goal-helpers.ts`
   - Use YAML serializer for new goals
   - **Validation**: Create goal and verify file format

9. **Add auto-migration for goals**
   - Add migration logic to `getActiveGoals` and goal list operations
   - Detect inline format files
   - Migrate entire file to YAML on first read
   - Log migration events
   - **Validation**: Create legacy goal file, list goals, verify migration

10. **Update goal update operations**
    - Modify `updateGoalDeadline` to use YAML format
    - Modify `updateGoalDescription` to use YAML format
    - Modify `completeGoalEntry` to use YAML format
    - **Validation**: Update goal deadline, verify YAML format preserved

### Phase 3: Todo Management Migration

11. **Update TodoEntry interface**
    - Add JSDoc comments describing YAML format
    - Ensure interface matches YAML field structure
    - **Validation**: TypeScript compilation passes

12. **Implement YAML parser for todos**
    - Create `parseTodoEntryYaml(entry: string)` in `src/utils/storage.ts`
    - Parse YAML front matter to extract: timestamp, completed, priority, goal
    - Parse markdown body for checkbox and text
    - Handle default values (priority: 0, goal: null)
    - **Validation**: Unit tests with various todo YAML formats

13. **Implement YAML serializer for todos**
    - Create `serializeTodoEntryYaml(entry: TodoEntry)` in `src/utils/storage.ts`
    - Serialize metadata to YAML front matter
    - Omit default values for cleaner output
    - Keep checkbox in markdown body
    - **Validation**: Unit tests for serialization

14. **Update parseTodoEntry with format detection**
    - Detect YAML vs inline format
    - Route to appropriate parser
    - Fall back to inline parser on YAML errors
    - **Validation**: Unit tests with both formats

15. **Update todo creation to use YAML format**
    - Modify `createTodoInteractive` in `src/utils/todo-helpers.ts`
    - Modify todo add command in `src/commands/todo.ts`
    - Use YAML serializer for new todos
    - **Validation**: Create todo and verify file format

16. **Add auto-migration for todos**
    - Add migration logic to `getAllIncompleteTodos` and todo list operations
    - Detect inline format files
    - Migrate entire file to YAML on first read
    - Log migration events
    - **Validation**: Create legacy todo file, list todos, verify migration

17. **Update todo update operations**
    - Modify `updateTodoStatus` to use YAML format
    - Modify `updateTodoPriority` to use YAML format
    - Modify `updateTodoGoal` to use YAML format
    - Modify `updateTodoText` to use YAML format
    - **Validation**: Update todo status, verify YAML format preserved

### Phase 4: History Tracking Migration

18. **Update HistoryEntry interface**
    - Add JSDoc comments describing YAML format
    - Ensure interface matches YAML field structure
    - **Validation**: TypeScript compilation passes

19. **Implement YAML parser for history**
    - Create `parseHistoryEntryYaml(entry: string)` in `src/utils/storage.ts`
    - Parse YAML front matter to extract: timestamp, goal
    - Parse markdown body for history text
    - Handle null goal field
    - **Validation**: Unit tests with various history YAML formats

20. **Implement YAML serializer for history**
    - Create `serializeHistoryEntryYaml(entry: HistoryEntry)` in `src/utils/storage.ts`
    - Serialize metadata to YAML front matter
    - Omit null goal for cleaner output
    - **Validation**: Unit tests for serialization

21. **Update parseHistoryEntry with format detection**
    - Detect YAML vs inline format
    - Route to appropriate parser
    - Fall back to inline parser on YAML errors
    - **Validation**: Unit tests with both formats

22. **Update history logging to use YAML format**
    - Modify history log command in `src/commands/history.ts`
    - Use YAML serializer for new history entries
    - **Validation**: Log history entry and verify file format

23. **Add auto-migration for history**
    - Add migration logic to `getAllHistory` and history show operations
    - Detect inline format files
    - Migrate entire file to YAML on first read
    - Log migration events
    - **Validation**: Create legacy history file, show history, verify migration

### Phase 5: Context Management Migration

24. **Update ContextEntry interface**
    - Create or update ContextEntry interface with JSDoc
    - Include: timestamp, source, goal, content
    - **Validation**: TypeScript compilation passes

25. **Implement YAML parser for context**
    - Create `parseContextEntryYaml(entry: string)` in `src/utils/storage.ts`
    - Parse YAML front matter to extract: timestamp, source, goal
    - Parse markdown body for context content
    - Handle null goal field
    - **Validation**: Unit tests with various context YAML formats

26. **Implement YAML serializer for context**
    - Create `serializeContextEntryYaml(entry: ContextEntry)` in `src/utils/storage.ts`
    - Serialize metadata to YAML front matter
    - Properly quote file paths
    - Omit null goal for cleaner output
    - **Validation**: Unit tests for serialization

27. **Update parseContextEntry with format detection**
    - Detect YAML vs inline format
    - Route to appropriate parser
    - Fall back to inline parser on YAML errors
    - **Validation**: Unit tests with both formats

28. **Update context logging to use YAML format**
    - Modify context log command in `src/commands/context.ts`
    - Use YAML serializer for new context entries
    - **Validation**: Log context entry and verify file format

29. **Add auto-migration for context**
    - Add migration logic to context show and list operations
    - Detect inline format files
    - Migrate entire file to YAML on first read
    - Log migration events
    - **Validation**: Create legacy context file, show context, verify migration

### Phase 6: Testing and Documentation

30. **Add comprehensive unit tests**
    - Test YAML parsing for all entry types
    - Test YAML serialization for all entry types
    - Test format detection
    - Test migration logic
    - Test error handling and fallbacks
    - **Validation**: All tests pass with >90% coverage

31. **Add integration tests**
    - Test create → read → update cycles for all entry types
    - Test auto-migration scenarios
    - Test mixed format handling
    - Test file write atomicity
    - **Validation**: All integration tests pass

32. **Update documentation**
    - Update README.md with YAML format examples
    - Add migration notes to CHANGELOG.md
    - Update plugin documentation (aissist-plugin/README.md)
    - Document YAML front matter schema
    - **Validation**: Documentation review

33. **Test with real user data**
    - Create test dataset with legacy formats
    - Run all commands and verify migrations
    - Check for edge cases and data loss
    - Test performance with large files
    - **Validation**: Manual testing, no data loss

### Phase 7: Polish and Release

34. **Add migration logging**
    - Add info/warning messages for migrations
    - Include file paths and counts in logs
    - Add verbose mode for debugging
    - **Validation**: Run migration, verify logs appear

35. **Optimize performance**
    - Consider caching migrated files
    - Batch migrations when possible
    - Profile critical paths
    - **Validation**: Performance benchmarks

36. **Final validation**
    - Run full test suite
    - Test all commands with both formats
    - Verify backward compatibility
    - Check for regressions
    - **Validation**: All tests pass, manual QA complete

37. **Update plugin skill**
    - Update aissist-cli skill with YAML format knowledge
    - Add migration notes to skill documentation
    - **Validation**: Skill documentation updated

## Dependencies

- Tasks 1-3 must complete before any other phase
- Phase 2 (Goals) can be done independently
- Phase 3 (Todos) can be done independently
- Phase 4 (History) can be done independently
- Phase 5 (Context) can be done independently
- Phase 6 (Testing) requires all previous phases
- Phase 7 (Polish) requires Phase 6

## Parallel Work

These phases can be worked on in parallel after Phase 1:
- Phase 2 (Goals)
- Phase 3 (Todos)
- Phase 4 (History)
- Phase 5 (Context)

## Estimated Effort

- Phase 1: 4 hours
- Phase 2: 6 hours
- Phase 3: 6 hours
- Phase 4: 4 hours
- Phase 5: 4 hours
- Phase 6: 8 hours
- Phase 7: 4 hours

**Total**: ~36 hours (can be reduced with parallel work)
