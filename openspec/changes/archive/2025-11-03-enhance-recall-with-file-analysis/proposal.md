# Enhance Recall with Claude Code File Analysis

## Why

The current recall implementation has significant limitations that reduce its effectiveness:

### Current Problems:
1. **Simple Keyword Search**: Uses basic string matching (`searchMarkdownFiles`) which only finds literal text matches, missing semantically related content
2. **Claude CLI Timeout**: Currently spawns Claude CLI with all excerpts in a single prompt, causing 30-second timeouts on large result sets (as evidenced by the recent `recall "MVP"` command)
3. **No Intelligent File Selection**: Sends all keyword matches to Claude without understanding file relevance
4. **Limited Context Understanding**: Keyword search cannot understand concepts, synonyms, or related topics

### Proposed Solution:
Instead of using keyword search + Claude CLI for summarization, we should:

1. **Check for Active Claude Code Session**: Detect if a Claude Code terminal session is available and authenticated
2. **Delegate to Claude Code Headless**: Use Claude Code in headless mode with file analysis tools (Grep, Read) to intelligently search through memory files
3. **Enable Semantic Understanding**: Claude can understand the query intent and find semantically related content, not just keyword matches
4. **Better Performance**: Claude Code can stream responses and handle file reading incrementally, avoiding timeout issues
5. **Tool-Enabled Search**: Claude Code can use Grep for initial discovery, then Read specific files for deeper analysis

### Benefits:
- **Smarter Search**: Understands "what did I say about productivity?" even if files use "efficiency" or "time management"
- **No Timeouts**: Claude Code handles file reading with proper tooling instead of dumping all text in a prompt
- **Better Integration**: Leverages existing Claude Code authentication and capabilities
- **Incremental Analysis**: Can read files progressively instead of all at once
- **Natural Language Understanding**: Claude can interpret complex queries and relationships

## What Changes

Replace the current two-step approach (keyword search → Claude summarization) with direct Claude Code headless invocation that has access to file analysis tools.

### Architecture Change:
```
BEFORE:
User Query → searchMarkdownFiles() → keyword matches → buildRecallPrompt() → Claude CLI → timeout

AFTER:
User Query → Check Claude Code session → Claude Code headless (with Grep/Read tools) → semantic file analysis → streamed response
```

### Key Implementation Details:
1. **Session Detection**: Check if Claude Code is installed, authenticated, and available
2. **Headless Invocation**: Use `claude -p "query" --allowedTools 'Grep,Read,Glob'` to enable file analysis
3. **Context Passing**: Provide Claude with the storage path and query intent
4. **Fallback Handling**: If Claude Code unavailable, fall back to current keyword search (without Claude summarization)

## Impact

### Affected Specs
- **MODIFIED**: semantic-recall
- **MODIFIED**: claude-integration

### Affected Code
- `src/commands/recall.ts` - Complete rewrite of recall logic
- `src/llm/claude.ts` - Add Claude Code headless invocation with tools
- `src/utils/search.ts` - Keep as fallback but make optional

### Dependencies
- No new dependencies (uses existing `claude` CLI)
- Requires Claude Code installation and authentication

### User Impact
- **Better Results**: More relevant and comprehensive answers
- **Faster Response**: No more 30-second timeouts
- **Same Fallback**: If Claude Code not available, shows keyword results (same as before)
- **Better UX**: Natural language queries work better

### Trade-offs

**Benefits:**
- Semantic understanding of queries
- No timeout issues
- Leverages Claude Code's file analysis tools
- More accurate and relevant results
- Handles large result sets gracefully

**Considerations:**
- Requires Claude Code installation (same as current approach)
- Slightly different architecture (subprocess with tools vs direct CLI)
- Need to handle tool execution properly (security: restrict to Grep/Read/Glob)
- Fallback to keyword search if Claude Code unavailable
