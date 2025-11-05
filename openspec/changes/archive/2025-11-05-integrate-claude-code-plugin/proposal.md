# Proposal: Integrate Claude Code Plugin

## Summary
Enhance aissist to integrate deeply with Claude Code as an official plugin, enabling users to install aissist capabilities directly into Claude Code's workflow. This includes extending the init command to offer optional Claude Code integration, creating a log command that imports historical work from GitHub, and packaging aissist as a Claude Code plugin with custom slash commands.

## Motivation
Currently, aissist operates as a standalone CLI tool. By packaging it as a Claude Code plugin:
- Users get seamless access to aissist functionality within Claude Code sessions
- The log command can leverage Claude Code's environment to import work history from GitHub
- Integration becomes automated through the init command workflow
- Custom slash commands provide natural language interfaces for aissist operations

## Goals
1. Package aissist as a Claude Code plugin with proper plugin.json structure
2. Extend init command to prompt for Claude Code integration and auto-install the plugin
3. Implement a log command that imports GitHub activity as aissist history entries
4. Create custom slash commands for key aissist operations
5. Support natural language date parsing for the log command (e.g., "this week", "this month")

## Non-Goals
- Migrating core aissist functionality to depend on Claude Code (remains standalone)
- Real-time GitHub syncing (one-time import only)
- Supporting other version control systems besides GitHub

## Success Criteria
- Users can run `aissist init` and optionally install Claude Code integration
- Plugin appears in Claude Code with functional slash commands
- Log command successfully imports GitHub commits/PRs as history entries
- Natural language date parsing works for common timeframes
- All OpenSpec validation passes

## Affected Capabilities
- **NEW**: `plugin-infrastructure` - Claude Code plugin packaging and distribution
- **MODIFIED**: `cli-infrastructure` - Init command enhancement for plugin installation
- **NEW**: `history-import` - Log command for GitHub activity import
- **NEW**: `claude-slash-commands` - Custom slash commands for aissist operations

## Dependencies
- Requires GitHub API access (user's existing credentials or tokens)
- Requires Claude Code CLI installed on user's machine
- Builds on existing `history-tracking` and `cli-infrastructure` specs

## Risks and Mitigations
- **Risk**: Users without Claude Code installed will see confusing prompts
  - **Mitigation**: Check for Claude Code installation before prompting, gracefully skip if not found
- **Risk**: GitHub API rate limiting for large history imports
  - **Mitigation**: Implement pagination and batch processing with progress indicators
- **Risk**: Plugin installation might fail due to permissions
  - **Mitigation**: Provide clear error messages and fallback manual installation instructions

## Open Questions
1. Should the plugin support both local and global Claude Code installations?
2. What GitHub entities should be logged (commits only, or PRs, issues, comments)?
3. Should log command support other platforms (GitLab, Bitbucket) in the future?
4. How to handle rate limiting and authentication for GitHub API?

## Timeline
- Design and spec writing: 1 day
- Implementation: 2-3 days
- Testing and validation: 1 day
