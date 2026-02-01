# Authentication System Quick Reference

## Overview
Your app now has a complete login/authentication system with:
- ✅ Owner login with 2FA (Google Authenticator)
- ✅ User creation by owner
- ✅ User login with email/password
- ✅ JWT token-based session management
- ✅ Password hashing with bcrypt

---

## Login Flow

### First Time Setup (Owner)
```
1. Visit login.html
2. Click "Owner Login" tab
3. Enter email + password (first time ever)
4. Get QR code + secret key
5. Scan with Google Authenticator app
6. Enter 6-digit code to verify
7. Owner login complete!
```

### Create Users (Owner Only)
```
1. Login as owner
2. Go to Settings → Participants
3. Click "Create New User"
4. Enter email and password
5. Share credentials with users
```

### User Login (Regular Users)
```
1. Visit login.html
2. Click "User Login" tab (default)
3. Enter email + password
4. Click "Sign In"
5. Join meeting!
```

---

## File Structure

### Backend Auth Files
```
server/
├── auth.js              ← All auth logic
│   ├── initializeOwner()
│   ├── ownerLogin()
│   ├── verify2FA()
│   ├── userLogin()
│   ├── createUser()
│   └── ...
└── server.js           ← Auth endpoints
    ├── POST /api/auth/owner-login
    ├── POST /api/auth/verify-2fa
    ├── POST /api/auth/login
    ├── POST /api/users/create
    ├── GET  /api/users/list
    └── DELETE /api/users/:userId

data/                   ← Auto-created
├── owner.json          ← Owner account + 2FA secret
└── users.json          ← All user accounts
```

### Frontend Auth Files
```
public/
├── login.html           ← Login page with 2FA UI
├── app.js               ← Auth checks + logout function
└── index.html           ← Logout button in controls
```

---

## Key Functions

### Backend (server/auth.js)

```javascript
// Initialize owner (first login ever)
await initializeOwner(email, password)
// Returns: { secret, qrCode, isFirstTime }

// Owner login
await ownerLogin(email, password)
// Returns: { secret, qrCode, isFirstTime }

// Verify 2FA code (after owner login)
verify2FA(email, twoFACode)
// Returns: { success: boolean }

// User login
await userLogin(email, password)
// Returns: { success, user }

// Create new user (owner only)
await createUser(email, password)
// Returns: { success, user }
```

### Frontend (public/app.js)

```javascript
// Check if user is authenticated (runs on page load)
checkAuthentication()
// Redirects to login.html if no token

// Logout user
logout()
// Clears token from localStorage
// Disconnects Socket.IO
// Redirects to login.html
```

---

## Data Storage

### owner.json
```json
{
  "email": "your@email.com",
  "password": "$2a$10$...",  // bcrypt hash
  "secret": "ABCD1234...",    // Base32 for Google Authenticator
  "secretFull": {
    "base32": "...",
    "otpauth_url": "..."
  },
  "isFirstTime": false,
  "createdAt": "2024-01-31T..."
}
```

### users.json
```json
{
  "users": [
    {
      "id": "1706....",
      "email": "user@example.com",
      "password": "$2a$10$...",  // bcrypt hash
      "createdAt": "2024-01-31T..."
    }
  ]
}
```

---

## Environment Variables

Add to `.env` file (create in root directory):

```env
# JWT Secret for token signing
JWT_SECRET=your-super-secret-key-min-32-characters-long

# Backend API URL (for GitHub Pages deployment)
API_BASE_URL=https://your-public-backend-url.com

# Node environment
NODE_ENV=production

# Port (default 3000)
PORT=3000
```

---

## Testing the Auth System

### Test Owner Registration
```bash
# Start server
npm start

# Visit login page
# Owner Login → enter new email/pass
# Should show QR code + secret key
# Scan with Google Authenticator
# Enter 6-digit code
# Should see "Owner login successful!"
```

### Test User Creation
```bash
# As owner, go to Settings → Participants
# Click "Create New User"
# Enter email + password
# Should see "User created successfully"
```

### Test User Login
```bash
# New browser or incognito window
# Visit login page
# User Login → enter email/pass from creation
# Should login and see meeting
```

### Test Chat Toggle
```bash
# Login
# Go to Settings → General Settings
# Toggle "Enable chat" checkbox
# Chat sidebar should appear/disappear
# Logout and test with different user
```

---

## Common Issues & Solutions

### "Invalid 2FA code"
**Cause**: Phone/PC time is out of sync
**Solution**: 
- Sync both devices with internet time
- Retry with next 6-digit code (changes every 30 sec)

### "User not found"
**Cause**: Email doesn't exist in database
**Solution**:
- Owner must create user first
- Check email spelling exactly

### "Invalid password"
**Cause**: Password is wrong
**Solution**:
- Passwords are case-sensitive
- Owner can only reset by editing users.json manually

### "API connection failed"
**Cause**: Backend not running or wrong URL
**Solution**:
- Check `npm start` is running
- Verify `window.API_BASE_URL` in login.html
- Check firewall allows port 3000

### "Session expired"
**Cause**: Token expired or invalid
**Solution**:
- Logout and login again
- Clear browser localStorage if stuck

---

## Customization

### Change JWT Expiration
In `server/server.js`, line ~45:
```javascript
// Change '24h' to your desired duration
const token = jwt.sign(data, JWT_SECRET, { expiresIn: '24h' });
```

### Change 2FA Window
In `server/auth.js`, line ~120:
```javascript
const verified = speakeasy.totp.verify({
  secret: ownerData.secret,
  encoding: 'base32',
  token: token,
  window: 2  // ← Change this (2 means ±1 30-sec window)
});
```

### Disable Chat by Default
In `public/app.js`, line ~50:
```javascript
settings: {
  enableChat: false  // ← Change from true to false
}
```

---

## Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use strong JWT secret** - At least 32 random characters
3. **Use HTTPS in production** - GitHub Pages + Cloudflare both provide it
4. **Backup `data/` folder** - Contains user accounts
5. **Monitor users.json** - Regular users can be deleted by owner
6. **Rotate owner password** - Update `owner.json` manually if needed

---

## Need More Users?

Owner can create unlimited users:
1. Settings → Participants → "Create New User"
2. OR: Admin can directly edit `data/users.json` (advanced)

Each user gets their own credentials to login independently.

