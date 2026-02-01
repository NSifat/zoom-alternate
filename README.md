# 🎥 Zoom Alternate - Secure WebRTC Video Conference

A complete, production-ready video conferencing application with **owner login**, **2FA**, **user management**, and **host controls**. Built with Node.js, Express, Socket.IO, and WebRTC.

Perfect for teams, families, or groups who want their own private video conference platform.

## ✨ Features

### Core Conferencing
- ✅ **Multi-user video conferencing** - Unlimited participants in mesh topology
- ✅ **Screen sharing** - Share your screen with pin and fullscreen options
- ✅ **Text chat** - Real-time messaging (toggleable by host)
- ✅ **Breakout rooms** - Create and manage dynamic meeting rooms
- ✅ **Audio/Video controls** - Mute, camera on/off, keyboard shortcuts

### Security & Authentication
- ✅ **Owner login with 2FA** - Google Authenticator (TOTP)
- ✅ **User management** - Create, list, and delete user credentials
- ✅ **Password security** - bcrypt hashing (10 rounds)
- ✅ **JWT tokens** - Secure session management (24-hour expiration)
- ✅ **Socket.IO authentication** - Token verification on connection

### Host Controls
- ✅ **Mute all participants** - Instant audio control
- ✅ **Disable all cameras** - Privacy control
- ✅ **Close breakout rooms** - Bring everyone back
- ✅ **Participant tracking** - See who's in which room + media status
- ✅ **Ban functionality** - Remove troublesome users

### Deployment
- ✅ **GitHub Pages ready** - Free static hosting
- ✅ **Flexible backend** - Run on your PC, exposed via tunnel
- ✅ **Cloudflare/ngrok support** - HTTPS public URLs
- ✅ **Environment variables** - Configurable API endpoints
- ✅ **Auto-restart options** - PM2, Windows Task Scheduler, nssm

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd "path/to/Zoom Alternate"
npm install
```

### 2. Start Server
```bash
npm start
```
Server runs on `http://localhost:3000`

### 3. Owner Setup (First Time)
1. Visit `http://localhost:3000/login.html`
2. Click **Owner Login**
3. Enter email + password
4. Scan QR code with [Google Authenticator](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)
5. Enter 6-digit code
6. You're the owner! ✅

### 4. Create User Accounts
1. From Settings → Participants → "Create New User"
2. Share email/password with users

### 5. Users Can Join
- Visit login page
- Click "User Login"
- Use credentials
- Join meeting!

## 📚 Documentation

| Guide | Purpose |
|-------|---------|
| **[AUTH_SYSTEM.md](AUTH_SYSTEM.md)** | Authentication system reference, 2FA setup, testing |
| **[GITHUB_PAGES_GUIDE.md](GITHUB_PAGES_GUIDE.md)** | Deploy frontend to GitHub Pages, expose backend publicly |
| **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** | Technical details, file changes, testing checklist |

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Socket.IO, QRCode.js |
| **Backend** | Node.js, Express.js, Socket.IO |
| **Security** | bcryptjs, jsonwebtoken, speakeasy (Google Authenticator) |
| **WebRTC** | RTCPeerConnection, getUserMedia, getDisplayMedia |
| **Storage** | JSON files (upgradeable to SQLite/PostgreSQL) |

## 📋 Prerequisites

