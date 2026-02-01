# 📖 Complete Setup & Deployment Guide

Your Zoom Alternate is a secure video conferencing app with owner login (2FA), user management, and full host controls. This guide covers running locally and deploying to GitHub Pages.

---

## Part 1: Running Locally (5 Minutes)

### Prerequisites
- Node.js 14+ installed ([Download](https://nodejs.org))
- Google Authenticator app ([iOS](https://apps.apple.com/us/app/google-authenticator/id388497605) / [Android](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2))

### Step 1: Start Server
```powershell
cd "c:\Users\ferdo\OneDrive\Desktop\VS Projects\Zoom Alternate"
npm start
```

You'll see:
```
🎥 WebRTC Video Conference Server running on http://localhost:3000
```

### Step 2: Owner Setup (First Time Only)
1. **Visit**: `http://localhost:3000/login.html`
2. **Click "Owner Login"** tab
3. **Enter**:
   - Email: `nowshadsifat2@gmail.com`
   - Password: `admin123`
4. **Scan QR code** with Google Authenticator app
5. **Enter 6-digit code** from Authenticator
6. **Click "Verify & Login"** ✅

### Step 3: Create Users
Once you're logged in:
1. Click **Settings** button
2. Go to **Participants** section
3. Click **"Create New User"** button
4. Enter email and password for the user
5. Click **Create**
6. **Share these credentials** with the user

### Step 4: Users Can Join
Users visit `http://localhost:3000/login.html`:
1. Click **"User Login"** tab
2. Enter their email + password
3. Enter meeting code (or leave empty for auto-generated)
4. Click **"Join Meeting"** ✅

### Step 5: Test Features

**Toggle Audio/Video:**
- Click **Mute** button (microphone)
- Click **Camera** button (video)

**Screen Share:**
- Click **Share** button
- Select screen/window to share

**Chat:**
- Click **Chat** button (opens sidebar)
- Type and send messages
- To disable: Settings → General Settings → Uncheck "Enable chat"

**Breakout Rooms:**
- Click **Breakout** button
- Enter number of rooms
- Click to join/leave rooms

**Host Controls (Owner Only):**
- Click **Host** button (only visible to owner)
- **Mute All** - Mutes all participants
- **Disable All Cameras** - Turns off all cameras
- **Close All Breakout Rooms** - Brings everyone back

---

## Part 2: GitHub Pages + Public Backend (20 Minutes)

### What We're Doing
- **Frontend** (static files) → GitHub Pages (Free hosting)
- **Backend** (server code) → Your PC exposed via Cloudflare Tunnel

### Step 1: Create GitHub Account
1. Go to [GitHub](https://github.com)
2. Click **Sign Up**
3. Verify email

### Step 2: Create GitHub Repository
1. Click **New Repository**
2. Name it: `zoom-alternate`
3. Set to **Public** (required for free GitHub Pages)
4. Click **Create Repository**

### Step 3: Push Frontend to GitHub

**Open PowerShell in your project folder:**
```powershell
cd "c:\Users\ferdo\OneDrive\Desktop\VS Projects\Zoom Alternate"
```

**Initialize Git (if not already done):**
```powershell
git init
git config user.email "your_email@gmail.com"
git config user.name "Your Name"
```

**Push to GitHub:**
```powershell
# Add only public folder (frontend)
git add public/*.html public/*.js public/*.css public/*.ico

# Commit
git commit -m "Initial commit - Zoom Alternate frontend"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/zoom-alternate.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **Branch: main**
4. Under "Folder", select **/ (root)**
5. Click **Save**

Wait ~2 minutes. You'll get a URL like:
```
https://YOUR_USERNAME.github.io/zoom-alternate/login.html
```

✅ **Your frontend is now public!**

### Step 5: Expose Backend with Cloudflare Tunnel

**Download Cloudflare Tunnel:**
```powershell
# Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/install-and-setup/tunnel-guide/
# Find Windows installer and download

# Or if using Chocolatey:
choco install cloudflare-warp
```

**Login to Cloudflare:**
```powershell
cloudflared login
```
A browser window opens - approve the login.

**Create Tunnel:**
```powershell
cloudflared tunnel create zoom-alternate
```

You'll get output like:
```
Tunnel credentials written to C:\path\to\.cloudflared\abc123.json
Created tunnel zoom-alternate with id abc123
```

**Route DNS (if you have a domain):**
```powershell
cloudflared tunnel route dns zoom-alternate your-domain.com
```

Or just use the generated URL.

**Start the Tunnel:**
```powershell
cloudflared tunnel run zoom-alternate --url http://localhost:3000
```

You'll see:
```
INV-xxx | https://zoom-alternate.your-domain.com (or auto-generated URL)
```

✅ **Your backend is now public!**

### Step 6: Connect Frontend to Backend

Edit `public/login.html` (around line 117):

**Find this:**
```javascript
window.API_BASE_URL = window.location.origin;
```

**Replace with your Cloudflare URL:**
```javascript
// Use your Cloudflare Tunnel URL
window.API_BASE_URL = 'https://zoom-alternate.your-domain.com';
// OR use auto-generated URL:
// window.API_BASE_URL = 'https://abc123xyz.cloudflared.io';
```

**Push the change to GitHub:**
```powershell
git add public/login.html
git commit -m "Update API backend URL for public deployment"
git push
```

GitHub will auto-rebuild in ~1 minute.

✅ **Everything is connected!**

### Step 7: Test Public Deployment

1. **Visit your GitHub Pages URL:**
   ```
   https://YOUR_USERNAME.github.io/zoom-alternate/login.html
   ```

2. **Owner Login:**
   - Email: `nowshadsifat2@gmail.com`
   - Password: `admin123`
   - Scan QR code
   - Enter 6-digit code

3. **Create users and test!**

---

## Part 3: Environment Variables (Optional)

Create `.env` file in your project root:

```env
# JWT Secret (change this!)
JWT_SECRET=your-super-secret-key-min-32-characters-long

# Backend API URL (for GitHub Pages)
API_BASE_URL=https://zoom-alternate.your-domain.com

# Node environment
NODE_ENV=production

# Port
PORT=3000
```

**Install dotenv:**
```powershell
npm install dotenv
```

**Add to top of `server/server.js`:**
```javascript
require('dotenv').config();

// Then use:
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
```

---

## Part 4: Keeping Backend Running 24/7

### Option A: PM2 (Recommended for Development)

**Install:**
```powershell
npm install -g pm2
```

**Start:**
```powershell
pm2 start server/server.js --name zoom-alternate
pm2 save
```

**Auto-restart on reboot:**
```powershell
pm2 startup
```

**View logs:**
```powershell
pm2 logs zoom-alternate
```

**Stop:**
```powershell
pm2 stop zoom-alternate
```

### Option B: Windows Task Scheduler (Built-in)

1. Press `Win + R`, type `taskschd.msc`, press Enter
2. Click **Create Basic Task**
3. Name: `Zoom Alternate Server`
4. Trigger: **At startup**
5. Action: **Start a program**
   - Program: `C:\Program Files\nodejs\node.exe`
   - Arguments: `c:\Users\ferdo\OneDrive\Desktop\VS Projects\Zoom Alternate\server\server.js`
6. Click **Finish**

### Option C: nssm (Windows Service)

**Install:**
```powershell
choco install nssm
```

**Create Service:**
```powershell
nssm install ZoomAlternateServer "C:\Program Files\nodejs\node.exe" "c:\Users\ferdo\OneDrive\Desktop\VS Projects\Zoom Alternate\server\server.js"
```

**Start:**
```powershell
net start ZoomAlternateServer
```

**Stop:**
```powershell
net stop ZoomAlternateServer
```

---

## Part 5: Troubleshooting

### "Invalid form control with name=''"
- ✅ Fixed in latest version. Make sure you have the latest `login.html`

### "Invalid 2FA code"
- Check phone/PC time is synced with internet
- Code changes every 30 seconds
- Try next code that appears

### "API connection failed"
- Backend not running: Check `npm start` is running
- Wrong URL: Verify `window.API_BASE_URL` in login.html
- Cloudflare tunnel down: Run `cloudflared tunnel run zoom-alternate --url http://localhost:3000`

### "WebSocket connection failed"
- Same as API connection failed
- Check browser DevTools (F12) → Network tab

### "Users can't login"
- Make sure user was created by owner
- Check email spelling exactly
- Users need different credentials from owner

### "Backend won't start"
```powershell
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill the process using port 3000
taskkill /PID <PID> /F

# Try npm start again
npm start
```

### "GitHub Pages shows old files"
- Clear browser cache: Ctrl+Shift+Delete
- Force refresh: Ctrl+F5
- GitHub Pages takes 1-2 minutes to update

---

## Quick Reference

### URLs
| Environment | URL |
|-------------|-----|
| Local | `http://localhost:3000/login.html` |
| GitHub Pages | `https://YOUR_USERNAME.github.io/zoom-alternate/login.html` |
| Local Meeting | `http://localhost:3000/index.html?room=code` |

### Commands
```powershell
# Start server locally
npm start

# Push to GitHub
git add public/*
git commit -m "message"
git push

# Start Cloudflare tunnel
cloudflared tunnel run zoom-alternate --url http://localhost:3000

# Check if server running
netstat -ano | findstr :3000

# Restart server
Ctrl+C (stop), npm start (start)
```

### Default Credentials
- **Email**: `nowshadsifat2@gmail.com`
- **Password**: `admin123`
- **Role**: Owner (can create users, manage settings)

### Important Folders
- `public/` → Frontend (upload to GitHub)
- `server/` → Backend (keep on your PC)
- `data/` → User database (auto-created)

---

## Complete Workflow Example

### Day 1: Local Setup
```powershell
npm start
# Visit http://localhost:3000/login.html
# Owner login with your email
# Create test users
# Test all features
```

### Day 2: Public Deployment
```powershell
# Initialize Git
git init
git remote add origin https://github.com/YOUR_USERNAME/zoom-alternate.git

# Push frontend
git add public/*
git commit -m "Initial commit"
git push -u origin main

# Enable GitHub Pages (Settings → Pages)

# Start Cloudflare tunnel
cloudflared tunnel run zoom-alternate --url http://localhost:3000

# Update API URL in login.html
# Push update to GitHub

# Visit public URL and test!
```

### Day 3+: Keep Running
```powershell
# Keep server running with PM2 or Task Scheduler
pm2 start server/server.js

# Keep Cloudflare tunnel running
cloudflared tunnel run zoom-alternate --url http://localhost:3000

# Share public GitHub Pages URL with users
# https://YOUR_USERNAME.github.io/zoom-alternate/login.html
```

---

## File Structure After Setup

```
GitHub Repository (Public)
└── public/
    ├── login.html       ← Your login page
    ├── index.html       ← Meeting room
    ├── app.js           ← Client logic
    └── style.css        ← Styling

Your PC (Private)
├── server/
│   ├── server.js        ← Express server
│   ├── auth.js          ← Auth logic
│   └── ...
├── data/                ← Auto-created
│   ├── owner.json
│   └── users.json
├── public/              ← Also on PC for development
├── node_modules/
├── package.json
└── .env                 ← Not in GitHub
```

---

## Security Best Practices

✅ **What's Already Secure:**
- Passwords hashed with bcrypt
- JWT tokens for sessions
- 2FA for owner with Google Authenticator
- HTTPS with Cloudflare Tunnel

🔒 **What You Should Do:**
- Don't share owner credentials
- Use strong passwords (8+ chars, mixed case)
- Keep `.env` file out of GitHub (add to `.gitignore`)
- Backup `data/` folder regularly
- Monitor who has access

---

## Features Summary

### For Everyone
- ✅ Video conferencing with multiple users
- ✅ Screen sharing (pin and fullscreen)
- ✅ Text chat (toggleable)
- ✅ Audio/video controls
- ✅ Breakout rooms
- ✅ Dark modern UI

### For Owners
- ✅ Email + password login
- ✅ Google Authenticator 2FA
- ✅ Create/manage user accounts
- ✅ Mute all participants
- ✅ Disable all cameras
- ✅ Close breakout rooms
- ✅ See participant list with status

### For Users
- ✅ Email + password login
- ✅ Join meetings with code
- ✅ Full video/audio controls
- ✅ Send chat messages
- ✅ Share screen
- ✅ Join breakout rooms

---

## Next Steps

1. ✅ Start server locally with `npm start`
2. ✅ Test owner login
3. ✅ Create test users
4. ✅ Create GitHub repository
5. ✅ Push frontend to GitHub
6. ✅ Enable GitHub Pages
7. ✅ Set up Cloudflare Tunnel
8. ✅ Update API URL in login.html
9. ✅ Test public deployment
10. ✅ Set up auto-restart (PM2 or Task Scheduler)
11. ✅ Share public URL with users

---

## Support

- **Node.js Issues**: [Node.js Docs](https://nodejs.org/docs)
- **GitHub Help**: [GitHub Docs](https://docs.github.com)
- **Cloudflare**: [Cloudflare Docs](https://developers.cloudflare.com)
- **Google Authenticator**: [Setup Guide](https://support.google.com/accounts/answer/1066447)

---

## You're Ready! 🎉

Your Zoom Alternate app is fully configured and ready for:
- ✅ Local testing
- ✅ Public deployment on GitHub Pages
- ✅ User management with 2FA
- ✅ Secure video conferencing

Start the server with `npm start` and begin using it now!
