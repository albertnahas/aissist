# Design: enable-hierarchical-config-discovery

## Architecture Overview

### System Components
```
┌─────────────────────────────────────────────────────┐
│                 CLI Commands Layer                   │
│  (goal list, history show, recall, etc.)            │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│            Storage Abstraction Layer                 │
│  • getStoragePath() → returns write path            │
│  • getReadPaths() → returns [local, ...parents]     │
│  • mergeResults() → combines multi-path reads       │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               File System Layer                      │
│  ~/proj/monorepo/.aissist/                          │
│  ~/proj/monorepo/pkg-a/.aissist/  ← write here     │
│  ~/proj/monorepo/pkg-a/api/.aissist/               │
└─────────────────────────────────────────────────────┘
```

### Data Flow

#### Write Operations (Unchanged)
```
User Command → Resolve Write Path → Write to Local .aissist/
```

#### Read Operations (New Behavior)
```
User Command → Resolve Read Paths → [local, parent1, parent2, ...]
             ↓
        Read from all paths in order
             ↓
        Merge results (local takes precedence)
             ↓
        Return unified result
```

## Key Design Decisions

### 1. Hierarchy Detection Algorithm
**Approach**: Walk upward from current directory during `init`, collecting all `.aissist` paths

```typescript
async function discoverHierarchy(startPath: string): Promise<string[]> {
  const discovered: string[] = [];
  let currentPath = startPath;

  while (true) {
    const aissistPath = join(currentPath, '.aissist');
    try {
      await access(aissistPath);
      discovered.push(aissistPath);
    } catch {
      // Not found, continue
    }

    const parentPath = dirname(currentPath);
    if (parentPath === currentPath) break; // Reached root
    currentPath = parentPath;
  }

  return discovered;
}
```

**Trade-off**: Linear time complexity O(depth), but typically shallow hierarchies (< 10 levels)

### 2. Configuration Storage
**Approach**: Extend `config.json` schema with optional `readPaths` field

```typescript
export const ConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  createdAt: z.string(),
  lastModified: z.string(),
  animations: z.object({
    enabled: z.boolean().default(true),
  }).default({ enabled: true }),
  // NEW FIELD
  readPaths: z.array(z.string()).optional().default([]),
});
```

**Trade-off**: Stores absolute paths, which may break if directories move. Alternative: store relative offsets (e.g., "../../.aissist")

**Decision**: Use absolute paths for simplicity, accept that moving directories requires re-init

### 3. Merge Strategy for Conflicting Data
**Problem**: What if parent and local both have a goal with codename "launch-v2"?

**Approach**: Local takes precedence, with clear precedence rules:
1. **Goals**: Local goals shadow parent goals with same codename
2. **History**: All entries merged chronologically (no conflicts)
3. **Context**: All entries merged chronologically (no conflicts)
4. **Todos**: All entries merged, sorted by priority
5. **Reflections**: All entries merged chronologically

**Implementation**:
```typescript
async function mergeGoals(paths: string[]): Promise<ActiveGoal[]> {
  const allGoals: ActiveGoal[] = [];
  const seenCodenames = new Set<string>();

  // Process paths in reverse order (local first, then parents)
  for (const path of paths) {
    const goals = await getGoalsFromPath(path);

    for (const goal of goals) {
      if (!seenCodenames.has(goal.codename)) {
        allGoals.push({ ...goal, source: path }); // Track source
        seenCodenames.add(goal.codename);
      }
    }
  }

  return allGoals;
}
```

### 4. User Prompt UX
**Approach**: Show discovered paths with context (levels up, global indicator)

```
? Would you like to include parent directories for reading?
  ℹ This allows you to see goals, history, and context from parent projects

  Discovered paths:
    • ~/projects/monorepo/.aissist (2 levels up)
    • ~/.aissist (global)

  Changes will always be saved to: ~/projects/monorepo/packages/api/.aissist

  › Yes (recommended for monorepos)
    No (start fresh)
```

