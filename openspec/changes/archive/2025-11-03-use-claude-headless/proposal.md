# Use Claude Code Headless Mode

## Why

The current implementation uses the Anthropic SDK directly with `ANTHROPIC_API_KEY` environment variable. This requires users to:
1. Obtain an API key from Anthropic Console
2. Manage API keys as environment variables
3. Handle API costs directly

Claude Code headless mode offers a better user experience by:
1. Leveraging existing Claude CLI authentication (no separate API key needed)
2. Using the same authentication as Claude Code
3. Providing a simpler integration path for users already using Claude
4. Reducing friction for getting started with AI features

## What Changes

Replace the current `@anthropic-ai/sdk` implementation with Claude Code headless mode invocation via the `claude` CLI command.

### Key Changes:
- Remove direct SDK dependency on `@anthropic-ai/sdk`
- Implement subprocess execution of `claude -p` command
- Update authentication checking to look for `claude` CLI availability
- Modify error messages to guide users to install Claude Code instead of API keys
- Update documentation to reflect new authentication approach

## Impact

### Affected Specs
- **MODIFIED**: claude-integration

### Affected Code
- `src/llm/claude.ts` - Complete rewrite to use subprocess execution
- `package.json` - Remove @anthropic-ai/sdk dependency
- `README.md` - Update authentication instructions

### Dependencies Removed
- `@anthropic-ai/sdk` (^0.32.1)

### User Impact
- **Simplified Setup**: Users with Claude Code installed don't need API keys
- **Better UX**: Uses existing Claude authentication
- **Potential Breaking Change**: Users currently using ANTHROPIC_API_KEY will need to install Claude CLI
- **Fallback Behavior**: Same graceful degradation if Claude unavailable (show raw search results)

### Trade-offs

**Benefits:**
- Simpler authentication flow
- No API key management needed
- Consistent with Claude Code ecosystem
- No direct API costs (handled by Claude subscription)

**Considerations:**
- Requires Claude CLI installation
- Subprocess overhead (minimal for this use case)
- Less direct control over API parameters
- Requires Claude Code to be installed and authenticated
