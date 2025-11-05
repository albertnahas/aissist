# Tasks for add-todo-priority-and-management

## Overview
Implementation order focuses on foundational storage changes first, then CLI interactions. Priority and management features can be developed in parallel after storage is ready.

---

## Phase 1: Storage & Data Model (Foundation)

### 1. Extend TodoEntry interface with priority field ✅
- [x] **WHAT**: Add `priority: number` field to `TodoEntry` interface in `src/utils/storage.ts:475`
- [x] **HOW**: Update the interface definition and set default value to 0
- [x] **VERIFY**: TypeScript compilation succeeds
- **PARALLEL**: Can proceed independently

### 2. Update todo parsing to extract priority ✅
- [x] **WHAT**: Modify `parseTodoEntries()` in `src/utils/storage.ts` to parse `(Priority: N)` from markdown
- [x] **HOW**:
  - Use regex to extract priority: `/\(Priority:\s*(\d+)\)/i`
  - Default to 0 if not found
  - Handle malformed values gracefully
- [x] **VERIFY**: Unit test parsing todos with/without priority
- **DEPENDS**: Task 1 (interface extension)

### 3. Update todo write operations to include priority ✅
- [x] **WHAT**: Modify functions that write todos (`appendToMarkdown`, `updateTodoText`, `updateTodoStatus`) to preserve/write priority
- [x] **HOW**:
  - Include `(Priority: N)` in markdown format when N > 0
  - Maintain order: Priority before Goal in metadata
  - Update `updateTodoText` to preserve priority
- [x] **VERIFY**: Manual test: add todo with priority, edit it, verify priority preserved
- **DEPENDS**: Task 1, Task 2

### 4. Add priority sorting helper function ✅
- [x] **WHAT**: Create `sortTodosByPriority(todos: TodoEntry[]): TodoEntry[]` utility
- [x] **HOW**: Sort by priority descending, then by timestamp ascending
- [x] **VERIFY**: Unit test with mixed priorities and timestamps
- **PARALLEL**: Can proceed independently after Task 1

---

## Phase 2: Priority CLI Integration

### 5. Add --priority flag to `todo add` command ✅
- [x] **WHAT**: Extend `todo add` command in `src/commands/todo.ts:25` with `--priority <number>` option
- [x] **HOW**:
  - Add option to commander: `.option('-p, --priority <number>', 'Set priority (higher = more urgent)', '0')`
  - Parse as integer and validate
  - Include priority in markdown entry format
- [x] **VERIFY**:
  - `aissist todo add "Test" --priority 5` creates todo with priority
  - `aissist todo add "Test"` creates todo with priority 0
- **DEPENDS**: Task 3

### 6. Update `todo list` to sort by priority ✅
- [x] **WHAT**: Modify `todo list` command in `src/commands/todo.ts:74` to sort before display
- [x] **HOW**:
  - Apply `sortTodosByPriority()` to entries before rendering
  - Update both plain and interactive modes
- [x] **VERIFY**:
  - Add todos with priorities 10, 5, 0, 8
  - Run `aissist todo list` and verify order: 10, 8, 5, 0
- **DEPENDS**: Task 4, Task 5

### 7. Display priority in todo list outputs ✅
- [x] **WHAT**: Update display logic to show priority values
- [x] **HOW**:
  - Plain mode: Show `(Priority: N)` inline
  - Interactive mode: Show `[P:N]` prefix with color coding
  - Color code: ≥5 red/yellow, <5 gray
- [x] **VERIFY**: Visual check in both plain and interactive modes
- **DEPENDS**: Task 6

---

## Phase 3: Interactive Management Interface

### 8-17. Interactive Management (Implemented as single comprehensive function) ✅
- [x] **WHAT**: Add complete interactive `todo manage` command with all CRUD operations
- [x] **HOW**:
  - Created `interactiveTodoManagement()` function with continuous loop
  - Todo selection interface with priority display and color coding
  - Action menu: Complete, Delete, Edit, Set Priority, Link Goal, Cancel
  - Navigation: Back exits, Cancel returns to list, ESC/Ctrl+C handled
  - Created `updateTodoPriority()` and `updateTodoGoal()` functions in storage.ts
- [x] **VERIFY**: All operations tested and working
  - ✓ Command launches and displays sorted todo list
  - ✓ Todo selection with formatted display (timestamp | priority | text | goal)
  - ✓ Complete action marks done, logs to history, plays animation
  - ✓ Delete action removes without history log
  - ✓ Edit action updates text, preserves priority and goal
  - ✓ Set Priority action updates priority and re-sorts list
  - ✓ Link Goal action adds/changes/removes goal links
  - ✓ Navigation and error handling work correctly
  - ✓ Continuous loop allows multiple operations per session

---

## Phase 4: Documentation & Polish

### 18. Update CLI help text ✅
- [x] **WHAT**: Add descriptions for new commands and options
- [x] **HOW**:
  - Update `todo add` description to mention `--priority`
  - Add `todo manage` command description
  - Update README or inline help
- [x] **VERIFY**: `aissist todo --help` shows updated info
  - ✓ `todo add` shows `-p, --priority <number>` option
  - ✓ `todo manage` appears in command list

### 19. Update CHANGELOG or docs ⏭️
- **WHAT**: Document new features
- **HOW**: Add entry describing priority and manage features
- **VERIFY**: Documentation is clear and accurate
- **NOTE**: Deferred - can be done when archiving the change

### 20. Manual end-to-end testing ✅
- [x] **WHAT**: Full workflow test
- [x] **HOW**:
  - Add multiple todos with varying priorities
  - Run `todo list` and verify sorting
  - Run `todo manage` and test each action
  - Verify backward compatibility (old todos work)
- [x] **VERIFY**: All user stories from proposal work as expected
  - ✓ Added todos with priorities 10, 5, 1, 0
  - ✓ List displays in correct order (10 → 5 → 1 → 0)
  - ✓ Plain mode shows priority inline
  - ✓ Interactive mode shows [P:N] prefix
  - ✓ File format correct: `(Priority: N)` stored before `(Goal:)`
  - ✓ Backward compatible: todos without priority work (default 0)

---

## Dependencies Summary

```
1 (interface) → 2 (parsing), 3 (writing), 4 (sorting)
3 → 5 (add command)
4, 5 → 6 (list sorting)
6 → 7 (display)
6 → 8 (manage skeleton)
8 → 9 (selection)
9 → 10 (action menu)
10 → 11, 12, 13, 14, 15, 16 (all actions, parallelizable)
11-16 → 17 (loop)
17 → 18, 19, 20 (docs & testing)
```

---

## Parallelization Opportunities

- After Task 1: Tasks 2, 3, 4 can proceed concurrently
- After Task 10: Tasks 11, 12, 13, 14, 15, 16 can proceed concurrently (6 parallel streams)

---

## Testing Strategy

- **Unit tests**: Priority parsing, sorting logic, storage functions
- **Integration tests**: Command execution with various flags
- **Manual tests**: Interactive UI workflows, visual display checks
- **Regression tests**: Verify old todos without priority still work
