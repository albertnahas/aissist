import { spawn } from 'child_process';
import type { SearchMatch } from '../utils/search.js';

export interface ClaudeSessionStatus {
  available: boolean;
  authenticated: boolean;
  error?: string;
}

/**
 * Check if Claude CLI is available in PATH
 */
export async function checkClaudeCliAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('which', ['claude']);
    proc.on('close', (code) => {
      resolve(code === 0);
    });
    proc.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Check Claude Code session status (installed and authenticated)
 */
export async function checkClaudeCodeSession(): Promise<ClaudeSessionStatus> {
  // First check if Claude CLI is installed
  const isInstalled = await checkClaudeCliAvailable();
  if (!isInstalled) {
    return {
      available: false,
      authenticated: false,
      error: 'Claude Code not found. Install from: https://claude.ai/download',
    };
  }

  // For now, assume if Claude is installed, it's ready to use
  // We'll detect authentication errors when we actually try to use it
  return {
    available: true,
    authenticated: true,
  };
}

/**
 * Execute Claude CLI command with prompt via stdin
 */
async function executeClaudeCommand(prompt: string, timeoutMs: number = 30000, model?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use stdin for the prompt (better for long prompts than CLI args)
    // --allowedTools with empty string to disable all tools for security
    const args = ['--allowedTools', ''];

    // Add model selection if specified
    if (model) {
      args.push('--model', model);
    }

    const proc = spawn('claude', args);

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Set timeout
    const timeout = setTimeout(() => {
      timedOut = true;
      proc.kill();
      reject(new Error('Claude CLI timed out after 30 seconds'));
    }, timeoutMs);

    // Send prompt via stdin
    proc.stdin.write(prompt);
    proc.stdin.end();

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);

      if (timedOut) {
        return;
      }

      if (code === 0) {
        resolve(stdout.trim());
      } else {
        // Check for common error patterns
        if (stderr.includes('not authenticated') || stderr.includes('login')) {
          reject(new Error(
            'Claude CLI is not authenticated.\n' +
            'Please run: claude login\n' +
            '\nThen try again.'
          ));
        } else if (stderr.includes('command not found') || stderr.includes('not found')) {
          reject(new Error(
            'Claude CLI not found.\n' +
            'Please install Claude Code from: https://claude.ai/download'
          ));
        } else {
          reject(new Error(`Claude CLI error: ${stderr || 'Unknown error'}`));
        }
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      if (err.message.includes('ENOENT')) {
        reject(new Error(
          'Claude CLI not found.\n' +
          'Please install Claude Code from: https://claude.ai/download'
        ));
      } else {
        reject(new Error(`Failed to execute Claude CLI: ${err.message}`));
      }
    });
  });
}

/**
 * Build a file analysis prompt for Claude Code with tools
 */
export function buildFileAnalysisPrompt(query: string, storagePath: string): string {
  return `You are helping the user recall information from their personal memory system.

**Memory Location**: ${storagePath}

**Directory Structure**:
- goals/ - User's goals and objectives (organized by date: YYYY-MM-DD.md)
- history/ - Daily history logs (dated YYYY-MM-DD.md)
- reflections/ - Personal reflections (dated YYYY-MM-DD.md)
- context/*/ - Context-specific logs organized in subdirectories

**Your Task**:
Use the Grep, Read, and Glob tools to search through these markdown files and find relevant information to answer the user's query.

**Tool Usage Strategy**:
1. Start with Grep to search for relevant keywords across all markdown files
2. Use Glob to find files by patterns if needed (e.g., goals/*.md, history/2024-*.md)
3. Read the most promising files to gather detailed information
4. Use semantic understanding - look for related concepts, not just exact keyword matches
5. Synthesize information from multiple files when relevant

**Important**:
- Think semantically: if the query is about "productivity", also consider files mentioning "efficiency", "time management", "focus", etc.
- Reference dates and file paths when providing your answer
- If you can't find relevant information, say so clearly

**User's Query**: ${query}

Please search the memory files and provide a comprehensive answer based on what you find.`;
}

/**
 * Build a recall prompt with excerpts (kept for fallback)
 */
