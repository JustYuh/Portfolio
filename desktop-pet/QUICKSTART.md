# Quick Start Guide 🚀

Get your desktop pet up and running in 5 minutes!

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Start the app
npm start
```

## First Time Setup

### If you see build errors with robotjs:

**Windows:**
```bash
npm install --global windows-build-tools
npm install
```

**macOS:**
```bash
xcode-select --install
npm install
```

**Linux:**
```bash
sudo apt-get install build-essential libxtst-dev libpng++-dev
npm install
```

## Quick Configuration

### Access Settings
- **Method 1:** Right-click the character
- **Method 2:** Click system tray icon → Settings

### Recommended First-Time Settings

1. **Enable Pomodoro Timer**
   - Great for focused work sessions
   - Default: 25min work, 5min break

2. **Adjust Hydration Interval**
   - Set to your preference (default: 60min)

3. **Disable Mouse Thief** (if distracting)
   - Uncheck "Mouse Thief" in Playful Behaviors
   - Or enable "Disable Mouse Stealing" globally

## System Tray

Look for the pink pet icon in your system tray:
- **Left-click:** Show/hide pet
- **Right-click:** Access full menu

## Keyboard Shortcuts

- **Escape:** Close settings panel
- **Drag:** Click and drag character anywhere

## Troubleshooting

### Can't see the character?
- Check system tray → "Show Pet"
- Character might be at screen edge

### Mouse control issues on macOS?
- System Preferences → Security & Privacy → Accessibility
- Add your terminal or Electron app

### Still having issues?
- Try: `npm run dev` (opens DevTools)
- Check console for errors

## What's Next?

1. **Watch your buddy!** It will start walking around
2. **Try the Pomodoro timer** for your next work session
3. **Customize** behaviors to match your workflow
4. **Adjust character size/speed** if needed

## Pro Tips

- Character reflects your system health (CPU/RAM)
- Gets tired when you work too long - take breaks!
- Celebrates your git commits
- Reminds you to stay hydrated

---

Enjoy your new desktop companion! 🐾

For detailed information, see [README.md](README.md)
