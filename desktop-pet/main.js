const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// =============================================================================
// CONFIGURATION
// =============================================================================
const CONFIG_PATH = path.join(app.getPath('userData'), 'pet-config.json');
const DEFAULT_CONFIG = {
  behaviors: {
    pomodoro: { enabled: true, workDuration: 25, breakDuration: 5 },
    breakReminder: { enabled: true, activityThreshold: 50 },
    focusMode: { enabled: true },
    systemHealth: { enabled: true },
    hydration: { enabled: true, interval: 60 },
    mouseThief: { enabled: true },
    celebration: { enabled: true }
  },
  character: {
    speed: 1.0,
    size: 1.0
  },
  general: {
    disableMouseStealing: false,
    workHoursOnly: false,
    workHoursStart: 9,
    workHoursEnd: 17
  }
};

// =============================================================================
// GLOBAL STATE
// =============================================================================
let mainWindow = null;
let tray = null;
let config = null;

// =============================================================================
// CONFIG MANAGEMENT
// =============================================================================
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      config = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    } else {
      config = { ...DEFAULT_CONFIG };
      saveConfig();
    }
  } catch (error) {
    console.error('Error loading config:', error);
    config = { ...DEFAULT_CONFIG };
  }
  return config;
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// =============================================================================
// WINDOW CREATION
// =============================================================================
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Set window to be click-through by default
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.loadFile('index.html');

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);

  // Position at top-left of screen
  mainWindow.setPosition(0, 0);

  // Keep window always on top
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// =============================================================================
// SYSTEM TRAY
// =============================================================================
function createTray() {
  // Create a simple icon (you can replace with an actual icon file)
  const icon = createTrayIcon();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Pet',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('wake-up');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        mainWindow.webContents.send('show-settings');
      }
    },
    {
      label: 'Behaviors',
      submenu: [
        {
          label: 'Pomodoro Timer',
          type: 'checkbox',
          checked: config.behaviors.pomodoro.enabled,
          click: (item) => {
            config.behaviors.pomodoro.enabled = item.checked;
            saveConfig();
            mainWindow.webContents.send('config-updated', config);
          }
        },
        {
          label: 'Break Reminder',
          type: 'checkbox',
          checked: config.behaviors.breakReminder.enabled,
          click: (item) => {
            config.behaviors.breakReminder.enabled = item.checked;
            saveConfig();
            mainWindow.webContents.send('config-updated', config);
          }
        },
        {
          label: 'Focus Mode',
          type: 'checkbox',
          checked: config.behaviors.focusMode.enabled,
          click: (item) => {
            config.behaviors.focusMode.enabled = item.checked;
            saveConfig();
            mainWindow.webContents.send('config-updated', config);
          }
        },
        {
          label: 'System Health Monitor',
          type: 'checkbox',
          checked: config.behaviors.systemHealth.enabled,
          click: (item) => {
            config.behaviors.systemHealth.enabled = item.checked;
            saveConfig();
            mainWindow.webContents.send('config-updated', config);
          }
        },
        {
          label: 'Hydration Reminder',
          type: 'checkbox',
          checked: config.behaviors.hydration.enabled,
          click: (item) => {
            config.behaviors.hydration.enabled = item.checked;
            saveConfig();
            mainWindow.webContents.send('config-updated', config);
          }
        },
        { type: 'separator' },
        {
          label: 'Mouse Thief (Playful)',
          type: 'checkbox',
          checked: config.behaviors.mouseThief.enabled,
          click: (item) => {
            config.behaviors.mouseThief.enabled = item.checked;
            saveConfig();
            mainWindow.webContents.send('config-updated', config);
          }
        },
        {
          label: 'Celebration Mode',
          type: 'checkbox',
          checked: config.behaviors.celebration.enabled,
          click: (item) => {
            config.behaviors.celebration.enabled = item.checked;
            saveConfig();
            mainWindow.webContents.send('config-updated', config);
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Disable Mouse Stealing',
      type: 'checkbox',
      checked: config.general.disableMouseStealing,
      click: (item) => {
        config.general.disableMouseStealing = item.checked;
        saveConfig();
        mainWindow.webContents.send('config-updated', config);
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Desktop Pet Companion');

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

// Create a simple tray icon (placeholder)
function createTrayIcon() {
  const { nativeImage } = require('electron');

  // Create a simple 16x16 icon using a data URL
  const iconData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFOSURBVDiNpZK9SgNBFIW/2d1sNhqTKEEQBBUrK0Wwt7G3sbWw8QH0BXwAH0HBRrCwEKysbK0stBAsRLAQJIJGE5PNZnZnxmI3GqNY+OByYe495965P1dUFf+Zifmg7/txLvvLnJI0k/2MMRhjEBEQQVWxbRvbtjHGICKoKqrK4+MjS8tLHB0fU6lWyefzr5eXl1+qGohIoKrB+fm5Li0va6VS0Wq1qrVaTUulki4sLOju7q6KCCJCkiSYJCFJEpIkIYoixsbG2NjYQFXZ39/n7OyM8fFx1tbXmZubI45jnHNYlkUURViWhXOO5eVlKpUKIsLMzAwTExM45xiZnGR6epo4jonjON0DWJaFfr+P8/2MTSQSYXvb3L2/I5yIAE6dQ0RO/P0gImfOOU4dF9c3HB4e0mw26ff7AGQyGVzf0e11uWu3abfbdLtdvgG+vZBfYkMeBgAAAABJRU5ErkJggg==',
    'base64'
  );

  return nativeImage.createFromBuffer(iconData);
}

// =============================================================================
// IPC HANDLERS
// =============================================================================

// Handle window click-through toggle
ipcMain.on('set-click-through', (event, clickThrough) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
  }
});

// Handle config requests
ipcMain.handle('get-config', () => {
  return config;
});

ipcMain.on('update-config', (event, newConfig) => {
  config = { ...config, ...newConfig };
  saveConfig();
  // Recreate tray menu with updated config
  if (tray) {
    createTray();
  }
});

// Handle screen size requests
ipcMain.handle('get-screen-size', () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { width, height };
});

// Handle notifications
ipcMain.on('show-notification', (event, { title, message }) => {
  const notifier = require('node-notifier');
  notifier.notify({
    title: title || 'Desktop Pet',
    message: message,
    sound: false,
    wait: false
  });
});

// Handle mouse movement (from robotjs)
ipcMain.handle('get-mouse-position', () => {
  try {
    const robot = require('robotjs');
    return robot.getMousePos();
  } catch (error) {
    console.error('Error getting mouse position:', error);
    return { x: 0, y: 0 };
  }
});

ipcMain.on('move-mouse', (event, { x, y }) => {
  try {
    if (!config.general.disableMouseStealing) {
      const robot = require('robotjs');
      robot.moveMouse(x, y);
    }
  } catch (error) {
    console.error('Error moving mouse:', error);
  }
});

// =============================================================================
// APP LIFECYCLE
// =============================================================================
app.whenReady().then(() => {
  loadConfig();
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Don't quit on window close - keep running in tray
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  saveConfig();
});

// Handle quit via Escape key
ipcMain.on('quit-app', () => {
  app.quit();
});
