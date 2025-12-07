## 1. Progress File Infrastructure

- [x] 1.1 Add `ProgressFile` interface and schema to `src/utils/storage.ts`
- [x] 1.2 Implement `writeProgressFile()` with atomic write support
- [x] 1.3 Implement `readProgressFile()` with graceful error handling
- [x] 1.4 Add `sync` configuration schema to `ConfigSchema`

## 2. Goal Metadata Extension

- [x] 2.1 Add `parent_goal` field to `GoalEntry` interface
- [x] 2.2 Update `parseGoalEntryYaml()` to extract `parent_goal`
- [x] 2.3 Update `serializeGoalEntryYaml()` to include `parent_goal`
- [x] 2.4 Add `--parent` flag to `goal add` command

## 3. Progress Tracking

- [x] 3.1 Create progress tracking functions in storage.ts (addProgressNote, etc.)
- [x] 3.2 Implement `goal progress` subcommand for adding notes
- [x] 3.3 Add `goal show` subcommand to display progress notes
- [x] 3.4 Hook goal add/complete/update to update `progress.json`

## 4. Child Discovery & Aggregation

- [x] 4.1 Implement `discoverChildDirectories()` in storage utils
- [x] 4.2 Create `src/commands/sync.ts` with sync command
- [x] 4.3 Implement progress aggregation logic
- [x] 4.4 Add `children` key to progress file for aggregated data

## 5. Display & Validation

- [x] 5.1 Update `goal list` to show parent relationships
- [x] 5.2 Add parent goal validation with warning for missing parents
- [x] 5.3 Implement `sync` command output showing aggregated progress

## 6. Testing

- [x] 6.1 Unit tests for progress file read/write
- [x] 6.2 Unit tests for parent goal linkage parsing
- [x] 6.3 Unit tests for child discovery (discoverChildDirectories)
- [x] 6.4 Unit tests for addProgressNote

## 7. Documentation

- [x] 7.1 Update README with sync command documentation
- [x] 7.2 Update README with goal progress/show subcommands
- [x] 7.3 Add progress.json to Storage Structure section
