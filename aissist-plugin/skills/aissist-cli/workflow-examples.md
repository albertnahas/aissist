# Aissist Workflow Examples

Real-world workflows and usage patterns for effective use of aissist.

## Table of Contents
- [Getting Started](#getting-started)
- [Daily Workflow](#daily-workflow)
- [Goal-Driven Workflow](#goal-driven-workflow)
- [Context-Specific Workflows](#context-specific-workflows)
- [Reflection and Planning](#reflection-and-planning)
- [GitHub Integration](#github-integration)
- [Multi-Goal Coordination](#multi-goal-coordination)
- [Deadline Management](#deadline-management)

---

## Getting Started

### First-Time Setup with Interactive Onboarding

When initializing aissist for the first time, the CLI guides you through creating your first goal and todo:

```bash
# Initialize storage
aissist init

# Interactive prompts:
# 1. "Would you like to set your first goal?" → Enter goal text
# 2. "Enter deadline (default: Tomorrow):" → Accept default or customize
# 3. "Would you like to add a todo and link it to this goal?" → Enter todo text
# 4. "Enter priority (default: medium):" → Set priority level
```

**Example session:**
```
$ aissist init
✓ Initialized aissist storage at: /Users/you/.aissist
ℹ You can now start tracking your goals, history, context, and reflections!

? Would you like to set your first goal? (Y/n) y
? Enter your goal: Learn TypeScript
✓ Goal added with codename: learn-typescript
ℹ Deadline: 2025-11-06

? Would you like to add a todo and link it to this goal? (Y/n) y
? Enter your todo: Complete TypeScript handbook
? Enter priority (default: medium): high
✓ Todo added with priority 5 and linked to goal: learn-typescript
```

**Tips:**
- Press Enter to accept defaults (quick setup)
- Type specific values for custom deadlines/priorities
- Press Ctrl+C to skip prompts and use commands manually
- Prompts only appear in interactive terminals (not in scripts/CI)

---

## Daily Workflow

### Morning Routine

Start your day by reviewing and planning tasks:

```bash
# 1. Review active goals
aissist goal list

# 2. Check today's todos
aissist todo list

# 3. Add new todos based on priorities
aissist todo add "Code review for PR #156" --priority high
aissist todo add "Update documentation" --goal improve-docs
aissist todo add "Team standup at 10am"
```

**Why this works:** Clear morning plan sets daily direction and links work to bigger goals.

### During the Day

Track progress as you work:

```bash
# Mark todos as complete (automatically logs to history)
aissist todo done "Code review for PR #156"

# Log ad-hoc accomplishments
aissist history log "Fixed critical bug in auth module" --goal fix-authentication

# Add context-specific notes
aissist context log work "Team decided to use JWT for authentication"
```

### Evening Routine

Review and reflect on your day:

```bash
# 1. Complete remaining todos
aissist todo done "Update documentation"

# 2. Log any untracked work
aissist history log "Helped Sarah debug deployment issue"

# 3. Review what you accomplished
aissist history show --from today

# 4. Plan tomorrow (optional)
aissist todo add "Continue with authentication testing"
```

---

## Goal-Driven Workflow

### Setting Up a New Goal

Complete workflow from goal creation to completion:

```bash
# 1. Create the goal with deadline
aissist goal add "Master React Testing Library" --deadline "end of month"

# Output: Created goal with codename 'master-react-testing-library'
# Interactive prompt: "Would you like to add a todo and link it to this goal?"
#   - If yes: Enter first todo immediately with goal pre-linked
#   - If no: Add todos manually later

# 2. Break down into todos (if not added via prompt)
aissist todo add "Read React Testing Library docs" --goal master-react-testing-library
aissist todo add "Complete Jest testing tutorial" --goal master-react-testing-library
aissist todo add "Write tests for user component" --goal master-react-testing-library
aissist todo add "Refactor existing tests" --goal master-react-testing-library

# 3. Work on todos and log progress
aissist todo done "Read React Testing Library docs"
# Automatically creates history entry linked to goal

# 4. Log additional progress
aissist history log "Watched 2-hour video on testing patterns" --goal master-react-testing-library

# 5. Check progress regularly
aissist history show --goal master-react-testing-library
aissist recall "progress on React testing"

# 6. Complete the goal
aissist goal complete master-react-testing-library
```

### Tracking Multiple Goals

Manage several goals simultaneously:

```bash
# Set up multiple goals
aissist goal add "Learn TypeScript" --deadline "2024-12-31"
aissist goal add "Build portfolio website" --deadline "next month"
aissist goal add "Contribute to open source" --priority high

# View all goals
aissist goal list

# Work on specific goal
aissist todo list --goal learn-typescript
aissist todo add "Complete TypeScript handbook" --goal learn-typescript

# Review progress across all goals
aissist recall "what progress have I made on my goals?"
```

---

## Context-Specific Workflows

### Work Project Tracking

Track work-related information separately:

```bash
# Sprint planning
aissist context log work "Sprint 23 goals: Authentication, User profiles, API optimization"

# Daily standups
aissist context log work "Standup: Working on auth module, blocked on API key issue"

# Meeting notes
aissist context log work "Team meeting: Decided to use PostgreSQL for user data"

# Review work context
aissist context show work --from "this week"

# Link work to goals
aissist history log "Completed authentication module" --goal build-user-system
```

### Fitness Tracking

Track workouts and progress:

```bash
# Log workouts
aissist context log fitness "Morning run: 5km in 28 minutes"
aissist context log fitness "Gym session: Upper body, 45 mins"

# Set fitness goal
aissist goal add "Run 10k under 50 minutes" --deadline "end of quarter"

# Track progress toward goal
aissist history log "Completed 7km run in 35 minutes" --goal run-10k-under-50-minutes

# Review progress
aissist context show fitness --from "this month"
aissist recall "my fitness progress this month"
```

### Meal Planning

Track diet and meal prep:

```bash
# Weekly meal prep
aissist context log diet "Meal prep for week: Chicken breast, brown rice, broccoli, sweet potato"

# Daily meals
aissist context log diet "Breakfast: Oatmeal with berries and almonds"
aissist context log diet "Lunch: Grilled chicken salad"

# Link to health goal
aissist goal add "Eat healthy for 30 days" --deadline "end of month"
aissist history log "Completed day 5 of healthy eating" --goal eat-healthy-for-30-days

# Track progress
aissist context show diet --from "this week"
```

### Learning Projects

Organize learning resources and progress:

```bash
# Create context for learning topic
aissist context log rust-learning "Key concepts: Ownership, borrowing, lifetimes"
aissist context log rust-learning "Resource: The Rust Programming Language book, Chapter 4"

# Set learning goal
aissist goal add "Complete Rust beginner course" --deadline "next month"

# Log study sessions
aissist history log "Completed ownership chapter exercises" --goal complete-rust-beginner-course
aissist history log "Built first CLI tool in Rust" --goal complete-rust-beginner-course

# Review learning
aissist context show rust-learning
aissist recall "what have I learned about Rust ownership?"
```

---

## Reflection and Planning

### Weekly Reflection Workflow

End-of-week review and planning:

```bash
# 1. Review the week
aissist history show --from "this week"

# 2. Reflect on the week
aissist reflect --from "this week"
# Interactive prompts:
# - What did you accomplish?
# - What challenges did you face?
# - What did you learn?
# - What are you grateful for?
# - What will you focus on next?

# 3. Get AI-powered proposals
aissist propose "next week"

# 4. Plan next week based on proposals
aissist todo add "Focus on X based on this week's reflection"
aissist goal add "New goal inspired by reflection"

# 5. Review goals and adjust priorities
aissist goal list
```

### Monthly Review

End-of-month comprehensive review:

```bash
# 1. Review all activity
aissist history show --from "this month"

# 2. Check goal progress
aissist goal list
aissist recall "what goals did I make progress on this month?"

# 3. Reflect on the month
aissist reflect --from "this month"

# 4. Plan next month
aissist propose "next month"

# 5. Set/adjust goals for next month
aissist goal add "New monthly goal"
aissist goal deadline existing-goal "end of next month"
```

### Project Post-Mortem

Reflect after completing a project:

```bash
# 1. Complete the goal
aissist goal complete build-portfolio-website

# 2. Review all project work
aissist history show --goal build-portfolio-website

# 3. Document learnings
aissist context log projects "Portfolio project learnings: Next.js, Tailwind, Vercel deployment"

# 4. Reflect on experience
aissist reflect
# Focus on: What went well? What would you do differently?

# 5. Apply learnings to future goals
aissist goal add "Build e-commerce site with Next.js"
# Use insights from portfolio project
```

---

## GitHub Integration

### Import GitHub Activity

Automatically log GitHub work as history:

```bash
# 1. Import today's GitHub activity
aissist history log --from github
# Prompts for timeframe, defaults to today

# 2. Import specific timeframe
aissist history log --from github
# Enter "this week" when prompted

# 3. Review imported history
aissist history show --from "today"
```

**What gets imported:**
- Commits with messages
- Pull requests (created, reviewed, merged)
- Semantic grouping of related changes

**Requirements:**
- GitHub CLI (`gh`) installed: `brew install gh`
- Authenticated: `gh auth login`

### Link GitHub Work to Goals

After importing, link to goals:

```bash
# 1. Import GitHub activity
aissist history log --from github

# 2. View what was imported
aissist history show --from today

# 3. Add goal-specific context
aissist history log "GitHub work was for authentication feature" --goal build-user-auth

# 4. Review goal progress including GitHub work
aissist recall "progress on user authentication goal"
```

---

## Multi-Goal Coordination

### Managing Dependencies Between Goals

Handle goals that depend on each other:

```bash
# Set up related goals
aissist goal add "Learn GraphQL" --priority high --deadline "end of month"
aissist goal add "Build API with GraphQL" --deadline "next month"
aissist goal add "Deploy GraphQL API to production" --deadline "two months"

# Track prerequisites
aissist context log learning "GraphQL must be learned before building API"

# Work on prerequisite goal first
aissist todo list --goal learn-graphql
aissist todo add "Complete GraphQL tutorial" --goal learn-graphql

# Once prerequisite is done, start next goal
aissist goal complete learn-graphql
aissist todo add "Set up GraphQL server" --goal build-api-with-graphql
```

### Parallel Goal Tracking

Work on multiple goals simultaneously:

```bash
# Morning: Focus on learning
aissist todo add "Read TypeScript chapter 5" --goal learn-typescript

# Afternoon: Focus on project
aissist todo add "Implement user authentication" --goal build-app

# Evening: Focus on fitness
aissist todo add "Evening run 5km" --goal improve-fitness

# Track different goals throughout day
aissist todo done "Read TypeScript chapter 5"
aissist todo done "Implement user authentication"
aissist todo done "Evening run 5km"

# Review progress on all goals
aissist goal list
aissist history show --from today
```

---

## Deadline Management

### Setting Realistic Deadlines

Approach to setting and managing deadlines:

```bash
# 1. Create goal with initial estimate
aissist goal add "Write technical blog post" --deadline "next Friday"

# 2. Break down into todos with time estimates
aissist todo add "Research topic (2 hours)" --goal write-technical-blog-post
aissist todo add "Write draft (3 hours)" --goal write-technical-blog-post
aissist todo add "Edit and revise (1 hour)" --goal write-technical-blog-post
aissist todo add "Create diagrams (1 hour)" --goal write-technical-blog-post

# 3. Track actual progress
aissist todo done "Research topic (2 hours)"
# Note: Took 3 hours in reality

# 4. Adjust deadline if needed
aissist goal deadline write-technical-blog-post "next Monday"

# 5. Complete and reflect
aissist goal complete write-technical-blog-post
aissist reflect
# Note: What made it take longer? Better estimation next time?
```

### Urgent vs Important

Manage priorities effectively:

```bash
# High priority, urgent deadline
aissist goal add "Fix production bug" --priority high --deadline "today"
aissist todo add "Debug production issue" --priority high --goal fix-production-bug

# Important, not urgent
aissist goal add "Refactor legacy code" --priority normal --deadline "end of quarter"
aissist todo add "Plan refactoring approach" --goal refactor-legacy-code

# Review by priority
aissist todo list --priority high
aissist goal list

# Daily focus on high priority items
aissist todo list
# Complete high priority todos first
```

### Deadline Warnings

Monitor approaching deadlines:

```bash
# Review all goals to see deadlines
aissist goal list

# Check goals due soon
aissist recall "what goals have upcoming deadlines?"

# Get proposals for urgent goals
aissist propose
# AI considers deadlines in proposals

# Adjust workload if overcommitted
aissist goal deadline some-goal "later date"
# Or remove less critical goals
aissist goal remove low-priority-goal
```

---

## Best Practices Summary

1. **Consistency is key** - Use aissist daily for best results
2. **Link everything** - Connect todos and history to goals
3. **Use contexts** - Separate work, personal, learning for clarity
4. **Reflect regularly** - Weekly reflections provide valuable insights
5. **Trust the process** - Let AI-powered recall and proposals guide you
6. **Start simple** - Begin with basic workflows, add complexity as needed
7. **Review and adjust** - Use `aissist recall` to see patterns and improve