**Trade-off**: More verbose than simple Y/N, but reduces confusion

### 5. Performance Optimization
**Problem**: Reading from multiple directories could slow down commands

**Approach**:
- Lazy loading (only read when needed)
- Cache read results within command execution
- Parallel file reads using `Promise.all()`

```typescript
async function getActiveGoals(storagePath: string): Promise<ActiveGoal[]> {
  const config = await loadConfig(storagePath);
  const readPaths = [storagePath, ...(config.readPaths || [])];

  // Parallel reads
  const goalArrays = await Promise.all(
    readPaths.map(path => getGoalsFromPath(path))
  );

  // Merge with precedence
  return mergeGoals(goalArrays);
}
```

## Edge Cases

### Case 1: Parent Directory Removed
**Scenario**: User configures hierarchy, then parent `.aissist` is deleted

**Handling**: Skip missing paths gracefully, log warning
```typescript
for (const path of readPaths) {
  try {
    await access(path);
    // Read from path
  } catch {
    warn(`Configured read path not found: ${path} (skipping)`);
  }
}
```

### Case 2: Circular Symlinks
**Scenario**: `.aissist` directories linked in a cycle

**Handling**: Resolve real paths using `fs.realpath()`, deduplicate by real path

### Case 3: Permission Denied on Parent
**Scenario**: User has read access to current dir but not parent

**Handling**: Catch permission errors, skip that path, continue with others

### Case 4: Nested Hierarchies (Deep Trees)
**Scenario**: 10+ levels of `.aissist` directories

**Handling**: No limit on depth (rare in practice), but prompt may be overwhelming if showing all

**Mitigation**: Only show "nearby" paths (e.g., within 5 levels) and global in prompt

## Testing Strategy

### Unit Tests
- `discoverHierarchy()` with mocked file system
- `mergeGoals()` with conflicting codenames
- Config schema validation with/without `readPaths`

### Integration Tests
- Init flow with parent directories
- Read operations merging results
- Write operations isolated to local

### Manual Testing
- Monorepo scenario (packages)
- Global + local hierarchy
- Edge cases (missing paths, permissions)

## Migration Path

### For Existing Users
- No breaking changes (opt-in during init)
- Existing configs without `readPaths` continue to work
- `readPaths` defaults to `[]` (backward compatible)

### For New Users
- Prompted during first `aissist init`
- Can decline and get current behavior
- Can re-run init to reconfigure

## Runtime Configuration Design

### Commands
```bash
aissist config hierarchy enable    # Discover and enable parent paths
aissist config hierarchy disable   # Switch to sandbox mode
aissist config hierarchy status    # Show current configuration
```

### Enable Flow
```typescript
async function enableHierarchy() {
  const storagePath = await getStoragePath();
  const parents = await discoverHierarchy(dirname(storagePath));

  if (parents.length === 0) {
    info('No parent directories found. Hierarchy remains disabled.');
    return;
  }

  const config = await loadConfig(storagePath);
  config.readPaths = parents;
  await saveConfig(storagePath, config);

  success(`Hierarchical read access enabled (${parents.length} parent paths)`);
  parents.forEach(p => info(`  • ${p}`));
}
```

### Disable Flow
```typescript
async function disableHierarchy() {
  const storagePath = await getStoragePath();
  const config = await loadConfig(storagePath);

  if (config.readPaths?.length === 0) {
    info('Hierarchical read access already disabled');
    return;
  }

  config.readPaths = [];
  await saveConfig(storagePath, config);

  success('Hierarchical read access disabled (sandbox mode)');
}
```

## Future Enhancements

1. **Selective inheritance**: Choose which data types to inherit (goals only, not history)
2. **Visual indicators**: Show source path in output (e.g., `(from: monorepo)`)
3. **Conflict resolution**: Interactive prompt when codename conflicts detected
4. **Manual path management**: `aissist config hierarchy add <path>` to add specific paths
