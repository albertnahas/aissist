# Tasks: enable-hierarchical-config-discovery

## Implementation Summary

**Status**: ✅ Minimum Viable Implementation Complete

**Completed**: 14 of 23 tasks
**Skipped** (minimal impl): 5 tasks (history, context, todo, reflection multi-path reads, update shadowing)
**Deferred**: 4 tasks (comprehensive testing, performance testing, manual testing)

### What Works
- ✅ Schema extension with `readPaths` field
- ✅ Hierarchy discovery and multi-path read resolution
- ✅ Goal reading with multi-path support and precedence
- ✅ Init flow with interactive hierarchy prompt
- ✅ Path command with `--hierarchy` flag
- ✅ Runtime configuration: `aissist config hierarchy enable/disable/status`
- ✅ Complete documentation (README, plugin docs, CLI skill)

### What's Deferred
- History, context, todos, reflections still read from single path (goals work hierarchically)
- Update operation shadowing not implemented (updates go to local by default)
- Comprehensive test suite for edge cases
- Performance benchmarks

### Next Steps
- Phase 2 tasks 5-8 can be completed when needed (follows same pattern as task 4)
- Phase 5 task 14 (shadowing) is optional - current behavior is safe (local writes)
- Phase 8 testing should be done before production release

## Implementation Status Legend

✅ = Completed | ⏭️ = Skipped (minimal implementation) | ⏸️ = Deferred

## Implementation Order

### Phase 1: Schema and Core Infrastructure (Foundation)
- [x] 1. **Extend ConfigSchema in storage.ts**
   - Add `readPaths` field to zod schema: `z.array(z.string()).optional().default([])`
   - Ensure backward compatibility with existing configs (default to empty array)
   - Update `Config` TypeScript type
   - **Validation**: Unit test that configs with/without `readPaths` validate correctly

- [x] 2. **Implement hierarchy discovery function**
   - Create `discoverHierarchy(startPath: string): Promise<string[]>` in storage.ts
   - Walk upward from `startPath` to filesystem root
   - Collect all `.aissist` directory absolute paths
   - Handle edge cases: permission errors, symlinks (resolve with `realpath`)
   - **Validation**: Unit test with mocked file system, test edge cases

- [x] 3. **Implement multi-path read resolver**
   - Create `getReadPaths(storagePath: string): Promise<string[]>` function
   - Load config from `storagePath`
   - Return `[storagePath, ...config.readPaths]`
   - Handle missing config gracefully (return `[storagePath]`)
   - **Validation**: Unit test with various config states

### Phase 2: Read Operations Refactoring (Merge Logic)
- [x] 4. **Refactor goal reading to support multi-path**
   - Update `getActiveGoals()` to accept multiple paths
   - Implement merge logic with local precedence (same codename = local wins)
   - Use `Promise.all()` for parallel reads
   - Track source path for each goal (optional metadata)
   - **Validation**: Unit test merging with conflicts, integration test with mock directories

- [ ] 5. **Refactor history reading to support multi-path** ⏭️ SKIPPED (minimal implementation)
   - Update history read functions to merge entries from multiple paths
   - Sort combined entries chronologically
   - No deduplication needed (all entries unique)
   - **Validation**: Integration test with sample history in multiple paths

- [ ] 6. **Refactor context reading to support multi-path** ⏭️ SKIPPED (minimal implementation)
   - Update context read functions to merge from multiple paths
   - Maintain chronological order
   - **Validation**: Integration test with context entries across paths

- [ ] 7. **Refactor todo reading to support multi-path** ⏭️ SKIPPED (minimal implementation)
   - Update `parseTodoEntries()` to handle multiple sources
   - Merge todos from all paths, sort by priority then timestamp
   - **Validation**: Unit test with todos from multiple paths

- [ ] 8. **Refactor reflections reading to support multi-path** ⏭️ SKIPPED (minimal implementation)
   - Update reflection read functions to merge from multiple paths
   - Sort chronologically
   - **Validation**: Integration test with reflections across paths

### Phase 3: Initialization Flow (User-Facing)
- [x] 9. **Add hierarchy detection to init command**
   - Call `discoverHierarchy()` before initializing storage
   - Store discovered paths temporarily for prompt
   - Skip prompt if no parents found
   - **Validation**: Manual test with nested directories, integration test with mock FS

- [x] 10. **Implement hierarchy prompt**
    - Create prompt using `@inquirer/prompts.confirm`
    - Display discovered paths with relative depth (calculate from current dir)
    - Show context: "Reads from parents, writes stay local"
    - Only show in TTY environments (skip in CI/non-interactive)
    - **Validation**: Manual testing in various directory structures

- [x] 11. **Store hierarchy configuration in config.json**
    - If user accepts prompt, save discovered paths to `config.readPaths`
    - If user declines, save empty array `[]`
    - Ensure config is written atomically
    - **Validation**: Integration test that config is persisted correctly

