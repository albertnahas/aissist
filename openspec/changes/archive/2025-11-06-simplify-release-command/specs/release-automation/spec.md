# release-automation Specification Delta

## ADDED Requirements

### Requirement: Simplified Release Command
The project SHALL provide a single npm command that interactively bumps the version, syncs all version files, creates a git tag, and pushes to trigger the release workflow.

#### Scenario: Run release command with interactive prompt
- **WHEN** a maintainer runs `npm run release`
- **THEN** the system presents an interactive prompt
- **AND** offers three options: "major", "minor", or "patch"
- **AND** displays semver descriptions for each option
- **AND** shows current version and what the new version will be
- **AND** waits for user selection before proceeding

#### Scenario: Pre-flight checks before release
- **WHEN** the release command is executed
- **THEN** the system checks if the git working directory is clean
- **AND** verifies the current branch is 'main'
- **AND** confirms local main is up to date with origin/main
- **AND** aborts with clear error if any check fails
- **AND** displays which check failed and how to fix it

#### Scenario: Version bump with major selection
- **WHEN** user selects "major" bump
- **THEN** the system executes `npm version major`
- **AND** updates package.json from X.Y.Z to (X+1).0.0
- **AND** creates a git commit with message "chore(release): bump version to (X+1).0.0"
- **AND** creates a git tag v(X+1).0.0
- **AND** displays the new version number

#### Scenario: Version bump with minor selection
- **WHEN** user selects "minor" bump
- **THEN** the system executes `npm version minor`
- **AND** updates package.json from X.Y.Z to X.(Y+1).0
- **AND** creates a git commit with message "chore(release): bump version to X.(Y+1).0"
- **AND** creates a git tag vX.(Y+1).0
- **AND** displays the new version number

#### Scenario: Version bump with patch selection
- **WHEN** user selects "patch" bump
- **THEN** the system executes `npm version patch`
- **AND** updates package.json from X.Y.Z to X.Y.(Z+1)
- **AND** creates a git commit with message "chore(release): bump version to X.Y.(Z+1)"
- **AND** creates a git tag vX.Y.(Z+1)
- **AND** displays the new version number

#### Scenario: Automatic version file synchronization
- **WHEN** npm version bump succeeds
- **THEN** the system extracts the new version number
- **AND** executes `node scripts/update-version.js <version>`
- **AND** syncs version in aissist-plugin/.claude-plugin/plugin.json
- **AND** syncs version in aissist-plugin/.claude-plugin/marketplace.json
- **AND** creates a git commit with message "chore(release): sync version files"
- **AND** aborts if version sync fails

#### Scenario: Automatic tag and commit push
- **WHEN** version files are synchronized successfully
- **THEN** the system pushes commits to origin main
- **AND** pushes the version tag to origin
- **AND** displays success message: "Release initiated!"
- **AND** shows GitHub Actions workflow URL for monitoring
- **AND** aborts with clear error if push fails

#### Scenario: Abort release with dirty working directory
- **WHEN** release command runs with uncommitted changes
- **THEN** the system detects dirty working directory
- **AND** displays error: "Git working directory has uncommitted changes"
- **AND** instructs user to commit or stash changes first
- **AND** exits without making any changes

#### Scenario: Abort release when not on main branch
- **WHEN** release command runs from non-main branch
- **THEN** the system detects current branch is not 'main'
- **AND** displays error: "Release must be run from main branch"
- **AND** displays current branch name
- **AND** instructs user to checkout main first
- **AND** exits without making any changes

#### Scenario: Abort release when behind origin
- **WHEN** release command runs with local main behind origin/main
- **THEN** the system detects local branch is behind remote
- **AND** displays error: "Local main is behind origin/main"
- **AND** instructs user to pull latest changes
- **AND** exits without making any changes

#### Scenario: Release command help flag
- **WHEN** user runs `node scripts/release.js --help`
- **THEN** the system displays usage information
- **AND** explains the interactive bump type selection
- **AND** lists pre-flight requirements (clean working dir, main branch)
- **AND** shows examples of major/minor/patch version changes
- **AND** exits without prompting for input

#### Scenario: Display monitoring link after successful push
- **WHEN** tag is successfully pushed to GitHub
- **THEN** the system constructs the GitHub Actions workflow URL
- **AND** displays: "Monitor release at: https://github.com/albertnahas/aissist/actions"
- **AND** displays the tag that was pushed (e.g., v1.2.3)
- **AND** exits with success status code
