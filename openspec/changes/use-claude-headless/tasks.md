# Implementation Tasks

## 1. Update Dependencies

- [x] 1.1 Remove @anthropic-ai/sdk from package.json dependencies
- [x] 1.2 Run npm install to update package-lock.json
- [x] 1.3 Verify build still works without SDK dependency

## 2. Rewrite Claude Integration

- [x] 2.1 Update src/llm/claude.ts to remove SDK imports
- [x] 2.2 Implement checkClaudeCliAvailable() function to check if `claude` is in PATH
- [x] 2.3 Implement executeClaudeCommand() to spawn subprocess with `claude -p`
- [x] 2.4 Update error messages to reference Claude CLI instead of API keys
- [x] 2.5 Implement subprocess timeout handling (30 second default)
- [x] 2.6 Implement stdout/stderr capture and parsing
- [x] 2.7 Update error handling for CLI-specific errors (not found, auth failed, etc.)
- [x] 2.8 Keep buildRecallPrompt() function (prompt construction logic unchanged)
- [x] 2.9 Update summarizeExcerpts() to use subprocess execution instead of SDK

## 3. Update Recall Command

- [x] 3.1 Review src/commands/recall.ts for any SDK-specific code
- [x] 3.2 Update error messages to reflect new CLI-based approach
- [x] 3.3 Ensure fallback behavior still works correctly
- [x] 3.4 Test with Claude CLI unavailable scenario
- [x] 3.5 Test with Claude CLI not authenticated scenario

## 4. Update Documentation

- [x] 4.1 Update README.md authentication section
- [x] 4.2 Replace ANTHROPIC_API_KEY instructions with Claude CLI setup
- [x] 4.3 Add instructions for installing Claude Code
- [x] 4.4 Add instructions for running `claude login`
- [x] 4.5 Update examples to reflect new authentication flow
- [x] 4.6 Add troubleshooting section for CLI issues

## 5. Testing

- [x] 5.1 Test with Claude CLI installed and authenticated
- [x] 5.2 Test with Claude CLI not installed
- [x] 5.3 Test with Claude CLI installed but not authenticated
- [x] 5.4 Test timeout scenarios with slow responses
- [x] 5.5 Test error handling for various CLI failure modes
- [x] 5.6 Verify fallback to raw search results works
- [x] 5.7 Manual testing of recall command end-to-end

## Dependencies

- Task 2.x must complete before 3.x (recall depends on updated claude.ts)
- Task 1.x should complete before 2.x (clean dependency state)
- Task 4.x can be done in parallel with 2.x and 3.x
- Task 5.x must complete after 2.x and 3.x (testing requires implementation)

## Parallelizable Work

- Tasks 1.x and 4.x can run in parallel
- Task 4.x (documentation) can be drafted while coding is in progress
