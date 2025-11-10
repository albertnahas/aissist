# Design: YAML Front Matter Migration

## Architecture Overview

This change introduces a standardized YAML front matter format for all entry types while maintaining backward compatibility through auto-migration.

## Key Design Decisions

### 1. YAML Front Matter Structure

Each entry type will have a consistent YAML front matter block followed by markdown content:

```yaml
---
# Metadata fields specific to entry type
---

# Markdown content
```

### 2. Parser Architecture

```
┌─────────────────────┐
│ Parse Entry Request │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Detect Format      │
│  (YAML vs inline)   │
└──────────┬──────────┘
           │
           ├─── Has YAML? ──► Parse YAML Front Matter ──┐
           │                                              │
           └─── No YAML? ──► Parse Inline Format ────┐   │
                                                      │   │
                                            ┌─────────▼───▼────────┐
                                            │  Auto-Migrate File   │
                                            │  (if inline detected) │
                                            └──────────┬───────────┘
                                                       │
                                                       ▼
                                            ┌──────────────────────┐
                                            │  Return Parsed Entry │
                                            └──────────────────────┘
```

### 3. Metadata Field Mapping

#### Goals
| Old Format | YAML Field | Type | Notes |
|------------|------------|------|-------|
| `## HH:MM - codename` | `timestamp`, `codename` | string | Split from header |
| `> Description lines` | `description` | string \| null | Blockquote to field |
| `Deadline: YYYY-MM-DD` | `deadline` | string \| null | ISO date string |

#### Todos
| Old Format | YAML Field | Type | Notes |
|------------|------------|------|-------|
| `## HH:MM` | `timestamp` | string | From header |
| `- [x]` or `- [ ]` | `completed` | boolean | Checkbox state |
| `(Priority: N)` | `priority` | number | Integer, default 0 |
| `(Goal: codename)` | `goal` | string \| null | Goal codename |

#### History
| Old Format | YAML Field | Type | Notes |
|------------|------------|------|-------|
| `## HH:MM` | `timestamp` | string | From header |
| `Goal: codename` | `goal` | string \| null | Goal codename |

#### Context
| Old Format | YAML Field | Type | Notes |
|------------|------------|------|-------|
| `## HH:MM` | `timestamp` | string | From header |
| `**Source:** ...` | `source` | string | Source description |
| `Goal: codename` | `goal` | string \| null | Goal codename |

### 4. Auto-Migration Strategy

**When to migrate**:
- On any read operation that parses entries
- Triggered by: list, show, complete, edit, remove operations
- NOT triggered by: append-only operations (to avoid unnecessary reads)

**How to migrate**:
1. Parse using old inline format parser
2. Convert to structured entry object
3. Serialize to YAML front matter format
4. Rewrite entire file with all entries in new format
5. Preserve entry order and file structure

**Migration safety**:
- Only migrate complete, parseable entries
- Log warnings for unparseable entries (keep as-is)
- Atomic file writes (write to temp, then rename)
- Preserve original file permissions

### 5. YAML Library Choice

Use `js-yaml` for parsing and serialization:
- Well-maintained, widely used
- Handles edge cases (multiline strings, special chars)
- Good error reporting
- TypeScript support

### 6. Entry Serialization Format

**Common patterns**:
```typescript
interface BaseEntry {
  timestamp: string; // HH:MM format
}

interface GoalEntry extends BaseEntry {
  codename: string;
  deadline: string | null;
  description: string | null;
}

interface TodoEntry extends BaseEntry {
  completed: boolean;
  priority: number;
  goal: string | null;
}

interface HistoryEntry extends BaseEntry {
  goal: string | null;
}

interface ContextEntry extends BaseEntry {
  source: string;
  goal: string | null;
}
```

**Serialization rules**:
- Omit null values (cleaner YAML)
- Use explicit string quotes for timestamps
- Use boolean literals for completed
- Use integers for priority
- Multiline content uses `|` indicator

### 7. File Structure

**Before** (inline format):
```markdown
## 09:00 - goal-1

Goal text

Deadline: 2025-11-15

## 10:00 - goal-2

Another goal
```

**After** (YAML format):
```markdown
---
timestamp: "09:00"
codename: goal-1
deadline: "2025-11-15"
---

Goal text

---
timestamp: "10:00"
codename: goal-2
---

Another goal
```

### 8. Error Handling

**YAML parse errors**:
- Fall back to inline format parser
- Log warning about malformed YAML
- Continue with old format (no migration)

**Inline parse errors**:
- Return null for unparseable entries
- Skip during migration
- Log warning for user awareness

**File write errors**:
- Keep original file intact
- Throw error, don't silent fail
- Provide clear error message

### 9. Performance Considerations

**Lazy migration**:
- Only migrate files when read
- Don't pre-migrate entire storage on startup

**Batch migration**:
- When reading a file, migrate all entries in that file
- Avoid partial migrations (all-or-nothing per file)

**Caching**:
- Consider marking files as "migrated" to avoid re-checking
- Use file modification time as migration indicator

### 10. Testing Strategy

**Unit tests**:
- Parser for each entry type (YAML format)
- Serializer for each entry type
- Migration function for each entry type
- Edge cases: empty fields, special characters, multiline

**Integration tests**:
- Read old format, verify auto-migration
- Create new entries in YAML format
- Mixed operations (read old, write new)
- File corruption scenarios

**Migration tests**:
- Full file migration (multiple entries)
- Partial migration (some entries fail)
- Idempotent migration (migrate twice = same result)

## Implementation Phases

### Phase 1: YAML Parsers
- Add `js-yaml` dependency
- Implement YAML parsers for each entry type
- Keep inline parsers as fallback
- Add detection logic (YAML vs inline)

### Phase 2: YAML Serializers
- Implement YAML serializers for each entry type
- Update write functions to use YAML format
- Ensure all new entries use YAML

### Phase 3: Auto-Migration
- Implement file rewrite logic
- Add migration on read for each command
- Test migration with real data
- Add logging and error handling

### Phase 4: Deprecate Inline Format
- Remove inline format parsers (keep for reference)
- Update documentation
- Add migration notes to changelog

## Rollback Plan

If critical issues are discovered:
1. Revert parser changes
2. Keep YAML parsing as optional
3. Make inline format the default again
4. Fix issues with YAML implementation
5. Re-deploy when stable

## Open Questions

None - all decisions finalized based on user input.
