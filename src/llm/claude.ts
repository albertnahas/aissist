import { spawn } from 'child_process';
import type { SearchMatch } from '../utils/search.js';

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
 * Build a recall prompt with excerpts
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
 * Summarize excerpts using Claude CLI
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
