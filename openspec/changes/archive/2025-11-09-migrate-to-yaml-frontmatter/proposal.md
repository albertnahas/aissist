# Proposal: Migrate to YAML Front Matter

## Problem Statement

Currently, metadata for goals, todos, history, and context entries is embedded inline within the markdown body using patterns like `Deadline: 2025-11-15`, `(Priority: 3)`, `(Goal: codename)`, and `**Source:** File`. This approach has several limitations:

1. **Parsing complexity**: Requires regex parsing of markdown text to extract metadata
2. **Fragility**: Format changes or user edits can break parsing
3. **Limited extensibility**: Adding new metadata fields requires updating multiple parsers
4. **Inconsistent format**: Different structures use different inline conventions
5. **Poor tool compatibility**: Most markdown tools expect metadata in YAML front matter

## Proposed Solution

Migrate all structures (goals, todos, history, context) to use YAML front matter for metadata while keeping the main content in the markdown body. This provides:

- **Structured parsing**: Use standard YAML parser instead of complex regex
- **Extensibility**: Easy to add new metadata fields
- **Consistency**: All structures follow the same pattern
- **Better tool support**: Compatible with markdown processors, editors, and static site generators
- **Backward compatibility**: Auto-migrate old format on read

## Migration Strategy

1. **Auto-migration on read**: When parsing entries, detect old inline format and automatically rewrite files to YAML format
2. **All writes use YAML**: All new entries created with YAML front matter
3. **Transparent to users**: Migration happens automatically without user intervention
4. **Preserves all data**: No data loss during migration

## Example Transformations

### Goals (Before)
```markdown
## 14:30 - complete-project-proposal

Complete the quarterly project proposal document

> Detailed description of the proposal requirements

Deadline: 2025-11-15
```

### Goals (After)
```markdown
---
timestamp: "14:30"
codename: complete-project-proposal
deadline: "2025-11-15"
description: Detailed description of the proposal requirements
---

Complete the quarterly project proposal document
```

### Todos (Before)
```markdown
## 09:15

- [ ] Review code changes (Priority: 3) (Goal: code-quality)
```

### Todos (After)
```markdown
---
timestamp: "09:15"
completed: false
priority: 3
goal: code-quality
---

- [ ] Review code changes
```

### History (Before)
```markdown
## 16:45

Completed sprint retrospective meeting

Goal: team-alignment
```

### History (After)
```markdown
---
timestamp: "16:45"
goal: team-alignment
---

Completed sprint retrospective meeting
```

### Context (Before)
```markdown
## 11:20

**Source:** File: meal-plan.txt

[content here]

Goal: healthy-eating
```

### Context (After)
```markdown
---
timestamp: "11:20"
source: "File: meal-plan.txt"
goal: healthy-eating
---

[content here]
```

## Scope

This change affects:
- **Goal management**: `goal-management` spec
- **Todo management**: `todo-management` spec
- **History tracking**: `history-tracking` spec
- **Context management**: `context-management` spec
- **Storage utilities**: `src/utils/storage.ts` parsing functions
- **All commands**: Goal, todo, history, context commands

## Benefits

1. **Maintainability**: Simpler parsing logic, easier to debug
2. **Reliability**: YAML parser handles edge cases better than regex
3. **Flexibility**: Easy to add new metadata fields without breaking changes
4. **Tool compatibility**: Works with existing markdown ecosystem
5. **User experience**: Transparent migration, no manual work needed

## Risks & Mitigations

**Risk**: Auto-migration might corrupt malformed entries
- **Mitigation**: Comprehensive testing, fallback to old parser on YAML parse errors

**Risk**: Git conflicts during migration window
- **Mitigation**: File format is deterministic, conflicts are standard markdown

**Risk**: Performance impact from file rewrites
- **Mitigation**: Only rewrite when old format detected, cache migrated entries

## Success Criteria

- All parsing functions use YAML front matter
- Auto-migration preserves 100% of existing metadata
- All tests pass with new format
- Old format entries automatically upgraded on read
- New entries created with YAML front matter only
