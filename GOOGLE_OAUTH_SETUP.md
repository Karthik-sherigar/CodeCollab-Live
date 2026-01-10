# Google OAuth Setup Guide

## Step-by-Step Instructions

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create a New Project (or select existing)
- Click on the project dropdown at the top
- Click "New Project"
- Name: "CollabCode Live" (or any name you prefer)
- Click "Create"

### 3. Enable Google+ API
- In the left sidebar, go to "APIs & Services" → "Library"
- Search for "Google+ API"
- Click on it and click "Enable"

### 4. Create OAuth 2.0 Credentials
- Go to "APIs & Services" → "Credentials"
- Click "+ CREATE CREDENTIALS" → "OAuth client ID"
- If prompted, configure the OAuth consent screen:
  - User Type: External
  - App name: CollabCode Live
  - User support email: your email
  - Developer contact: your email
  - Click "Save and Continue"
  - Scopes: Skip this, click "Save and Continue"
  - Test users: Add your email (sherigarkarthik6@gmail.com)
  - Click "Save and Continue"

### 5. Create OAuth Client ID
- Application type: **Web application**
- Name: "CollabCode Web Client"
- Authorized JavaScript origins:
  - Click "+ Add URI"
  - Add: `http://localhost:5173`
  - Add: `http://localhost:5000`
- Authorized redirect URIs:
  - Click "+ Add URI"
  - Add: `http://localhost:5173`
- Click "Create"

### 6. Copy Your Credentials
You'll see a popup with:
- **Client ID** (looks like: xxxxx.apps.googleusercontent.com)
- **Client Secret** (looks like: GOCSPX-xxxxx)

### 7. Update Backend .env
Open: `/home/karthik-sherigar/Desktop/CollabCode-Live/backend/.env`

Replace these lines:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

With your actual credentials:
```env
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_actual_secret
```

### 8. Update Frontend .env
Open: `/home/karthik-sherigar/Desktop/CollabCode-Live/frontend/.env`

Replace:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

With your actual Client ID:
```env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
```

**IMPORTANT:** Use the SAME Client ID in both files!

### 9. Restart Both Servers
```bash
# Stop both servers (Ctrl+C in each terminal)

# Terminal 1 - Backend
cd /home/karthik-sherigar/Desktop/CollabCode-Live/backend
npm start

# Terminal 2 - Frontend
cd /home/karthik-sherigar/Desktop/CollabCode-Live/frontend
npm run dev
```

### 10. Test Google Login
1. Go to http://localhost:5173/login
2. Click "Continue with Google"
3. Select your Google account
4. Should auto-register and redirect to dashboard

## Troubleshooting

**Error: "The OAuth client was not found"**
- You haven't created OAuth credentials yet
- Follow steps 1-6 above

**Error: "redirect_uri_mismatch"**
- Make sure `http://localhost:5173` is in Authorized JavaScript origins
- Make sure `http://localhost:5173` is in Authorized redirect URIs

**Error: "Access blocked: This app's request is invalid"**
- Make sure you added your email as a test user in OAuth consent screen
- The app is in "Testing" mode, only test users can access it

**Google button not showing**
- Check browser console for errors
- Verify VITE_GOOGLE_CLIENT_ID is set in frontend/.env
- Make sure you restarted the frontend server after updating .env

## Quick Reference

**Google Cloud Console:** https://console.cloud.google.com/
**OAuth Credentials Page:** https://console.cloud.google.com/apis/credentials

**Required URIs:**
- Authorized JavaScript origins: `http://localhost:5173`, `http://localhost:5000`
- Authorized redirect URIs: `http://localhost:5173`
