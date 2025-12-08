# Tasks: Add Smart History Logging Flag

## Implementation Tasks

- [x] **Add `enhanceHistoryEntry()` function to `src/llm/claude.ts`**
  - Accept raw text and list of active goals
  - Build prompt for Haiku to clean text and identify best goal match
  - Return enhanced text and optional goal codename
  - Handle Claude CLI errors gracefully with fallback to raw text

- [x] **Add `--smart` flag to `history log` command**
  - Add `-s, --smart` option to the command definition
  - When flag is present, call `enhanceHistoryEntry()` before logging
  - Use returned goal codename if provided (skip interactive prompt)
  - Show spinner during AI processing

- [x] **Update CLI help text**
  - Document `--smart` flag in command help
  - Add usage examples

- [x] **Add unit tests for `enhanceHistoryEntry()`**
  - Test text cleanup output format
  - Test goal matching with mock responses
  - Test fallback when Claude unavailable

- [x] **Add E2E test for `--smart` flag**
  - Test command with `--smart` flag (mocked Claude)
  - Verify entry is logged with enhanced text

- [x] **Update README documentation**
  - Add `--smart` flag to history command docs
  - Include example usage
