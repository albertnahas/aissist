---
description: Generate accomplishment report
argument-hint: [timeframe] [--purpose <type>] [--output <file>]
allowed-tools: Bash(aissist:*), Bash(npx aissist:*), Read, Write
---

# Generate Accomplishment Report

Create a professional, formatted report of your accomplishments suitable for brag documents, promotion cases, manager updates, or status reports.

## Usage

```
/aissist:report [timeframe] [--purpose <type>] [--output <file>]
```

## Arguments

- `timeframe` (optional): Time period to report on. Supports natural language like "today", "week", "month", "quarter", or ISO dates. Defaults to "today"
- `--purpose <type>` (optional): Report purpose that adjusts language and emphasis:
  - `promotion`: Leadership, impact, career growth focus
  - `manager-update`: Business value, deliverables, team collaboration
  - `brag-doc`: Personal achievements and skills developed
  - `status`: Concise bullet points for quick updates
  - `general` (default): Balanced, multi-purpose format
- `--output <file>` (optional): Save report to file instead of displaying
- `--context <name>` (optional): Include specific context in report

## Examples

```
/aissist:report week
/aissist:report quarter --purpose promotion
/aissist:report week --purpose manager-update
/aissist:report month --purpose brag-doc
/aissist:report --purpose status
/aissist:report month --output report.md
```

## What it does

This slash command orchestrates report generation by having Claude directly analyze your aissist data:

1. Check if aissist storage is initialized using `aissist path`
2. Determine the storage path for reading data files
3. Read and parse data from multiple sources within the specified timeframe:
   - History entries (from `history/*.md` files)
   - Completed goals (from `goals/finished/*.md` files)
   - Completed todos (extracted from history entries)
   - Context-specific notes (from `context/*.md` files if --context specified)
4. Aggregate and transform the raw data into professional language
5. Generate a formatted markdown report with sections appropriate to the data:
   - Key Accomplishments
   - Goals Completed
   - Skills Developed
   - Projects & Contributions
   - Productivity Metrics
6. Adapt language and emphasis based on the purpose parameter
7. Output the report or save to file if --output specified

**How it works:** Claude reads the markdown files directly and uses its understanding to:
- Parse dates and filter entries within the timeframe
- Transform technical logs into professional accomplishment statements
- Group related activities into cohesive achievements
- Extract skills and technologies mentioned
- Identify project contributions
- Format everything appropriately for the specified purpose (promotion, manager-update, etc.)

## Purpose-Based Formatting

Different purposes emphasize different aspects:

- **promotion**: Highlights leadership actions, team impact, strategic contributions, quantified results
- **manager-update**: Focuses on deliverables, blockers resolved, team collaboration, business value
- **brag-doc**: Emphasizes personal achievements, skills developed, challenges overcome, growth
- **status**: Provides concise bullet points for daily standups or quick updates
- **general**: Balanced tone suitable for multiple audiences

## Requirements

- aissist initialized (run `aissist init` first)
- Some history, goals, or todos logged within the timeframe
- Read access to aissist storage directory

## Tips

- Use `week` or `month` for regular updates
- Use `quarter` for promotion cases or performance reviews
- The `--purpose` flag significantly changes the language and emphasis
- Save important reports with `--output` for future reference
- Link work to goals for better categorization in reports
- Ask a follow-up question if the user wants to export this report in a file format or into an external source using MCP. 

---

$ARGUMENTS
