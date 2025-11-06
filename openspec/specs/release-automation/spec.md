# release-automation Specification

## Purpose
TBD - created by archiving change add-automated-release-workflow. Update Purpose after archive.
## Requirements
### Requirement: Continuous Integration
The project SHALL provide automated continuous integration that validates code quality on every pull request and push to main.

#### Scenario: CI runs on pull request
- **WHEN** a pull request is created or updated
- **THEN** the CI workflow triggers automatically
- **AND** installs dependencies
- **AND** runs linting checks
- **AND** executes the full test suite
- **AND** validates TypeScript build succeeds
- **AND** reports pass/fail status on the PR

#### Scenario: CI runs on main push
- **WHEN** code is pushed to the main branch
- **THEN** the CI workflow runs all quality checks
- **AND** ensures main branch is always in releasable state
- **AND** blocks broken code from being merged

#### Scenario: CI failure prevents merge
- **WHEN** CI checks fail on a pull request
- **THEN** the PR shows failed status
- **AND** merge is blocked until issues are resolved
- **AND** clear error messages indicate what failed

### Requirement: Automated Version Management
The project SHALL automate version updates across all release artifacts with synchronized versioning.

#### Scenario: Version extracted from git tag
- **WHEN** a release is triggered by a version tag (e.g., v1.2.3)
- **THEN** the version number is extracted from the tag
- **AND** the tag format `v*.*.*` (semver) is validated
- **AND** invalid tags are rejected with clear error

#### Scenario: Version synchronized across files
- **WHEN** version is updated during release
- **THEN** `package.json` version field is updated
- **AND** `aissist-plugin/.claude-plugin/plugin.json` version is updated
- **AND** `aissist-plugin/.claude-plugin/marketplace.json` plugins[0].version is updated
- **AND** all three files have identical version numbers

#### Scenario: Semantic versioning enforced
- **WHEN** creating a release tag
- **THEN** the version follows semver format: MAJOR.MINOR.PATCH
- **AND** MAJOR increments for breaking changes
- **AND** MINOR increments for new features
- **AND** PATCH increments for bug fixes

### Requirement: Automated Changelog Generation
The project SHALL generate changelogs automatically from conventional commit messages.

#### Scenario: Changelog generated from commits
- **WHEN** a release is created
- **THEN** commits since the last release are analyzed
- **AND** conventional commit format is parsed (type(scope): description)
- **AND** commits are grouped by type (feat, fix, docs, etc.)
- **AND** `CHANGELOG.md` is updated with new version section

#### Scenario: Conventional commit types recognized
- **WHEN** parsing commits for changelog
- **THEN** `feat:` commits appear under "### Added"
- **AND** `fix:` commits appear under "### Fixed"
- **AND** `docs:` commits appear under "### Documentation"
- **AND** `chore:`, `refactor:`, `test:` commits are optionally included
- **AND** breaking changes are highlighted prominently

#### Scenario: Changelog follows Keep a Changelog format
- **WHEN** changelog is generated
- **THEN** it follows Keep a Changelog structure
- **AND** includes version number and date
- **AND** organizes changes by category
- **AND** links to compare views on GitHub

### Requirement: Automated npm Publishing
The project SHALL publish the CLI package to npm automatically upon release.

#### Scenario: npm package published on release
- **WHEN** a release tag is pushed
- **THEN** the release workflow builds the TypeScript code
- **AND** runs the full test suite
- **AND** authenticates with npm using NPM_TOKEN secret
- **AND** publishes the package to npm registry
- **AND** package is immediately available: `npm install -g aissist@<version>`

#### Scenario: npm publish requires passing tests
- **WHEN** attempting to publish to npm
- **THEN** all tests must pass first
- **AND** build must succeed
- **AND** if tests fail, publishing is aborted
- **AND** workflow fails with clear error message

#### Scenario: npm authentication handled securely
- **WHEN** publishing to npm
- **THEN** NPM_TOKEN is read from GitHub secrets
- **AND** token is never logged or exposed
- **AND** token has publish permissions for the package
- **AND** authentication failure aborts the release

### Requirement: GitHub Release Creation
The project SHALL create GitHub releases with generated release notes for every version.

#### Scenario: GitHub release created automatically
- **WHEN** a version tag is pushed and workflow completes
- **THEN** a GitHub release is created for the tag
- **AND** release title is "Release v{version}"
- **AND** release body contains generated changelog
- **AND** release is marked as latest
- **AND** built artifacts are attached if applicable

#### Scenario: Release notes include changelog
- **WHEN** creating a GitHub release
- **THEN** the release notes contain the changelog for this version
- **AND** changes are categorized (Added, Fixed, Changed, etc.)
- **AND** includes link to full changelog file
- **AND** highlights breaking changes prominently

#### Scenario: Pre-release tags handled differently
- **WHEN** tag contains pre-release identifier (e.g., v1.0.0-beta.1)
- **THEN** GitHub release is marked as pre-release
- **AND** it doesn't update the "latest" release marker
- **AND** users must explicitly opt in to pre-releases

### Requirement: Release Workflow Orchestration
The project SHALL coordinate all release steps in proper sequence with failure handling.

#### Scenario: Release workflow sequence
- **WHEN** release workflow is triggered
- **THEN** steps execute in order:
  1. Extract version from tag
  2. Update version in all files
  3. Generate changelog
  4. Install dependencies
  5. Build artifacts
  6. Run tests
  7. Publish to npm
  8. Create GitHub release
- **AND** each step must succeed before proceeding
- **AND** failure at any step aborts the workflow

#### Scenario: Workflow failure notifications
- **WHEN** release workflow fails
- **THEN** workflow status shows as failed
- **AND** error logs are available in Actions tab
- **AND** the specific failing step is clearly identified
- **AND** maintainers are notified (via GitHub notifications)

#### Scenario: Idempotent release operations
- **WHEN** a release workflow is re-run
- **THEN** operations are idempotent where possible
- **AND** duplicate npm publishes are prevented
- **AND** GitHub release creation handles existing releases gracefully

### Requirement: Release Documentation
The project SHALL provide clear documentation for the release process and workflow usage.

#### Scenario: Release process documented
- **WHEN** maintainers need to create a release
- **THEN** documentation exists explaining:
  - How to create and push a version tag
  - What happens during the automated workflow
  - How to monitor workflow progress
  - How to verify a release succeeded
- **AND** documentation is in CONTRIBUTING.md or RELEASE.md

#### Scenario: Troubleshooting guide available
- **WHEN** a release fails
- **THEN** documentation provides troubleshooting steps
- **AND** common failure scenarios are documented
- **AND** rollback procedures are explained
- **AND** manual override steps are available if needed

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

