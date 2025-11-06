# Proposal: enable-hierarchical-config-discovery

## Summary
Enable optional hierarchical configuration discovery during initialization, allowing users to inherit read access to parent `.aissist` directories while keeping writes isolated to the current directory. This enhances the user experience for monorepos and nested project structures where users may want to recall history/goals from parent contexts without polluting them with local project data.

## Problem
Currently, when aissist is opened in a new directory (e.g., a subdirectory of a project with an existing `.aissist` folder), the system operates in complete isolation. Users cannot access history, goals, or context from parent directories even when it would be relevant to their current work. This creates a friction point for:

1. **Monorepo workflows**: Developers working on packages within a monorepo can't access organization-level goals or team history
2. **Nested projects**: Sub-projects or experiments within a larger project lose access to parent context
3. **Context switching**: Users opening Claude Code in subdirectories start with a blank slate

The current `findStoragePath()` algorithm walks upward to find the *first* `.aissist` directory, but only searches from `process.cwd()`. If the user initializes a new local storage, they completely shadow any parent configs.

## Proposed Solution
Introduce an **opt-in hierarchical configuration system** that:

1. **During initialization**: Detect all `.aissist` directories in the path hierarchy from current directory to filesystem root
2. **Prompt user**: If parent directories are found, ask "Would you like to include data from parent directories for reading?"
3. **Read hierarchy**: If accepted, configure the storage system to read from all discovered `.aissist` directories (current + ancestors)
4. **Write isolation**: All write operations remain exclusive to the current directory's `.aissist` folder
5. **Transparent merging**: Commands like `aissist goal list`, `aissist recall`, `aissist history show` transparently merge results from all configured layers

### Example Flow
```
$ cd ~/projects/monorepo/packages/api
$ aissist init

✓ Detected .aissist directories in parent paths:
  • ~/projects/monorepo/.aissist (2 levels up)
  • ~/.aissist (global)

? Would you like to include these directories for reading? (Y/n)

✓ Initialized aissist storage at: ~/projects/monorepo/packages/api/.aissist
ℹ Read access enabled for 2 parent directories
ℹ All changes will be saved to the local directory
```

### User Benefits
- **Seamless context**: Access organizational goals and history while working in subdirectories
- **Clean separation**: Local experiments don't pollute parent configs
- **Flexible workflows**: Users can work at any directory level with appropriate context
- **Opt-in design**: Power users get flexibility, newcomers get simple default behavior

## Scope
### In Scope
- Detection of `.aissist` directories in ancestor paths during initialization
- Interactive prompt for opting into hierarchical reads
- Storage configuration to support multiple read paths
- Transparent merging for read operations (goals, history, context, todos, reflections)
- Runtime configuration commands: `aissist config hierarchy enable/disable`
- Documentation and user guidance

### Out of Scope
- Write operations to parent directories (always writes to local only)
- Permission/access control for parent directories (relies on filesystem permissions)
- Automatic syncing or bidirectional data flow
- Per-directory selective exclusions (all-or-nothing hierarchy)

## Impact
### User-Facing Changes
- New optional prompt during `aissist init`
- New config field: `readPaths: string[]` in `config.json`
- Enhanced read commands that merge results from multiple directories

### Internal Changes
- Extend `storage.ts` to support multi-path reads
- Update all read operations (goals, history, context, todos, reflections) to merge results
- Ensure write operations remain isolated to local path

### Risks
- **Complexity**: Multi-path reads add complexity to query logic
- **Performance**: Reading from multiple directories may be slower (mitigated by caching)
- **Confusion**: Users might not understand why data appears from parent dirs (mitigated by clear messaging)

## Alternatives Considered
1. **Automatic hierarchy (no prompt)**: Too implicit, users might not expect parent data to appear
2. **Manual path configuration**: Too complex, requires users to know exact paths
3. **Symlink-based approach**: Platform-dependent and harder to reason about

## Dependencies
- No external dependencies
- Builds on existing `storage-system` spec
- Impacts: `claude-integration`, `semantic-recall`, `ai-planning` (all read from storage)

## Design Decisions

### Resolved Questions
1. **Selective hierarchy**: All-or-nothing approach - users enable full hierarchy or stay in sandbox mode. No per-directory exclusions (keeps UX simple).
2. **Conflict resolution**: Local always wins when codenames match (clear precedence model).
3. **Path command**: `aissist path` shows current write path by default. Use `aissist path --hierarchy` to view full read hierarchy.
4. **Runtime configuration**: YES - Support `aissist config hierarchy enable/disable` to toggle hierarchy after initialization without re-running init.

## Next Steps
1. Create spec deltas for `storage-system` and `cli-infrastructure`
2. Draft implementation tasks
3. Validate proposal with `openspec validate`
4. Seek feedback on UX approach
