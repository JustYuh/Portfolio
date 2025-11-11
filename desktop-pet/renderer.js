// =============================================================================
// DESKTOP PET RENDERER - Main character logic and behavior system
// =============================================================================

// Configuration constants
const CHARACTER_SIZE = 32; // Base size in pixels
const GRAVITY = 0.5;
const JUMP_SPEED = -8;
const WALK_SPEED = 2;
const ANIMATION_SPEED = 150; // ms per frame

// =============================================================================
// GLOBAL STATE
// =============================================================================
let canvas, ctx;
let screenWidth, screenHeight;
let config = null;

// Character state
let character = {
  x: 100,
  y: 100,
  vx: 0,
  vy: 0,
  size: CHARACTER_SIZE,
  direction: 1, // 1 = right, -1 = left
  state: 'idle', // idle, walking, sleeping, excited, tired, carrying, celebrating
  animFrame: 0,
  animTimer: 0,
  isDragging: false,
  energy: 100, // 0-100
  isOnGround: false
};

// Mouse state
let mouseState = {
  x: 0,
  y: 0,
  isOverCharacter: false
};

// Behavior system state
let behaviorState = {
  currentMode: 'idle', // idle, working, break, focus, celebrating
  lastActivity: Date.now(),
  continuousActivity: 0
};

// Load all behavior modules
let behaviors = {};

// =============================================================================
// INITIALIZATION
// =============================================================================
async function init() {
  console.log('Initializing Desktop Pet...');

  canvas = document.getElementById('pet-canvas');
  ctx = canvas.getContext('2d');

  // Get screen size and set canvas
  const screenSize = await window.electronAPI.getScreenSize();
  screenWidth = screenSize.width;
  screenHeight = screenSize.height;
  canvas.width = screenWidth;
  canvas.height = screenHeight;

  // Load config
  config = await window.electronAPI.getConfig();
  console.log('Config loaded:', config);

  // Apply character size from config
  character.size = CHARACTER_SIZE * config.character.size;

  // Start character in random position
  character.x = Math.random() * (screenWidth - character.size);
  character.y = screenHeight - character.size - 100;

  // Initialize behaviors
  await initBehaviors();

  // Set up event listeners
  setupEventListeners();

  // Set up settings panel
  setupSettingsPanel();

  // Start main loop
  requestAnimationFrame(gameLoop);

  console.log('Desktop Pet initialized!');
}

// =============================================================================
// BEHAVIOR SYSTEM INITIALIZATION
// =============================================================================
async function initBehaviors() {
  // Import all behavior modules
  // These will be loaded dynamically
  const PomodoroTimer = await import('./behaviors/pomodoro.js').catch(() => null);
  const BreakReminder = await import('./behaviors/break-reminder.js').catch(() => null);
  const FocusMode = await import('./behaviors/focus-mode.js').catch(() => null);
  const SystemHealth = await import('./behaviors/system-health.js').catch(() => null);
  const Hydration = await import('./behaviors/hydration.js').catch(() => null);
  const MouseThief = await import('./behaviors/mouse-thief.js').catch(() => null);
  const Celebration = await import('./behaviors/celebration.js').catch(() => null);

  // Initialize each behavior if available
  if (PomodoroTimer) behaviors.pomodoro = new PomodoroTimer.default(character, config);
  if (BreakReminder) behaviors.breakReminder = new BreakReminder.default(character, config);
  if (FocusMode) behaviors.focusMode = new FocusMode.default(character, config);
  if (SystemHealth) behaviors.systemHealth = new SystemHealth.default(character, config);
  if (Hydration) behaviors.hydration = new Hydration.default(character, config);
  if (MouseThief) behaviors.mouseThief = new MouseThief.default(character, config);
  if (Celebration) behaviors.celebration = new Celebration.default(character, config);

  console.log('Behaviors initialized:', Object.keys(behaviors));
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================
function setupEventListeners() {
  // Character dragging
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);

  // Right-click menu
  canvas.addEventListener('contextmenu', handleContextMenu);

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyDown);

  // Listen for config updates from main process
  window.electronAPI.onConfigUpdated((newConfig) => {
    config = newConfig;
    character.size = CHARACTER_SIZE * config.character.size;
    console.log('Config updated:', config);
  });

  // Listen for wake-up event
  window.electronAPI.onWakeUp(() => {
    if (character.state === 'sleeping') {
      character.state = 'idle';
    }
  });

  // Listen for settings panel event
  window.electronAPI.onShowSettings(() => {
    showSettingsPanel();
  });
}

function handleMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isPointInCharacter(x, y)) {
    character.isDragging = true;
    character.state = 'excited';
    window.electronAPI.setClickThrough(false);
    e.preventDefault();
  }
}

function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  mouseState.x = x;
  mouseState.y = y;

  if (character.isDragging) {
    character.x = x - character.size / 2;
    character.y = y - character.size / 2;
    character.vx = 0;
    character.vy = 0;
  }

  // Update mouse over state
  const wasOver = mouseState.isOverCharacter;
  mouseState.isOverCharacter = isPointInCharacter(x, y);

  // Toggle click-through based on mouse position
  if (mouseState.isOverCharacter && !wasOver) {
    window.electronAPI.setClickThrough(false);
  } else if (!mouseState.isOverCharacter && wasOver && !character.isDragging) {
    window.electronAPI.setClickThrough(true);
  }
}

function handleMouseUp(e) {
  if (character.isDragging) {
    character.isDragging = false;
    character.state = 'idle';
    if (!mouseState.isOverCharacter) {
      window.electronAPI.setClickThrough(true);
    }
  }
}

function handleContextMenu(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isPointInCharacter(x, y)) {
    showSettingsPanel();
    e.preventDefault();
  }
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel.classList.contains('visible')) {
      hideSettingsPanel();
    } else {
      // Optional: quit on Escape when settings not open
      // window.electronAPI.quitApp();
    }
  }
}

// =============================================================================
// SETTINGS PANEL
// =============================================================================
function setupSettingsPanel() {
  // Populate settings from config
  document.getElementById('pomodoro-enabled').checked = config.behaviors.pomodoro.enabled;
  document.getElementById('pomodoro-work').value = config.behaviors.pomodoro.workDuration;
  document.getElementById('pomodoro-break').value = config.behaviors.pomodoro.breakDuration;

  document.getElementById('break-reminder-enabled').checked = config.behaviors.breakReminder.enabled;
  document.getElementById('break-threshold').value = config.behaviors.breakReminder.activityThreshold;

  document.getElementById('focus-mode-enabled').checked = config.behaviors.focusMode.enabled;
  document.getElementById('system-health-enabled').checked = config.behaviors.systemHealth.enabled;

  document.getElementById('hydration-enabled').checked = config.behaviors.hydration.enabled;
  document.getElementById('hydration-interval').value = config.behaviors.hydration.interval;

  document.getElementById('mouse-thief-enabled').checked = config.behaviors.mouseThief.enabled;
  document.getElementById('celebration-enabled').checked = config.behaviors.celebration.enabled;

  document.getElementById('character-speed').value = config.character.speed;
  document.getElementById('speed-value').textContent = config.character.speed.toFixed(1);

  document.getElementById('character-size').value = config.character.size;
  document.getElementById('size-value').textContent = config.character.size.toFixed(1);

  document.getElementById('disable-mouse-stealing').checked = config.general.disableMouseStealing;
  document.getElementById('work-hours-only').checked = config.general.workHoursOnly;
  document.getElementById('work-hours-start').value = config.general.workHoursStart;
  document.getElementById('work-hours-end').value = config.general.workHoursEnd;

  // Slider updates
  document.getElementById('character-speed').addEventListener('input', (e) => {
    document.getElementById('speed-value').textContent = parseFloat(e.target.value).toFixed(1);
  });

  document.getElementById('character-size').addEventListener('input', (e) => {
    document.getElementById('size-value').textContent = parseFloat(e.target.value).toFixed(1);
  });

  // Save button
  document.getElementById('save-settings').addEventListener('click', saveSettings);

  // Close button
  document.getElementById('close-settings').addEventListener('click', hideSettingsPanel);
}

function showSettingsPanel() {
  document.getElementById('settings-panel').classList.add('visible');
  window.electronAPI.setClickThrough(false);
}

function hideSettingsPanel() {
  document.getElementById('settings-panel').classList.remove('visible');
  if (!mouseState.isOverCharacter) {
    window.electronAPI.setClickThrough(true);
  }
}

