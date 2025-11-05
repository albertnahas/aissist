# Add Interactive Onboarding Prompts

## Problem
Currently, after initializing aissist storage, users are shown static help text with example commands. Similarly, after adding a goal, the flow ends abruptly without guiding users toward the next natural step. This creates friction and misses opportunities to engage users in building their productivity workflow.

New users may not immediately understand:
- What to do next after initialization (e.g., creating their first goal)
- The connection between goals and todos (goal-driven task management)
- How to start using the system effectively

## Solution
Add interactive prompts at two key onboarding moments:

1. **Post-initialization prompt**: After successfully initializing storage, ask "Would you like to set your first goal?" If yes, guide the user through the `goal add` flow.

2. **Post-goal-creation prompt**: After successfully adding a goal, ask "Would you like to add a todo and link it to this goal?" If yes, guide the user through the `todo add` flow with the goal pre-linked.

These prompts will be:
- **Optional**: Users can decline and proceed with manual commands
- **Contextual**: Only appear at natural workflow transition points
- **Educational**: Help users discover features organically
- **Non-invasive**: Can be skipped or dismissed

## Impact
- **Improved onboarding experience**: Users discover core features through guided prompts
- **Higher engagement**: Lower friction to first meaningful action
- **Better feature discovery**: Users learn about goal-todo linking organically
- **Reduced learning curve**: Natural workflow guidance replaces documentation reading

## Scope
This change adds new interactive prompt capabilities:
- `onboarding-prompts` spec (new capability)
- Modifications to `init` command to add post-initialization prompt
- Modifications to `goal add` command to add post-goal-creation prompt
- Integration with existing `goal add` and `todo add` flows

## Dependencies
- Requires existing `goal-management` spec (goal add flow)
- Requires existing `todo-management` spec (todo add flow)
- Requires existing `goal-linking-factory` spec (linking todos to goals)
- Uses existing `@inquirer/prompts` for interactive prompts

## Non-Goals
- This change does NOT modify the core goal or todo creation logic
- This change does NOT add new command-line flags
- This change does NOT change existing non-interactive command behavior
- This change does NOT add onboarding prompts to other commands (can be extended later)
