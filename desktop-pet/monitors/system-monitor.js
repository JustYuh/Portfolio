// =============================================================================
// SYSTEM MONITOR - CPU, RAM, and process monitoring utilities
// =============================================================================

const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');

class SystemMonitor {
  constructor() {
    this.cpuUsage = 0;
    this.ramUsage = 0;
    this.activeProcesses = new Set();
    this.lastCheck = Date.now();
    this.updateInterval = 5000; // Check every 5 seconds
  }

  // Get current CPU usage percentage
  async getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    this.cpuUsage = usage;
    return usage;
  }

  // Get current RAM usage percentage
  getRamUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usage = (usedMem / totalMem) * 100;

    this.ramUsage = usage;
    return usage;
  }

  // Check if a specific process is running
  async isProcessRunning(processName) {
    return new Promise((resolve) => {
      const platform = process.platform;
      let cmd;

      if (platform === 'win32') {
        cmd = `tasklist /FI "IMAGENAME eq ${processName}.exe"`;
      } else if (platform === 'darwin' || platform === 'linux') {
        cmd = `ps aux | grep -i ${processName} | grep -v grep`;
      } else {
        resolve(false);
        return;
      }

      exec(cmd, (error, stdout) => {
        if (error) {
          resolve(false);
          return;
        }
        resolve(stdout.toLowerCase().includes(processName.toLowerCase()));
      });
    });
  }

  // Check for meeting apps
  async checkMeetingApps() {
    const meetingApps = ['zoom', 'teams', 'slack', 'meet', 'webex', 'skype'];
    const running = [];

    for (const app of meetingApps) {
      if (await this.isProcessRunning(app)) {
        running.push(app);
      }
    }

    return running;
  }

  // Check for focus/DND mode (platform-specific)
  async checkFocusMode() {
    const platform = process.platform;

    if (platform === 'darwin') {
      // macOS: Check Do Not Disturb
      return new Promise((resolve) => {
        exec('defaults read com.apple.controlcenter "NSStatusItem Visible FocusModes"', (error, stdout) => {
          resolve(!error && stdout.trim() === '1');
        });
      });
    } else if (platform === 'win32') {
      // Windows: Check Focus Assist
      return new Promise((resolve) => {
        exec('powershell -command "Get-WinUserState"', (error, stdout) => {
          resolve(stdout.includes('Priority') || stdout.includes('Alarms'));
        });
      });
    } else {
      // Linux: No standard way, return false
      return false;
    }
  }

  // Count browser tabs (approximation by checking process count)
  async countBrowserTabs() {
    return new Promise((resolve) => {
      const platform = process.platform;
      let cmd;

      if (platform === 'win32') {
        cmd = 'tasklist /FI "IMAGENAME eq chrome.exe" /FI "IMAGENAME eq firefox.exe" | find /C /V ""';
      } else if (platform === 'darwin' || platform === 'linux') {
        cmd = 'ps aux | grep -i -E "chrome|firefox" | grep -v grep | wc -l';
      } else {
        resolve(0);
        return;
      }

      exec(cmd, (error, stdout) => {
        if (error) {
          resolve(0);
          return;
        }
        const count = parseInt(stdout.trim()) || 0;
        // Rough estimate: each process ~= 5 tabs
        resolve(count * 5);
      });
    });
  }

  // Check for recent git commits
  async checkGitActivity(repoPath = '.') {
    return new Promise((resolve) => {
      const gitDir = `${repoPath}/.git`;

      if (!fs.existsSync(gitDir)) {
        resolve(null);
        return;
      }

      exec(`git -C ${repoPath} log -1 --format="%H|%s|%ar"`, (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }

        const [hash, message, time] = stdout.trim().split('|');
        resolve({ hash, message, time });
      });
    });
  }

  // Monitor keyboard/mouse activity (simplified - tracks update frequency)
  trackActivity() {
    this.lastActivity = Date.now();
  }

  getIdleTime() {
    return Date.now() - this.lastActivity;
  }

  // Update all metrics
  async update() {
    const now = Date.now();
    if (now - this.lastCheck < this.updateInterval) {
      return;
    }

    this.lastCheck = now;
    await this.getCPUUsage();
    this.getRamUsage();
  }
}

// Singleton instance
const systemMonitor = new SystemMonitor();

module.exports = systemMonitor;
