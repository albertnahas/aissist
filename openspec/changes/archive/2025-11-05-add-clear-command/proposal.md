# Proposal: Add Clear Command

**Change ID:** add-clear-command
**Status:** Draft
**Created:** 2025-11-05

## Why

Users need a safe, built-in way to clear their `.aissist/` storage data when starting fresh in a new context, removing outdated information, or troubleshooting storage issues. Currently, users must manually delete files, which is error-prone and provides no visibility into what will be deleted. This change adds a `clear` command with safety features (interactive confirmation, dry-run mode) that makes storage management safer and more user-friendly.

## Overview

Add a new `aissist clear` command that allows users to safely delete stored data in their local or global `.aissist/` directory. This provides users with a way to reset their storage and start fresh when needed, with appropriate safety measures to prevent accidental data loss.

## What Changes

This change adds a new `clear` command capability to the CLI:

- **New Spec**: `clear-command` - Defines behavior for safely clearing storage data
- **New File**: `src/commands/clear.ts` - Command implementation
- **Updated File**: `src/index.ts` - Register the new command
- **Updated File**: `src/utils/storage.ts` - Add `clearStorage()` utility function

Command supports multiple flags:

- `--yes`: Skip confirmation prompt
- `--dry`: Preview what would be deleted without deleting
- `--global`: Target global storage (~/.aissist/)
- `--hard`: Remove entire .aissist directory

## Motivation

Users may need to clear their aissist data for several reasons:

- Starting fresh in a new project context
- Removing sensitive or outdated information
- Testing or troubleshooting storage issues
- Migrating between storage modes (global/local)

Currently, there is no built-in way to safely clear storage data without manually deleting files, which can be error-prone and doesn't provide users with visibility into what will be deleted.

## User Impact

**Positive:**

- Provides a safe, interactive way to clear storage data
- Reduces risk of accidentally deleting important files outside `.aissist/`
- Improves user control over their data
- Enables easier testing and troubleshooting

**Risks:**

- Potential for accidental data loss if used without caution
- Mitigated by interactive confirmation prompts and dry-run mode

## Scope

This change introduces:

1. A new `clear` command with safety features (confirmation, dry-run)
2. Support for both local and global storage clearing
3. Multiple clearing modes (content-only vs. complete removal)

## Related Changes

- Depends on existing `storage-system` spec for path resolution
- Integrates with `cli-infrastructure` spec for command registration

## Alternatives Considered

1. **No command, manual deletion only**
   - Rejected: Error-prone and doesn't provide user feedback

2. **Auto-clear on init with --force**
   - Rejected: Less explicit, users may not realize data will be deleted

3. **Archive instead of delete**
   - Considered for future enhancement, but adds complexity

## Open Questions

None - design is straightforward with clear safety requirements.