export function buildRecallPrompt(query: string, matches: SearchMatch[]): string {
  const excerptText = matches
    .map((match, index) => {
      return `
### Excerpt ${index + 1}
**File:** ${match.relativeFilePath}
**Date:** ${match.date}
**Type:** ${match.context}
**Line:** ${match.lineNumber}

\`\`\`
${match.excerpt}
\`\`\`
`;
    })
    .join('\n');

  return `You are helping the user recall information from their personal memory system.
The user has stored goals, reflections, history, and context information in markdown files.

Here are the relevant excerpts from their memory that match their query:

${excerptText}

User's question: ${query}

Please synthesize the information from the excerpts above to answer the user's question.
Be concise and reference specific dates or contexts when helpful. If the excerpts don't
contain enough information to answer the question, say so.`;
}

/**
 * Execute Claude Code with file analysis tools (Grep, Read, Glob)
 */
export async function executeClaudeCodeWithTools(
  prompt: string,
  workingDir: string,
  allowedTools: string[] = ['Grep', 'Read', 'Glob']
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Restrict to safe, read-only tools
    const toolsArg = allowedTools.join(',');

    const proc = spawn('claude', ['-p', prompt, '--allowedTools', toolsArg], {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    // Close stdin immediately since we're using -p flag for the prompt
    proc.stdin.end();

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        // Check for common error patterns
        if (stderr.includes('not authenticated') || stderr.includes('login')) {
          reject(new Error(
            'Claude Code is not authenticated.\n' +
            'Please run: claude login'
          ));
        } else if (stderr.includes('command not found') || stderr.includes('not found')) {
          reject(new Error(
            'Claude Code not found.\n' +
            'Please install from: https://claude.ai/download'
          ));
        } else {
          reject(new Error(`Claude Code error: ${stderr || 'Unknown error'}`));
        }
      }
    });

    proc.on('error', (err) => {
      if (err.message.includes('ENOENT')) {
        reject(new Error(
          'Claude Code not found.\n' +
          'Please install from: https://claude.ai/download'
        ));
      } else {
        reject(new Error(`Failed to execute Claude Code: ${err.message}`));
      }
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      proc.kill('SIGINT');
      reject(new Error('Cancelled by user'));
    });
  });
}

/**
 * Recall with Claude Code using file analysis tools
 */
export async function recallWithClaudeCode(query: string, storagePath: string): Promise<string> {
  // Build file analysis prompt
  const prompt = buildFileAnalysisPrompt(query, storagePath);

  // Execute Claude Code with file tools
  try {
    const response = await executeClaudeCodeWithTools(prompt, storagePath);
    return response;
  } catch (err) {
    throw err;
  }
}

/**
 * Summarize excerpts using Claude CLI (fallback method)
 */
export async function summarizeExcerpts(query: string, matches: SearchMatch[]): Promise<string> {
  // Check if Claude CLI is available
  const isAvailable = await checkClaudeCliAvailable();
  if (!isAvailable) {
    throw new Error(
      'Claude CLI not found.\n' +
      'Please install Claude Code from: https://claude.ai/download\n' +
      'Then run: claude login'
    );
  }

  // Build prompt
  const prompt = buildRecallPrompt(query, matches);

  // Execute Claude command
  try {
    const response = await executeClaudeCommand(prompt);
    return response;
  } catch (err) {
    throw err;
  }
}

/**
 * Generate a unique kebab-case codename for a goal using Claude CLI
 */
