# Proposal: Add Schema Version to YAML Front Matter

## Why

Currently, YAML front matter entries don't include a schema version field. This creates challenges for:

1. **Future Evolution**: No way to track format changes or introduce breaking updates safely
2. **Migration Detection**: Cannot distinguish between different versions of the YAML format
3. **Backward Compatibility**: Difficult to support multiple format versions simultaneously
4. **Debugging**: No clear indication of what format version a file uses

Adding a `schema_version` field enables:
- Gradual format evolution with clear version boundaries
- Explicit migration paths between versions
- Better error messages when encountering unexpected formats
- Future-proof architecture for format improvements

## What Changes

Add a `schema_version: "1.0"` field to YAML front matter for all entry types (goals, todos, history, context).

### Current Format (v1.0 implicit)
```markdown
---
timestamp: "20:08"
codename: yaml-migration-test
deadline: "2025-11-15"
description: This is a test description
---

Test YAML goal migration
```

### New Format (v1.0 explicit)
```markdown
---
schema_version: "1.0"
timestamp: "20:08"
codename: yaml-migration-test
deadline: "2025-11-15"
description: This is a test description
---

Test YAML goal migration
```

## Scope

### Affected Components

1. **Serialization** (`src/utils/storage.ts`)
   - Update all `serialize*Yaml()` functions to include `schema_version`
   - Goals, Todos, History, Context serializers

2. **Parsing** (`src/utils/storage.ts`)
   - Update all `parse*Yaml()` functions to read and validate `schema_version`
   - Default to "1.0" if missing (backward compatibility)
   - Validate known versions, warn on unknown versions

3. **Migration** (`src/utils/migration.ts`)
   - Update auto-migration to add `schema_version: "1.0"` to migrated files
   - Preserve existing schema_version if present

4. **Specs**
   - `goal-management`: Add schema_version requirement
   - `todo-management`: Add schema_version requirement
   - `history-tracking`: Add schema_version requirement
   - `context-management`: Add schema_version requirement

## Benefits

1. **Future-Proof**: Clear path for format evolution
2. **Explicit Versions**: No ambiguity about format expectations
3. **Better Errors**: Can provide version-specific error messages
4. **Migration Safety**: Can detect and handle version-specific migrations
5. **Documentation**: Schema version serves as inline documentation

## Backward Compatibility

- **Existing files without `schema_version`**: Treated as v1.0
- **Parsing**: Falls back to v1.0 if field is missing
- **No breaking changes**: All existing files continue to work
- **Gradual adoption**: New entries get schema_version, old entries migrate on read

## Risks & Mitigations

**Risk**: Extra field adds slight overhead
**Mitigation**: Minimal - one field per entry, negligible impact

**Risk**: Users might manually edit schema_version incorrectly
**Mitigation**: Parser validates and warns on unknown versions

**Risk**: Confusion about what schema_version means
**Mitigation**: Clear documentation and comments in code

## Success Criteria

- All new entries include `schema_version: "1.0"`
- Parsers correctly handle missing schema_version (default to "1.0")
- Parsers warn on unknown schema versions
- Auto-migration adds schema_version to legacy files
- All tests pass with schema versioning
- Documentation updated

## Related Changes

- Builds on: `2025-11-09-migrate-to-yaml-frontmatter` (YAML front matter migration)
- Enables future: Format evolution and versioned migrations
