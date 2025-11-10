# Tasks: Add Schema Version to YAML Front Matter

## Phase 1: Core Utilities (Tasks 1-3)

### Task 1: ✅ Add schema version constants and validation ✅
**Estimate**: 15 minutes

Add schema version utilities to `src/utils/yaml-helpers.ts`:
- Define `KNOWN_SCHEMA_VERSIONS` constant with `["1.0"]`
- Implement `isKnownSchemaVersion(version: string): boolean`
- Implement `normalizeSchemaVersion(version?: string): string`
- Add JSDoc comments explaining version format

**Validation**:
- TypeScript compilation passes
- Unit tests for validation helpers

---

### Task 2: ✅ Update Goal serialization
**Estimate**: 10 minutes

Update `serializeGoalEntryYaml()` in `src/utils/storage.ts`:
- Add `schema_version: "1.0"` as first field in metadata
- Ensure it appears before other fields

**Validation**:
- Create new goal and verify `schema_version` in file
- Check field order (schema_version first)

---

### Task 3: ✅ Update Goal parsing
**Estimate**: 15 minutes

Update `parseGoalEntryYaml()` in `src/utils/storage.ts`:
- Extract `schema_version` from metadata
- Call `normalizeSchemaVersion()` with extracted value
- Log warning if unknown version detected
- Continue parsing with normalized version

**Validation**:
- Parse goal with schema_version works
- Parse goal without schema_version defaults to "1.0"
- Unknown version logs warning

---

## Phase 2: Todo Entry Types (Tasks 4-5)

### Task 4: ✅ Update Todo serialization
**Estimate**: 10 minutes

Update `serializeTodoEntryYaml()` in `src/utils/storage.ts`:
- Add `schema_version: "1.0"` as first field

**Validation**:
- Create new todo and verify `schema_version` in file

---

### Task 5: ✅ Update Todo parsing
**Estimate**: 15 minutes

Update `parseTodoEntryYaml()` in `src/utils/storage.ts`:
- Extract and normalize `schema_version`
- Log warning if unknown version

**Validation**:
- Parse todo with/without schema_version
- Unknown version warning works

---

## Phase 3: History Entry Types (Tasks 6-7)

### Task 6: ✅ Update History serialization
**Estimate**: 10 minutes

Update `serializeHistoryItemEntryYaml()` in `src/utils/storage.ts`:
- Add `schema_version: "1.0"` as first field

**Validation**:
- Create new history entry and verify `schema_version`

---

### Task 7: ✅ Update History parsing
**Estimate**: 15 minutes

Update `parseHistoryItemEntryYaml()` in `src/utils/storage.ts`:
- Extract and normalize `schema_version`
- Log warning if unknown version

**Validation**:
- Parse history with/without schema_version
- Unknown version warning works

---

## Phase 4: Context Entry Types (Tasks 8-9)

### Task 8: ✅ Update Context serialization
**Estimate**: 10 minutes

Update `serializeContextItemEntryYaml()` in `src/utils/storage.ts`:
- Add `schema_version: "1.0"` as first field

**Validation**:
- Create new context entry and verify `schema_version`

---

### Task 9: ✅ Update Context parsing
**Estimate**: 15 minutes

Update `parseContextItemEntryYaml()` in `src/utils/storage.ts`:
- Extract and normalize `schema_version`
- Log warning if unknown version

**Validation**:
- Parse context with/without schema_version
- Unknown version warning works

---

## Phase 5: Migration Updates (Task 10)

### Task 10: ✅ Verify auto-migration includes schema_version
**Estimate**: 15 minutes

Verify that auto-migration in:
- `getGoalsFromPath()` - src/utils/storage.ts
- `getAllIncompleteTodos()` - src/utils/storage.ts
- `getAllHistory()` - src/utils/storage.ts
- `searchDirectory()` - src/utils/search.ts

Already uses updated serializers, so migrated files will include `schema_version`.

**Validation**:
- Create old inline format file
- Trigger migration (list/show command)
- Verify migrated file has `schema_version: "1.0"`

---

## Phase 6: Testing (Tasks 11-14)

### Task 11: ✅ Test all entry types with schema_version
**Estimate**: 20 minutes

Test create operations:
- Create goal with schema_version
- Create todo with schema_version
- Create history with schema_version
- Create context with schema_version

**Validation**:
- All files have `schema_version: "1.0"` as first field
- Files parse correctly
- Entries display properly

---

### Task 12: ✅ Test backward compatibility
**Estimate**: 20 minutes

Test parsing without schema_version:
- Create YAML entries without schema_version
- Verify they parse with default "1.0"
- Verify no errors or warnings

**Validation**:
- Files without schema_version work
- Default to "1.0" silently

---

### Task 13: ✅ Test unknown version warning
**Estimate**: 15 minutes

Test unknown version handling:
- Manually create entry with `schema_version: "9.9"`
- Parse the entry
- Verify warning is logged
- Verify entry still works (treated as 1.0)

**Validation**:
- Warning logged to console
- Entry parses successfully
- No crashes

---

### Task 14: ✅ Test migration adds schema_version
**Estimate**: 20 minutes

Test auto-migration:
- Create inline format entries (all types)
- Trigger migration (list commands)
- Verify all migrated files have `schema_version: "1.0"`

**Validation**:
- Goals migration adds schema_version
- Todos migration adds schema_version
- History migration adds schema_version
- Context migration adds schema_version

---

## Phase 7: Documentation (Tasks 15-16)

### Task 15: ✅ Update CHANGELOG
**Estimate**: 10 minutes

Add entry to CHANGELOG.md:
- Note addition of schema_version to YAML front matter
- Explain backward compatibility
- Mention this enables future format evolution

**Validation**:
- CHANGELOG entry added
- Format follows existing entries

---

### Task 16: ✅ Update implementation docs
**Estimate**: 10 minutes

Update documentation:
- Update COMPLETE.md or similar with schema_version info
- Add examples showing schema_version field

**Validation**:
- Documentation updated
- Examples include schema_version

---

## Summary

**Total Tasks**: 16
**Estimated Time**: 3.5 hours
**Phases**: 7

**Dependencies**:
- Phase 1 must complete before Phase 2-4
- Phases 2-4 can run in parallel
- Phase 5-6 depend on Phase 2-4 completion
- Phase 7 can run after Phase 6

**Critical Path**: Phase 1 → Phase 2-4 (parallel) → Phase 5 → Phase 6 → Phase 7
