# Add Goal-Focused Proposals with Dynamic Timeframe

## Why

Currently, when users run `aissist propose --goal <codename>`, the `--goal` flag only affects metadata when saving proposals—it doesn't influence what Claude generates. The AI receives no information about which goal the user wants to focus on, leading to generic proposals that may not align with the specific goal.

Additionally, users cannot generate proposals bounded by a goal's deadline. If a goal has a deadline of December 31st, users should be able to ask "what should I do between now and that deadline?" without manually calculating timeframes.

**Problems:**
1. `--goal` flag is metadata-only; Claude doesn't know to focus on the specified goal
2. No way to generate proposals spanning "now until goal deadline"
3. Goals without deadlines can't be used for timeless strategic planning

## What Changes

**Simplified approach - make `--goal` smarter:**

When `--goal` is specified, the behavior changes based on whether a timeframe is also provided:

1. **`aissist propose --goal <codename>`** (no timeframe)
   - **With deadline**: Automatically use "now until deadline" timeframe
   - **Without deadline**: Timeless strategic planning
   - Prompt is goal-focused

2. **`aissist propose <timeframe> --goal <codename>`** (explicit timeframe)
   - Use the specified timeframe (e.g., "today", "this week")
   - Prompt is goal-focused within that timeframe
   - Goal deadline is informational context

3. **Goal-Focused Prompt Generation** (applies to both above)
   - Modify the prompt sent to Claude to explicitly mention the focused goal
   - Include goal details (text, description, deadline) in the prompt context
   - Instruct Claude to prioritize proposals that directly advance that specific goal

**Key insight:** No new "dynamic" keyword needed—just make `--goal` without a timeframe do the smart thing!

**Affected Files:**
- `src/commands/propose.ts` - Detect when `--goal` is used without timeframe; load goal and calculate timeframe
- `src/prompts/proposal-prompt.ts` - Add goal-focused prompt building
- `src/utils/storage.ts` - Add function to load goal details by codename
- `src/utils/timeframe-parser.ts` - (optional) Helper for calculating "now to deadline" timeframe

**Affected Specs:**
- `ai-planning` (MODIFIED) - Update proposal generation requirements
- New spec needed? Possibly `goal-focused-planning` if scope warrants it

## Impact

**User Impact:**
- Users get proposals actually focused on their specified goal
- Can ask "what do I need to do to achieve goal X by its deadline?"
- Strategic planning for goals without deadlines becomes possible
- More relevant, actionable proposals

**Technical Impact:**
- Minimal changes to existing flow
- Adds one new timeframe type (`dynamic`)
- Modifies prompt building to conditionally include goal context
- No breaking changes—existing commands work as before

## Scope

### In Scope
- Add `dynamic` timeframe parsing with goal deadline resolution
- Modify proposal prompt to include goal focus when `--goal` is specified
- Handle both deadline and non-deadline goals appropriately
- Error handling when `dynamic` is used without `--goal`
- Update help text and documentation

### Out of Scope
- Changing how goals are stored or structured
- Multi-goal proposals (focusing on multiple goals at once)
- Automatic goal detection without `--goal` flag
- UI/visualization of goal-proposal relationships
- Retrospective analysis of whether proposals achieved goals

## Dependencies

- Depends on existing goal storage format (codename, deadline, description)
- Depends on existing `linkToGoal` functionality for goal selection
- No new external dependencies required

## Examples

### Example 1: Goal with Deadline (Smart Default)
```bash
$ aissist propose --goal launch-product-hunt
# Goal: launch-product-hunt (Deadline: 2025-11-30)
# Timeframe: Now (Nov 8) until November 30, 2025 (auto-calculated)

🎯 Proposed Plan to achieve "launch-product-hunt":
1. Finalize product description and screenshots (by Nov 15)
2. Prepare launch announcement and first comment (by Nov 20)
3. Schedule launch for optimal time (by Nov 25)
4. Monitor and respond to feedback (Nov 30)
```

### Example 2: Goal without Deadline (Timeless Plan)
```bash
$ aissist propose --goal learn-rust
# Goal: learn-rust (No deadline - comprehensive plan)

🎯 Proposed Plan to achieve "learn-rust":
1. Complete Rust Book chapters 1-10 (foundational concepts)
2. Build 3 small CLI projects (hands-on practice)
3. Study ownership and borrowing deeply (core concepts)
4. Contribute to an open-source Rust project (real-world experience)
5. Build a production-ready application (capstone)
```

### Example 3: Explicit Timeframe with Goal Focus
```bash
$ aissist propose "this week" --goal learn-rust
# Goal: learn-rust (for context: no deadline)
# Timeframe: This week (Nov 8-14, 2025)

🎯 Proposed Plan for This Week (advancing "learn-rust"):
1. Read Rust Book chapters 3-4 (focus on ownership)
2. Complete 5 Rustlings exercises
3. Start building a simple CLI todo app
```

### Example 4: No Goal (Current Behavior - Unchanged)
```bash
$ aissist propose "today"
# No goal specified - general proposals

🎯 Proposed Plan for Today:
(Proposals based on all goals, history, and patterns)
```
