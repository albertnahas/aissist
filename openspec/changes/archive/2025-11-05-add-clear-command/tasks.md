# Implementation Tasks

## Phase 1: Core Implementation

- [x] Create `src/commands/clear.ts` with basic command structure
  - Import required dependencies (commander, storage utilities, CLI utilities)
  - Define command with description and options
  - Export clearCommand function

- [x] Implement `clearStorage()` utility function in `src/utils/storage.ts`
  - Accept parameters: storagePath, hard mode flag
  - Return list of deleted items and any errors
  - Handle both content deletion and hard delete modes
  - Note: Implemented directly in clear.ts as it's command-specific

- [x] Implement interactive confirmation prompt
  - Display storage path being cleared
  - Show clear warning about data loss
  - Handle user response (y/n)
  - Include cancellation message

- [x] Implement basic deletion logic
  - Enumerate directories to delete (goals, history, context, reflections, todos, slash-commands)
  - Delete config.json file
  - Use fs.rm with recursive option for directories
  - Preserve .aissist directory unless --hard is specified

## Phase 2: Safety Features

- [x] Implement `--dry` flag functionality
  - Walk directory tree and collect file information
  - Calculate total size of data
  - Display formatted preview of what would be deleted
  - Skip actual deletion

- [x] Implement `--yes` flag functionality
  - Skip confirmation prompt when flag is present
  - Proceed directly to deletion
  - Still display what was deleted

- [x] Implement `--global` flag functionality
  - Override storage path resolution to use ~/.aissist/
  - Update confirmation message to indicate global storage
  - Ensure proper path handling

- [x] Implement `--hard` flag functionality
  - Add extra warning to confirmation prompt
  - Delete entire .aissist directory instead of contents
  - Update success message accordingly

## Phase 3: Error Handling & Edge Cases

- [x] Add storage existence check
  - Check if .aissist directory exists before proceeding
  - Display appropriate message if not found
  - Exit gracefully

- [x] Implement permission error handling
  - Catch EACCES and EPERM errors
  - Display clear permission error messages
  - Provide guidance on fixing permission issues

- [x] Implement partial failure handling
  - Track successful and failed deletions separately
  - Display detailed results if some files fail
  - Exit with error code on failures

- [x] Add validation for flag combinations
  - Ensure --dry doesn't require confirmation
  - Validate that --global targets correct path
  - Test all flag combinations

## Phase 4: Integration & Polish

- [x] Register command in `src/index.ts`
  - Import clearCommand
  - Add to program with addCommand()
  - Ensure proper placement in command list

- [x] Add appropriate CLI feedback
  - Use chalk for colored success/error messages
  - Consider ora spinner for deletion progress
  - Format file lists clearly

- [x] Update help text and descriptions
  - Write clear command description
  - Document all flags in help output
  - Include examples if possible

- [x] Test command integration
  - Verify command appears in `aissist --help`
  - Test with both local and global storage
  - Test all flag combinations
  - Test error scenarios

## Phase 5: Documentation (Optional)

- [ ] Update project README if it includes command list
- [ ] Add examples to documentation
- [ ] Update CHANGELOG if one exists

## Testing Checklist

- [x] `aissist clear` with confirmation
- [x] `aissist clear` with cancellation
- [x] `aissist clear --yes`
- [x] `aissist clear --dry`
- [x] `aissist clear --global`
- [x] `aissist clear --hard`
- [x] `aissist clear --hard --yes`
- [x] `aissist clear --dry --global`
- [x] Clear when no storage exists
- [x] Clear with permission errors
- [x] Clear followed by init
- [x] Verify .aissist preserved (non-hard mode)
- [x] Verify .aissist removed (hard mode)

Note: All core functionality has been implemented and tested. The command works as specified in the requirements.
