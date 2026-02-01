# GitHub Pages + Backend Deployment Guide

## Overview
Your Zoom Alternate application can be deployed in two parts:
1. **Frontend**: Static HTML/CSS/JS hosted on GitHub Pages (Free!)
2. **Backend**: Node.js server running on your PC or any server

This gives you a publicly accessible website while keeping your server code on your machine.

---

## Part 1: GitHub Pages Setup

### Step 1: Create a GitHub Repository
1. Go to [GitHub](https://github.com) and login
2. Click **New Repository**
3. Name it: `zoom-alternate` (or your preferred name)
4. Set to **Public** (required for free GitHub Pages)
5. Click **Create repository**

### Step 2: Prepare Your Files
Your GitHub repository only needs the `public` folder contents:
- `login.html`
- `index.html`
- `app.js`
- `style.css`

The `server` folder stays on your PC only.

### Step 3: Push Files to GitHub
```powershell
# Navigate to your project
cd "c:\Users\ferdo\OneDrive\Desktop\VS Projects\Zoom Alternate"

# Initialize git (if not already done)
git init
git add public/*
git add .gitignore  # Optional: create this to exclude server folder
git commit -m "Initial commit - Zoom Alternate frontend"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/zoom-alternate.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **Branch: main**
4. Under "Folder", select **/ (root)**
5. Click **Save**

GitHub will build and deploy your site. You'll see:
```
Your site is live at https://YOUR_USERNAME.github.io/zoom-alternate
```

---

## Part 2: Backend on Your PC

### Step 1: Keep Your Backend Running
Your `server/server.js` continues running on your PC:

```powershell
cd "c:\Users\ferdo\OneDrive\Desktop\VS Projects\Zoom Alternate"
npm start
```

This starts your server on `http://localhost:3000`

### Step 2: Expose Your PC to the Internet

**Option A: Use Cloudflare Tunnel (Recommended)**

**Install Cloudflare Tunnel:**
```powershell
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/install-and-setup/tunnel-guide/remoteconfig/linux/
# For Windows, download the latest release

# Or use Chocolatey:
choco install cloudflare-warp
```

**Create a Tunnel:**
```powershell
# Login to Cloudflare
cloudflared login

# Create a tunnel (replace your-tunnel-name)
cloudflared tunnel create zoom-alternate

# Route to your backend
cloudflared tunnel route dns zoom-alternate your-domain.com

# Run the tunnel
cloudflared tunnel run zoom-alternate
```

You'll get a public URL like: `https://zoom-alternate.your-domain.com`

---

**Option B: Use ngrok (Alternative)**

**Install ngrok:**
```powershell
# Download from: https://ngrok.com/download
# Or use Chocolatey:
choco install ngrok

# Get an ngrok auth token from https://dashboard.ngrok.com/auth/your-authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

**Expose Your Backend:**
```powershell
ngrok http 3000
```

You'll get a public URL like: `https://abc123xyz.ngrok.io`

**Note:** ngrok URLs change every time you restart (unless you have a paid plan)

---

## Part 3: Connect Frontend to Backend

### Update Your Configuration

In `public/login.html`, around line 117, update:

```javascript
// Set your backend API URL
window.API_BASE_URL = 'https://your-public-backend-url.com';
// Examples:
// window.API_BASE_URL = 'https://zoom-alternate.your-domain.com';  // Cloudflare
// window.API_BASE_URL = 'https://abc123xyz.ngrok.io';              // ngrok
```

### For GitHub Pages Users
After updating the config, you need to rebuild/push your changes:

```powershell
git add public/login.html
git commit -m "Update API backend URL"
git push
```

GitHub will auto-rebuild and deploy within ~1 minute.

---

## Part 4: Testing the Full Setup

### Test Scenario 1: Owner Registration

1. Visit: `https://YOUR_USERNAME.github.io/zoom-alternate/login.html`
2. Click **Owner Login** tab
3. Enter your email and password
4. On first login, you'll see:
   - QR code to scan with Google Authenticator
   - Secret key to manually enter
5. Scan with Google Authenticator app on your phone
6. Enter the 6-digit code from Authenticator
7. You're logged in as Owner!

### Test Scenario 2: Create User Credentials

1. As owner, go to Settings → Participants section
2. Find "Create New User" button (or use admin panel)
3. Enter email and password for a new user
4. Share these credentials with someone

### Test Scenario 3: User Login & Join Meeting

1. Go to login page with a different browser/device
2. Click **User Login** tab
3. Use the credentials you just created
4. You're now in the meeting!

### Test Scenario 4: Enable/Disable Chat

1. Go to Settings → General Settings
2. Toggle "Enable chat" checkbox
3. Click "Save Settings"
4. Chat sidebar appears/disappears for all users

---

## Part 5: Environment Variables (Production)

For security, use environment variables instead of hardcoding:

### Update `server/server.js`

```javascript
// Use environment variable for backend URL
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
```

### Create `.env` file

```
JWT_SECRET=your-super-secret-key-min-32-characters-long
API_BASE_URL=https://your-public-backend-url.com
NODE_ENV=production
```

### Install `dotenv`

```powershell
npm install dotenv
```

### Load in server.js (add at top)

```javascript
require('dotenv').config();
```

---

## Part 6: Keeping Backend Running

### Option 1: PM2 (Process Manager)

```powershell
npm install -g pm2

# Start your app with PM2
pm2 start server/server.js --name zoom-alternate

# Auto-restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs zoom-alternate
```

### Option 2: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to "At startup"
4. Set action to: `C:\Program Files\nodejs\node.exe`
5. Arguments: `"c:\Users\ferdo\OneDrive\Desktop\VS Projects\Zoom Alternate\server\server.js"`

### Option 3: Windows Service

Use `nssm` (Non-Sucking Service Manager):

```powershell
choco install nssm

nssm install ZoomAlternateServer "C:\Program Files\nodejs\node.exe" "c:\Users\ferdo\OneDrive\Desktop\VS Projects\Zoom Alternate\server\server.js"

# Start the service
net start ZoomAlternateServer
```

---

## Troubleshooting

### "API connection failed"
- Check if backend is running: `http://your-backend-url/api/auth/login` in browser
- Verify `window.API_BASE_URL` is correct in login.html
- Check CORS is enabled in `server/server.js`

### "WebSocket connection failed"
- Same as above - backend must be reachable
- Check browser DevTools → Network tab
- Look for error messages in console

### "Token expired after logout"
- Token stored in localStorage, persists across page refreshes
- Logout clears it automatically
- If stuck, clear browser localStorage manually

### "2FA code doesn't work"
- Verify time is synced on PC and phone (sync both with internet time)
- Google Authenticator should show 6-digit code that changes every 30 seconds
- You have a 2-second window to enter (30 second window total with 2 codes)

---

## File Structure After Deployment

```
GitHub Repository (Public)
├── public/
│   ├── login.html       ← With API_BASE_URL configured
│   ├── index.html
│   ├── app.js
│   └── style.css

Your PC (Private)
├── server/
│   ├── server.js
│   ├── auth.js
│   └── ...
├── data/                ← Auto-created, stores users
│   ├── users.json
│   └── owner.json
├── node_modules/
└── package.json
```

---

## Security Considerations

1. **JWT Secret**: Use a strong, random secret in `.env`
2. **CORS**: Currently allows all origins - restrict to your domain in production
3. **HTTPS**: GitHub Pages and Cloudflare both provide free HTTPS
4. **Passwords**: Stored hashed with bcrypt, never in plain text
5. **2FA**: Google Authenticator (TOTP) - time-based, no internet needed

---

## Next Steps

1. ✅ GitHub Pages setup - Your frontend is live
2. ✅ Expose backend with Cloudflare/ngrok
3. ✅ Update API URL in login.html
4. ✅ Test the full auth flow
5. ✅ Set up auto-restart for backend (PM2/Task Scheduler)
6. ✅ Share your public URL with users!

---

## Cost Summary

- **GitHub Pages**: Free ✓
- **Cloudflare Tunnel**: Free ✓
- **ngrok**: Free (with limitations, $5/month for custom domain)
- **Your backend**: Free (runs on your PC)

**Total**: Completely Free!

