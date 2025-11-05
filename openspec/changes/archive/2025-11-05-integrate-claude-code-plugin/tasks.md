# Tasks: Integrate Claude Code Plugin

## Implementation Status

**Completed:** Tasks 1-17 (Phases 1-4)
- Plugin infrastructure created
- Slash commands defined
- Init command enhanced with Claude Code integration
- History log command foundation with date parsing

**Remaining:** Tasks 18-43 (Phases 5-10)
- GitHub API integration (fetch commits/PRs)
- Semantic processing and summarization
- Error handling enhancements
- Testing and documentation

## Implementation Order

### Phase 1: Plugin Infrastructure (Parallel)
These tasks create the foundational plugin structure and can be done in parallel.

- [x] 1. **Create plugin directory structure**
   - Create `.claude-plugin/` directory
   - Create `plugin/commands/` directory
   - Verify directory permissions
   - **Validation**: Directory structure exists with correct permissions

- [x] 2. **Write plugin.json manifest**
   - Create `.claude-plugin/plugin.json` with metadata
   - Set name: "aissist", version: "1.0.0", description
   - Include author information
   - **Validation**: JSON is valid and includes all required fields

- [x] 3. **Create development marketplace.json**
   - Create `.claude-plugin/marketplace.json` for local testing
   - Add aissist plugin entry
   - **Validation**: Can install plugin locally via marketplace

### Phase 2: Slash Command Definitions (Parallel)
These tasks create the slash command files and can be done in parallel.

- [x] 4. **Write /aissist:log slash command**
   - Create `plugin/commands/log.md`
   - Add frontmatter with description, argument-hint, allowed-tools
   - Write usage documentation with examples
   - Include `$ARGUMENTS` interpolation
   - **Validation**: Command file follows Claude Code format

- [x] 5. **Write /aissist:recall slash command**
   - Create `plugin/commands/recall.md`
   - Add frontmatter with description, argument-hint, allowed-tools
   - Write usage documentation with examples
   - Include file exploration guidance
   - **Validation**: Command file follows Claude Code format

- [x] 6. **Write /aissist:goal slash command**
   - Create `plugin/commands/goal.md`
   - Add frontmatter with description, argument-hint, allowed-tools
   - Write usage documentation with examples
   - Support subcommand delegation
   - **Validation**: Command file follows Claude Code format

### Phase 3: Init Command Enhancement (Sequential)
These tasks extend the init command and must be done in order.

- [x] 7. **Add Claude Code detection to init command**
   - Import `child_process.spawn` for CLI detection
   - Add function to check if `claude` exists in PATH
   - Add function to verify Claude CLI is working (`claude --version`)
   - **Validation**: Detection works with and without Claude Code installed

- [x] 8. **Implement integration prompt**
   - Add prompt after storage initialization
   - Conditionally show based on Claude Code detection
   - Handle yes/no responses
   - **Validation**: Prompt appears only when appropriate

- [x] 9. **Implement package path resolution**
   - Add function to resolve aissist package installation path
   - Check for global installation (npm root -g)
   - Fall back to local node_modules
   - Return absolute path to package directory
   - **Validation**: Correctly identifies package location in various scenarios

- [x] 10. **Implement plugin already installed check**
    - Execute `claude plugin list` to check installed plugins
    - Parse output to detect if aissist is already installed
    - Skip installation if already present
    - **Validation**: Detects existing installation correctly

- [x] 11. **Implement marketplace addition**
    - Execute `claude plugin marketplace add file://<package-path>`
    - Capture stdout/stderr for error handling
    - Parse result to verify success
    - **Validation**: Marketplace added successfully

- [x] 12. **Implement plugin installation**
    - Execute `claude plugin install aissist`
    - Stream output to user (show progress)
    - Handle installation errors
    - **Validation**: Plugin installs successfully

- [x] 13. **Verify plugin installation**
    - Re-check `claude plugin list` after installation
    - Confirm aissist appears in the list
    - **Validation**: Plugin appears in installed plugins

- [x] 14. **Add success feedback**
    - Display integration success message
    - Instruct user to restart Claude Code or run `/plugin refresh`
    - List available commands
    - Show example usage
    - **Validation**: User sees clear next steps

### Phase 4: History Import - Foundation (Sequential)
These tasks build the log command foundation.

- [x] 15. **Create history log command stub**
    - Add `history log` subcommand to CLI
    - Parse `--from` flag
    - Display timeframe prompt if not provided
    - **Validation**: Command accepts and displays arguments

- [x] 16. **Implement date parsing**
    - Install and configure `date-fns`
    - Parse "today", "yesterday", "this week", "this month", "last week", "last month"
    - Parse ISO date strings
    - Validate and convert to date ranges
    - **Validation**: Unit tests pass for all date formats

- [x] 17. **Implement invalid date handling**
    - Detect unrecognized formats
    - Re-prompt with helpful examples
    - Allow user to cancel
    - **Validation**: Handles invalid input gracefully

### Phase 5: GitHub Integration (Sequential with parallel API calls)
These tasks integrate with GitHub and must respect dependencies.

- [ ] 18. **Implement GitHub authentication**
    - Check for `gh` CLI and its auth status
    - Fallback to prompting for GitHub token
    - Store token securely in environment variable
    - **Validation**: Authentication works via gh CLI and token

19. **Implement authentication validation**
    - Make test API call to verify credentials
    - Display clear error messages on failure
    - **Validation**: Invalid credentials are detected and reported

20. **Implement GitHub commit fetching**
    - Use GitHub REST API to fetch commits by author
    - Filter by date range
    - Include repository name and commit message
    - **Validation**: Returns commits for authenticated user within timeframe

