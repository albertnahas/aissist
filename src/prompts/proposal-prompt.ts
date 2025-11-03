import { TimeframeResult } from '../utils/timeframe-parser.js';
import { ProposalData } from '../utils/data-aggregator.js';

export interface ProposalPromptOptions {
  timeframe: TimeframeResult;
  data: ProposalData;
  storagePath: string;
  tag?: string;
}

/**
 * Build a comprehensive prompt for Claude Code to generate actionable proposals
 */
export function buildProposalPrompt(options: ProposalPromptOptions): string {
  const { timeframe, data, storagePath, tag } = options;

  const sections: string[] = [];

  // Header section
  sections.push(`# Generate Actionable Proposals for ${timeframe.label}`);
  sections.push('');
  sections.push('You are an AI planning assistant helping the user plan their actions based on their goals, history, and reflections.');
  sections.push('');

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
  sections.push('3. **Generate 3-5 actionable proposals** for what the user should focus on during the specified timeframe');
  sections.push('4. **Prioritize** based on:');
  sections.push('   - Goal alignment and deadlines');
  sections.push('   - Recent patterns and momentum');
  sections.push('   - Reflection insights and lessons learned');
  sections.push('   - Timeframe constraints (short-term vs. long-term)');
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
  sections.push('');

  // Additional guidance
  sections.push('## Tips');
  sections.push('');
  sections.push('- Be specific and actionable (e.g., "Complete X by date Y" rather than "Work on X")');
  sections.push('- Consider the timeframe length (short-term vs. long-term planning)');
  sections.push('- Look for unfinished goals, recurring themes, and missed patterns');
  sections.push('- Balance ambition with realism based on the user\'s history');
  sections.push('- Surface insights from reflections that might inform better decisions');
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
