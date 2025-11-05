import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isTTY } from './tty.js';

describe('isTTY', () => {
  let originalStdin: typeof process.stdin;
  let originalStdout: typeof process.stdout;

  beforeEach(() => {
    originalStdin = process.stdin;
    originalStdout = process.stdout;
  });

  afterEach(() => {
    process.stdin = originalStdin;
    process.stdout = originalStdout;
  });

  it('should return true when both stdin and stdout are TTY', () => {
    // Mock both stdin and stdout as TTY
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });

    expect(isTTY()).toBe(true);
  });

  it('should return false when stdin is not TTY', () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });

    expect(isTTY()).toBe(false);
  });

  it('should return false when stdout is not TTY', () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });

    expect(isTTY()).toBe(false);
  });

  it('should return false when neither stdin nor stdout are TTY', () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });

    expect(isTTY()).toBe(false);
  });

  it('should return false when isTTY is undefined (non-TTY environment)', () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: undefined, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: undefined, configurable: true });

    expect(isTTY()).toBe(false);
  });
});