function saveSettings() {
  // Gather all settings
  const newConfig = {
    behaviors: {
      pomodoro: {
        enabled: document.getElementById('pomodoro-enabled').checked,
        workDuration: parseInt(document.getElementById('pomodoro-work').value),
        breakDuration: parseInt(document.getElementById('pomodoro-break').value)
      },
      breakReminder: {
        enabled: document.getElementById('break-reminder-enabled').checked,
        activityThreshold: parseInt(document.getElementById('break-threshold').value)
      },
      focusMode: {
        enabled: document.getElementById('focus-mode-enabled').checked
      },
      systemHealth: {
        enabled: document.getElementById('system-health-enabled').checked
      },
      hydration: {
        enabled: document.getElementById('hydration-enabled').checked,
        interval: parseInt(document.getElementById('hydration-interval').value)
      },
      mouseThief: {
        enabled: document.getElementById('mouse-thief-enabled').checked
      },
      celebration: {
        enabled: document.getElementById('celebration-enabled').checked
      }
    },
    character: {
      speed: parseFloat(document.getElementById('character-speed').value),
      size: parseFloat(document.getElementById('character-size').value)
    },
    general: {
      disableMouseStealing: document.getElementById('disable-mouse-stealing').checked,
      workHoursOnly: document.getElementById('work-hours-only').checked,
      workHoursStart: parseInt(document.getElementById('work-hours-start').value),
      workHoursEnd: parseInt(document.getElementById('work-hours-end').value)
    }
  };

  window.electronAPI.updateConfig(newConfig);
  config = newConfig;

  // Apply immediate changes
  character.size = CHARACTER_SIZE * config.character.size;

  // Reinitialize behaviors with new config
  Object.values(behaviors).forEach(behavior => {
    if (behavior.updateConfig) {
      behavior.updateConfig(config);
    }
  });

  window.electronAPI.showNotification('Settings Saved', 'Your desktop pet settings have been updated!');
  hideSettingsPanel();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function isPointInCharacter(x, y) {
  return x >= character.x &&
         x <= character.x + character.size &&
         y >= character.y &&
         y <= character.y + character.size;
}

// =============================================================================
// GAME LOOP
// =============================================================================
let lastTime = Date.now();

function gameLoop() {
  const now = Date.now();
  const deltaTime = now - lastTime;
  lastTime = now;

  // Clear canvas
  ctx.clearRect(0, 0, screenWidth, screenHeight);

  // Update character
  updateCharacter(deltaTime);

  // Update behaviors
  updateBehaviors(deltaTime);

  // Draw character
  drawCharacter();

  // Draw UI overlays (timer, etc.)
  drawUI();

  requestAnimationFrame(gameLoop);
}

// =============================================================================
// CHARACTER UPDATE
// =============================================================================
function updateCharacter(deltaTime) {
  if (character.isDragging) {
    return; // Don't apply physics when dragging
  }

  // Apply gravity
  character.vy += GRAVITY;

  // Ground collision
  const groundY = screenHeight - character.size;
  if (character.y + character.vy >= groundY) {
    character.y = groundY;
    character.vy = 0;
    character.isOnGround = true;
  } else {
    character.isOnGround = false;
  }

  // Apply velocity
  character.x += character.vx * config.character.speed;
  character.y += character.vy;

  // Screen bounds (sides)
  if (character.x < 0) {
    character.x = 0;
    character.vx = 0;
  } else if (character.x > screenWidth - character.size) {
    character.x = screenWidth - character.size;
    character.vx = 0;
  }

  // Update animation
  character.animTimer += deltaTime;
  if (character.animTimer > ANIMATION_SPEED) {
    character.animFrame = (character.animFrame + 1) % 4;
    character.animTimer = 0;
  }

  // Simple idle movement if no behaviors are active
  if (character.state === 'idle' && character.isOnGround) {
    // Occasionally walk around
    if (Math.random() < 0.002) {
      character.state = 'walking';
      character.direction = Math.random() > 0.5 ? 1 : -1;
      character.vx = character.direction * WALK_SPEED;
    }
  } else if (character.state === 'walking' && character.isOnGround) {
    // Stop walking after a bit
    if (Math.random() < 0.01) {
      character.state = 'idle';
      character.vx = 0;
    }
  }

  // Friction
  if (character.isOnGround && Math.abs(character.vx) > 0.1) {
    character.vx *= 0.95;
  }
}

// =============================================================================
// BEHAVIOR UPDATE
// =============================================================================
function updateBehaviors(deltaTime) {
  // Update each active behavior
  for (const [name, behavior] of Object.entries(behaviors)) {
    const behaviorConfig = config.behaviors[name];
    if (behaviorConfig && behaviorConfig.enabled && behavior.update) {
      behavior.update(deltaTime, behaviorState, mouseState);
    }
  }
}

// =============================================================================
// CHARACTER DRAWING
// =============================================================================
function drawCharacter() {
  const { x, y, size, state, animFrame, direction } = character;

  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  if (direction === -1) {
    ctx.scale(-1, 1);
  }
  ctx.translate(-size / 2, -size / 2);

  // Draw character based on state
  switch (state) {
    case 'idle':
      drawIdleCharacter(size, animFrame);
      break;
    case 'walking':
      drawWalkingCharacter(size, animFrame);
      break;
    case 'sleeping':
      drawSleepingCharacter(size, animFrame);
      break;
    case 'excited':
      drawExcitedCharacter(size, animFrame);
      break;
    case 'tired':
      drawTiredCharacter(size, animFrame);
      break;
    case 'carrying':
      drawCarryingCharacter(size, animFrame);
      break;
    case 'celebrating':
      drawCelebratingCharacter(size, animFrame);
      break;
    default:
      drawIdleCharacter(size, animFrame);
  }

  ctx.restore();
}

// Character drawing functions (pixel art style)
function drawIdleCharacter(size, frame) {
  // Body
  ctx.fillStyle = '#FF6B9D';
  ctx.fillRect(4, 8, size - 8, size - 12);

  // Eyes
  ctx.fillStyle = '#FFF';
  ctx.fillRect(10, 14, 4, 4);
  ctx.fillRect(size - 14, 14, 4, 4);

  // Pupils (blink animation)
  if (frame !== 3) {
    ctx.fillStyle = '#000';
    ctx.fillRect(11, 15, 2, 2);
    ctx.fillRect(size - 13, 15, 2, 2);
  }

  // Mouth
  ctx.fillStyle = '#000';
  ctx.fillRect(12, 22, 8, 2);

  // Ears (idle bob)
  const earBob = frame === 1 ? -1 : 0;
  ctx.fillStyle = '#FF8FB3';
  ctx.fillRect(2, 6 + earBob, 4, 6);
  ctx.fillRect(size - 6, 6 + earBob, 4, 6);
}

function drawWalkingCharacter(size, frame) {
  // Body
  ctx.fillStyle = '#FF6B9D';
  ctx.fillRect(4, 8, size - 8, size - 12);

  // Eyes
  ctx.fillStyle = '#FFF';
  ctx.fillRect(10, 14, 4, 4);
  ctx.fillRect(size - 14, 14, 4, 4);

  ctx.fillStyle = '#000';
  ctx.fillRect(11, 15, 2, 2);
  ctx.fillRect(size - 13, 15, 2, 2);

  // Mouth (determined)
  ctx.fillStyle = '#000';
  ctx.fillRect(11, 22, 10, 2);

  // Ears (bounce with walk)
  const earBounce = frame % 2 === 0 ? -2 : 0;
  ctx.fillStyle = '#FF8FB3';
  ctx.fillRect(2, 6 + earBounce, 4, 6);
  ctx.fillRect(size - 6, 6 + earBounce, 4, 6);

  // Legs (walking animation)
  ctx.fillStyle = '#FF6B9D';
  if (frame % 2 === 0) {
    ctx.fillRect(8, size - 6, 4, 6);
    ctx.fillRect(size - 16, size - 4, 4, 4);
  } else {
    ctx.fillRect(8, size - 4, 4, 4);
    ctx.fillRect(size - 16, size - 6, 4, 6);
  }
}

function drawSleepingCharacter(size, frame) {
  // Lying down body
  ctx.fillStyle = '#FF6B9D';
  ctx.fillRect(2, size - 12, size - 4, 8);

  // Closed eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(8, size - 8, 4, 1);
  ctx.fillRect(size - 12, size - 8, 4, 1);

  // ZZZ (sleep animation)
  if (frame % 2 === 0) {
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.fillText('z', size + 4, size - 16);
    ctx.fillText('z', size + 10, size - 22);
    ctx.fillText('Z', size + 14, size - 28);
  }
}

function drawExcitedCharacter(size, frame) {
  // Body (slightly jumping)
  const jump = Math.sin(frame * 0.5) * 2;
  ctx.fillStyle = '#FF6B9D';
  ctx.fillRect(4, 8 - jump, size - 8, size - 12);

  // Wide eyes
  ctx.fillStyle = '#FFF';
  ctx.fillRect(9, 13 - jump, 6, 6);
  ctx.fillRect(size - 15, 13 - jump, 6, 6);

  ctx.fillStyle = '#000';
  ctx.fillRect(11, 15 - jump, 2, 3);
  ctx.fillRect(size - 13, 15 - jump, 2, 3);

  // Happy mouth
  ctx.fillStyle = '#000';
  ctx.fillRect(10, 22 - jump, 2, 2);
  ctx.fillRect(12, 23 - jump, 4, 2);
  ctx.fillRect(16, 22 - jump, 2, 2);

  // Ears (excited)
  ctx.fillStyle = '#FF8FB3';
  ctx.fillRect(2, 4 - jump, 4, 8);
  ctx.fillRect(size - 6, 4 - jump, 4, 8);
}

function drawTiredCharacter(size, frame) {
  // Body (slouched)
  ctx.fillStyle = '#FF6B9D';
  ctx.fillRect(4, 12, size - 8, size - 14);

  // Half-closed eyes
  ctx.fillStyle = '#FFF';
  ctx.fillRect(10, 16, 4, 3);
  ctx.fillRect(size - 14, 16, 4, 3);

  ctx.fillStyle = '#000';
  ctx.fillRect(11, 18, 2, 1);
  ctx.fillRect(size - 13, 18, 2, 1);

  // Tired mouth
  ctx.fillStyle = '#000';
  ctx.fillRect(12, 24, 6, 1);

  // Droopy ears
  ctx.fillStyle = '#FF8FB3';
  ctx.fillRect(2, 10, 4, 8);
  ctx.fillRect(size - 6, 10, 4, 8);

  // Sweat drops (if animated)
  if (frame % 2 === 0) {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(size - 8, 14, 2, 3);
  }
}

function drawCarryingCharacter(size, frame) {
  // Similar to walking but with arms up
  drawWalkingCharacter(size, frame);

  // Carrying something above head
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(size / 2 - 4, 2, 8, 6);
}

function drawCelebratingCharacter(size, frame) {
  // Body (bouncing)
  const bounce = Math.abs(Math.sin(frame * 0.8)) * 4;
  ctx.fillStyle = '#FF6B9D';
  ctx.fillRect(4, 8 - bounce, size - 8, size - 12);

  // Very happy eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(10, 14 - bounce, 2, 2);
  ctx.fillRect(12, 15 - bounce, 2, 1);
  ctx.fillRect(size - 14, 14 - bounce, 2, 2);
  ctx.fillRect(size - 16, 15 - bounce, 2, 1);

  // Big smile
  ctx.fillStyle = '#000';
  ctx.fillRect(10, 22 - bounce, 2, 2);
  ctx.fillRect(12, 23 - bounce, 8, 2);
  ctx.fillRect(20, 22 - bounce, 2, 2);

  // Ears (very perky)
  ctx.fillStyle = '#FF8FB3';
  ctx.fillRect(2, 3 - bounce, 4, 8);
  ctx.fillRect(size - 6, 3 - bounce, 4, 8);

  // Confetti
  if (frame % 2 === 0) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(size + 2, -2, 2, 2);
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(size - 4, 0, 2, 2);
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(size + 6, 2, 2, 2);
  }
}

// =============================================================================
// UI DRAWING
// =============================================================================
function drawUI() {
  // Draw behavior-specific UI elements
  for (const [name, behavior] of Object.entries(behaviors)) {
    const behaviorConfig = config.behaviors[name];
    if (behaviorConfig && behaviorConfig.enabled && behavior.drawUI) {
      behavior.drawUI(ctx, character);
    }
  }
}

// =============================================================================
// START APPLICATION
// =============================================================================
window.addEventListener('DOMContentLoaded', init);
