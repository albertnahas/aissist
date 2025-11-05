# clear-command Specification

## Purpose

Enable users to safely delete stored data from their `.aissist/` directory with interactive confirmation, dry-run preview, and support for both local and global storage modes. Provides a safe alternative to manual file deletion with comprehensive safety features including confirmation prompts, preview mode, and granular control over what gets deleted.
## Requirements
### Requirement: Basic Clear Command

The system SHALL provide a `clear` command that safely deletes storage data with interactive confirmation.

#### Scenario: Clear with interactive confirmation

- **WHEN** the user runs `aissist clear`
- **THEN** the system prompts for confirmation before deleting any data
- **AND** displays a warning message about data loss
- **AND** waits for explicit user confirmation (y/n)
- **AND** only proceeds with deletion if user confirms

#### Scenario: User cancels clear operation

- **WHEN** the user runs `aissist clear` and declines the confirmation prompt
- **THEN** the system displays a cancellation message
- **AND** exits without deleting any data

#### Scenario: Clear deletes expected directories and files

- **WHEN** the user runs `aissist clear` and confirms
- **THEN** the system deletes the following from the storage path:
  - `goals/` directory and all contents
  - `history/` directory and all contents
  - `context/` directory and all contents
  - `reflections/` directory and all contents
  - `todos/` directory and all contents
  - `config.json` file
- **AND** displays a success message indicating data was cleared

### Requirement: Non-Interactive Clear

The system SHALL support a `--yes` flag to skip confirmation prompts for automated use cases.

#### Scenario: Clear with --yes flag

- **WHEN** the user runs `aissist clear --yes`
- **THEN** the system deletes storage data without prompting for confirmation
- **AND** displays a success message

### Requirement: Dry-Run Mode

The system SHALL support a `--dry` flag that shows what would be deleted without actually deleting anything.

#### Scenario: Dry-run preview

- **WHEN** the user runs `aissist clear --dry`
- **THEN** the system displays a list of all files and directories that would be deleted
- **AND** displays the total size that would be freed
- **AND** does not delete any data
- **AND** does not prompt for confirmation

#### Scenario: Dry-run with actual file listing

- **WHEN** the user runs `aissist clear --dry` and the storage contains data
- **THEN** the system lists each file that exists with its size
- **AND** shows the total number of files and directories
- **AND** indicates which directories are empty

### Requirement: Global Storage Clearing

The system SHALL support a `--global` flag to explicitly clear global storage at `~/.aissist/`.

#### Scenario: Clear global storage

- **WHEN** the user runs `aissist clear --global`
- **THEN** the system targets `~/.aissist/` for clearing
- **AND** prompts for confirmation with a warning about global storage
- **AND** clears the global storage upon confirmation

#### Scenario: Clear detects current storage mode

- **WHEN** the user runs `aissist clear` without the `--global` flag
- **THEN** the system uses the current storage path (local if available, otherwise global)
- **AND** displays which storage path is being cleared in the confirmation prompt

### Requirement: Hard Delete Mode

The system SHALL support a `--hard` flag that removes the entire `.aissist/` directory instead of just its contents.

#### Scenario: Hard delete removes entire directory

- **WHEN** the user runs `aissist clear --hard`
- **THEN** the system prompts with an extra warning about complete removal
- **AND** deletes the entire `.aissist/` directory upon confirmation
- **AND** does not preserve the directory structure

#### Scenario: Hard delete requires confirmation

- **WHEN** the user runs `aissist clear --hard` without `--yes`
- **THEN** the system displays a warning that the entire directory will be removed
- **AND** requires explicit confirmation before proceeding

### Requirement: Error Handling

The system SHALL handle errors gracefully and provide clear feedback.

#### Scenario: Storage does not exist

- **WHEN** the user runs `aissist clear` and no `.aissist/` directory exists
- **THEN** the system displays a message that no storage directory was found
- **AND** exits without error

#### Scenario: Permission denied

- **WHEN** the user runs `aissist clear` and lacks permission to delete files
- **THEN** the system displays a clear error message about permission issues
- **AND** indicates which files could not be deleted
- **AND** exits with an appropriate error code

#### Scenario: Partial deletion failure

- **WHEN** the system successfully deletes some files but fails on others
- **THEN** it displays which files were deleted successfully
- **AND** displays which files failed with error reasons
- **AND** exits with an error code

### Requirement: Storage Path Preservation

The system SHALL preserve the `.aissist/` directory itself unless `--hard` is specified.

#### Scenario: Clear preserves directory structure

- **WHEN** the user runs `aissist clear` without `--hard` and confirms
- **THEN** the system deletes all contents of `.aissist/`
- **AND** keeps the `.aissist/` directory itself
- **AND** allows immediate use of other aissist commands

#### Scenario: User can init after clear

- **WHEN** the user runs `aissist clear` and then `aissist init`
- **THEN** the init command recreates the standard directory structure
- **AND** creates a new default config.json
- **AND** the storage is ready for use

