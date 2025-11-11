const { contextBridge, ipcRenderer } = require('electron');

// =============================================================================
// SECURE IPC BRIDGE
// =============================================================================
// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object

contextBridge.exposeInMainWorld('electronAPI', {
  // Config
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config) => ipcRenderer.send('update-config', config),
  onConfigUpdated: (callback) => ipcRenderer.on('config-updated', (event, config) => callback(config)),

  // Screen
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),

  // Notifications
  showNotification: (title, message) => ipcRenderer.send('show-notification', { title, message }),

  // Mouse control
  getMousePosition: () => ipcRenderer.invoke('get-mouse-position'),
  moveMouse: (x, y) => ipcRenderer.send('move-mouse', { x, y }),

  // Window control
  setClickThrough: (clickThrough) => ipcRenderer.send('set-click-through', clickThrough),
  quitApp: () => ipcRenderer.send('quit-app'),

  // Events from main process
  onWakeUp: (callback) => ipcRenderer.on('wake-up', callback),
  onShowSettings: (callback) => ipcRenderer.on('show-settings', callback)
});
