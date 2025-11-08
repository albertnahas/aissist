import { marked } from 'marked';
import chalk from 'chalk';
// @ts-ignore - marked-terminal doesn't have TypeScript definitions
import TerminalRenderer from 'marked-terminal';

// Configure marked to use the terminal renderer with blue-ish color scheme
marked.setOptions({
  // @ts-ignore - marked-terminal types may not match perfectly
  renderer: new TerminalRenderer({
    width: 80, // Max width for wrapping
    reflowText: true, // Wrap text to fit width
    showSectionPrefix: false, // Don't show [Section] prefixes
    tab: 2, // Indentation size
    heading: chalk.bold.cyan,
  }),
});

/**
 * Post-processes rendered markdown to fix inline formatting in lists.
 * marked-terminal has a bug where bold/italic markers aren't processed in list items.
 * This function manually applies chalk styling to those markers.
 *
 * @param text - The already-rendered markdown text from marked
 * @returns Text with inline formatting properly styled
 */
function postProcessInlineFormatting(text: string): string {
  // Replace **bold** with chalk.bold
  // Use negative lookbehind/lookahead to avoid matching escaped asterisks
  text = text.replace(/\*\*([^*]+?)\*\*/g, (_, content) => chalk.bold(content));

  // Replace *italic* with chalk.dim (avoiding **bold** which has already been processed)
  // Match single asterisk that's not part of ** or preceded/followed by *
  text = text.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, (_, content) => chalk.dim(content));

  return text;
}

/**
 * Renders markdown text for terminal display with beautiful formatting.
 *
 * @param text - The markdown text to render
 * @param raw - If true, returns the original markdown without rendering
 * @returns Rendered markdown string with ANSI codes for terminal display, or raw markdown if raw=true
 *
 * @example
 * ```typescript
 * // Beautiful terminal output (default)
 * const formatted = renderMarkdown('## Hello\n\nThis is **bold**');
 * console.log(formatted);
 *
 * // Raw markdown for machine consumption
 * const raw = renderMarkdown('## Hello\n\nThis is **bold**', true);
 * console.log(raw); // "## Hello\n\nThis is **bold**"
 * ```
 */
export function renderMarkdown(text: string, raw?: boolean): string {
  // If raw mode is requested, return original markdown
  if (raw) {
    return text;
  }

  try {
    // Render markdown with terminal formatting
    const rendered = marked(text);

    // marked returns a Promise in some versions, handle both cases
    if (typeof rendered === 'string') {
      // Post-process to fix inline formatting in lists (marked-terminal bug workaround)
      return postProcessInlineFormatting(rendered);
    } else if (rendered instanceof Promise) {
      // This shouldn't happen with marked-terminal, but handle gracefully
      console.warn('Warning: Markdown rendering returned a Promise, falling back to raw output');
      return text;
    }

    return postProcessInlineFormatting(rendered as string);
  } catch (error) {
    // On any error, fall back to raw markdown with a warning
    console.warn('Warning: Failed to render markdown, displaying raw output');
    if (error instanceof Error) {
      console.warn(`Error: ${error.message}`);
    }
    return text;
  }
}

/**
 * Type guard to check if terminal supports colors.
 * This is automatically handled by marked-terminal, but exposed for convenience.
 */
export function supportsColor(): boolean {
  // Check common environment variables
  if (process.env.NO_COLOR || process.env.NODE_DISABLE_COLORS) {
    return false;
  }

  if (process.env.FORCE_COLOR) {
    return true;
  }

  // Check if stdout is a TTY
  return process.stdout.isTTY === true;
}