- **Node.js 14+** ([Download](https://nodejs.org))
- **npm** (comes with Node.js)
- **Modern browser** with WebRTC (Chrome, Firefox, Edge, Safari)
- **Google Authenticator app** (for owner login)
  - [iOS](https://apps.apple.com/us/app/google-authenticator/id388497605)
  - [Android](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)

## 📁 Project Structure

```
root/
├── public/
│   ├── login.html          ← Login with 2FA
│   ├── index.html          ← Meeting room UI
│   ├── app.js              ← Client logic
│   └── style.css           ← Dark theme
├── server/
│   ├── server.js           ← Express + Socket.IO
│   └── auth.js             ← Auth & 2FA logic
├── data/                   ← Auto-created
│   ├── owner.json          ← Owner account
│   └── users.json          ← User accounts
└── docs/
    ├── AUTH_SYSTEM.md
    ├── GITHUB_PAGES_GUIDE.md
    └── IMPLEMENTATION_SUMMARY.md
```

## 🎯 How It Works

### Owner
1. Owner logs in with email + password
2. First time: Scan QR code with Google Authenticator
3. Next logins: Enter 6-digit code from Authenticator
4. Can create user credentials for others
5. Full control: mute all, close breakout rooms, view participants

### Regular Users
1. Receive email/password from owner
2. Login with credentials (no 2FA)
3. Join meetings, use video/audio/chat
4. No admin access

### Meeting Flow
1. User logs in → meets room code
2. Can create or share existing code
3. Others join with same code
4. Real-time video/audio/chat
5. Leave anytime

## 🔒 Security Features

- **Passwords**: Hashed with bcrypt (10 salt rounds)
- **Sessions**: JWT tokens (24-hour expiration)
- **2FA**: Google Authenticator (TOTP)
- **WebRTC**: Encrypted peer connections
- **Storage**: JSON files (no cloud exposure)

## 🌐 Public Deployment

### Option 1: Cloudflare Tunnel (Recommended)
- Free HTTPS
- Custom domain
- No port forwarding needed
- [Setup guide in GITHUB_PAGES_GUIDE.md](GITHUB_PAGES_GUIDE.md)

### Option 2: ngrok
- Free public URL (changes on restart)
- Pro plan: custom domain
- [Setup guide in GITHUB_PAGES_GUIDE.md](GITHUB_PAGES_GUIDE.md)

### Option 3: GitHub Pages + Your Backend
- Frontend hosted free on GitHub
- Backend runs on your PC
- See [GITHUB_PAGES_GUIDE.md](GITHUB_PAGES_GUIDE.md)

## 🧪 Testing

See **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** for:
- ✅ Backend testing (no errors)
- ⏳ Manual testing checklist
- ⏳ 2FA verification testing
- ⏳ Multi-user scenarios

## 📝 Environment Variables

Create `.env` file in root directory:

```env
# JWT Secret (change this!)
JWT_SECRET=your-super-secret-key-min-32-characters-long

# Backend API URL (for GitHub Pages)
API_BASE_URL=https://your-public-url.com

# Environment
NODE_ENV=production

# Port (optional, defaults to 3000)
PORT=3000
```

## 🔧 Running the Server

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

### Keep It Running 24/7
- **PM2**: `pm2 start server/server.js`
- **Windows Task Scheduler**: Schedule at startup
- **nssm**: Install as Windows service

See [GITHUB_PAGES_GUIDE.md](GITHUB_PAGES_GUIDE.md#keeping-backend-running) for details.

## 🆘 Troubleshooting

### "Cannot POST /api/auth/login"
- Backend not running: `npm start`
- Wrong API URL in login.html
- CORS issue: Check server console

### "Invalid 2FA code"
- Phone/PC time out of sync
- Code expires every 30 seconds
- Try next code that appears

### "API connection failed"
- Backend not accessible
- Check firewall allows port 3000
- Verify `window.API_BASE_URL` in login.html

See [GITHUB_PAGES_GUIDE.md#troubleshooting](GITHUB_PAGES_GUIDE.md#troubleshooting) for more.

## 📞 Support

- **Auth questions**: [AUTH_SYSTEM.md](AUTH_SYSTEM.md)
- **Deployment questions**: [GITHUB_PAGES_GUIDE.md](GITHUB_PAGES_GUIDE.md)
- **Technical details**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

## 📄 Running the Server

### Development (with auto-reload)

| Control | Action | Shortcut |
|---------|--------|----------|
| 🎤 Mute | Toggle microphone | Ctrl+M |
| 📹 Camera | Toggle camera on/off | Ctrl+V |
| 📺 Share | Start/stop screen sharing | - |
| 💬 Chat | Open/close chat panel | - |
| ⚙️ Settings | (For future features) | - |
| 📞 Leave | Exit meeting | - |

### 6. Breakout Rooms
- Click **Rooms** button to manage breakout rooms
- Switch to different rooms to create separate discussions
- All participants are in the same main room by default

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Local Media │  │   WebRTC     │  │   Socket.IO  │  │
│  │ (Camera/Mic) │  │ Peer Conn.   │  │  Signaling   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │           │
│         └──────────────────┼──────────────────┘           │
│                            │                              │
└────────────────────────────┼──────────────────────────────┘
                             │ WebSocket + WebRTC
                             │
┌────────────────────────────┼──────────────────────────────┐
│                    Node.js Server                         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Express    │  │  Socket.IO   │  │   Room Mgmt  │  │
│  │   (HTTP)     │  │  (Signaling) │  │  (In-Memory) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## WebRTC Signaling Flow

```
User A                    Signaling Server              User B
  │                             │                         │
  ├─────── join-room ──────────>│                         │
  │                             ├──── user-joined ──────>│
  │                             │                         │
  │<────── existing-users ──────┤                         │
  │                             │                         │
  │ Create Peer Connection      │                         │
  │ Create Offer                │                         │
  │                             │                         │
  ├──────── offer ─────────────>│                         │
  │                             ├──────── offer ────────>│
  │                             │   Create Peer Conn.    │
  │                             │   Create Answer        │
  │<────── answer ──────────────┤<────── answer ────────┤
  │ Set Remote Desc.            │                         │
  │                             │                         │
  │<──── ice-candidate ────────>│<── ice-candidate ────>│
  │                             │                         │
  │    P2P Connection Established                        │
  │<════════════ Video/Audio Stream ════════════════════>│
```

## Socket.IO Events

### Client to Server

**Joining:**
- `join-room` - Join a meeting room
  ```javascript
  { roomId: "my-room", userName: "John", userId: "user-123" }
  ```

**WebRTC Signaling:**
- `offer` - Send WebRTC offer
  ```javascript
  { to: "socket-id", offer: RTCSessionDescription }
  ```
- `answer` - Send WebRTC answer
  ```javascript
  { to: "socket-id", answer: RTCSessionDescription }
  ```
- `ice-candidate` - Exchange ICE candidates
  ```javascript
  { to: "socket-id", candidate: RTCIceCandidate }
  ```

**Features:**
- `chat-message` - Send chat message
  ```javascript
  { message: "Hello!" }
  ```
- `screen-share-start` - Notify screen share started
- `screen-share-stop` - Notify screen share stopped
- `switch-room` - Switch to breakout room
  ```javascript
  { newRoomId: "breakout-1" }
  ```

### Server to Client

- `user-joined` - New user joined room
- `existing-users` - List of current room users
- `offer` - Receive WebRTC offer
- `answer` - Receive WebRTC answer
- `ice-candidate` - Receive ICE candidate
- `user-left` - User disconnected
- `chat-message` - Receive chat message
- `screen-share-started` - Someone started sharing screen
- `screen-share-stopped` - Screen share ended

## File Structure

```
📁 Zoom Alternate/
│
├── package.json              # Project dependencies
├── README.md                 # This file
│
├── 📁 server/
│   └── server.js            # Express + Socket.IO server
│
└── 📁 public/
    ├── index.html           # Main HTML (join + conference)
    ├── style.css            # Dark theme styles
    └── app.js               # Frontend WebRTC logic
```

## Key Code Files Explained

### server.js
- **Socket.IO Setup**: Handles WebRTC signaling
- **Room Management**: Tracks active rooms and participants
- **Signaling Events**: 
  - `join-room` - Add user to room
  - `offer/answer/ice-candidate` - WebRTC peer exchange
  - `chat-message` - Relay messages to room
  - `switch-room` - Move user to different room

### app.js
- **State Management**: Tracks local/remote streams, peer connections
- **WebRTC**:
  - `initializeLocalMedia()` - Get camera/mic
  - `createPeerConnection()` - Create peer for each participant
  - Offer/Answer negotiation
  - ICE candidate gathering
- **UI Handlers**: Mute, video toggle, screen share, chat
- **Media Management**: Track enabled/disabled status

### style.css
- Dark theme (Jitsi-like)
- Responsive grid layout for video tiles
- Modal for join screen
- Chat sidebar
- Control buttons bar

## Testing Locally

### Single Computer, Multiple Browsers
1. Start server on Computer A
2. Open `http://localhost:3000?room=test` in 2 browser windows
3. Enter different names
4. Video will appear on both sides

### Multiple Computers (Same Network)
1. Start server on Computer A (e.g., IP: 192.168.1.100)
2. On Computer B, open `http://192.168.1.100:3000?room=test`
3. Works on LAN without internet!

### Testing Screen Share
1. Click "Share" button
2. Select the screen/window to share
3. Other participants see the screen
4. Click "Share" again to stop

### Testing Breakout Rooms
1. In meeting, click "Rooms" button
2. Create new room (e.g., "breakout-1")
3. Click button to switch to new room
4. Previous peer connections close, new room starts fresh

## Limitations & Considerations

⚠️ **Mesh Topology**: Each peer connects to ALL others
- Works great for 2-6 users
- Bandwidth usage increases exponentially
- CPU usage increases per peer

⚠️ **No Database**: Rooms exist only in server memory
- Rooms deleted when last user leaves
- No recording or persistence
- Perfect for testing

⚠️ **STUN Only**: No TURN server
- Works on local network
- Works with some ISPs via STUN
- May not work through some firewalls
- For production, add TURN server

⚠️ **No Encryption**: Signaling not encrypted
- For production, use HTTPS + WSS
- For testing, fine as-is

## Troubleshooting

### Camera/Mic Not Working
- Check browser permissions
- Ensure device has camera/mic
- Try different browser
- Restart browser

### Can't Connect to Peer
- Check firewall allows WebRTC
- STUN servers may be blocked (corporate network)
- Try from home network
- Check browser console for errors

### Screen Share Not Working
- Only works in HTTPS (or localhost)
- Browser permissions may block it
- Some displays can't be shared

### Echo in Audio
- Browser should handle echo cancellation
- Try disabling noise suppression
- Different device might help

### Poor Video Quality
- Check network speed
- More peers = lower quality
- Reduce video resolution in browser settings
- Close other apps using network

## Performance Tips

1. **Limit Participants**: Keep under 6 users per room
2. **Use Breakout Rooms**: Divide large groups
3. **Close Unused Tabs**: Reduces CPU usage
4. **Hardware**: Use recent laptops (built-in GPU helps)
5. **Network**: Wired connection recommended

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full (15+) |
| Edge | ✅ Full |
| IE11 | ❌ Not supported |

## Security Notes

For **localhost testing only**:
- No authentication needed
- No encryption
- All participants can see all others

For **production deployment**:
- Use HTTPS (self-signed cert OK for testing)
- Add authentication (OAuth, JWT, etc.)
- Add TURN servers for firewall traversal
- Rate limit signaling events
- Validate all socket events
- Consider recording disclaimers

## Extending the App

### Add Video Recording
```javascript
const mediaRecorder = new MediaRecorder(stream);
mediaRecorder.start();
// Handle ondataavailable event
```

### Add Hand Raise Feature
```javascript
socket.emit('hand-raised', { userName });
socket.on('hand-raised', (data) => {
    // Show notification
});
```

### Add Virtual Backgrounds
```javascript
// Use canvas to process video frames
// Replace background with blur/image
```

### Add Bandwidth Monitoring
```javascript
peerConnection.getStats().then(stats => {
    // Analyze RTCStatsReport
    // Show bitrate, packet loss, latency
});
```

## Deployment Options

### Windows EXE (Electron)
See `ELECTRON_SETUP.md` for wrapping in Electron

### Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

### Cloud (Heroku, DigitalOcean, etc.)
- Push code to platform
- Set `PORT` environment variable
- Use secure signaling (WSS instead of WS)

## Future Features

- 📊 Recording support
- 🎯 Hand raise
- 🖼️ Virtual backgrounds
- 🔐 Room passwords
- 📝 Meeting transcripts
- 🎛️ Advanced audio controls
- 📊 Live participant stats
- ♿ Better accessibility
- 🌍 i18n support

## License

MIT - Open source for any use

## Credits

Built with:
- [Express.js](https://expressjs.com)
- [Socket.IO](https://socket.io)
- [WebRTC](https://webrtc.org)
- [Font Awesome](https://fontawesome.com) for icons

## Questions?

Check the server console for debug logs starting with `[Socket]`, `[WebRTC]`, etc.

Enable browser DevTools console (F12) for client-side logs.

---

**Happy Conferencing!** 🎉

For issues or improvements, feel free to modify and extend this codebase.