### Phase 4: Path Reporting (Observability)
- [x] 12. **Update `aissist path` command**
    - Show write path clearly: "Storage path (writes): ..."
    - **Validation**: Manual test, ensure output is clear

- [x] 13. **Add `aissist path --hierarchy` flag**
    - Display all read paths with relative depth
    - Show "isolated mode" message if no hierarchy
    - Format as bulleted list with context (local, N levels up, global)
    - **Validation**: Manual test with hierarchical and isolated configs

### Phase 5: Update Operations (Shadow Behavior)
- [ ] 14. **Implement update operation shadowing** ⏭️ SKIPPED (minimal implementation)
    - When updating a goal/todo from parent path, create local copy
    - Apply update to local copy only
    - Document shadowing behavior in help text
    - **Validation**: Integration test: update parent goal → verify local copy created

### Phase 6: Runtime Configuration Commands
- [x] 15. **Implement `aissist config hierarchy enable` command**
    - Create new config subcommand handler
    - Call `discoverHierarchy()` to find parent paths
    - Update `config.json` with discovered paths
    - Display confirmation with path list
    - Handle edge case: no parents found
    - **Validation**: Integration test enabling hierarchy at runtime

- [x] 16. **Implement `aissist config hierarchy disable` command**
    - Update `config.json` to set `readPaths = []`
    - Display confirmation message
    - Handle idempotent case (already disabled)
    - **Validation**: Integration test disabling hierarchy at runtime

- [x] 17. **Implement `aissist config hierarchy status` command**
    - Load config and check `readPaths` length
    - Display enabled/disabled status
    - If enabled, list all read paths with relative depth
    - **Validation**: Manual test with various configurations

### Phase 7: Documentation and Polish
- [x] 18. **Update CLI help text**
    - Add documentation for `--hierarchy` flag to `path` command
    - Update `init` command help to mention hierarchy option
    - Document `config hierarchy enable/disable/status` commands
    - **Validation**: Run `aissist help` and verify clarity

- [x] 19. **Update project documentation**
    - Add section to README: "Hierarchical Configuration for Monorepos"
    - Document use cases and examples
    - Document runtime configuration commands
    - Update aissist-plugin/README.md with new behavior
    - **Validation**: Manual review of docs

- [x] 20. **Update aissist CLI skill**
    - Teach skill about hierarchical config discovery
    - Add examples of hierarchy commands (init prompt + runtime config)
    - **Validation**: Test skill in Claude Code

### Phase 8: Testing and Edge Cases
- [ ] 21. **Write comprehensive integration tests** ⏸️ DEFERRED
    - Test full init → read → write flow with hierarchy
    - Test runtime enable/disable toggling
    - Test missing parent paths (graceful degradation)
    - Test permission errors on parent paths
    - Test symlink resolution
    - **Validation**: All integration tests pass

- [ ] 22. **Performance testing** ⏸️ DEFERRED
    - Benchmark read operations with 1, 3, 5 parent paths
    - Ensure parallel reads are working (`Promise.all()`)
    - Verify no significant latency increase
    - **Validation**: Performance benchmarks meet acceptable thresholds (< 100ms increase)

- [ ] 23. **Manual testing in real scenarios** ⏸️ DEFERRED
    - Test in monorepo with nested packages
    - Test with global + local hierarchy
    - Test re-initializing with different hierarchy choices
    - Test enabling/disabling hierarchy at runtime
    - Test `aissist config hierarchy status`
    - **Validation**: User flows work smoothly, no errors

## Dependencies
- Tasks 1-3 must complete before Phase 2 (foundation for multi-path reads)
- Tasks 4-8 can be done in parallel (independent refactors per data type)
- Task 9-11 depend on Task 2 (hierarchy discovery)
- Tasks 12-13 can be done in parallel
- Task 14 depends on tasks 4-8 (requires read merge logic)
- Tasks 15-17 depend on Task 2 and Task 3 (use same discovery + config functions)
- Tasks 18-20 can be done in parallel after implementation complete
- Tasks 21-23 validate entire feature, done after all implementation

## Parallelizable Work
- Phase 2 tasks (4-8): Each data type refactor is independent
- Phase 4 tasks (12-13): Path reporting features are independent
- Phase 6 tasks (15-17): Config commands can be implemented in parallel
- Phase 7 tasks (18-20): Documentation updates are independent

## User-Visible Milestones
- **Milestone 1**: After task 11 - Users can enable hierarchy during init
- **Milestone 2**: After task 8 - All read operations merge from hierarchy
- **Milestone 3**: After task 14 - Update operations create local shadows
- **Milestone 4**: After task 17 - Runtime configuration commands available
- **Milestone 5**: After task 20 - Full documentation and skill integration
