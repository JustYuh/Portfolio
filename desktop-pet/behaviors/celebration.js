// =============================================================================
// CELEBRATION MODE BEHAVIOR (Playful)
// Celebrates git commits and successful builds
// =============================================================================

export default class Celebration {
  constructor(character, config) {
    this.character = character;
    this.config = config;
    this.lastCommitHash = null;
    this.checkInterval = 10000; // Check every 10 seconds
    this.lastCheck = Date.now();
    this.isCelebrating = false;
    this.celebrationEndTime = 0;
  }

  async update(deltaTime, behaviorState, mouseState) {
    const now = Date.now();

    // Check for git activity periodically
    if (now - this.lastCheck >= this.checkInterval) {
      this.lastCheck = now;
      await this.checkGitActivity();
    }

    // Handle active celebration
    if (this.isCelebrating) {
      if (now >= this.celebrationEndTime) {
        this.endCelebration();
      } else {
        // Keep celebrating
        this.character.state = 'celebrating';
      }
    }
  }

  async checkGitActivity() {
    // Check for new git commits
    // This is a simplified version - in production, you'd monitor .git directory
    // or use git hooks

    try {
      // Placeholder for git detection
      // In real implementation, this would check:
      // 1. Monitor .git/logs/HEAD for changes
      // 2. Parse last commit hash
      // 3. Compare with this.lastCommitHash

      // For now, we'll just use a random chance for demonstration
      // In production, you'd implement actual git monitoring

      // Example of what the actual check would look like:
      /*
      const gitLogPath = '.git/logs/HEAD';
      if (fs.existsSync(gitLogPath)) {
        const content = fs.readFileSync(gitLogPath, 'utf8');
        const lines = content.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const hash = lastLine.split(' ')[1];

        if (hash !== this.lastCommitHash) {
          this.lastCommitHash = hash;
          // Extract commit message
          const message = lastLine.split('\t')[1] || 'commit';
          this.celebrate('commit', message);
        }
      }
      */

      // Placeholder - would be replaced with actual git monitoring
    } catch (error) {
      console.error('Error checking git activity:', error);
    }
  }

  celebrate(type, message) {
    if (this.isCelebrating) return;

    this.isCelebrating = true;
    this.celebrationEndTime = Date.now() + 5000; // Celebrate for 5 seconds

    this.character.state = 'celebrating';
    this.character.vx = 0;

    if (type === 'commit') {
      window.electronAPI.showNotification(
        '🎉 New Commit!',
        `Great work! Committed: ${message}`
      );
    } else if (type === 'build') {
      window.electronAPI.showNotification(
        '✅ Build Successful!',
        'Your build completed successfully!'
      );
    }

    console.log('Celebration: Starting celebration for', type);
  }

  endCelebration() {
    this.isCelebrating = false;
    this.character.state = 'idle';
    console.log('Celebration: Ended');
  }

  drawUI(ctx, character) {
    // Draw celebration effects
    if (this.isCelebrating) {
      ctx.save();

      const now = Date.now();
      const elapsed = now - (this.celebrationEndTime - 5000);
      const progress = elapsed / 5000;

      // Draw animated confetti
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + progress * Math.PI;
        const distance = 30 + progress * 50;
        const x = character.x + character.size / 2 + Math.cos(angle) * distance;
        const y = character.y + character.size / 2 + Math.sin(angle) * distance;

        // Random colors
        const colors = ['#FFD700', '#87CEEB', '#90EE90', '#FF6B9D', '#FFA500'];
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }

      // Draw celebration text
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;

      const text = '🎉';
      const textX = character.x + character.size / 2 - 10;
      const textY = character.y - 30 - Math.sin(progress * Math.PI * 4) * 5;

      ctx.strokeText(text, textX, textY);
      ctx.fillText(text, textX, textY);

      ctx.restore();
    }
  }

  updateConfig(newConfig) {
    this.config = newConfig;
  }

  // Manual trigger for testing
  triggerCelebration(type = 'commit', message = 'test') {
    this.celebrate(type, message);
  }

  // Watch for build completion
  watchBuildProcess(processName) {
    // This would monitor specific build processes
    // Implementation would check for process completion
    console.log('Watching build process:', processName);
  }
}
