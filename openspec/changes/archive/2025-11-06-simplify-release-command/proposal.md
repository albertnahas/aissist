# Proposal: simplify-release-command

## Why

Currently, creating a release requires multiple manual steps:
1. Ensure main branch is up to date
2. Run tests locally
3. Manually create a git tag with the correct version number
4. Push the tag to trigger the automated workflow

This multi-step process is error-prone and requires maintainers to:
- Manually calculate the next version number (what comes after 1.2.3?)
- Remember the exact tag format (v1.2.3, not 1.2.3)
- Type the version number twice (in tag name and message)
- Remember to push the tag

**The problem**: The current process has unnecessary friction for a common maintenance task, increasing the cognitive load and risk of human error.

## What Changes

Add a single npm script command that:
1. Presents an interactive prompt asking the user to select: major, minor, or patch bump
2. Uses npm's built-in `npm version` command to bump the version in package.json and create a git tag
3. Runs the version sync script to update all version files (plugin.json, marketplace.json)
4. Automatically pushes the tag to GitHub to trigger the release workflow

**Example usage**:
```bash
npm run release
# Prompts: "Select version bump type: major / minor / patch"
# User selects "minor"
# Output: Bumping version from 1.0.0 to 1.1.0...
# Output: Updating version files...
# Output: Creating git tag v1.1.0...
# Output: Pushing tag to GitHub...
# Output: ✓ Release initiated! Monitor at: https://github.com/albertnahas/aissist/actions
```

## Benefits

1. **Single command**: Replace 4+ manual steps with one command
2. **No mental math**: System calculates the next version number automatically
3. **Consistent format**: No risk of typos in tag format (v1.2.3 vs 1.2.3)
4. **Immediate feedback**: Clear output showing what happened and where to monitor
5. **Lower barrier**: Makes releases accessible to any maintainer, not just release managers
6. **Version sync**: Automatically updates all version files before creating the tag

## Approach

### Implementation Strategy

1. **Create interactive release script** (`scripts/release.js`):
   - Use @inquirer/prompts for bump type selection
   - Execute `npm version <bump-type>` to update package.json and create tag
   - Run `node scripts/update-version.js <version>` to sync other files
   - Commit the version file updates with a conventional commit message
   - Push the tag and commits to origin
   - Display success message with workflow monitoring link

2. **Add npm script** in package.json:
   - `"release": "node scripts/release.js"`

3. **Update documentation**:
   - CONTRIBUTING.md: Replace multi-step instructions with single command
   - Add troubleshooting section for release failures

### Technical Details

- Leverage npm's built-in `npm version` command which handles:
  - Version bumping with semver rules
  - Git tag creation (with `v` prefix by default)
  - Git commit of package.json changes
- Script will use Node.js child_process to execute commands
- Use @inquirer/prompts (already a dependency) for interactive selection
- Exit with clear error if git working directory is dirty
- Exit with clear error if not on main branch

### Edge Cases

- **Dirty working directory**: Abort with message to commit or stash changes
- **Not on main branch**: Abort with message to checkout main
- **Behind origin**: Abort with message to pull latest changes
- **Push failure**: Clear error message, tag remains local for manual retry
- **Version sync failure**: Abort before creating tag

## Related Specs

This change modifies:
- `release-automation`: Add requirement for simplified release command

## Breaking Changes

None. This is additive functionality. Existing release process (manual git tag creation) still works.

## Migration Path

No migration needed. Maintainers can immediately start using `npm run release` instead of manual steps.
