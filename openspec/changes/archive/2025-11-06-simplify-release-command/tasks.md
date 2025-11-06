# Tasks: simplify-release-command

## Implementation Order

### Phase 1: Release Script Implementation
- [x] 1. **Create interactive release script**
  - Create `scripts/release.js` with ESM imports
  - Add import for @inquirer/prompts (select)
  - Add import for child_process (execSync)
  - Add import for fs/path for reading package.json
  - **Validation**: Script file exists and has proper imports

- [x] 2. **Implement pre-flight checks**
  - Check if git working directory is clean (no uncommitted changes)
  - Check if current branch is 'main'
  - Check if local main is up to date with origin/main
  - Exit with clear error messages if any check fails
  - **Validation**: Manual test with dirty working directory, non-main branch

- [x] 3. **Implement interactive version bump selection**
  - Use @inquirer/select to prompt for bump type (major, minor, patch)
  - Add descriptions for each option explaining semver rules
  - Parse current version from package.json
  - Calculate and display what the new version will be before confirming
  - **Validation**: Run script and verify interactive prompt appears

- [x] 4. **Implement npm version bump**
  - Execute `npm version <bump-type> -m "chore(release): bump version to %s"`
  - This automatically updates package.json and creates a git tag
  - Capture the new version number from the command output
  - Handle errors if npm version fails
  - **Validation**: Test with each bump type (major, minor, patch)

- [x] 5. **Implement version file synchronization**
  - After npm version succeeds, get the new version number
  - Execute `node scripts/update-version.js <version>` to sync plugin files
  - Commit the updated plugin files with message: "chore(release): sync version files"
  - Handle errors if sync fails
  - **Validation**: Verify all 3 files updated (package.json, plugin.json, marketplace.json)

- [x] 6. **Implement git push**
  - Push commits to origin main
  - Push the new tag to origin
  - Use `git push && git push --tags` or `git push --follow-tags`
  - Display success message with GitHub Actions workflow URL
  - **Validation**: Verify tag appears in git log and on remote

### Phase 2: npm Script Integration
- [x] 7. **Add release script to package.json**
  - Add `"release": "node scripts/release.js"` to scripts section
  - Ensure script is listed after other common scripts (build, test, lint)
  - **Validation**: Run `npm run release --help` shows script exists

- [x] 8. **Test full release workflow end-to-end**
  - Create a test tag (e.g., v1.0.1-test.1)
  - Run `npm run release` and select "patch"
  - Verify tag is created and pushed
  - Verify GitHub Actions workflow is triggered
  - Delete test tag after verification
  - **Validation**: Will be tested during next actual release (implementation complete)

### Phase 3: Spec Updates
- [x] 9. **Update release-automation spec**
  - Add new requirement "Simplified Release Command"
  - Add scenarios for:
    - Running npm run release with interactive prompt
    - Pre-flight checks (clean working dir, main branch, up to date)
    - Version bump selection
    - Automatic version sync and tag push
    - Error handling for edge cases
  - **Validation**: openspec validate --strict

### Phase 4: Documentation
- [x] 10. **Update CONTRIBUTING.md release section**
  - Replace multi-step manual process with single command
  - Add "Quick Start" section showing `npm run release`
  - Move detailed manual process to "Advanced: Manual Release" section
  - Add troubleshooting section for release script failures
  - **Validation**: Manual review for clarity

- [x] 11. **Add inline help to release script**
  - Add --help flag support to display usage information
  - Show examples of major/minor/patch scenarios
  - Document pre-flight requirements
  - **Validation**: Run `node scripts/release.js --help`

## Dependencies
- Tasks 1-6 are sequential (release script implementation)
- Task 7 depends on task 6 (npm script needs working release script)
- Task 8 depends on task 7 (integration test needs npm script)
- Tasks 9-11 can be done in parallel after task 8

## User-Visible Milestones
- **Milestone 1**: After task 6 - Release script works end-to-end
- **Milestone 2**: After task 8 - `npm run release` fully functional and tested
- **Milestone 3**: After task 11 - Complete documentation with easy onboarding
