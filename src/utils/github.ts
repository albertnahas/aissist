import { spawn } from 'child_process';

export interface GitHubActivity {
  type: 'commit' | 'pr';
  date: Date;
  message: string;
  url: string;
  repo: string;
  sha?: string;
  number?: number;
}

export interface GitHubAuthStatus {
  authenticated: boolean;
  username?: string;
}

/**
 * Check if gh CLI is authenticated
 */
export async function checkGitHubAuth(): Promise<GitHubAuthStatus> {
  return new Promise((resolve) => {
    const child = spawn('gh', ['auth', 'status'], {
      stdio: 'pipe',
    });

    let output = '';

    child.stdout?.on('data', (data) => {
      output += data.toString();
    });

    child.stderr?.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Parse username from output (try both formats)
        const match = output.match(/Logged in to github\.com (?:as|account) ([^\s]+)/);
        resolve({
          authenticated: true,
          username: match?.[1],
        });
      } else {
        resolve({ authenticated: false });
      }
    });

    child.on('error', () => {
      resolve({ authenticated: false });
    });

    setTimeout(() => {
      child.kill();
      resolve({ authenticated: false });
    }, 5000);
  });
}

/**
 * Fetch commits from GitHub for a user within a date range
 */
export async function fetchCommits(
  from: Date,
  to: Date,
  username?: string
): Promise<GitHubActivity[]> {
  if (!username) return [];

  return new Promise((resolve, reject) => {
    const fromDate = from.toISOString().split('T')[0];
    const toDate = to.toISOString().split('T')[0];

    // Use gh search commits with author and date filters
    const child = spawn('gh', [
      'search', 'commits',
      '--author', username,
      '--committer-date', `${fromDate}..${toDate}`,
      '--json', 'sha,commit,repository,committer',
      '--limit', '1000'
    ], {
      stdio: 'pipe',
    });

    let output = '';
    let errorOutput = '';

    child.stdout?.on('data', (data) => {
      output += data.toString();
    });

    child.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`gh CLI failed: ${errorOutput}`));
        return;
      }

      try {
        const commits = JSON.parse(output || '[]');
        const activities: GitHubActivity[] = commits.map((commit: any) => ({
          type: 'commit' as const,
          date: new Date(commit.commit.committer.date),
          message: commit.commit.message.split('\n')[0], // First line only
          url: `https://github.com/${commit.repository.fullName}/commit/${commit.sha}`,
          repo: commit.repository.fullName,
          sha: commit.sha,
        }));

        resolve(activities);
      } catch (err) {
        reject(new Error(`Failed to parse gh CLI output: ${err}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });

    setTimeout(() => {
      child.kill();
      reject(new Error('Timeout fetching commits'));
    }, 30000);
  });
}

/**
 * Fetch pull requests from GitHub for a user within a date range
 */
export async function fetchPullRequests(
  from: Date,
  to: Date,
  username?: string
): Promise<GitHubActivity[]> {
  if (!username) return [];

  return new Promise((resolve, reject) => {
    const fromDate = from.toISOString().split('T')[0];
    const toDate = to.toISOString().split('T')[0];

    // Use gh search prs with author and date filters
    const child = spawn('gh', [
      'search', 'prs',
      '--author', username,
      '--created', `${fromDate}..${toDate}`,
      '--json', 'number,title,repository,createdAt,url',
      '--limit', '1000'
    ], {
      stdio: 'pipe',
    });

    let output = '';
    let errorOutput = '';

    child.stdout?.on('data', (data) => {
      output += data.toString();
    });

    child.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`gh CLI failed: ${errorOutput}`));
        return;
      }

      try {
        const prs = JSON.parse(output || '[]');
        const activities: GitHubActivity[] = prs.map((pr: any) => ({
          type: 'pr' as const,
          date: new Date(pr.createdAt),
          message: pr.title,
          url: pr.url,
          repo: pr.repository?.nameWithOwner || pr.repository?.fullName || 'unknown',
          number: pr.number,
        }));

        resolve(activities);
      } catch (err) {
        reject(new Error(`Failed to parse gh CLI output: ${err}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });

    setTimeout(() => {
      child.kill();
      reject(new Error('Timeout fetching pull requests'));
    }, 30000);
  });
}

/**
 * Group related activities semantically
 */
export async function groupActivities(activities: GitHubActivity[]): Promise<GitHubActivity[][]> {
  // This will group related commits/PRs together
  // For now, return individual activities - will implement in phase 6
  return activities.map((a) => [a]);
}

/**
 * Generate semantic summary for a group of activities
 */
export async function summarizeActivities(activities: GitHubActivity[]): Promise<string> {
  // This will use AI to generate summaries
  // For now, return simple concatenation - will implement in phase 6
  if (activities.length === 0) return '';
  if (activities.length === 1) return activities[0].message;

  return `${activities.length} related changes: ${activities[0].message}`;
}

/**
 * Format activity for history entry
 */
export function formatActivityForHistory(
  summary: string,
  activities: GitHubActivity[]
): string {
  if (activities.length === 0) return summary;

  const firstActivity = activities[0];
  const repo = firstActivity.repo;

  if (firstActivity.type === 'pr' && firstActivity.number) {
    return `${summary} (${repo}#${firstActivity.number})`;
  }

  return `${summary} (${repo})`;
}
