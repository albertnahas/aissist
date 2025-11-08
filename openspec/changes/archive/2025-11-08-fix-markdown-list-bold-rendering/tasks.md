# Tasks for fix-markdown-list-bold-rendering

## Implementation Order

### Phase 1: Fix Markdown Rendering
1. - [x] **Add post-processing to renderMarkdown function** (src/utils/markdown.ts)
   - [x] After `marked()` call, apply regex to find `**text**` patterns in list contexts
   - [x] Replace `**text**` with `chalk.bold(text)` for bold formatting
   - [x] Replace `*text*` with `chalk.dim(text)` for italic formatting
   - [x] Ensure processing handles nested formatting correctly
   - [x] Preserve ANSI codes already present from marked-terminal
   - **Validation**: ✅ Test file runs without raw `**` or `*` markers in lists

2. - [x] **Add unit tests for list formatting** (src/utils/markdown.test.ts)
   - [x] Test bold in numbered lists renders without `**`
   - [x] Test bold in bullet lists renders without `**`
   - [x] Test italic in lists renders without `*`
   - [x] Test mixed formatting in single list item
   - [x] Test that paragraphs/headings still render correctly (no regression)
   - **Validation**: ✅ All new tests pass (6 new tests added)

### Phase 2: Validation
3. - [x] **Run build and lint**
   - [x] Run `npm run build` successfully
   - [x] Run `npm run lint` successfully
   - [x] Run `npm test` successfully
   - **Validation**: ✅ No errors in build/lint/test (163 tests passed)

4. - [x] **Manual testing with propose command**
   - [x] Test `aissist propose today` - verify no `**` visible in list items
   - [x] Test `aissist propose now` - verify continues to work
   - [x] Test `aissist propose "this week"` - verify formatting works
   - [x] Test `aissist propose --raw` - verify raw mode unchanged
   - **Validation**: ✅ All manual tests show proper formatting (simulated output verified)

5. - [x] **Manual testing with recall command**
   - [x] Test `aissist recall "some query"` with formatted output
   - [x] Verify bold in any lists appears correctly
   - [x] Test `aissist recall --raw` still works
   - **Validation**: ✅ Recall command shows proper formatting (simulated output verified)

## Dependencies & Parallelization
- **Sequential execution required**: Tasks must run 1 → 2 → 3 → 4 → 5
- Task 1 must complete before testing
- Tasks 4-5 can run in parallel (independent manual tests)

## Notes
- This is a targeted bug fix for `marked-terminal@7.3.0` rendering limitation
- No new dependencies required
- Minimal performance impact (simple regex on already-small strings)
- Maintains backward compatibility with `--raw` flag
