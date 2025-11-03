# Design: Enhanced Recall with File Analysis Tools

## Problem Statement

The current recall implementation suffers from two critical issues:
1. **Semantic Gap**: Keyword search cannot find conceptually related content (e.g., searching "productivity" won't find "efficiency")
2. **Timeout Issues**: Dumping all matched excerpts into a single Claude CLI prompt causes 30-second timeouts

## Design Goals

1. **Semantic Search**: Enable natural language understanding of queries
2. **Scalability**: Handle large volumes of memory files without timeouts
3. **Performance**: Stream results progressively, don't load everything into memory
4. **Reliability**: Graceful fallback when Claude Code is unavailable
5. **Security**: Restrict Claude Code to safe file analysis tools only

## Architectural Decision

### Option 1: Current Approach (Keyword Search + Claude Summarization)
**Architecture**: `searchMarkdownFiles() → matches → buildRecallPrompt() → Claude CLI`

**Pros**:
- Simple, two-step process
- Keyword search is fast
- Works as fallback

**Cons**:
- No semantic understanding
- Timeout on large result sets
- Claude receives too much context at once
- Cannot handle synonyms or related concepts

### Option 2: Claude Code Headless with File Tools (SELECTED)
**Architecture**: `User Query → Claude Code headless (Grep/Read/Glob enabled) → Semantic analysis`

**Pros**:
- Claude understands query semantically
- Uses Grep for efficient initial discovery
- Reads only relevant files (not everything)
- Streams results (no timeout)
- Can follow relationships between files
- More intelligent and context-aware

**Cons**:
- Requires Claude Code installation
- More complex subprocess management
- Need to handle tool execution properly

**Decision**: We choose Option 2 because semantic understanding and scalability are critical for a memory recall system. The current timeout issues make the existing approach unworkable for real-world usage.

## Implementation Strategy

### Phase 1: Claude Code Session Detection
```typescript
// Check if Claude Code is available and authenticated
async function checkClaudeCodeSession(): Promise<boolean> {
  // 1. Check if 'claude' CLI exists in PATH
  // 2. Verify authentication status
  // 3. Return true if available, false otherwise
}
```

### Phase 2: Headless Invocation with Tools
```typescript
// Invoke Claude Code in headless mode with file analysis tools
async function recallWithClaudeCode(
  query: string,
  storagePath: string
): Promise<string> {
  const prompt = `
You are helping the user recall information from their personal memory system.

Memory storage location: ${storagePath}

The storage contains markdown files organized as:
- goals/*.md - User goals and objectives
- history/*.md - Daily history logs
- reflections/*.md - Personal reflections
- context/*/*.md - Context-specific logs

User query: ${query}

Please use the Grep and Read tools to search through the markdown files and find relevant information to answer the user's query. Use semantic understanding to find related concepts, not just keyword matches.
  `;

  // Execute: claude -p "<prompt>" --allowedTools 'Grep,Read,Glob'
  // Return streamed response
}
```

### Phase 3: Fallback Handling
```typescript
async function recallCommand(query: string): Promise<void> {
  try {
    // Try Claude Code first
    if (await checkClaudeCodeSession()) {
      const result = await recallWithClaudeCode(query, storagePath);
      displayResult(result);
      return;
    }
  } catch (error) {
    // Log error, fall through to fallback
  }

  // Fallback: keyword search only
  const matches = await searchMarkdownFiles(storagePath, query);
  displayRawMatches(matches);
}
```

## Tool Restrictions

For security, we MUST restrict Claude Code to safe, read-only tools:
- **Grep**: Search file contents (read-only)
- **Read**: Read file contents (read-only)
- **Glob**: Find files by pattern (read-only)

**BLOCKED**: Bash, Write, Edit, Delete, or any tools that could modify the file system.

Implementation:
```bash
claude -p "<prompt>" --allowedTools 'Grep,Read,Glob'
```

## Performance Considerations

### Keyword Search (Current):
- Time: O(n) where n = total lines across all files
- Memory: Loads all matches into memory before sending to Claude
- Timeout: 30 seconds with large result sets

### Claude Code with Tools (Proposed):
- Time: O(m) where m = relevant files (Claude decides what to read)
- Memory: Streams results incrementally
- Timeout: No timeout (Claude reads files progressively)

### Trade-off Analysis:
The new approach may make more file I/O calls, but:
1. It's selective (reads only relevant files)
2. It's incremental (no big memory spike)
3. It's semantic (better quality results)

Overall: Better performance and better results.

## Error Handling

### Claude Code Unavailable:
```
User Query → Check session (fail) → Fallback to keyword search → Display raw results
```

### Claude Code Timeout (unlikely with tools):
```
User Query → Claude Code (timeout) → Display partial results + error message
```

### Authentication Error:
```
User Query → Check session (auth fail) → Display "run claude login" message
```

## Security Considerations

1. **Tool Restriction**: Only allow read-only tools (Grep, Read, Glob)
2. **Path Restriction**: Claude can only access files in the storage path
3. **No Code Execution**: Tools cannot execute arbitrary code
4. **Subprocess Isolation**: Claude Code runs in isolated subprocess

## Testing Strategy

1. **Unit Tests**:
   - Test `checkClaudeCodeSession()` with mocked subprocess
   - Test prompt construction with various queries
   - Test fallback logic

2. **Integration Tests**:
   - Test with real Claude Code installation
   - Test with missing Claude Code
   - Test with unauthenticated Claude Code
   - Test with various query types (keywords, questions, concepts)

3. **Performance Tests**:
   - Test with small memory sets (< 10 files)
   - Test with medium memory sets (10-100 files)
   - Test with large memory sets (> 100 files)
   - Verify no timeouts

## Migration Path

### For Users:
1. Install Claude Code (if not already installed)
2. Run `claude login` (if not already authenticated)
3. Run `aissist recall "query"` - automatically uses new approach

### For Developers:
1. Update `src/llm/claude.ts` with new headless invocation
2. Update `src/commands/recall.ts` with new logic
3. Keep `src/utils/search.ts` for fallback
4. Update tests
5. Update documentation

No breaking changes - graceful fallback ensures existing behavior when Claude Code unavailable.

## Open Questions

1. **Should we allow other tools?** (e.g., WebFetch for looking up external context)
   - **Decision**: No, stick to file analysis only (Grep/Read/Glob)

2. **Should we cache Claude's file analysis results?**
   - **Decision**: No, memory files change frequently, caching would be stale

3. **Should we show Claude's tool usage to the user?**
   - **Decision**: No, just show final answer (cleaner UX)

4. **What if Claude Code version is outdated?**
   - **Decision**: Check version and warn if too old (future enhancement)