21. **Implement GitHub PR fetching (Parallel with #20)**
    - Use GitHub REST API to fetch PRs by author
    - Filter by date range
    - Include repository, PR number, and title
    - **Validation**: Returns PRs for authenticated user within timeframe

22. **Implement repository detection**
    - Detect current Git repository
    - Prioritize commits from current repo
    - Fetch from all accessible repos as secondary
    - **Validation**: Current repo commits appear first

23. **Add progress indicators**
    - Display spinner during API calls
    - Show "Fetching GitHub activity..." message
    - Update message as fetching progresses
    - **Validation**: User sees progress feedback

### Phase 6: Semantic Processing (Sequential)
These tasks process and summarize GitHub activity.

24. **Implement commit grouping logic**
    - Group commits by semantic similarity
    - Use commit messages and timestamps
    - Create logical units of work
    - **Validation**: Related commits are grouped together

25. **Implement semantic summarization**
    - Enhance terse commit messages
    - Generate descriptive summaries
    - Preserve repository and PR links
    - **Validation**: Summaries are more descriptive than raw commit messages

26. **Implement batch processing**
    - Process commits in batches of 20-50
    - Avoid exceeding API rate limits
    - Display batch progress
    - **Validation**: Large histories process without hitting rate limits

### Phase 7: History Entry Creation (Sequential)
These tasks write the imported data to aissist storage.

27. **Implement history entry formatting**
    - Format entries as: "- {summary} ({repo}#PR)"
    - Include date, repository, GitHub URL
    - Follow existing history entry conventions
    - **Validation**: Entries match aissist history format

28. **Implement date-based file writing**
    - Append to existing YYYY-MM-DD.md files
    - Create new files if needed
    - Maintain chronological order
    - **Validation**: Entries written to correct date files

29. **Add completion feedback**
    - Display import summary (X activities imported)
    - Show preview of first 3 entries
    - Display file locations
    - **Validation**: User sees confirmation of successful import

### Phase 8: Error Handling (Parallel)
These tasks add robustness and can be done in parallel.

30. **Implement rate limit handling**
    - Detect approaching rate limits
    - Slow down requests automatically
    - Display warning messages
    - **Validation**: Rate limits don't cause failures

31. **Implement network error handling**
    - Retry failed requests up to 3 times
    - Use exponential backoff
    - Display clear error messages
    - **Validation**: Transient network errors are recovered

32. **Implement partial import handling**
    - Continue on per-repository failures
    - Log warnings for failed fetches
    - Report which repositories succeeded
    - **Validation**: Some failures don't abort entire import

### Phase 9: Testing and Documentation (Parallel)
These tasks validate the implementation.

33. **Write unit tests for date parsing**
    - Test all natural language formats
    - Test ISO date parsing
    - Test invalid date handling
    - **Validation**: All tests pass

34. **Write integration tests for init command**
    - Mock Claude Code detection
    - Test file copying logic
    - Test error scenarios
    - **Validation**: All tests pass

35. **Write integration tests for log command**
    - Mock GitHub API responses
    - Test end-to-end import flow
    - Test error scenarios
    - **Validation**: All tests pass

36. **Update plugin README**
    - Document installation steps
    - Provide usage examples for each command
    - Include troubleshooting section
    - **Validation**: README is complete and accurate

37. **Update main README**
    - Document Claude Code integration
    - Add log command documentation
    - Include screenshots/examples
    - **Validation**: README reflects new features

### Phase 10: Manual Validation
These tasks require manual testing in real environments.

38. **Test plugin installation**
    - Run `aissist init` with Claude Code
    - Verify plugin is added to marketplace
    - Verify plugin installs successfully
    - Verify commands appear in `/help` after restart
    - **Validation**: Plugin installs correctly via Claude CLI

39. **Test /aissist:log in Claude Code**
    - Run `/aissist:log "this week"`
    - Verify GitHub activity is fetched
    - Verify history entries are created
    - **Validation**: Log command works end-to-end

40. **Test /aissist:recall in Claude Code**
    - Run `/aissist:recall "what did I work on?"`
    - Verify semantic search works
    - Verify file exploration tools work
    - **Validation**: Recall command works in plugin context

41. **Test /aissist:goal in Claude Code**
    - Run `/aissist:goal add "Test goal"`
    - Run `/aissist:goal list`
    - Verify interactive mode works
    - **Validation**: Goal command works in plugin context

42. **Test error scenarios**
    - Test without authentication
    - Test with invalid timeframes
    - Test with rate limits
    - Test without network
    - **Validation**: All error messages are clear and helpful

43. **Validate OpenSpec compliance**
    - Run `openspec validate integrate-claude-code-plugin --strict`
    - Resolve any validation errors
    - **Validation**: No OpenSpec errors

## Dependencies
- Tasks 1-3 are foundational for Phase 1
- Tasks 4-6 depend on task 2 (plugin.json)
- Tasks 7-14 are sequential within Phase 3
- Tasks 15-17 are sequential within Phase 4
- Tasks 18-23 are sequential except 20-21 can be parallel
- Tasks 24-29 are sequential
- Tasks 30-32 can be done in parallel
- Tasks 33-37 can be done in parallel
- Tasks 38-43 require all implementation tasks complete

## Parallelization Opportunities
- Phase 1 (tasks 1-3)
- Phase 2 (tasks 4-6)
- Phase 8 (tasks 30-32)
- Phase 9 (tasks 33-37)
- Within Phase 5: tasks 20-21
