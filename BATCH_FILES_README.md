# 🚀 Quick Launch Batch Files

Two convenient batch files are included to make launching the app super easy!

## 📌 START.bat - Production Mode ✅ **Use This**

**What it does:**
1. Checks if dependencies are installed
2. Installs them if needed
3. Opens http://localhost:3000 in your browser automatically
4. Starts the server

**How to use:**
- Double-click `START.bat`
- Your browser opens automatically
- Server starts
- Done! Start conferencing!

**Stop the server:**
- Close the terminal window, or
- Press `Ctrl+C` and confirm

---

## 💻 START_DEV.bat - Development Mode

**What it does:**
- Same as START.bat BUT with auto-reload
- When you change code files, server automatically restarts
- Perfect for developing and testing changes

**How to use:**
- Double-click `START_DEV.bat`
- Make changes to code files
- Server automatically restarts (no manual restart needed!)
- Test your changes immediately

**When to use:**
- You're modifying the code
- You want to see changes instantly
- You're extending the app with new features

---

## 📂 Location

Both files are in the project root:
```
c:\Users\ferdo\OneDrive\Desktop\VS Projects\Zoom Alternate\
├── START.bat          ← Use this for normal use
├── START_DEV.bat      ← Use this if you're developing
├── server/
├── public/
└── ...
```

---

## ⚡ Quick Start (Super Easy!)

### First Time EVER
1. Double-click `START.bat`
2. Let it install dependencies
3. Browser opens to http://localhost:3000
4. Join a meeting!

### Every Other Time
1. Double-click `START.bat`
2. Browser opens automatically
3. Start using it!

---

## 🎯 Tips

**Tip 1: Bookmark in Browser**
- Once the app loads, bookmark it
- Can close and reopen by clicking bookmark
- Don't need to run batch file every time (just once to start server)

**Tip 2: Keep Server Running**
- Leave the terminal window open while you use the app
- Close it when done conferencing
- Server stays running until you close it

**Tip 3: Test Locally**
- Open http://localhost:3000?room=test in multiple tabs
- Each tab is a different "user"
- Test features (mute, camera, screen share, chat)

**Tip 4: Test on Network**
- Get your computer IP: Open cmd, type `ipconfig`
- Look for "IPv4 Address" (usually 192.168.x.x)
- On another computer on same network:
  - Open: http://[YOUR-IP]:3000?room=test
  - You'll see video from both computers!

---

## 🐛 Troubleshooting

**"Port 3000 already in use"**
- Another app is using port 3000
- Close other apps or wait a moment
- Or use different port: Set environment variable `PORT=3001`

**"npm install fails"**
- Make sure Node.js is installed
- Download from: https://nodejs.org

**"Browser doesn't open automatically"**
- Manually open: http://localhost:3000
- It's still running even if browser doesn't auto-open

**"Permission denied" when clicking .bat**
- Right-click → Run as Administrator
- Or: Extract project to Documents instead

---

## ✅ You're All Set!

Just **double-click START.bat** and you're ready to start video conferencing! 🎉

No command line needed! No complicated setup! Just click and go!

---

**Enjoy!** 📹✨
