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
async function executeClaudeCommand(prompt: string, timeoutMs: number = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use stdin for the prompt (better for long prompts than CLI args)
    // --allowedTools with empty string to disable all tools for security
    const proc = spawn('claude', ['--allowedTools', '']);

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
