// =============================================================================
// SMART BREAK REMINDER BEHAVIOR
// Monitors activity and gets progressively tired, forcing breaks
// =============================================================================

export default class BreakReminder {
  constructor(character, config) {
    this.character = character;
    this.config = config;
    this.activityStartTime = Date.now();
    this.continuousActivityTime = 0;
    this.lastActivityTime = Date.now();
    this.isIdle = false;
    this.idleStartTime = null;
    this.hasShownWarning = false;
    this.forcedBreak = false;

    // Threshold in milliseconds
    this.activityThreshold = config.behaviors.breakReminder.activityThreshold * 60 * 1000;
  }

  update(deltaTime, behaviorState, mouseState) {
    const now = Date.now();

    // Track if there's been recent mouse activity
    const timeSinceActivity = now - this.lastActivityTime;

    if (timeSinceActivity < 5000) {
      // Recent activity detected
      if (this.isIdle) {
        // Just came back from idle
        if (this.forcedBreak && this.idleStartTime) {
          const idleDuration = now - this.idleStartTime;
          if (idleDuration >= 2 * 60 * 1000) {
            // Had a proper 2+ minute break
            this.reset();
            window.electronAPI.showNotification(
              '✨ Welcome Back!',
              'Great break! Your buddy is refreshed and ready to go!'
            );
          }
        }
        this.isIdle = false;
        this.idleStartTime = null;
      }

      // Accumulate continuous activity time
      this.continuousActivityTime = now - this.activityStartTime;

      // Check if we've exceeded the threshold
      if (this.continuousActivityTime >= this.activityThreshold) {
        this.handleLongActivity();
      } else if (this.continuousActivityTime >= this.activityThreshold * 0.7 && !this.hasShownWarning) {
        // 70% through - show warning
        this.character.state = 'tired';
        this.hasShownWarning = true;
        window.electronAPI.showNotification(
          '😴 Getting Tired...',
          'You\'ve been working hard! Consider taking a break soon.'
        );
      }
    } else {
      // No recent activity - user is idle
      if (!this.isIdle) {
        this.isIdle = true;
        this.idleStartTime = now;
      }
    }

    // Update energy level based on activity
    this.updateEnergy();
  }

  handleLongActivity() {
    if (!this.forcedBreak) {
      // First time hitting threshold
      this.forcedBreak = true;
      this.character.state = 'sleeping';
      this.character.vx = 0;

      window.electronAPI.showNotification(
        '💤 Break Time!',
        'Your buddy needs a break (and so do you!). Take 2+ minutes to rest.'
      );
    } else {
      // Stay in forced break state
      this.character.state = 'sleeping';
      this.character.vx = 0;
    }
  }

  updateEnergy() {
    if (this.continuousActivityTime === 0) {
      this.character.energy = 100;
    } else {
      const energyPercent = 1 - (this.continuousActivityTime / this.activityThreshold);
      this.character.energy = Math.max(0, Math.min(100, energyPercent * 100));
    }

    // Adjust character speed based on energy
    if (this.character.energy < 30 && !this.forcedBreak) {
      this.character.state = 'tired';
    }
  }

  reset() {
    this.activityStartTime = Date.now();
    this.continuousActivityTime = 0;
    this.hasShownWarning = false;
    this.forcedBreak = false;
    this.character.energy = 100;

    if (this.character.state === 'sleeping' || this.character.state === 'tired') {
      this.character.state = 'idle';
    }
  }

  trackActivity() {
    this.lastActivityTime = Date.now();
  }

  drawUI(ctx, character) {
    // Draw energy bar if energy is low
    if (character.energy < 50) {
      ctx.save();

      const barWidth = 40;
      const barHeight = 4;
      const x = character.x + character.size / 2 - barWidth / 2;
      const y = character.y - 15;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Energy bar (color changes with level)
      let color;
      if (character.energy < 20) {
        color = '#FF4444';
      } else if (character.energy < 50) {
        color = '#FFD700';
      } else {
        color = '#4CAF50';
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth * (character.energy / 100), barHeight);

      ctx.restore();
    }
  }

  updateConfig(newConfig) {
    this.config = newConfig;
    this.activityThreshold = newConfig.behaviors.breakReminder.activityThreshold * 60 * 1000;
  }
}
