/**
 * TTY detection utilities for determining if the process is running in an interactive terminal
 */

/**
 * Check if the current process is running in a TTY (interactive terminal)
 *
 * @returns true if both stdin and stdout are TTY, false otherwise
 */
export function isTTY(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}
