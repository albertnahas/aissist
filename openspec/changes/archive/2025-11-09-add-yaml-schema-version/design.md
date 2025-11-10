# Design: Schema Version in YAML Front Matter

## Overview

Add `schema_version` field to YAML front matter for all entry types to enable format evolution and explicit version tracking.

## Architecture

### Version Format

- **Type**: String (semantic version)
- **Current Version**: `"1.0"`
- **Format**: `"MAJOR.MINOR"` (e.g., "1.0", "1.1", "2.0")
- **Location**: First field in YAML front matter (for visibility)

### Version Semantics

- **Major version** (X.0): Breaking changes, incompatible format
- **Minor version** (1.X): Backward-compatible additions

Examples:
- `1.0` → `1.1`: New optional field added (backward compatible)
- `1.1` → `2.0`: Field renamed or removed (breaking change)

## Implementation Strategy

### 1. Serialization Updates

Update all serializers to include `schema_version` as the first field:

```typescript
export function serializeGoalEntryYaml(goal: GoalEntry): string {
  const metadata: Record<string, unknown> = {
    schema_version: "1.0",  // First field
    timestamp: goal.timestamp,
    // ... rest of metadata
  };

  return serializeYamlFrontMatter(metadata, goal.text);
}
```

**Affected functions:**
- `serializeGoalEntryYaml()` - src/utils/storage.ts
- `serializeTodoEntryYaml()` - src/utils/storage.ts
- `serializeHistoryItemEntryYaml()` - src/utils/storage.ts
- `serializeContextItemEntryYaml()` - src/utils/storage.ts

### 2. Parsing Updates

Update parsers to extract and validate `schema_version`:

```typescript
export function parseGoalEntryYaml(entry: string): GoalEntry | null {
  const parsed = parseYamlFrontMatter(entry);
  if (!parsed) return null;

  const [metadata, body] = parsed;

  // Extract schema version (default to "1.0" for backward compat)
  const schemaVersion = (metadata.schema_version as string) || "1.0";

  // Validate known versions
  if (!isKnownSchemaVersion(schemaVersion)) {
    console.warn(`Unknown schema version: ${schemaVersion}, treating as 1.0`);
  }

  // Version-specific parsing logic
  if (schemaVersion === "1.0") {
    return parseGoalEntryV1_0(metadata, body, entry);
  }

  // Fallback to v1.0 parser for unknown versions
  return parseGoalEntryV1_0(metadata, body, entry);
}
```

**Affected functions:**
- `parseGoalEntryYaml()` - src/utils/storage.ts
- `parseTodoEntryYaml()` - src/utils/storage.ts
- `parseHistoryItemEntryYaml()` - src/utils/storage.ts
- `parseContextItemEntryYaml()` - src/utils/storage.ts

### 3. Version Validation Helper

Create a shared validation utility:

```typescript
// src/utils/yaml-helpers.ts

const KNOWN_SCHEMA_VERSIONS = ["1.0"];

export function isKnownSchemaVersion(version: string): boolean {
  return KNOWN_SCHEMA_VERSIONS.includes(version);
}

export function normalizeSchemaVersion(version: string | undefined): string {
  if (!version) return "1.0"; // Default for backward compatibility

  if (isKnownSchemaVersion(version)) {
    return version;
  }

  console.warn(`Unknown schema version ${version}, falling back to 1.0`);
  return "1.0";
}
```

### 4. Migration Updates

Update auto-migration to add `schema_version`:

```typescript
// In getGoalsFromPath, getAllIncompleteTodos, etc.
if (needsMigration(content)) {
  try {
    const inlineEntries = parseGoalEntries(content);
    const yamlEntries = inlineEntries.map(serializeGoalEntryYaml); // Already includes schema_version
    const migratedContent = yamlEntries.join('\n\n');
    await writeFileAtomic(filePath, migratedContent);
    content = migratedContent;
  } catch (error) {
    console.warn(`Failed to migrate ${filePath}:`, error);
  }
}
```

## Backward Compatibility

### Parsing Priority

1. **YAML with `schema_version`**: Use specified version
2. **YAML without `schema_version`**: Default to "1.0"
3. **Inline format**: Parse as legacy, migrate to v1.0 with schema_version

### Migration Behavior

| File State | Behavior |
|------------|----------|
| Inline format | Migrate to YAML v1.0 with `schema_version: "1.0"` |
| YAML without version | Treat as v1.0, add version on next write |
| YAML with version | Use specified version |
| Unknown version | Warn, treat as v1.0 |

## Example Formats

### Goals

```yaml
---
schema_version: "1.0"
timestamp: "14:30"
codename: complete-project-proposal
deadline: "2025-11-15"
description: Detailed description of the proposal requirements
---

Complete the quarterly project proposal document
```

### Todos

```yaml
---
schema_version: "1.0"
timestamp: "09:15"
completed: false
priority: 3
goal: code-quality
---

- [ ] Review code changes
```

### History

```yaml
---
schema_version: "1.0"
timestamp: "16:45"
goal: team-alignment
---

Completed sprint retrospective meeting
```

### Context

```yaml
---
schema_version: "1.0"
timestamp: "11:20"
source: "File: meal-plan.txt"
goal: healthy-eating
---

[content here]
```

## Future Evolution Example

When we need to add a new field or change format in the future:

### Scenario: Add "tags" field (v1.1)

```yaml
---
schema_version: "1.1"
timestamp: "14:30"
codename: complete-project-proposal
deadline: "2025-11-15"
description: Detailed description
tags: ["work", "urgent"]  # New optional field in v1.1
---

Complete the quarterly project proposal document
```

Parser handles both:
- v1.0 files: No tags field, works as before
- v1.1 files: Tags field parsed and used

## Testing Strategy

1. **Unit tests**: Verify schema_version parsing and serialization
2. **Backward compat tests**: Verify files without schema_version work
3. **Migration tests**: Verify auto-migration adds schema_version
4. **Unknown version tests**: Verify warnings for unknown versions
5. **Integration tests**: End-to-end with schema versioning

## Performance Impact

- **Negligible**: One additional field per entry
- **Memory**: ~15 bytes per entry
- **Parsing**: Single field read, no performance impact
- **Serialization**: Single field write, no performance impact

## Rollout Plan

1. **Phase 1**: Add schema_version to serializers (all new entries get it)
2. **Phase 2**: Update parsers to read and default schema_version
3. **Phase 3**: Update auto-migration to add schema_version
4. **Phase 4**: Test and validate
5. **Phase 5**: Deploy

All phases maintain backward compatibility.
