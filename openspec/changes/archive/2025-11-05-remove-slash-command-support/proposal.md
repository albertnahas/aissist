# Proposal: Remove Slash-Command Support

## Overview
Remove all slash-command related functionality from aissist. This includes removing the slash-commands directory creation during initialization, removing slash-command manifest generation, and cleaning up related documentation. This will be reworked later with a different approach.

## Why
The current slash-command integration needs to be redesigned. Rather than maintaining deprecated or incomplete functionality, we should remove it cleanly to avoid confusion and reduce maintenance burden until a better solution is implemented.

Specific reasons for removal:
1. **Incomplete Implementation**: The slash-command feature creates a manifest file but doesn't provide clear value to users in its current form
2. **Maintenance Burden**: Keeping unused code increases complexity and testing overhead
3. **Future Redesign**: The feature needs rethinking before it can provide real value
4. **Clean Slate**: Removing it now allows us to redesign from scratch without backward compatibility constraints

## Motivation
The slash-command functionality was initially added for Claude Code integration, but the implementation is minimal and not fully utilized. By removing it now, we eliminate technical debt and create space for a better-designed solution in the future.

## Current State
The codebase currently includes:
1. **Storage Layer** (`src/utils/storage.ts:109-120`): Creates `slash-commands/` directory and generates `aissist.json` manifest during initialization
2. **Spec** (`openspec/specs/storage-system/spec.md:32`): Documents `slash-commands/` as part of storage structure
3. **Tests** (`src/utils/storage.test.ts`): Tests for slash-command manifest creation
4. **Documentation** (`README.md`): References to Claude Code slash command support and integration
5. **Project Context** (`openspec/project.md:61,65`): Mentions compatibility with Claude Code slash commands
6. **Existing Directories**: User's global storage (`~/.aissist/slash-commands/`) may contain the generated manifest

## Proposed Changes

### Code Changes
- **`src/utils/storage.ts`**: Remove slash-command directory creation and manifest generation logic (lines 109-120)
- **`src/utils/storage.test.ts`**: Remove tests related to slash-command functionality
- **`openspec/specs/storage-system/spec.md`**: Remove `slash-commands/` from storage structure requirement

### Documentation Changes
- **`README.md`**: Remove references to slash-command support and Claude Code integration mentions that specifically relate to slash commands
- **`openspec/project.md`**: Remove mention of Claude Code slash command compatibility

### No User Data Migration
- Existing `slash-commands/` directories in user storage will be left in place but no longer maintained
- No migration script needed as the data is minimal and non-critical

## Impact Analysis

### Breaking Changes
- Users with existing `.aissist/slash-commands/` directories will no longer see them maintained
- Any external tools depending on the `aissist.json` manifest will stop receiving updates

### Non-Breaking
- Core functionality (goals, history, context, reflections, recall, propose) remains unchanged
- Storage path resolution and configuration management unaffected

### Risk Assessment
**Low Risk**: Slash-command functionality appears to be an optional integration feature that is not central to the core assistant capabilities. Removing it will not impact the primary user workflows.

## Testing Strategy
- Verify storage initialization no longer creates `slash-commands/` directory
- Confirm all existing tests pass after removal of slash-command tests
- Manual testing: Run `aissist init` and verify directory structure
- Manual testing: Run all core commands to ensure no regressions

## Alternatives Considered
1. **Keep as deprecated feature**: Rejected because it adds maintenance burden without clear benefit
2. **Improve current implementation**: Deferred until requirements for slash-command integration are clarified

## Implementation Notes
- This is a pure removal change with no new functionality
- All changes should be atomic and easily reversible
- Consider adding a comment in code indicating this feature was removed for future redesign

## Success Criteria
- [ ] All slash-command related code removed from source
- [ ] All slash-command tests removed or updated
- [ ] Documentation updated to remove slash-command references
- [ ] Storage initialization no longer creates slash-commands directory
- [ ] All existing tests pass
- [ ] Manual testing confirms no regression in core features
