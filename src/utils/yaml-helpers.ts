import { load, dump } from 'js-yaml';

/**
 * Known schema versions for YAML front matter
 * Format: "MAJOR.MINOR" (e.g., "1.0", "1.1", "2.0")
 */
export const KNOWN_SCHEMA_VERSIONS = ['1.0'];

/**
 * Check if a schema version is known/supported
 * @param version - Schema version string (e.g., "1.0")
 * @returns true if version is known, false otherwise
 */
export function isKnownSchemaVersion(version: string): boolean {
  return KNOWN_SCHEMA_VERSIONS.includes(version);
}

/**
 * Normalize schema version, defaulting to "1.0" for backward compatibility
 * @param version - Schema version from YAML front matter (may be undefined)
 * @returns Normalized schema version ("1.0" if missing or unknown)
 */
export function normalizeSchemaVersion(version: string | undefined): string {
  if (!version) return '1.0'; // Default for backward compatibility

  if (isKnownSchemaVersion(version)) {
    return version;
  }

  console.warn(`Unknown schema version ${version}, falling back to 1.0`);
  return '1.0';
}

/**
 * Parse YAML front matter from markdown content
 * Returns [metadata, body] tuple, or null if no front matter found
 */
export function parseYamlFrontMatter(content: string): [Record<string, unknown>, string] | null {
  const trimmed = content.trim();

  // Check if content starts with YAML front matter delimiter
  if (!trimmed.startsWith('---')) {
    return null;
  }

  // Find the closing delimiter
  const lines = trimmed.split('\n');
  let closingIndex = -1;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closingIndex = i;
      break;
    }
  }

  if (closingIndex === -1) {
    return null;
  }

  // Extract YAML content (between delimiters)
  const yamlContent = lines.slice(1, closingIndex).join('\n');

  // Extract markdown body (after closing delimiter)
  const body = lines.slice(closingIndex + 1).join('\n').trim();

  try {
    const metadata = load(yamlContent) as Record<string, unknown>;
    return [metadata || {}, body];
  } catch (_error) {
    // YAML parsing failed
    return null;
  }
}

/**
 * Serialize metadata and body to YAML front matter format
 * Omits null and undefined values for cleaner output
 */
export function serializeYamlFrontMatter(metadata: Record<string, unknown>, body: string): string {
  // Filter out null/undefined values
  const cleanMetadata: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== null && value !== undefined) {
      cleanMetadata[key] = value;
    }
  }

  // Serialize metadata to YAML
  const yamlContent = dump(cleanMetadata, {
    quotingType: '"',
    forceQuotes: false,
  }).trim();

  // Combine with body
  return `---\n${yamlContent}\n---\n\n${body}`;
}

/**
 * Detect if content uses YAML front matter or inline format
 */
export function detectFormat(content: string): 'yaml' | 'inline' {
  const trimmed = content.trim();
  return trimmed.startsWith('---') ? 'yaml' : 'inline';
}

/**
 * Split markdown content into individual entries
 * Entries are separated by ## headers in inline format
 * or by --- delimiters in YAML format
 */
export function splitEntries(content: string): string[] {
  if (!content.trim()) {
    return [];
  }

  const format = detectFormat(content);

  if (format === 'yaml') {
    // Split by YAML front matter blocks
    // Each entry starts with --- and ends before the next ---
    const entries: string[] = [];
    const lines = content.split('\n');
    let currentEntry: string[] = [];
    let inFrontMatter = false;
    let delimiterCount = 0; // Count individual delimiters, not pairs

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === '---') {
        if (!inFrontMatter) {
          // Opening delimiter - check if we need to save previous entry
          if (delimiterCount >= 2 && currentEntry.length > 0) {
            // We've completed the previous entry, save it
            entries.push(currentEntry.join('\n').trim());
            currentEntry = [];
            delimiterCount = 0;
          }
          inFrontMatter = true;
          delimiterCount++;
          currentEntry.push(line);
        } else {
          // Closing delimiter
          inFrontMatter = false;
          delimiterCount++;
          currentEntry.push(line);
        }
      } else if (delimiterCount > 0) {
        // We're inside or after a YAML block
        currentEntry.push(line);
      }
    }

    if (currentEntry.length > 0) {
      entries.push(currentEntry.join('\n').trim());
    }

    return entries.filter(e => e.length > 0);
  } else {
    // Split by ## headers (inline format)
    const entries = content.split(/(?=^## )/m).filter(e => e.trim().length > 0);
    return entries.map(e => e.trim());
  }
}