export async function generateGoalCodename(goalText: string, existingCodenames: string[]): Promise<string> {
  // Check if Claude CLI is available
  const isAvailable = await checkClaudeCliAvailable();
  if (!isAvailable) {
    throw new Error(
      'Claude CLI not found.\n' +
      'Please install Claude Code from: https://claude.ai/download\n' +
      'Then run: claude login'
    );
  }

  const existingList = existingCodenames.length > 0
    ? `\n\nExisting codenames to avoid:\n${existingCodenames.join(', ')}`
    : '';

  const prompt = `Generate a short, memorable kebab-case identifier (codename) for this goal.

Goal: ${goalText}${existingList}

Requirements:
- Use kebab-case format (e.g., "complete-project", "review-documentation")
- 1-4 words maximum
- Capture the core meaning of the goal
- Must be unique (not in existing codenames list)
- Easy to type and remember
- Use lowercase letters and hyphens only

Respond with ONLY the codename, nothing else.`;

  try {
    // Use Haiku for fast, cost-effective codename generation
    let codename = await executeClaudeCommand(prompt, 15000, 'haiku');
    // Clean up the response - remove any extra whitespace, quotes, or markdown
    codename = codename.trim().replace(/^["'`]+|["'`]+$/g, '');

    // Validate format (kebab-case)
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(codename)) {
      throw new Error(`Invalid codename format: ${codename}`);
    }

    // Handle conflicts by appending numeric suffix
    if (existingCodenames.includes(codename)) {
      let suffix = 2;
      while (existingCodenames.includes(`${codename}-${suffix}`)) {
        suffix++;
      }
      codename = `${codename}-${suffix}`;
    }

    return codename;
  } catch (_err) {
    // Fallback to simple generation if Claude fails
    console.error('Claude codename generation failed, using fallback');
    return generateFallbackCodename(goalText, existingCodenames);
  }
}

/**
 * Result from enhancing a history entry with AI
 */
export interface EnhancedHistoryResult {
  enhancedText: string;
  goalCodename: string | null;
  wasEnhanced: boolean;
  warning?: string;
}

/**
 * Goal info needed for smart matching
 */
export interface GoalInfo {
  codename: string;
  text: string;
}

/**
 * Enhance a history entry using Claude Haiku
 * - Corrects spelling/grammar mistakes
 * - Minimal rephrasing for clarity
 * - Auto-links to most relevant goal if confident match exists
 */
export async function enhanceHistoryEntry(
  rawText: string,
  activeGoals: GoalInfo[]
): Promise<EnhancedHistoryResult> {
  // Check if Claude CLI is available
  const isAvailable = await checkClaudeCliAvailable();
  if (!isAvailable) {
    return {
      enhancedText: rawText,
      goalCodename: null,
      wasEnhanced: false,
      warning: 'Claude CLI not available. Logging original text.',
    };
  }

  const goalsContext = activeGoals.length > 0
    ? `\n\nActive Goals (for potential linking):\n${activeGoals.map(g => `- ${g.codename}: ${g.text}`).join('\n')}`
    : '';

  const prompt = `You are a minimal text editor for a personal history log. Your job is to clean up rough input while preserving the original meaning.

Input text: "${rawText}"${goalsContext}

Instructions:
1. Fix any spelling or grammar mistakes
2. Make minimal improvements for clarity (don't over-elaborate)
3. Preserve all numbers, metrics, and specific details exactly
4. Keep the text concise - similar length to input
5. If the input is already clean, return it largely unchanged
${activeGoals.length > 0 ? `6. If the work clearly relates to one of the active goals, include its codename. Only link if confident.` : ''}

Respond in this exact JSON format (no markdown):
{
  "text": "the enhanced text here",
  "goal": ${activeGoals.length > 0 ? '"codename-here" or null if no confident match' : 'null'}
}`;

  try {
    const response = await executeClaudeCommand(prompt, 15000, 'haiku');

    // Parse JSON response
    const cleaned = response.trim();
    // Handle potential markdown code blocks
    const jsonStr = cleaned.replace(/^```json?\n?|\n?```$/g, '').trim();

    try {
      const parsed = JSON.parse(jsonStr);

      // Validate goal codename if returned
      let goalCodename: string | null = null;
      if (parsed.goal && typeof parsed.goal === 'string') {
        // Verify the goal exists in our list
        const matchedGoal = activeGoals.find(g => g.codename === parsed.goal);
        if (matchedGoal) {
          goalCodename = parsed.goal;
        }
      }

      return {
        enhancedText: parsed.text || rawText,
        goalCodename,
        wasEnhanced: true,
      };
    } catch {
      // If JSON parsing fails, try to extract text from response
      // This handles cases where the model doesn't follow the exact format
      return {
        enhancedText: rawText,
        goalCodename: null,
        wasEnhanced: false,
        warning: 'Failed to parse AI response. Logging original text.',
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return {
      enhancedText: rawText,
      goalCodename: null,
      wasEnhanced: false,
      warning: `Smart enhancement failed: ${errorMessage}. Logging original text.`,
    };
  }
}

/**
 * Fallback codename generation (deterministic, no AI)
 */
function generateFallbackCodename(goalText: string, existingCodenames: string[]): string {
  // Take first few words, convert to kebab-case
  const words = goalText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0)
    .slice(0, 4);

  let codename = words.join('-');

  // Handle conflicts
  if (existingCodenames.includes(codename)) {
    let suffix = 2;
    while (existingCodenames.includes(`${codename}-${suffix}`)) {
      suffix++;
    }
    codename = `${codename}-${suffix}`;
  }

  return codename;
}
