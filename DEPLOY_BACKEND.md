# Deploy Backend to Render

Your frontend is on GitHub Pages, but the backend (Node.js server) needs to run separately.

## Quick Deploy to Render (Free)

1. Go to https://render.com and sign up (use GitHub login)

2. Click "New +" → "Web Service"

3. Connect your GitHub repository: `NSifat/zoom-alternate`

4. Configure:
   - **Name**: `zoom-alternate-backend`
   - **Root Directory**: (leave blank)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

5. Click "Create Web Service"

6. Wait 2-3 minutes for deployment

7. Copy your backend URL (e.g., `https://zoom-alternate-backend.onrender.com`)

8. Update `app.js` line 99 with your Render URL:
   ```javascript
   : 'https://YOUR-APP-NAME.onrender.com';
   ```

9. Commit and push:
   ```bash
   git add .
   git commit -m "Update backend URL"
   git push
   ```

10. Visit https://nsifat.github.io/zoom-alternate/ - it will now connect!

## Alternative: Railway (Also Free)

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `NSifat/zoom-alternate`
5. Railway auto-detects Node.js and deploys
6. Copy the URL and update `app.js` as above

**Note**: Render free tier sleeps after 15 minutes of inactivity. First connection may take 30 seconds to wake up.
