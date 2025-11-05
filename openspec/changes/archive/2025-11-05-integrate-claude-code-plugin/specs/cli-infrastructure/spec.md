# cli-infrastructure Specification Delta

## Purpose
Extends the init command to optionally integrate aissist with Claude Code by detecting and installing plugin commands.

## MODIFIED Requirements

### Requirement: Interactive Initialization (MODIFIED)
The system SHALL support interactive setup with optional Claude Code integration.

#### Scenario: Claude Code detection (ADDED)
- **WHEN** running `aissist init`
- **THEN** the system checks if `claude` CLI exists in PATH

#### Scenario: Integration prompt (ADDED)
- **WHEN** Claude Code is detected
- **THEN** the system prompts: "Would you like to integrate with Claude Code? (Y/n)"

#### Scenario: Skip when not applicable (ADDED)
- **WHEN** Claude Code is not installed
- **THEN** the system skips the integration prompt and continues normal init

#### Scenario: User accepts integration (ADDED)
- **WHEN** the user responds "yes" to integration prompt
- **THEN** the system installs plugin commands to `.claude/commands/aissist/`

#### Scenario: User declines integration (ADDED)
- **WHEN** the user responds "no" to integration prompt
- **THEN** the system continues without installing plugin commands

### Requirement: Plugin Installation via Claude CLI (ADDED)
The system SHALL install the aissist plugin using Claude Code's plugin system.

#### Scenario: Determine package path
- **WHEN** installing the plugin
- **THEN** the system resolves the aissist package installation path (global or node_modules)

#### Scenario: Add local marketplace
- **WHEN** installing the plugin
- **THEN** the system executes: `claude plugin marketplace add file://<package-path>`

#### Scenario: Install plugin
- **WHEN** the marketplace is added
- **THEN** the system executes: `claude plugin install aissist`

#### Scenario: Verify installation
- **WHEN** plugin installation completes
- **THEN** the system verifies the plugin appears in Claude Code's plugin list

#### Scenario: Success feedback
- **WHEN** plugin is successfully installed
- **THEN** the system displays: "Claude Code integration complete! Restart Claude Code or run /plugin refresh to activate. Available commands: /aissist:log, /aissist:recall, /aissist:goal"

### Requirement: Error Handling for Integration (ADDED)
The system SHALL handle integration failures gracefully.

#### Scenario: Claude CLI not found
- **WHEN** `claude` CLI is not in PATH
- **THEN** it displays: "Claude Code CLI not found. Please install: https://claude.com/claude-code"

#### Scenario: Plugin already installed
- **WHEN** the aissist plugin is already installed
- **THEN** it displays: "aissist plugin is already installed in Claude Code" and skips installation

#### Scenario: Marketplace add failure
- **WHEN** adding the marketplace fails
- **THEN** the system displays the error and provides manual installation instructions

#### Scenario: Plugin install failure
- **WHEN** `claude plugin install aissist` fails
- **THEN** the system displays: "Plugin installation failed. Try manually: /plugin marketplace add file://<path> then /plugin install aissist"

### Requirement: CLI Accessibility (ADDED)
The system SHALL ensure the aissist CLI is accessible to plugin commands.

#### Scenario: Global installation
- **WHEN** aissist is installed globally via npm
- **THEN** plugin commands can invoke `aissist` directly

#### Scenario: Local installation
- **WHEN** aissist is installed locally in a project
- **THEN** plugin commands use `npx aissist` or absolute path to node_modules

#### Scenario: PATH verification
- **WHEN** installing the plugin
- **THEN** the system verifies aissist CLI is accessible and warns if not found

#### Scenario: Package path resolution
- **WHEN** determining the plugin source path
- **THEN** the system checks for global installation first, then falls back to local node_modules
