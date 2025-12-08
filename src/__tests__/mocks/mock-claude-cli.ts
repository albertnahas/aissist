#!/usr/bin/env node

/**
 * Mock Claude CLI for E2E testing
 *
 * This script mimics the behavior of the Claude Code CLI for testing purposes.
 * It responds to the same arguments and produces predictable output for testing.
 */

import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);

// Extract flags
const allowedToolsIndex = args.indexOf('--allowedTools');
const allowedTools = allowedToolsIndex !== -1 ? args[allowedToolsIndex + 1] : '';

// Model selection via --model flag is supported but not currently used in responses

const promptIndex = args.indexOf('-p');
const promptArg = promptIndex !== -1 ? args[promptIndex + 1] : null;

// Read prompt from stdin if not provided via -p flag
async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk.toString();
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

// Generate mock responses based on the prompt content
function generateResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  // Handle recall/search queries
  if (lowerPrompt.includes('recall') || lowerPrompt.includes('search') || lowerPrompt.includes('memory')) {
    if (lowerPrompt.includes('productivity') || lowerPrompt.includes('goals')) {
      return `Based on the memory files, I found several entries related to productivity:

- **2024-01-15**: You set a goal to improve your daily productivity by implementing time-blocking.
- **2024-01-20**: Logged a reflection about how the Pomodoro technique has been helping with focus.
- **2024-01-25**: Completed a task to set up automated reminders for breaks.

The files indicate you've been consistently working on productivity improvements over the past month.`;
    }

    if (lowerPrompt.includes('projects') || lowerPrompt.includes('work')) {
      return `Found work-related entries:

- **2024-02-01**: Started project "api-refactor" to improve backend performance.
- **2024-02-10**: Completed initial design phase for the API refactor.
- **2024-02-15**: Noted in history that code review process was implemented.

Your work history shows steady progress on technical projects.`;
    }

    // Generic recall response
    return `I searched through your memory files but couldn't find specific information matching your query. The memory includes goals, history entries, and reflections from various dates.`;
  }

  // Handle propose/planning queries
  if (lowerPrompt.includes('propose') || lowerPrompt.includes('actionable') || lowerPrompt.includes('todo')) {
    return `Based on the context provided, here are actionable next steps:

1. **Review current goals** - Assess progress on active goals and adjust priorities if needed
2. **Document recent work** - Log any unrecorded accomplishments from the past week
3. **Plan next sprint** - Identify 2-3 key objectives for the upcoming week
4. **Schedule reflection time** - Set aside 15 minutes for a weekly reflection session

These items will help maintain momentum and ensure alignment with your broader objectives.`;
  }

  // Handle codename generation
  if (lowerPrompt.includes('codename') || lowerPrompt.includes('kebab-case identifier')) {
    const goalMatch = prompt.match(/Goal: (.+)/);
    if (goalMatch) {
      const goalText = goalMatch[1].trim();
      // Generate a simple codename from the goal text
      const codename = goalText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .slice(0, 3)
        .join('-');
      return codename;
    }
    return 'test-goal';
  }

  // Handle smart history enhancement
  if (lowerPrompt.includes('minimal text editor') || lowerPrompt.includes('personal history log')) {
    const inputMatch = prompt.match(/Input text: "(.+?)"/);
    const inputText = inputMatch ? inputMatch[1] : 'Enhanced text';

    // Simple text cleanup simulation
    let enhancedText = inputText
      .replace(/fixd/gi, 'Fixed')
      .replace(/implmented/gi, 'Implemented')
      .replace(/featur/gi, 'feature')
      .replace(/usr/gi, 'user')
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize first letter
    enhancedText = enhancedText.charAt(0).toUpperCase() + enhancedText.slice(1);

    // Check for goal matching
    let goalCodename: string | null = null;
    const goalsMatch = prompt.match(/Active Goals.*?:\n([\s\S]*?)(?=\n\nInstructions|$)/);
    if (goalsMatch) {
      const goalsText = goalsMatch[1];
      // Simple keyword matching for testing
      if (lowerPrompt.includes('performance') || lowerPrompt.includes('optim')) {
        const perfGoalMatch = goalsText.match(/- ([a-z0-9-]+):/i);
        if (perfGoalMatch && goalsText.toLowerCase().includes('performance')) {
          goalCodename = perfGoalMatch[1];
        }
      }
      if (lowerPrompt.includes('auth') || lowerPrompt.includes('login')) {
        const authGoalMatch = goalsText.match(/- ([a-z0-9-]+):.*?auth/i);
        if (authGoalMatch) {
          goalCodename = authGoalMatch[1];
        }
      }
    }

    return JSON.stringify({
      text: enhancedText,
      goal: goalCodename
    });
  }

  // Default response for unknown prompts
  return `I've processed your request. This is a mock response for testing purposes.`;
}

// Main execution
async function main() {
  try {
    // Get the prompt
    const prompt = promptArg || await readStdin();

    // If using file tools (Grep, Read, Glob), simulate file reading
    if (allowedTools && allowedTools.includes('Grep,Read,Glob')) {
      const cwd = process.cwd();

      // Check if we're in a test environment with .aissist directory
      const aissistPath = path.join(cwd, '.aissist');
      if (fs.existsSync(aissistPath)) {
        // Simulate reading files and searching
        const response = generateResponse(prompt);
        console.log(response);
        process.exit(0);
      }
    }

    // Generate appropriate response
    const response = generateResponse(prompt);
    console.log(response);
    process.exit(0);
  } catch (error) {
    console.error('Mock Claude CLI error:', error);
    process.exit(1);
  }
}

main();
