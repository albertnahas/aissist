---
description: Import work history from GitHub
argument-hint: [timeframe]
allowed-tools: Bash(git:*), Bash(gh:*), Bash(aissist:*), Bash(npx aissist:*)
---

# Import GitHub Activity

Import your GitHub commits and pull requests as aissist history entries with semantic summarization.

## Usage

```
/aissist:log [timeframe]
```

## Arguments

- `timeframe` (optional): When to start logging from. Supports natural language like "today", "this week", "this month", or ISO dates like "2024-01-15"

## Examples

```
/aissist:log today
/aissist:log "this week"
/aissist:log "last month"
/aissist:log "2024-01-15"
```

## What it does

Before running, you should learn about how to use aissist for best outcomes. 

1. Prompts for timeframe if not provided (defaults to "today")
2. Authenticates with GitHub using `gh` CLI or prompts for token
3. Fetches your commits and pull requests within the timeframe
4. Checks my goals using `aissist goals list`.
5. Uses the `aissist history show` command to see what was already logged.
6. Semantically groups related changes
7. Logs summarized entries to your aissist history by using the `aissist history log` command for each (If it seems semantically related to a goal, it should also include it in the flags).

## Requirements

- GitHub CLI (`gh`) installed and authenticated, or GitHub personal access token
- aissist initialized (run `aissist init` first)

---

$ARGUMENTS
