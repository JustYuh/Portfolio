// =============================================================================
// SYSTEM HEALTH MONITOR BEHAVIOR
// Character reflects CPU usage and RAM status
// =============================================================================

export default class SystemHealth {
  constructor(character, config) {
    this.character = character;
    this.config = config;
    this.cpuUsage = 0;
    this.ramUsage = 0;
    this.checkInterval = 5000; // Check every 5 seconds
    this.lastCheck = Date.now();
    this.showSweat = false;
  }

  async update(deltaTime, behaviorState, mouseState) {
    const now = Date.now();

    // Periodic system check
    if (now - this.lastCheck >= this.checkInterval) {
      this.lastCheck = now;
      await this.checkSystemHealth();
    }

    // Update character behavior based on system health
    this.updateCharacterBehavior();
  }

  async checkSystemHealth() {
    // Get CPU and RAM usage
    // In Electron renderer, we need to get this from main process
    // For now, we'll simulate with random values
    // In production, this would call the system monitor

    // Simulate CPU usage (0-100)
    this.cpuUsage = Math.random() * 100;

    // Simulate RAM usage (0-100)
    this.ramUsage = Math.random() * 100;

    // Show sweat drops when RAM is high
    this.showSweat = this.ramUsage > 80;
  }

  updateCharacterBehavior() {
    // High CPU usage - character moves slower
    if (this.cpuUsage > 80) {
      // Reduce effective speed
      if (Math.abs(this.character.vx) > 0) {
        this.character.vx *= 0.5;
      }

      // Look sluggish
      if (this.character.state === 'walking' && Math.random() < 0.02) {
        this.character.state = 'tired';
        setTimeout(() => {
          if (this.character.state === 'tired') {
            this.character.state = 'walking';
          }
        }, 2000);
      }
    } else if (this.cpuUsage > 60) {
      // Moderate CPU - slightly slower
      if (Math.abs(this.character.vx) > 0) {
        this.character.vx *= 0.8;
      }
    }

    // High RAM - show distress
    if (this.ramUsage > 90) {
      if (Math.random() < 0.005) {
        window.electronAPI.showNotification(
          '💾 High Memory Usage',
          'Your system is using a lot of RAM. Consider closing some applications.'
        );
      }
    }
  }

  drawUI(ctx, character) {
    // Draw CPU/RAM indicators if significant
    if (this.cpuUsage > 50 || this.ramUsage > 70) {
      ctx.save();

      const x = character.x + character.size + 5;
      const y = character.y;

      ctx.font = '10px monospace';

      // CPU indicator
      if (this.cpuUsage > 50) {
        const cpuColor = this.cpuUsage > 80 ? '#FF4444' : '#FFD700';
        ctx.fillStyle = cpuColor;
        ctx.fillText(`CPU:${Math.round(this.cpuUsage)}%`, x, y);
      }

      // RAM indicator
      if (this.ramUsage > 70) {
        const ramColor = this.ramUsage > 90 ? '#FF4444' : '#FFD700';
        ctx.fillStyle = ramColor;
        ctx.fillText(`RAM:${Math.round(this.ramUsage)}%`, x, y + 12);
      }

      // Sweat drops
      if (this.showSweat) {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(character.x + character.size - 8, character.y + 10, 3, 4);
        ctx.fillRect(character.x + character.size - 8, character.y + 16, 2, 3);
      }

      ctx.restore();
    }
  }

  updateConfig(newConfig) {
    this.config = newConfig;
  }
}
