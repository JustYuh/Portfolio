// =============================================================================
// FOCUS MODE INTEGRATION BEHAVIOR
// Character sleeps in corner when focus/DND is enabled
// =============================================================================

export default class FocusMode {
  constructor(character, config) {
    this.character = character;
    this.config = config;
    this.isFocusModeActive = false;
    this.checkInterval = 30000; // Check every 30 seconds
    this.lastCheck = Date.now();
    this.savedState = null;
    this.cornerPosition = { x: 0, y: 0 };
  }

  async update(deltaTime, behaviorState, mouseState) {
    const now = Date.now();

    // Periodic check for focus mode
    if (now - this.lastCheck >= this.checkInterval) {
      this.lastCheck = now;
      await this.checkFocusMode();
    }

    // If in focus mode, ensure character stays in corner and sleeps
    if (this.isFocusModeActive) {
      this.character.state = 'sleeping';
      this.character.vx = 0;
      this.character.vy = 0;

      // Keep in corner
      if (Math.abs(this.character.x - this.cornerPosition.x) > 5 ||
          Math.abs(this.character.y - this.cornerPosition.y) > 5) {
        this.character.x = this.cornerPosition.x;
        this.character.y = this.cornerPosition.y;
      }
    }
  }

  async checkFocusMode() {
    // This would ideally call the system monitor, but for now we'll simulate
    // In a real implementation, this would check actual system focus mode
    // For now, we'll just detect based on time patterns or manual triggers

    // Placeholder: Check if certain apps are running that indicate focus
    // This could be expanded to actually check system DND settings
    const wasInFocusMode = this.isFocusModeActive;

    // Simulate focus mode detection (in real app, call system API)
    // For demo purposes, this is a placeholder
    this.isFocusModeActive = false; // Would be replaced with actual check

    // Handle state changes
    if (this.isFocusModeActive && !wasInFocusMode) {
      this.enterFocusMode();
    } else if (!this.isFocusModeActive && wasInFocusMode) {
      this.exitFocusMode();
    }
  }

  enterFocusMode() {
    // Save current state
    this.savedState = {
      state: this.character.state,
      x: this.character.x,
      y: this.character.y
    };

    // Move to corner
    this.cornerPosition = {
      x: 10,
      y: window.innerHeight - this.character.size - 10
    };

    this.character.x = this.cornerPosition.x;
    this.character.y = this.cornerPosition.y;
    this.character.state = 'sleeping';

    window.electronAPI.showNotification(
      '🔕 Focus Mode',
      'Your buddy is taking a quiet nap. Focus on your work!'
    );
  }

  exitFocusMode() {
    // Restore state or wake up
    if (this.savedState) {
      this.character.state = 'excited'; // Wake up excited
      setTimeout(() => {
        if (this.character.state === 'excited') {
          this.character.state = 'idle';
        }
      }, 3000);
    }

    window.electronAPI.showNotification(
      '👋 Focus Mode Ended',
      'Your buddy is awake and ready to help!'
    );

    this.savedState = null;
  }

  // Manual trigger (could be called from settings or keyboard shortcut)
  toggleFocusMode() {
    this.isFocusModeActive = !this.isFocusModeActive;

    if (this.isFocusModeActive) {
      this.enterFocusMode();
    } else {
      this.exitFocusMode();
    }
  }

  updateConfig(newConfig) {
    this.config = newConfig;
  }
}
