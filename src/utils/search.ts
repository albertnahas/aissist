import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { needsMigration, parseContextItemEntries, serializeContextItemEntryYaml, writeFileAtomic } from './storage.js';

export interface SearchMatch {
  filePath: string;
  relativeFilePath: string;
  lineNumber: number;
  line: string;
  excerpt: string;
  context: string; // goal, history, context, reflection
  date: string; // extracted from filename
}

/**
 * Search all markdown files in a directory recursively
 */
export async function searchMarkdownFiles(
  basePath: string,
  query: string,
  caseSensitive: boolean = false
): Promise<SearchMatch[]> {
  const matches: SearchMatch[] = [];
  const searchQuery = caseSensitive ? query : query.toLowerCase();

  async function searchDirectory(dirPath: string, contextType: string = ''): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Determine context type from directory name
          let newContextType = contextType;
          if (entry.name === 'goals') newContextType = 'goal';
          else if (entry.name === 'history') newContextType = 'history';
          else if (entry.name === 'reflections') newContextType = 'reflection';
          else if (contextType === 'context') newContextType = 'context';
          else if (dirPath.includes('/context/')) newContextType = 'context';

          await searchDirectory(fullPath, newContextType);
        } else if (entry.name.endsWith('.md')) {
          let content = await readFile(fullPath, 'utf-8');

          // Auto-migrate context files if needed
          if (contextType === 'context' && needsMigration(content)) {
            try {
              const inlineEntries = parseContextItemEntries(content);
              const yamlEntries = inlineEntries.map(serializeContextItemEntryYaml);
              const migratedContent = yamlEntries.join('\n\n');
              await writeFileAtomic(fullPath, migratedContent);
              content = migratedContent;
            } catch (error) {
              // If migration fails, continue with original content
              console.warn(`Failed to migrate ${fullPath}:`, error);
            }
          }

          const lines = content.split('\n');

          // Extract date from filename (YYYY-MM-DD.md)
          const dateMatch = entry.name.match(/(\d{4}-\d{2}-\d{2})/);
          const date = dateMatch ? dateMatch[1] : 'unknown';

          lines.forEach((line, index) => {
            const searchLine = caseSensitive ? line : line.toLowerCase();
            if (searchLine.includes(searchQuery)) {
              const excerpt = extractExcerpt(lines, index, 2);
              matches.push({
                filePath: fullPath,
                relativeFilePath: relative(basePath, fullPath),
                lineNumber: index + 1,
                line: line.trim(),
                excerpt,
                context: contextType || 'unknown',
                date,
              });
            }
          });
        }
      }
    } catch (error) {
      // Skip directories we can't read
      console.error(`Error searching ${dirPath}:`, (error as Error).message);
    }
  }

  await searchDirectory(basePath);
  return matches;
}

/**
 * Extract excerpt with surrounding lines
 */
export function extractExcerpt(lines: string[], targetIndex: number, contextLines: number = 2): string {
  const start = Math.max(0, targetIndex - contextLines);
  const end = Math.min(lines.length, targetIndex + contextLines + 1);
  return lines.slice(start, end).join('\n').trim();
}

/**
 * Filter top N most relevant matches
 */
export function filterTopMatches(matches: SearchMatch[], maxResults: number = 10): SearchMatch[] {
  // Sort by date (most recent first) and then by relevance
  const sorted = matches.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return a.lineNumber - b.lineNumber;
  });

  return sorted.slice(0, maxResults);
}

/**
 * Group matches by context type
 */
export function groupMatchesByContext(matches: SearchMatch[]): Map<string, SearchMatch[]> {
  const grouped = new Map<string, SearchMatch[]>();

  for (const match of matches) {
    const existing = grouped.get(match.context) || [];
    existing.push(match);
    grouped.set(match.context, existing);
  }

  return grouped;
}
