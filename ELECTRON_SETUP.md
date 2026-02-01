# 📦 Electron Wrapper Setup (Windows EXE)

This guide explains how to wrap the WebRTC conference app in Electron to create a standalone Windows EXE.

## Prerequisites

- Node.js 14+
- npm
- Windows 10+ (for building EXE)

## Setup Steps

### 1. Install Electron Dependencies

```bash
npm install --save-dev electron electron-builder
```

### 2. Create Electron Main File

Create `electron/main.js`:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startURL);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

### 3. Create Preload Script

Create `electron/preload.js`:

```javascript
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
  }
});
```

### 4. Update package.json

Add these fields:

```json
{
  "main": "electron/main.js",
  "homepage": "./",
  "scripts": {
    "react-start": "react-scripts start",
    "react-build": "react-scripts build",
    "react-test": "react-scripts test",
    "react-eject": "react-scripts eject",
    "electron-start": "electron .",
    "electron-dev": "concurrently \"npm start\" \"wait-on http://localhost:3000 && electron .\"",
    "electron-build": "npm run react-build && electron-builder",
    "start": "node server/server.js",
    "dev": "nodemon server/server.js",
    "build": "electron-builder"
  },
  "build": {
    "appId": "com.webrtc.conference",
    "productName": "WebRTC Conference",
    "files": [
      "electron/",
      "public/",
      "server/",
      "node_modules/",
      "package.json"
    ],
    "directories": {
      "buildResources": "assets"
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": [
            "x64"
          ]
        },
        {
          "target": "portable",
          "arch": [
            "x64"
          ]
        }
      ],
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "WebRTC Conference"
    }
  }
}
```

### 5. Create Icon

Create `assets/icon.ico` (256x256 pixels).

You can convert from PNG using online tools or with ImageMagick:

```bash
convert icon.png icon.ico
```

### 6. Install Additional Dev Dependencies

```bash
npm install --save-dev concurrently wait-on electron-is-dev
```

### 7. Run in Development

```bash
npm run electron-dev
```

### 8. Build Windows EXE

```bash
npm run build
```

This creates an installer and portable EXE in the `dist/` folder.

## Standalone Server Mode

If you want to run the server separately (for testing multiple computers):

### Create `electron/with-server.js`:

```javascript
const { spawn } = require('child_process');
const path = require('path');

let serverProcess;

function startServer() {
  const serverPath = path.join(__dirname, '../server/server.js');
  
  serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    shell: true
  });

  serverProcess.on('error', (error) => {
    console.error('Server error:', error);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
  });

  // Wait for server to start
  return new Promise(resolve => setTimeout(resolve, 2000));
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
  }
}

module.exports = { startServer, stopServer };
```

Update `main.js` to use it:

```javascript
const { startServer, stopServer } = require('./with-server');

app.on('ready', async () => {
  await startServer();
  createWindow();
});

app.on('before-quit', () => {
  stopServer();
});
```

## Distribution

### Windows Installer (NSIS)
- Creates: `WebRTC-Conference-Setup-1.0.0.exe`
- Allows installing to Program Files
- Creates Start Menu shortcuts
- Can uninstall via Control Panel

### Portable EXE
- Creates: `WebRTC-Conference-1.0.0.exe`
- No installation needed
- Can run from USB drive
- Works immediately

## Troubleshooting

**Port 3000 already in use?**
```javascript
// In electron/main.js, before startServer():
const PORT = process.env.PORT || 3000;
process.env.PORT = PORT;
```

**Icon not showing in installer?**
- Icon must be 256x256 PNG or ICO
- Path: `assets/icon.ico`

**App won't start?**
- Check electron/main.js path to server
- Ensure all files are included in `build.files`
- Check event logs for errors

## Advanced: Auto-Update

Install `electron-updater`:

```bash
npm install electron-updater
```

Add to `main.js`:

```javascript
const { autoUpdater } = require('electron-updater');

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
  createWindow();
});
```

Host updates on GitHub Releases and it will auto-download/install.

## Final Notes

- The EXE embeds Node.js runtime (~150 MB)
- Server runs locally when app starts
- All files are included in the bundle
- No external dependencies needed on user's machine

For production:
- Code sign the EXE (Windows SmartScreen)
- Use HTTPS with self-signed cert
- Test on Windows 10 and 11
- Test anti-virus doesn't block it

---

**Your WebRTC app is now packaged as a Windows EXE!** 📦
