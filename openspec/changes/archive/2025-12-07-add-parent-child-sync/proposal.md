## Why

The hierarchical storage system currently supports one-way read access: child instances can read from parent `.aissist` directories. However, there's no mechanism for bidirectional communication—children cannot notify parents of progress, and parents cannot aggregate child status. This limits the usefulness of nested goal hierarchies (similar to "Gold's tree" where parent goals contain child goals).

## What Changes

- **ADDED**: Progress sync file format (`progress.json`) in each `.aissist` directory
- **ADDED**: Child instances automatically write progress summaries when goals are completed/updated
- **ADDED**: Parent instances can aggregate progress from child directories via `aissist sync` command
- **ADDED**: Optional `parent_goal` field in goal metadata to link child goals to parent goals
- **ADDED**: Progress aggregation view showing parent goal with child contributions

## Design Philosophy: Simplest Scalable Solution

**File-based sync over network protocols**: Using plain JSON files that are already Git-compatible, human-readable, and require no additional infrastructure.

**Pull-based aggregation over push notifications**: Parents poll child progress files rather than children pushing updates. This is simpler, more reliable, and works offline.

**Opt-in linking over automatic detection**: Child goals explicitly reference parent goals by codename, avoiding complex tree-walking or magic inference.

## Impact

- Affected specs: `hierarchical-storage`, `goal-management`
- Affected code: `src/utils/storage.ts`, `src/commands/goal.ts`, new `src/commands/sync.ts`
- No breaking changes to existing functionality
- All new features are additive and opt-in
