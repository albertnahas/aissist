# Implementation Tasks

## 1. Timeframe Parsing Infrastructure
- [x] 1.1 Install `chrono-node` or `date-fns` for natural language date parsing
- [x] 1.2 Create `src/utils/timeframe-parser.ts` with `parseTimeframe()` function
- [x] 1.3 Implement parsing for "today", "this week", "next week", "tomorrow"
- [x] 1.4 Implement parsing for "this quarter", "next quarter", "YYYY QN" format
- [x] 1.5 Implement parsing for month names and "next month"
- [x] 1.6 Add error handling for invalid timeframes with helpful examples
- [ ] 1.7 Write unit tests for timeframe parsing edge cases

## 2. Data Aggregation Module
- [x] 2.1 Create `src/utils/data-aggregator.ts` with `loadProposalData()` function
- [x] 2.2 Implement goal file loading from `.aissist/goals/*.md`
- [x] 2.3 Implement history log loading with date range filtering
- [x] 2.4 Implement reflection file loading with date range filtering
- [x] 2.5 Add optional context file loading when `--context` flag is used
- [x] 2.6 Implement tag-based filtering logic for `--tag` option
- [x] 2.7 Add empty data detection and user guidance messages

## 3. Prompt Builder for Proposals
- [x] 3.1 Create `src/prompts/proposal-prompt.ts` with `buildProposalPrompt()` function
- [x] 3.2 Design prompt structure with timeframe, goals summary, history patterns, reflections
- [x] 3.3 Add instructions for Claude to generate 3-5 actionable proposals
- [x] 3.4 Include directory structure hints for Claude's file tools
- [x] 3.5 Add debug output option to print raw prompt

## 4. Propose Command Handler
- [x] 4.1 Create `src/commands/propose.ts` with command definition
- [x] 4.2 Register command in `src/index.ts` with commander
- [x] 4.3 Parse timeframe argument with default to "today"
- [x] 4.4 Implement `--reflect` flag to trigger reflection prompt before proposal
- [x] 4.5 Implement `--debug` flag to display prompt and data summary
- [x] 4.6 Implement `--context` flag to include context files
- [x] 4.7 Implement `--tag <focus>` option to filter by tag

## 5. Claude Code Integration for Proposals
- [x] 5.1 Extend Claude integration to support proposal generation use case
- [x] 5.2 Invoke Claude Code with `--allowedTools 'Grep,Read,Glob'` and proposal prompt
- [x] 5.3 Display spinner with "Analyzing your data..." message during execution
- [x] 5.4 Stream Claude's response and format output with proposal header
- [x] 5.5 Handle Claude Code unavailability with installation instructions
- [x] 5.6 Implement error handling for subprocess failures

## 6. Interactive Goal Saving
- [x] 6.1 Parse numbered proposal items from Claude's output
- [x] 6.2 Display prompt: "Want to save this as a new goal list? (Y/n)"
- [x] 6.3 On acceptance, create dated goal entries for each proposed item
- [x] 6.4 Use existing `goal add` logic to ensure consistency
- [x] 6.5 Display confirmation message with saved goal count
- [x] 6.6 Handle cancellation gracefully

## 7. Reflection Integration
- [x] 7.1 When `--reflect` flag is used, prompt user for reflection input
- [x] 7.2 Save reflection to `.aissist/reflections/YYYY-MM-DD.md` with timestamp
- [x] 7.3 Include saved reflection in data aggregation for proposal context

## 8. Output Formatting
- [x] 8.1 Format proposal output with emoji header: `🎯 Proposed Plan for <timeframe>:`
- [x] 8.2 Display numbered action items (1, 2, 3...)
- [x] 8.3 Include brief reasoning or context if provided by Claude
- [x] 8.4 Use chalk for colored output (green for success, yellow for warnings)

## 9. Testing and Validation
- [x] 9.1 Manual test with no existing data (empty state)
- [x] 9.2 Manual test with sample goals and history
- [x] 9.3 Test all timeframe expressions (today, this week, next quarter, etc.)
- [x] 9.4 Test all optional flags (--reflect, --debug, --context, --tag)
- [x] 9.5 Test interactive goal saving workflow
- [x] 9.6 Test error handling (Claude unavailable, invalid timeframe, etc.)
- [ ] 9.7 Update documentation with usage examples

## 10. Documentation
- [ ] 10.1 Add `propose` command to README with examples
- [ ] 10.2 Document all flags and options
- [ ] 10.3 Add example output screenshots or text samples
- [x] 10.4 Update help text in CLI
