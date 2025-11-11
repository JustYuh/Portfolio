// =============================================================================
// POMODORO TIMER BEHAVIOR
// Character walks energetically during work, rests during breaks
// =============================================================================

export default class PomodoroTimer {
  constructor(character, config) {
    this.character = character;
    this.config = config;
    this.isActive = false;
    this.currentSession = 'work'; // 'work' or 'break'
    this.sessionCount = 0;
    this.timeRemaining = 0;
    this.isPaused = false;

    // Convert minutes to milliseconds
    this.workDuration = config.behaviors.pomodoro.workDuration * 60 * 1000;
    this.breakDuration = config.behaviors.pomodoro.breakDuration * 60 * 1000;

    this.startSession('work');
  }

  startSession(type) {
    this.currentSession = type;
    this.timeRemaining = type === 'work' ? this.workDuration : this.breakDuration;
    this.isActive = true;

    if (type === 'work') {
      this.sessionCount++;
      // Start work - character walks energetically
      this.character.state = 'walking';
      this.character.vx = 2 * (Math.random() > 0.5 ? 1 : -1);
      window.electronAPI.showNotification(
        '🍅 Work Session Started',
        `Session ${this.sessionCount} - Let's focus for ${this.config.behaviors.pomodoro.workDuration} minutes!`
      );
    } else {
      // Break time - character sits down
      this.character.state = 'idle';
      this.character.vx = 0;
      window.electronAPI.showNotification(
        '☕ Break Time!',
        `Take a ${this.config.behaviors.pomodoro.breakDuration} minute break. You earned it!`
      );
    }
  }

  update(deltaTime, behaviorState, mouseState) {
    if (!this.isActive || this.isPaused) return;

    // Countdown timer
    this.timeRemaining -= deltaTime;

    if (this.timeRemaining <= 0) {
      this.onSessionComplete();
    } else {
      // Update character behavior based on session
      if (this.currentSession === 'work') {
        // During work: keep moving
        if (this.character.state === 'idle' && Math.random() < 0.05) {
          this.character.state = 'walking';
          this.character.direction = Math.random() > 0.5 ? 1 : -1;
          this.character.vx = this.character.direction * 2;
        }

        // Show excitement in last 5 minutes
        if (this.timeRemaining < 5 * 60 * 1000 && Math.random() < 0.001) {
          this.character.state = 'excited';
          setTimeout(() => {
            if (this.character.state === 'excited') {
              this.character.state = 'walking';
            }
          }, 2000);
        }
      } else {
        // During break: stay idle/resting
        if (this.character.state === 'walking') {
          this.character.state = 'idle';
          this.character.vx = 0;
        }
      }
    }
  }

  onSessionComplete() {
    if (this.currentSession === 'work') {
      // Work session complete
      if (this.sessionCount % 4 === 0) {
        // After 4 pomodoros, celebrate!
        this.character.state = 'celebrating';
        window.electronAPI.showNotification(
          '🎉 4 Pomodoros Complete!',
          'Amazing work! Take a longer break (15-30 minutes).'
        );

        setTimeout(() => {
          this.character.state = 'idle';
        }, 5000);

        // Long break - pause timer
        this.isActive = false;
      } else {
        // Regular break
        this.startSession('break');
      }
    } else {
      // Break complete, start new work session
      this.startSession('work');
    }
  }

  drawUI(ctx, character) {
    if (!this.isActive) return;

    // Draw timer near character
    const minutes = Math.floor(this.timeRemaining / 60000);
    const seconds = Math.floor((this.timeRemaining % 60000) / 1000);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    ctx.save();
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = this.currentSession === 'work' ? '#FF6B9D' : '#87CEEB';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;

    const x = character.x + character.size / 2 - 20;
    const y = character.y - 10;

    // Draw text with outline
    ctx.strokeText(timeStr, x, y);
    ctx.fillText(timeStr, x, y);

    // Draw small indicator
    const indicator = this.currentSession === 'work' ? '🍅' : '☕';
    ctx.font = '16px Arial';
    ctx.fillText(indicator, character.x + character.size / 2 - 8, character.y - 25);

    ctx.restore();
  }

  updateConfig(newConfig) {
    this.config = newConfig;
    this.workDuration = newConfig.behaviors.pomodoro.workDuration * 60 * 1000;
    this.breakDuration = newConfig.behaviors.pomodoro.breakDuration * 60 * 1000;
  }

  toggle() {
    this.isPaused = !this.isPaused;
  }

  reset() {
    this.sessionCount = 0;
    this.startSession('work');
  }
}
