// =============================================================================
// MOUSE THIEF BEHAVIOR (Playful)
// Occasionally chases and steals the mouse cursor
// =============================================================================

export default class MouseThief {
  constructor(character, config) {
    this.character = character;
    this.config = config;
    this.isChasing = false;
    this.lastChase = Date.now();
    this.chaseInterval = 15 * 60 * 1000; // Every 15 minutes
    this.chaseIntervalVariance = 15 * 60 * 1000; // +/- 15 minutes
    this.nextChaseTime = this.calculateNextChaseTime();
    this.chaseDuration = 10000; // Chase for 10 seconds max
    this.chaseStartTime = 0;
    this.hasCaughtMouse = false;
    this.lastTypingCheck = Date.now();
    this.isTyping = false;
  }

  calculateNextChaseTime() {
    const variance = (Math.random() - 0.5) * this.chaseIntervalVariance;
    return Date.now() + this.chaseInterval + variance;
  }

  update(deltaTime, behaviorState, mouseState) {
    const now = Date.now();

    // Don't chase during focus mode or if disabled
    if (behaviorState.currentMode === 'focus' || this.config.general.disableMouseStealing) {
      this.isChasing = false;
      return;
    }

    // Check for active typing (simple heuristic based on activity)
    if (now - this.lastTypingCheck > 1000) {
      this.lastTypingCheck = now;
      this.checkTyping();
    }

    // Don't interrupt if user is actively typing
    if (this.isTyping) {
      return;
    }

    // Check if it's time to chase
    if (!this.isChasing && now >= this.nextChaseTime) {
      this.startChase();
    }

    // Handle active chase
    if (this.isChasing) {
      this.handleChase(mouseState);

      // End chase after duration or if caught
      if (now - this.chaseStartTime > this.chaseDuration || this.hasCaughtMouse) {
        this.endChase();
      }
    }
  }

  startChase() {
    this.isChasing = true;
    this.chaseStartTime = Date.now();
    this.hasCaughtMouse = false;
    this.character.state = 'excited';

    console.log('Mouse thief: Starting chase!');
  }

  async handleChase(mouseState) {
    // Get current mouse position
    let mousePos;
    try {
      mousePos = await window.electronAPI.getMousePosition();
    } catch (error) {
      console.error('Failed to get mouse position:', error);
      this.endChase();
      return;
    }

    const dx = mousePos.x - (this.character.x + this.character.size / 2);
    const dy = mousePos.y - (this.character.y + this.character.size / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Chase the mouse
    if (distance > 20) {
      this.character.state = 'excited';
      const speed = 4;

      // Move towards mouse
      this.character.direction = dx > 0 ? 1 : -1;
      this.character.vx = (dx / distance) * speed;
      this.character.vy = (dy / distance) * speed;
    } else {
      // Caught the mouse!
      this.catchMouse(mousePos);
    }
  }

  async catchMouse(mousePos) {
    if (this.hasCaughtMouse) return;

    this.hasCaughtMouse = true;
    this.character.state = 'carrying';
    this.character.vx = 0;
    this.character.vy = 0;

    console.log('Mouse thief: Caught the mouse!');

    // Pull mouse away gently
    const pullDistance = 100;
    const newX = mousePos.x + (Math.random() - 0.5) * pullDistance;
    const newY = mousePos.y + (Math.random() - 0.5) * pullDistance;

    try {
      window.electronAPI.moveMouse(Math.round(newX), Math.round(newY));
    } catch (error) {
      console.error('Failed to move mouse:', error);
    }

    // Hold for a moment, then release
    setTimeout(() => {
      this.endChase();
    }, 2000);
  }

  endChase() {
    this.isChasing = false;
    this.hasCaughtMouse = false;
    this.character.state = 'idle';
    this.character.vx = 0;
    this.character.vy = 0;

    // Schedule next chase
    this.nextChaseTime = this.calculateNextChaseTime();

    console.log('Mouse thief: Chase ended. Next chase in', Math.round((this.nextChaseTime - Date.now()) / 60000), 'minutes');
  }

  checkTyping() {
    // Simple heuristic: if there's been continuous activity, assume typing
    // In a real implementation, you'd monitor keyboard events
    this.isTyping = false; // Placeholder
  }

  drawUI(ctx, character) {
    // Draw a little target/crosshair when chasing
    if (this.isChasing && !this.hasCaughtMouse) {
      ctx.save();

      ctx.strokeStyle = '#FF6B9D';
      ctx.lineWidth = 2;

      // Draw crosshair near character
      const x = character.x + character.size / 2;
      const y = character.y + character.size / 2;

      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + 10, y);
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x, y + 10);
      ctx.stroke();

      ctx.restore();
    }
  }

  updateConfig(newConfig) {
    this.config = newConfig;
  }

  // Manual trigger for testing
  triggerChase() {
    if (!this.isChasing) {
      this.startChase();
    }
  }
}
