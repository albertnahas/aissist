# Implementation Tasks: Remove Slash-Command Support

## Code Changes

### 1. Remove slash-command logic from storage initialization
- [x] **COMPLETE**

**File**: `src/utils/storage.ts:109-120`
**What**: Remove the code block that creates the `slash-commands/` directory and generates the `aissist.json` manifest
**How**:
- Delete lines 109-120 (the entire slash-command creation block including the try-catch)
- Ensure the `ensureDir()` call ends at line 108 without adding slash-command logic

**Validation**:
- Run `npm test -- src/utils/storage.test.ts` to ensure no test failures
- Manually run `aissist init` and verify no `slash-commands/` directory is created

**Depends on**: None

---

### 2. Remove slash-command tests
- [x] **COMPLETE**

**File**: `src/utils/storage.test.ts`
**What**: Remove the test case "should create slash command manifest" and the assertion for slash-commands directory in the structure test
**How**:
- Find and remove the entire test block for "should create slash command manifest" (around line 128-131)
- In the "should create directory structure" test, remove the line that asserts slash-commands directory exists (line 116)

**Validation**:
- Run `npm test -- src/utils/storage.test.ts` to verify tests pass
- Verify test count decreases by 1

**Depends on**: Task 1 (code must be removed before tests)

---

## Specification Updates

### 3. Update storage-system spec
- [x] **COMPLETE**

**File**: `openspec/specs/storage-system/spec.md:32`
**What**: Remove `slash-commands/` from the storage directory structure requirement
**How**:
- In the "Initialize storage structure" scenario, remove the line `  - slash-commands/` from the directory list

**Validation**:
- Run `openspec validate remove-slash-command-support --strict` to ensure spec consistency
- Review the spec to ensure the change is coherent with other requirements

**Depends on**: None (can be done in parallel)

---

## Documentation Updates

### 4. Update README - Remove slash-command references
- [x] **COMPLETE**

**File**: `README.md`
**What**: Remove references to Claude Code slash-command integration
**How**:
- Line 17: Remove the bullet point "**Claude Code Integration**: Optional slash command support"
- Line 354: Remove `slash-commands/` from the directory structure tree
- Review the entire file for any other mentions of "slash command" or "slash-command" and remove them

**Validation**:
- Search `README.md` for "slash" to ensure all references are removed
- Read through the document to ensure flow is maintained

**Depends on**: None (can be done in parallel)

---

### 5. Update project context
- [x] **COMPLETE**

**File**: `openspec/project.md`
**What**: Remove references to Claude Code slash-command compatibility
**How**:
- Line 61: Remove "Compatible with Claude Code slash commands" from Important Constraints section
- Line 65: Remove or update "**Claude Code**: Optional integration via slash commands" from External Dependencies section

**Validation**:
- Search `openspec/project.md` for "slash" to ensure all references are removed
- Review the constraints and dependencies sections for coherence

**Depends on**: None (can be done in parallel)

---

## Validation & Testing

### 6. Run full test suite
- [x] **COMPLETE**

**What**: Verify all tests pass after changes
**How**:
- Run `npm test --run` to execute the full test suite
- Address any failing tests
- Verify the test output shows the expected reduction in test count

**Validation**:
- All tests pass
- No unexpected test failures

**Depends on**: Tasks 1, 2

---

### 7. Manual testing of storage initialization
- [x] **COMPLETE**

**What**: Verify storage initialization behavior
**How**:
- Delete or move existing `.aissist/` test directory
- Run `aissist init` in a test location
- Verify the created structure does NOT include `slash-commands/` directory
- Verify all other directories are created correctly (goals, history, context, reflections, config.json)

**Validation**:
- Storage structure is correct without slash-commands directory
- All core functionality works as expected

**Depends on**: Tasks 1, 2, 6

---

### 8. Final validation with OpenSpec
- [x] **COMPLETE**

**What**: Validate the entire change proposal
**How**:
- Run `openspec validate remove-slash-command-support --strict`
- Resolve any validation errors
- Ensure all specs are consistent

**Validation**:
- No validation errors
- Proposal is ready for implementation

**Depends on**: Tasks 3

---

## Summary
- **Total Tasks**: 8
- **Parallel Work**: Tasks 1, 3, 4, 5 can be done in parallel
- **Critical Path**: Task 1 → Task 2 → Task 6 → Task 7
- **Estimated Effort**: Small (~1-2 hours)
