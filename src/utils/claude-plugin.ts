import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ClaudeCodeStatus {
  installed: boolean;
  version?: string;
}

interface PluginInstallResult {
  success: boolean;
  message: string;
  alreadyInstalled?: boolean;
}

/**
 * Check if Claude Code CLI is installed and working
 */
export async function checkClaudeCodeInstalled(): Promise<ClaudeCodeStatus> {
  return new Promise((resolve) => {
    const child = spawn('claude', ['--version'], {
      stdio: 'pipe',
    });

    let output = '';

    child.stdout?.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ installed: true, version: output.trim() });
      } else {
        resolve({ installed: false });
      }
    });

    child.on('error', () => {
      resolve({ installed: false });
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      child.kill();
      resolve({ installed: false });
    }, 5000);
  });
}

/**
 * Check if aissist plugin is already installed in Claude Code
 * Returns true if marketplace is configured (which is good enough indication)
 */
export async function checkPluginInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('claude', ['plugin', 'marketplace', 'list'], {
      stdio: 'pipe',
    });

    let output = '';

    child.stdout?.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Check if output contains "aissist"
        resolve(output.toLowerCase().includes('aissist'));
      } else {
        resolve(false);
      }
    });

    child.on('error', () => {
      resolve(false);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      child.kill();
      resolve(false);
    }, 5000);
  });
}

/**
 * Resolve the aissist package path for plugin installation
 */
export async function resolvePackagePath(): Promise<string | null> {
  // Try to resolve from the current module location
  // Go up from src/utils/claude-plugin.ts to package root
  const packageRoot = join(__dirname, '../..');

  return packageRoot;
}

/**
 * Add aissist as a marketplace in Claude Code
 */
export async function addMarketplace(packagePath: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const marketplacePath = `${packagePath}/aissist-plugin`;
    const child = spawn('claude', ['plugin', 'marketplace', 'add', marketplacePath], {
      stdio: 'pipe',
    });

    let stderr = '';

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({ success: false, error: stderr || 'Failed to add marketplace' });
      }
    });

    child.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      child.kill();
      resolve({ success: false, error: 'Marketplace add timed out' });
    }, 10000);
  });
}

/**
 * Install aissist plugin via Claude Code CLI
 */
export async function installPlugin(): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn('claude', ['plugin', 'install', 'aissist'], {
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({ success: false, error: stderr || stdout || 'Plugin installation failed' });
      }
    });

    child.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      child.kill();
      resolve({ success: false, error: 'Plugin installation timed out' });
    }, 30000);
  });
}

/**
 * Main function to handle Claude Code plugin integration
 */
export async function integrateClaudeCodePlugin(): Promise<PluginInstallResult> {
  // Check if Claude Code is installed
  const claudeStatus = await checkClaudeCodeInstalled();
  if (!claudeStatus.installed) {
    return {
      success: false,
      message: 'Claude Code CLI not found. Please install from: https://claude.com/claude-code',
    };
  }

  // Check if plugin is already installed
  const pluginInstalled = await checkPluginInstalled();
  if (pluginInstalled) {
    return {
      success: true,
      message: 'aissist plugin is already installed in Claude Code',
      alreadyInstalled: true,
    };
  }

  // Resolve package path
  const packagePath = await resolvePackagePath();
  if (!packagePath) {
    return {
      success: false,
      message: 'Could not resolve aissist package path',
    };
  }

  // Add marketplace
  const marketplaceResult = await addMarketplace(packagePath);
  if (!marketplaceResult.success) {
    return {
      success: false,
      message: `Failed to add marketplace: ${marketplaceResult.error}\n\nTry manually:\n  claude plugin marketplace add ${packagePath}/aissist-plugin\n  claude plugin install aissist`,
    };
  }

  // Install plugin
  const installResult = await installPlugin();
  if (!installResult.success) {
    return {
      success: false,
      message: `Failed to install plugin: ${installResult.error}\n\nTry manually:\n  claude plugin install aissist`,
    };
  }

  // Verify installation
  const verified = await checkPluginInstalled();
  if (!verified) {
    return {
      success: false,
      message: 'Plugin installation completed but could not verify. Try restarting Claude Code.',
    };
  }

  return {
    success: true,
    message: 'Claude Code integration complete! Restart Claude Code or run /plugin refresh to activate.',
  };
}
