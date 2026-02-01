# Development Configuration

This file contains example configurations for development.

## Environment Variables

Create a `.env` file in the root directory if needed:

```
PORT=3000
NODE_ENV=development
DEBUG=true
```

Then load it in `server.js`:

```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

Install dotenv:
```bash
npm install dotenv
```

## Development Tips

### Auto-Reload on File Changes

Install and use nodemon (already in devDependencies):

```bash
npm run dev
```

This watches for file changes and automatically restarts the server.

### Enable Debug Logging

In `server.js`, uncomment or add:

```javascript
const DEBUG = true;

if (DEBUG) {
  console.log('[DEBUG] Room created:', roomId);
}
```

In `app.js`, browser console will show logs starting with:
- `[Event]`
- `[WebRTC]`
- `[Socket]`
- `[Room]`
- `[Chat]`

### Multiple Instances on Same Machine

Run multiple servers on different ports:

```bash
# Terminal 1
npm start

# Terminal 2
set PORT=3001 && npm start

# Terminal 3
set PORT=3002 && npm start
```

Then visit:
- http://localhost:3000
- http://localhost:3001
- http://localhost:3002

### Simulate Network Issues

Use Chrome DevTools:

1. Open DevTools (F12)
2. Go to Network tab
3. Click the speed dropdown (usually "No throttling")
4. Select "Slow 3G" or custom speed
5. Refresh page and test

### Monitor WebSocket Traffic

In Chrome DevTools:

1. Network tab
2. Filter by "WS"
3. Click the WebSocket connection
4. Go to "Messages" tab
5. See all Socket.IO events

### Test Peer Connection Quality

In browser console:

```javascript
// Get stats for a peer connection
state.peerConnections.forEach((pc, peerId) => {
  pc.getStats().then(stats => {
    stats.forEach(report => {
      if (report.type === 'inbound-rtp') {
        console.log('Inbound:', report);
      }
    });
  });
});
```

### Test Disconnections

In browser console:

```javascript
// Simulate disconnect
state.socket.disconnect();

// Reconnect
state.socket.connect();

// Close peer connection
state.peerConnections.forEach(pc => {
  pc.close();
});
```

### Visual Debugging

Monitor video tiles in real-time:

```javascript
// In browser console
Array.from(document.querySelectorAll('video')).forEach((v, i) => {
  console.log(`Video ${i}:`, v.id, 'Playing:', !v.paused);
});
```

---

## Useful Scripts

Add these to `package.json` for convenience:

```json
{
  "scripts": {
    "start": "node server/server.js",
    "dev": "nodemon server/server.js",
    "debug": "node --inspect=9229 server/server.js",
    "test": "echo \"No tests yet\"",
    "lint": "eslint .",
    "clean": "rm -rf node_modules package-lock.json"
  }
}
```

Then run:
```bash
npm run dev      # Development with auto-reload
npm run debug    # Debug with Node inspector
npm run lint     # Lint code (requires eslint)
npm run clean    # Clean dependencies
```

---

## Browser Compatibility Testing

Test on different browsers:

```
Chrome:   Full support - Use DevTools (F12)
Firefox:  Full support - Use Developer Tools (F12)
Safari:   iOS 15+, macOS 11+
Edge:     Full support
IE:       Not supported
```

Quick test URLs:

```
http://localhost:3000?room=chrome-test
http://localhost:3000?room=firefox-test
http://localhost:3000?room=safari-test
http://localhost:3000?room=edge-test
```

---

## Performance Profiling

### Server Performance

Monitor in Node.js:

```bash
npm install --save-dev clinic

# Record profile
clinic doctor npm start

# Play video
clinic doctor --output-dir=clinic-data
```

### Client Performance

Use Chrome DevTools:

1. Performance tab
2. Record for 10 seconds of use
3. Check for dropped frames
4. Monitor memory usage

### Memory Leaks

Check for leaks:

```javascript
// In browser console
// Before test
const before = performance.memory.usedJSHeapSize;

// After test
const after = performance.memory.usedJSHeapSize;
const diff = after - before;
console.log(`Memory delta: ${diff / 1024 / 1024}MB`);
```

---

## Troubleshooting Commands

### Check if Port is in Use

Windows:
```bash
netstat -ano | findstr :3000
```

Linux/Mac:
```bash
lsof -i :3000
```

### Kill Process Using Port

Windows:
```bash
taskkill /PID <PID> /F
```

Linux/Mac:
```bash
kill -9 <PID>
```

### Check Node Version

```bash
node --version
```

### Clear npm Cache

```bash
npm cache clean --force
```

### Reinstall Dependencies

```bash
rm -r node_modules package-lock.json
npm install
```

---

## Git Workflow

### Commit Message Format

```
feat: Add feature X
fix: Fix bug Y
docs: Update README
style: Format code
refactor: Reorganize code
test: Add test for X
chore: Update dependencies
```

### Create a .gitignore

Already included in project.

### Initialize Git

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/repo.git
git push -u origin main
```

---

That's all for development configuration!

For production setup, see ELECTRON_SETUP.md or deployment docs.
