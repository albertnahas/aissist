# Fix Markdown Rendering for List Items

## Why

The `propose` command outputs beautifully formatted markdown using `marked-terminal`, but inline formatting (`**bold**`, `*italic*`) inside list items is not being rendered—the raw markdown markers remain visible. This creates an inconsistent and unprofessional user experience where:

- **Standalone paragraphs** render correctly: `**bold**` → bold text
- **List items** fail to render: `1. **bold**` → `1. **bold**` (markers visible)

This affects all timeframes (`today`, `this week`, etc.), making the output look unpolished and harder to read.

## What Changes

**Root Cause:**
`marked-terminal@7.3.0` has a rendering bug where inline formatting within list items is not processed.

**Solution:**
Update the markdown rendering utility to post-process the `marked` output and manually apply terminal styling to bold/italic markers that appear in list contexts.

**Affected Files:**
- `src/utils/markdown.ts` - Add post-processing to strip markdown markers and apply chalk styling

**Affected Specs:**
- `markdown-rendering` (MODIFIED) - Add requirement for consistent inline formatting across all markdown contexts

## Impact

**User Impact:**
- All `propose` output (regardless of timeframe) will have consistent, professional formatting
- Bold and italic text in list items will be properly rendered with terminal styling
- No breaking changes—output is purely visual improvement

**Technical Impact:**
- Minimal change to `renderMarkdown()` function
- No new dependencies required
- Performance impact negligible (regex post-processing on small strings)

## Scope

### In Scope
- Fix bold (`**text**`) rendering in numbered and bullet lists
- Fix italic (`*text*`) rendering in numbered and bullet lists
- Maintain existing rendering for paragraphs, headings, code blocks
- Preserve all other `marked-terminal` functionality

### Out of Scope
- Replacing `marked-terminal` with a different library
- Custom theme configuration
- Other markdown rendering issues not related to lists
- Rendering in commands besides `propose` and `recall`
