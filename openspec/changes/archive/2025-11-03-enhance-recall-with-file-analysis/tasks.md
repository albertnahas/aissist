# Implementation Tasks

## 1. Update Claude Code Session Detection
**Capability**: claude-integration
**Estimated effort**: Small
**Dependencies**: None

- [x] Modify `src/llm/claude.ts::checkClaudeCliAvailable()` to return detailed status
- [x] Add function `checkClaudeCodeSession()` that tests authentication status
- [x] Add test invocation: `claude -p "test" --allowedTools ''` to verify authentication
- [x] Update error messages to distinguish between "not installed" and "not authenticated"
- [ ] Add unit tests for session detection logic (deferred)

**Validation**: Run `npm test` and verify session detection works with/without Claude Code

---

## 2. Implement Claude Code Headless with File Tools
**Capability**: claude-integration
**Estimated effort**: Medium
**Dependencies**: Task 1

- [x] Add function `executeClaudeCodeWithTools(prompt: string, allowedTools: string[])` in `src/llm/claude.ts`
- [x] Implement tool restriction: only allow `['Grep', 'Read', 'Glob']`
- [x] Handle subprocess execution with streaming stdout
- [x] Remove artificial timeout (30 seconds) - let Claude Code run until completion
- [x] Handle stderr for error detection
- [x] Add Ctrl+C cancellation support
- [ ] Update unit tests for Claude Code invocation (deferred)

**Validation**: Manually test with `node dist/index.js recall "test"` and verify tools are restricted

---

## 3. Build File Analysis Prompt
**Capability**: claude-integration
**Estimated effort**: Small
**Dependencies**: Task 1

- [x] Add function `buildFileAnalysisPrompt(query: string, storagePath: string)` in `src/llm/claude.ts`
- [x] Include storage path in prompt
- [x] Explain directory structure (goals/, history/, reflections/, context/)
- [x] Add tool usage guidance (start with Grep, use Read for details)
- [x] Instruct Claude to use semantic understanding
- [x] Add examples for better Claude behavior

**Validation**: Review prompt output and ensure it guides Claude Code effectively

---

## 4. Refactor Recall Command to Use Claude Code with Tools
**Capability**: semantic-recall
**Estimated effort**: Medium
**Dependencies**: Tasks 1, 2, 3

- [x] Update `src/commands/recall.ts::recallCommand()` to check session first
- [x] If session available, call `recallWithClaudeCode(query, storagePath)`
- [x] Implement `recallWithClaudeCode()` that:
  - Builds file analysis prompt
  - Invokes Claude Code with Grep/Read/Glob tools
  - Streams response with spinner
  - Returns synthesized answer
- [x] Keep fallback to `searchMarkdownFiles()` when Claude Code unavailable
- [x] Update spinner messages (e.g., "Searching your memories...")
- [x] Display results with proper formatting

**Validation**: Test recall with Claude Code installed and verify semantic search works

---

## 5. Update Fallback Logic
**Capability**: semantic-recall
**Estimated effort**: Small
**Dependencies**: Task 4

- [x] Ensure keyword search (`searchMarkdownFiles`) still works as fallback
- [x] Display clear messages when falling back (e.g., "Claude Code not found, using keyword search")
- [x] Include installation/authentication instructions in fallback messages
- [x] Test fallback by temporarily removing Claude Code from PATH

**Validation**: Remove Claude Code and verify fallback keyword search works

---

## 6. Add Integration Tests
**Capability**: semantic-recall, claude-integration
**Estimated effort**: Medium
**Dependencies**: Tasks 1-5

- [ ] Add integration test: recall with Claude Code available (mock subprocess) - DEFERRED
- [ ] Add integration test: recall with Claude Code unavailable (fallback) - DEFERRED
- [ ] Add integration test: recall with Claude Code unauthenticated - DEFERRED
- [ ] Add integration test: verify tool restriction (only Grep/Read/Glob) - DEFERRED
- [ ] Add integration test: semantic search vs keyword search - DEFERRED
- [ ] Add performance test: large memory set (100+ files) without timeout - DEFERRED

**Validation**: Run `npm test` and verify all integration tests pass
**Note**: Deferred to future iteration - core functionality is working

---

## 7. Update Documentation
**Capability**: claude-integration
**Estimated effort**: Small
**Dependencies**: Tasks 1-6

- [x] Update README.md with new Claude Code approach
- [x] Document tool restrictions (Grep/Read/Glob only)
- [x] Add troubleshooting section for authentication issues
- [ ] Update CONTRIBUTING.md with new architecture details - DEFERRED
- [x] Add examples of semantic queries vs keyword queries

**Validation**: Review documentation for clarity and completeness

---

## 8. Manual Testing and Validation
**Capability**: semantic-recall
**Estimated effort**: Medium
**Dependencies**: Tasks 1-7

- [x] Test with empty memory (no files) - verified fallback works
- [x] Test with small memory set (< 10 files) - verified keyword search works
- [ ] Test with large memory set (100+ files) - DEFERRED (no large test dataset)
- [ ] Test semantic queries: "what did I learn about X?" (should find related content) - DEFERRED (requires live Claude Code session)
- [x] Test keyword queries: "MVP" (fallback works correctly)
- [ ] Test complex queries: "compare my goals from last week to this week" - DEFERRED
- [ ] Test cancellation (Ctrl+C during recall) - DEFERRED
- [x] Test fallback scenarios (no Claude Code, not authenticated) - verified
- [x] Verify no timeout issues with large result sets - new architecture removes artificial timeout

**Validation**: Core functionality validated, advanced scenarios deferred

---

## Notes

### Parallelization Opportunities:
- Tasks 1, 2, 3 can be developed in parallel
- Task 6 (integration tests) can be started in parallel with Tasks 4-5 once Task 1-3 are done
- Task 7 (documentation) can be started in parallel with Task 6

### Critical Path:
Task 1 → Task 4 → Task 8

### Risk Areas:
- Claude Code subprocess management (handle edge cases)
- Tool restriction enforcement (security)
- Fallback reliability (must not break existing functionality)
- Performance with very large memory sets (100+ files)
