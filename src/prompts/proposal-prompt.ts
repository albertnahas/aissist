import { TimeframeResult } from '../utils/timeframe-parser.js';
import { ProposalData } from '../utils/data-aggregator.js';

export interface ProposalPromptOptions {
  timeframe: TimeframeResult;
  data: ProposalData;
  storagePath: string;
  tag?: string;
  goalInfo?: {
    codename: string;
    text: string;
    description: string | null;
    deadline: string | null;
  };
}

/**
 * Build a comprehensive prompt for Claude Code to generate actionable proposals
 */
export function buildProposalPrompt(options: ProposalPromptOptions): string {
  const { timeframe, data, storagePath, tag, goalInfo } = options;

  const sections: string[] = [];

  // Detect "now" mode for immediate action
  const isNowMode = timeframe.label === 'Right Now';

  // Detect timeframe mode for goal-focused planning
  const isTimelessMode = timeframe.label === 'Comprehensive Plan';
  const isDeadlineMode = goalInfo?.deadline && timeframe.label.startsWith('Now until');

  // Header section
  sections.push(`# Generate Actionable Proposals for ${timeframe.label}`);
  sections.push('');
  sections.push('You are an AI planning assistant helping the user plan their actions based on their goals, history, and reflections.');
  sections.push('');

  // Goal Focus section (if goal is specified)
  if (goalInfo) {
    sections.push('## Goal Focus');
    sections.push('');
    sections.push(`**The user wants proposals specifically focused on advancing this goal:**`);
    sections.push('');
    sections.push(`- **Goal**: ${goalInfo.text} (${goalInfo.codename})`);
    if (goalInfo.description) {
      sections.push(`- **Description**: ${goalInfo.description}`);
    }
    if (goalInfo.deadline) {
      sections.push(`- **Deadline**: ${goalInfo.deadline}`);
    }
    sections.push('');

    if (isTimelessMode) {
      sections.push('**Important**: This goal has no deadline. Generate a comprehensive, strategic plan that focuses on:');
      sections.push('- Breaking the goal into logical milestones and phases');
      sections.push('- Identifying dependencies and prerequisites');
      sections.push('- Creating a roadmap regardless of time constraints');
      sections.push('- Prioritizing based on logical sequence, not urgency');
    } else if (isDeadlineMode) {
      sections.push('**Important**: This proposal should work backward from the goal deadline. Focus on:');
      sections.push('- What needs to be accomplished by the deadline');
      sections.push('- Critical path items and dependencies');
      sections.push('- Time-sensitive milestones within the timeframe');
      sections.push('- Realistic pacing to meet the deadline');
    } else {
      sections.push('**Important**: Prioritize proposals that directly advance this specific goal within the given timeframe.');
      sections.push('- All proposals should clearly contribute to achieving this goal');
      sections.push('- Consider both immediate actions and longer-term steps');
      sections.push('- Reference the goal context when explaining your recommendations');
    }
    sections.push('');
  }

  // Context section
  sections.push('## Context');
  sections.push(`- **Timeframe**: ${timeframe.label}`);
  sections.push(`- **Storage Path**: ${storagePath}`);
  if (tag) {
    sections.push(`- **Focus Tag**: #${tag}`);
  }
  sections.push('');

  // Data summary section
  sections.push('## Available Data');
  sections.push('');
  sections.push('The user has stored the following data in their `.aissist/` directory:');
  sections.push('');
  sections.push(`- **Goals**: ${data.goals.length} file(s) in \`goals/\``);
  sections.push(`- **History Logs**: ${data.history.length} file(s) in \`history/\``);
  sections.push(`- **Reflections**: ${data.reflections.length} file(s) in \`reflections/\``);
  if (data.context.length > 0) {
    sections.push(`- **Context Files**: ${data.context.length} file(s) in \`context/\``);
  }
  sections.push('');

  // Instructions section
  sections.push('## Your Task');
  sections.push('');
  sections.push('1. **Analyze** the user\'s goals, history, and reflections using the `Read` and `Grep` tools');
  sections.push('2. **Identify patterns** in their activities, progress, and challenges');

  if (isNowMode) {
    sections.push('3. **Generate exactly 1 actionable proposal** for what the user should do RIGHT NOW (within the next 1-2 hours)');
    sections.push('4. **Prioritize** based on:');
    sections.push('   - **Urgency**: What needs attention immediately');
    sections.push('   - **Feasibility**: Can be completed in 1-2 hours');
    sections.push('   - **Impact**: Makes meaningful progress on goals');
    sections.push('   - **Current momentum**: Aligns with recent activity patterns');
  } else {
    sections.push('3. **Generate 3-5 actionable proposals** for what the user should focus on during the specified timeframe');
    sections.push('4. **Prioritize** based on:');
    sections.push('   - Goal alignment and deadlines');
    sections.push('   - Recent patterns and momentum');
    sections.push('   - Reflection insights and lessons learned');
    sections.push('   - Timeframe constraints (short-term vs. long-term)');
  }
  sections.push('');

  // Tool usage guidance
  sections.push('## How to Use Tools');
  sections.push('');
  sections.push('You have access to `Grep`, `Read`, and `Glob` tools:');
  sections.push('');
  sections.push('- Use `Glob` to discover files: `goals/*.md`, `history/*.md`, `reflections/*.md`');
  sections.push('- Use `Grep` to search for keywords across files');
  sections.push('- Use `Read` to analyze specific files in detail');
  sections.push('');
  sections.push('Start by exploring the directory structure, then read relevant files to understand the user\'s situation.');
  sections.push('');

  // Output format section
  sections.push('## Output Format');
  sections.push('');
  sections.push('Please structure your response as follows:');
  sections.push('');

  if (isNowMode) {
    sections.push('```');
    sections.push('🎯 Proposed Plan for Right Now:');
    sections.push('');
    sections.push('▶️ [Single actionable item that can be completed in 1-2 hours]');
    sections.push('');
    sections.push('[Brief context: Why this is the most urgent/important immediate action]');
    sections.push('```');
  } else {
    sections.push('```');
    sections.push('🎯 Proposed Plan for [Timeframe]:');
    sections.push('');
    sections.push('1. [First actionable proposal]');
    sections.push('2. [Second actionable proposal]');
    sections.push('3. [Third actionable proposal]');
    sections.push('4. [Fourth actionable proposal] (optional)');
    sections.push('5. [Fifth actionable proposal] (optional)');
    sections.push('');
    sections.push('[Optional: Brief reasoning or context for your recommendations]');
    sections.push('```');
  }
  sections.push('');

  // Additional guidance
  sections.push('## Tips');
  sections.push('');

  if (isNowMode) {
    sections.push('- Be **extremely specific** about the single action (e.g., "Draft introduction section for API docs" not "Work on documentation")');
    sections.push('- Focus on **immediate feasibility** - can this realistically be done in 1-2 hours?');
    sections.push('- Choose the **most urgent** item based on deadlines, blockers, or momentum');
    sections.push('- Consider what gives the **best immediate return** on time invested');
    sections.push('- If multiple urgent items exist, pick the one that **unblocks other work** or has the nearest deadline');
  } else {
    sections.push('- Be specific and actionable (e.g., "Complete X by date Y" rather than "Work on X")');
    sections.push('- Consider the timeframe length (short-term vs. long-term planning)');
    sections.push('- Look for unfinished goals, recurring themes, and missed patterns');
    sections.push('- Balance ambition with realism based on the user\'s history');
    sections.push('- Surface insights from reflections that might inform better decisions');
  }
  sections.push('');

  // Edge case: no data
  if (data.goals.length === 0 && data.history.length === 0 && data.reflections.length === 0) {
    sections.push('## Important Note');
    sections.push('');
    sections.push('⚠️ The user has very limited data. Please acknowledge this and provide general productivity suggestions.');
    sections.push('');
  }

  return sections.join('\n');
}
