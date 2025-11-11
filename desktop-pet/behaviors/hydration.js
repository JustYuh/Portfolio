// =============================================================================
// HYDRATION REMINDER BEHAVIOR
// Walks to screen edge with water droplet reminder
// =============================================================================

export default class Hydration {
  constructor(character, config) {
    this.character = character;
    this.config = config;
    this.lastReminder = Date.now();
    this.reminderInterval = config.behaviors.hydration.interval * 60 * 1000;
    this.isReminding = false;
    this.targetX = 0;
    this.hasReachedEdge = false;
  }

  update(deltaTime, behaviorState, mouseState) {
    const now = Date.now();

    // Check if it's time for a reminder
    if (!this.isReminding && now - this.lastReminder >= this.reminderInterval) {
      this.startReminder();
    }

    // During reminder, walk to edge
    if (this.isReminding) {
      this.handleReminderWalk();
    }
  }

  startReminder() {
    this.isReminding = true;
    this.hasReachedEdge = false;

    // Choose a random edge (left or right)
    const screenWidth = window.innerWidth;
    if (Math.random() > 0.5) {
      this.targetX = screenWidth - this.character.size - 10;
      this.character.direction = 1;
    } else {
      this.targetX = 10;
      this.character.direction = -1;
    }

    this.character.state = 'carrying'; // Carrying a water droplet
    this.character.vx = this.character.direction * 2;

    window.electronAPI.showNotification(
      '💧 Hydration Time',
      'Time for a water break! Stay hydrated!'
    );
  }

  handleReminderWalk() {
    // Walk towards target edge
    const distance = Math.abs(this.character.x - this.targetX);

    if (distance < 10 && !this.hasReachedEdge) {
      // Reached edge
      this.hasReachedEdge = true;
      this.character.state = 'idle';
      this.character.vx = 0;

      // Stay there for a moment, then return to normal
      setTimeout(() => {
        this.endReminder();
      }, 5000);
    } else if (!this.hasReachedEdge) {
      // Keep walking
      this.character.state = 'carrying';
      const direction = this.targetX > this.character.x ? 1 : -1;
      this.character.direction = direction;
      this.character.vx = direction * 2;
    }
  }

  endReminder() {
    this.isReminding = false;
    this.hasReachedEdge = false;
    this.lastReminder = Date.now();
    this.character.state = 'idle';
    this.character.vx = 0;
  }

  drawUI(ctx, character) {
    // Draw water droplet icon during reminder
    if (this.isReminding) {
      ctx.save();

      // Water droplet
      ctx.fillStyle = '#87CEEB';
      ctx.beginPath();
      const x = character.x + character.size / 2;
      const y = character.y - 20;

      // Simple droplet shape
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Shine effect
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  updateConfig(newConfig) {
    this.config = newConfig;
    this.reminderInterval = newConfig.behaviors.hydration.interval * 60 * 1000;
  }

  // Manual trigger
  triggerReminder() {
    if (!this.isReminding) {
      this.startReminder();
    }
  }
}
