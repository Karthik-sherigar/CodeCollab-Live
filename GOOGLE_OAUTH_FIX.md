# Quick Fix for Google OAuth "Access Blocked" Error

## The Problem
Error: **"Access blocked: Authorization Error - The OAuth client was not found"**

This means your Google Cloud Console OAuth credentials need the correct authorized origins.

## The Solution

### Step 1: Go to Google Cloud Console Credentials
1. Visit: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID (the one ending in `.apps.googleusercontent.com`)
3. Click on it to edit

### Step 2: Add Authorized JavaScript Origins
In the **"Authorized JavaScript origins"** section, make sure you have:

```
http://localhost:5173
```

**Important Notes:**
- ✅ Use `http://localhost:5173` (NOT `http://localhost:5173/`)
- ✅ No trailing slash
- ✅ Must be exactly `localhost` (not `127.0.0.1`)
- ✅ Port must match your frontend (5173)

### Step 3: Add Authorized Redirect URIs
In the **"Authorized redirect URIs"** section, add:

```
http://localhost:5173
http://localhost:5173/login
```

### Step 4: Save Changes
- Click **"SAVE"** at the bottom
- Wait 1-2 minutes for changes to propagate

### Step 5: Clear Browser Cache
```bash
# In your browser (Ctrl+Shift+Delete)
# Or use incognito/private mode
```

### Step 6: Test Again
1. Go to http://localhost:5173/login
2. Click "Continue with Google"
3. Should work now!

## Common Mistakes to Avoid

❌ **Wrong:** `http://localhost:5173/` (has trailing slash)
✅ **Correct:** `http://localhost:5173`

❌ **Wrong:** `https://localhost:5173` (using https)
✅ **Correct:** `http://localhost:5173`

❌ **Wrong:** `http://127.0.0.1:5173`
✅ **Correct:** `http://localhost:5173`

## Screenshot Guide

Here's what your Google Cloud Console should look like:

**Authorized JavaScript origins:**
```
http://localhost:5173
```

**Authorized redirect URIs:**
```
http://localhost:5173
http://localhost:5173/login
```

## Still Not Working?

### Check OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Make sure your email is added as a **Test user**
3. Status should be "Testing" (not "In production")

### Verify Client ID
Make sure the Client ID in your `.env` files matches the one in Google Cloud Console:

**Backend (.env):**
```
GOOGLE_CLIENT_ID=863011820142-jplhaorae11fqtiretlvd0kd1si80e1o.apps.googleusercontent.com
```

**Frontend (.env):**
```
VITE_GOOGLE_CLIENT_ID=863011820142-jplhaorae11fqtiretlvd0kd1si80e1o.apps.googleusercontent.com
```

Both should be **identical**.

## After Fixing

Once you've updated Google Cloud Console:
1. Wait 1-2 minutes
2. Refresh your browser (or use incognito mode)
3. Try "Continue with Google" again
4. Should work! ✅
