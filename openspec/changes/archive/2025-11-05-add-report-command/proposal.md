# Add Report Command

**Status:** PROPOSED
**Created:** 2025-11-05
**Type:** Feature Addition

## Problem Statement

Users need a way to generate professional, human-readable accomplishment reports from their aissist data. Currently, users must manually review history, goals, todos, and contexts to create reports for:

- Brag documents
- Promotion cases
- Performance reviews
- Manager updates
- Weekly/monthly summaries

There's no automated way to aggregate and format this data into a polished, shareable report.

## Proposed Solution

Add a new `report` command that:

1. **Aggregates data** from multiple sources (history, goals, todos, contexts)
2. **Filters by timeframe** (today, week, month, quarter, or custom dates)
3. **Adapts to purpose** (promotion, manager-update, brag-doc, status, general)
4. **Formats professionally** with clear sections and human-readable language
5. **Generates markdown** that's ready to share with managers or use in promotion cases

The command will create reports with sections like:
- Key Accomplishments
- Goals Completed
- Skills Developed
- Projects Worked On
- Contributions & Collaboration

**Purpose-Based Formatting:**
The `--purpose` parameter adjusts language and emphasis:
- **promotion**: Leadership, impact, career growth focus
- **manager-update**: Business value, deliverables, team collaboration
- **brag-doc**: Personal achievements and skills developed
- **status**: Concise bullet points for quick updates
- **general** (default): Balanced, multi-purpose format

## Why This Change?

**User Value:**
- Save time creating performance reviews and status updates
- Present work professionally for promotion cases
- Track progress systematically for career development
- Share achievements with managers in digestible format

**Alignment with Aissist Philosophy:**
- Leverages existing data structures (no new storage needed)
- Follows markdown-first approach
- Works offline (no AI required for basic reports)
- Modular command following established patterns

## Changes Required

### New Files
- `aissist-plugin/commands/report.md` - Slash command that invokes CLI

### Modified Files
- `aissist-plugin/skills/aissist-cli/SKILL.md` - Add report command to skill
- `aissist-plugin/skills/aissist-cli/command-reference.md` - Add report documentation

### New Specs
- `report-command` - Requirements for report generation and formatting

**Note:** This is a Claude Code slash command only (like `/log`). It calls the aissist CLI internally but is not registered as a separate CLI command. Users invoke it via `/report` in Claude Code.

## Implementation Approach

### Phase 1: Slash Command Integration
1. Create `/report` slash command in `aissist-plugin/commands/report.md`
2. Command invokes `aissist` CLI with appropriate parameters
3. Claude reads the generated report and presents it to the user
4. Supports all parameters: timeframe, purpose, output, context

### Phase 2: Enhanced Features (Optional)
1. Add AI-powered summarization via Claude
2. Interactive parameter selection
3. Customizable report templates

### Technical Considerations

**Data Sources:**
- History entries (`history/YYYY-MM-DD.md`)
- Completed goals (`goals/*.md` with status: completed)
- Completed todos (from history entries)
- Context logs (filtered by timeframe)

**Timeframe Parsing:**
- Reuse existing `parseNaturalDate()` utility
- Support: "today", "week", "month", "quarter", custom dates

**Output Format:**
```markdown
# Accomplishment Report
**Period:** [Timeframe]
**Generated:** [Date]

## Key Accomplishments
- [Achievement 1]
- [Achievement 2]

## Goals Completed
- [Goal name]: [Description]

## Skills Developed
- [Skill 1]
- [Skill 2]

## Projects & Contributions
- [Project 1]: [Details]
```

**Formatting Principles:**
- Non-technical language
- Action-oriented bullet points
- Quantifiable when possible
- Professional tone
- Clear section headings

## Success Metrics

- Users can generate reports in under 5 seconds
- Reports require minimal editing before sharing
- 80%+ of accomplishments are captured from data
- Format is appropriate for professional contexts

## Risks & Mitigations

**Risk:** Report may miss accomplishments not logged in aissist
**Mitigation:** Encourage consistent logging; add prompt for manual additions

**Risk:** Formatting may not suit all organizational cultures
**Mitigation:** Start with sensible defaults; add customization later

**Risk:** Large timeframes may create overwhelming reports
**Mitigation:** Implement smart summarization; default to manageable periods

## Open Questions

1. Should reports be saved automatically or printed to stdout?
2. Should we support custom templates?
3. Should we integrate AI summarization in v1 or defer to v2?
4. What's the maximum reasonable timeframe (1 year? all time?)

## Related Work

- History command provides raw data
- Goal command tracks progress
- Recall provides semantic search

Report command bridges the gap between data collection and professional presentation.
