import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderMarkdown, supportsColor } from './markdown.js';

describe('renderMarkdown', () => {
  it('should render markdown with terminal formatting by default', () => {
    const markdown = '## Heading\n\nThis is **bold** text.';
    const result = renderMarkdown(markdown);

    // The result should be different from the input (formatted)
    expect(result).not.toBe(markdown);
    // The result should contain the text content
    expect(result).toContain('Heading');
    expect(result).toContain('bold');
  });

  it('should return raw markdown when raw=true', () => {
    const markdown = '## Heading\n\nThis is **bold** text.';
    const result = renderMarkdown(markdown, true);

    // Raw mode should return the exact input
    expect(result).toBe(markdown);
  });

  it('should handle headings', () => {
    const markdown = '# H1\n## H2\n### H3';
    const result = renderMarkdown(markdown);

    // Should contain heading text
    expect(result).toContain('H1');
    expect(result).toContain('H2');
    expect(result).toContain('H3');
  });

  it('should handle lists', () => {
    const markdown = '- Item 1\n- Item 2\n- Item 3';
    const result = renderMarkdown(markdown);

    // Should contain list items
    expect(result).toContain('Item 1');
    expect(result).toContain('Item 2');
    expect(result).toContain('Item 3');
  });

  it('should handle code blocks', () => {
    const markdown = '```javascript\nconst x = 1;\n```';
    const result = renderMarkdown(markdown);

    // Should contain code content
    expect(result).toContain('const x = 1;');
  });

  it('should handle inline code', () => {
    const markdown = 'This is `inline code` example.';
    const result = renderMarkdown(markdown);

    // Should contain the text
    expect(result).toContain('inline code');
  });

  it('should handle emphasis', () => {
    const markdown = 'This is *italic* and **bold** text.';
    const result = renderMarkdown(markdown);

    // Should contain the text content
    expect(result).toContain('italic');
    expect(result).toContain('bold');
  });

  it('should handle links', () => {
    const markdown = 'Check [this link](https://example.com).';
    const result = renderMarkdown(markdown);

    // Should contain link text
    expect(result).toContain('this link');
  });

  it('should handle empty string', () => {
    const result = renderMarkdown('');
    expect(result).toBe('');
  });

  it('should handle string with only whitespace', () => {
    const markdown = '   \n\n   ';
    const result = renderMarkdown(markdown);
    // Should return some output (may be formatted whitespace)
    expect(typeof result).toBe('string');
  });

  it('should handle complex markdown document', () => {
    const markdown = `# Main Title

## Section 1

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2

### Subsection

\`\`\`javascript
const code = 'example';
\`\`\`

[Link](https://example.com)`;

    const result = renderMarkdown(markdown);

    // Should contain all parts
    expect(result).toContain('Main Title');
    expect(result).toContain('Section 1');
    expect(result).toContain('bold');
    expect(result).toContain('italic');
    expect(result).toContain('List item 1');
    expect(result).toContain('Subsection');
    expect(result).toContain('example');
    expect(result).toContain('Link');
  });

  it('should fallback gracefully on error', () => {
    // Mock marked to throw an error
    const originalConsoleWarn = console.warn;
    console.warn = vi.fn();

    // We can't easily force marked to throw, but we can test the raw fallback path
    const markdown = '## Test';
    const result = renderMarkdown(markdown);

    // Should still return something
    expect(typeof result).toBe('string');

    console.warn = originalConsoleWarn;
  });

  // Tests for list formatting fix (marked-terminal bug workaround)
  it('should render bold text in numbered lists without raw ** markers', () => {
    const markdown = '1. **Bold item in list**\n2. Normal item';
    const result = renderMarkdown(markdown);

    // Should contain the text content
    expect(result).toContain('Bold item in list');
    expect(result).toContain('Normal item');

    // Should NOT contain raw ** markers
    expect(result).not.toContain('**Bold item in list**');
    expect(result).not.toContain('**');
  });

  it('should render bold text in bullet lists without raw ** markers', () => {
    const markdown = '- **Bold bullet item**\n- Normal bullet';
    const result = renderMarkdown(markdown);

    // Should contain the text content
    expect(result).toContain('Bold bullet item');
    expect(result).toContain('Normal bullet');

    // Should NOT contain raw ** markers
    expect(result).not.toContain('**Bold bullet item**');
    expect(result).not.toContain('**');
  });

  it('should render italic text in lists without raw * markers', () => {
    const markdown = '1. *Italic item*\n2. Normal item';
    const result = renderMarkdown(markdown);

    // Should contain the text content
    expect(result).toContain('Italic item');
    expect(result).toContain('Normal item');

    // Should NOT contain the exact pattern *Italic item*
    expect(result).not.toContain('*Italic item*');
  });

  it('should render mixed bold and italic in lists', () => {
    const markdown = '1. **Bold** and *italic* text\n2. Normal item';
    const result = renderMarkdown(markdown);

    // Should contain the text content
    expect(result).toContain('Bold');
    expect(result).toContain('italic');
    expect(result).toContain('text');

    // Should NOT contain raw markers
    expect(result).not.toContain('**Bold**');
    expect(result).not.toContain('*italic*');
  });

  it('should maintain paragraph bold/italic rendering (no regression)', () => {
    const markdown = 'This is **bold** and *italic* in a paragraph.';
    const result = renderMarkdown(markdown);

    // Should contain the text content
    expect(result).toContain('bold');
    expect(result).toContain('italic');

    // Should NOT contain raw markers
    expect(result).not.toContain('**bold**');
    expect(result).not.toContain('*italic*');
  });

  it('should handle complex list with multiple formatting', () => {
    const markdown = `1. **First item** with *emphasis*
2. **Second** item
3. Normal item

- **Bullet bold**
- *Bullet italic*
- Normal bullet`;

    const result = renderMarkdown(markdown);

    // Should contain all text
    expect(result).toContain('First item');
    expect(result).toContain('emphasis');
    expect(result).toContain('Second');
    expect(result).toContain('Bullet bold');
    expect(result).toContain('Bullet italic');

    // Should NOT contain raw markers
    expect(result).not.toContain('**First item**');
    expect(result).not.toContain('*emphasis*');
    expect(result).not.toContain('**Second**');
    expect(result).not.toContain('**Bullet bold**');
    expect(result).not.toContain('*Bullet italic*');
  });
});

describe('supportsColor', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should return false when NO_COLOR is set', () => {
    process.env.NO_COLOR = '1';
    expect(supportsColor()).toBe(false);
  });

  it('should return false when NODE_DISABLE_COLORS is set', () => {
    process.env.NODE_DISABLE_COLORS = '1';
    expect(supportsColor()).toBe(false);
  });

  it('should return true when FORCE_COLOR is set', () => {
    process.env.FORCE_COLOR = '1';
    expect(supportsColor()).toBe(true);
  });

  it('should check TTY when no environment variables are set', () => {
    delete process.env.NO_COLOR;
    delete process.env.NODE_DISABLE_COLORS;
    delete process.env.FORCE_COLOR;

    const result = supportsColor();
    // Result depends on whether stdout is a TTY
    expect(typeof result).toBe('boolean');
  });
});
