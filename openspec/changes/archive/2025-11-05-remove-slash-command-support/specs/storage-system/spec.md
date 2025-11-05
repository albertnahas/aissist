# storage-system Specification Delta

## MODIFIED Requirements

### Requirement: Storage Directory Structure
The system SHALL create and maintain a consistent directory structure for all storage locations.

#### Scenario: Initialize storage structure
- **WHEN** the user runs `aissist init`
- **THEN** the system creates the following directories:
  - config.json
  - goals/
  - history/
  - context/
  - reflections/

**Changes**: Removed `slash-commands/` directory from the storage structure. This directory will no longer be created or maintained during initialization.

**Rationale**: Slash-command support is being removed for future redesign. The feature was not widely used and adds unnecessary complexity to the storage layer. By removing it now, we simplify the codebase and reduce maintenance burden until a better integration approach is developed.

**Impact**: Users with existing `slash-commands/` directories will retain them, but they will no longer be updated or maintained by the system. This is a non-breaking change as the directory was optional and not relied upon by core functionality.
