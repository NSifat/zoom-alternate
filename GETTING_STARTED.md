# 🚀 Getting Started Guide

Welcome to Zoom Alternate! Here's how to get up and running in 5 minutes.

---

## Step 1: Start the Server (30 seconds)

```powershell
cd "c:\Users\ferdo\OneDrive\Desktop\VS Projects\Zoom Alternate"
npm start
```

You should see:
```
🎥 WebRTC Video Conference Server running on http://localhost:3000
```

✅ **Server is ready!**

---

## Step 2: Set Up as Owner (2 minutes)

1. **Open login page**: Visit `http://localhost:3000/login.html`
2. **Click "Owner Login" tab**
3. **Enter credentials**:
   - Email: `your@email.com` (any email)
   - Password: `SecurePassword123!` (any password)
4. **First time only** - You'll see:
   - QR code
   - Secret key
5. **Scan with Google Authenticator**:
   - Open Google Authenticator app on phone
   - Tap `+` button
   - Choose "Scan a setup key"
   - Scan the QR code
6. **Enter 6-digit code** that appears in Authenticator
7. **Click "Verify & Login"**

✅ **You're the owner!**

---

## Step 3: Create User Accounts (1 minute per user)

1. **From the meeting page**, click **Settings**
2. **Go to Settings** → **Participants** section
3. **Click "Create New User"** button
4. **Enter**:
   - Email: `newuser@email.com`
   - Password: `UserPassword123!`
5. **Click "Create"**
6. **Share these credentials** with the user

✅ **User account created!**

---

## Step 4: User Login (30 seconds)

1. **Open login page**: `http://localhost:3000/login.html`
2. **Click "User Login" tab** (default)
3. **Enter credentials** (from Step 3)
4. **Click "Sign In"**
5. **Enter meeting code** (or leave empty for auto-generated)
6. **Click "Join Meeting"**

✅ **User is in the meeting!**

---

## Step 5: Test Features (2 minutes)

### ✅ Audio/Video
- Click **Mute** button (toggles microphone)
- Click **Camera** button (toggles video)

### ✅ Screen Share
- Click **Share** button
- Select screen/window to share
- Click **Stop Sharing** to stop

### ✅ Chat
- Click **Chat** button (opens chat sidebar)
- Type message and press Enter
- **Toggle chat on/off**:
  - Settings → General Settings
  - Uncheck "Enable chat"
  - Click "Save Settings"

### ✅ Breakout Rooms
- Click **Breakout** button (if not hidden)
- Enter number of rooms (e.g., 3)
- Click "Create Rooms"
- Click a room to join
- Click "Return to Main" to go back

### ✅ Host Controls (Owner Only)
- Click **Host** button (only visible to owner)
- Opens Settings with extra options:
  - **Mute All** - Mutes all participants
  - **Disable All Cameras** - Turns off all cameras
  - **Close All Breakout Rooms** - Brings everyone back

---

## Common Commands

### Start/Stop Server
```powershell
# Start
npm start

# Stop
Ctrl + C
```

### Restart Server
```powershell
Ctrl + C      # Stop
npm start     # Start again
```

### Check if running
```powershell
netstat -ano | findstr :3000
```

### View data files
```powershell
cd "c:\Users\ferdo\OneDrive\Desktop\VS Projects\Zoom Alternate\data"
cat owner.json
cat users.json
```

---

## Quick URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/login.html` | Login page |
| `http://localhost:3000/index.html` | Meeting (after login) |
| `http://localhost:3000?room=CODE` | Join specific room |

---

## Useful Links

📚 **Full Guides:**
- [AUTH_SYSTEM.md](AUTH_SYSTEM.md) - Complete auth reference
- [GITHUB_PAGES_GUIDE.md](GITHUB_PAGES_GUIDE.md) - Deploy to public
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Technical details

🔐 **Security:**
- [Google Authenticator Download](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)
- Passwords hashed with bcrypt
- JWT tokens (24-hour expiration)

🌐 **Public Hosting:**
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) (Free, recommended)
- [ngrok](https://ngrok.com/) (Free with limitations)

---

## Troubleshooting

### "Server won't start"
```powershell
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process using port 3000
taskkill /PID <PID> /F
```

### "Login page is blank"
- Server might be down: Run `npm start`
- Browser cache: Ctrl+Shift+Delete to clear
- Check browser console: F12 → Console tab

### "Can't join meeting"
- Make sure you're logged in first
- Check socket connection: F12 → Console

### "2FA code doesn't work"
- Sync phone/PC time with internet
- Code expires every 30 seconds
- Try again with next code

### "WebRTC not working"
- Browser doesn't support WebRTC (use Chrome, Firefox, Edge)
- Firewall blocking camera/microphone
- Browser permissions: Check camera/mic are allowed

---

## Need Help?

1. **Check the logs**:
   ```powershell
   # Terminal shows errors when things go wrong
   # Read the error messages carefully
   ```

2. **Read the guides**:
   - AUTH_SYSTEM.md → Testing section
   - GITHUB_PAGES_GUIDE.md → Troubleshooting section

3. **Check browser console**:
   - Press F12
   - Click "Console" tab
   - Look for error messages in red

4. **Reset everything**:
   ```powershell
   # Delete data files to start fresh
   rm data\owner.json
   rm data\users.json
   # Next login will reinitialize
   ```

---

## Next Steps

### For Testing
1. ✅ Create 2-3 test users
2. ✅ Test with multiple browser windows
3. ✅ Test breakout rooms
4. ✅ Test host controls

### For Production
1. Read [GITHUB_PAGES_GUIDE.md](GITHUB_PAGES_GUIDE.md)
2. Set up Cloudflare Tunnel or ngrok
3. Deploy frontend to GitHub Pages
4. Set up auto-restart (PM2 or Task Scheduler)
5. Share public URL with users

### For Customization
1. Edit welcome message in `public/index.html`
2. Change colors in `public/style.css`
3. Modify timeout in `server/server.js`
4. Add features to `public/app.js`

---

## Feature Overview

### What Users Can Do
- ✅ Join meetings with code
- ✅ Enable/disable camera & microphone
- ✅ Share screen
- ✅ Send chat messages
- ✅ Join breakout rooms
- ✅ See other participants

### What Owners Can Do
- ✅ Everything users can do PLUS:
- ✅ Create user accounts
- ✅ Manage chat (enable/disable)
- ✅ Mute all participants
- ✅ Disable all cameras
- ✅ Close all breakout rooms
- ✅ See participant list with room location

---

## Security Reminders

🔒 **Keep Secure:**
- Don't share owner credentials
- Use strong passwords (8+ characters, mixed case)
- Regenerate JWT secret if exposed (in `.env` file)
- Backup `data/` folder regularly

✅ **Already Secure:**
- Passwords hashed with bcrypt
- Sessions use JWT tokens
- 2FA for owner (Google Authenticator)
- Local network encryption (HTTPS when public)

---

## You're All Set! 🎉

Your Zoom Alternate server is ready to use. Start creating meetings and inviting users!

**Questions?** Check the guides or read the documentation in the root folder.

