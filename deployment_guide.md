# 🚀 CollabCode Live - Deployment Guide

This guide details how to deploy the CollabCode Live ecosystem using **Railway** (for Database & Backend) and **Vercel** (for Frontend).

## 1. MySQL Setup (Railway)

1.  Log in to [Railway.app](https://railway.app/).
2.  Click **New Project** > **Provision MySQL**.
3.  Once the database is ready, click on the **MySQL** service.
4.  Go to the **Variables** tab to find your credentials:
    - `MYSQLHOST`
    - `MYSQLUSER`
    - `MYSQLPASSWORD`
    - `MYSQLPORT`
    - `MYSQLDATABASE`
5.  **Important**: Keep these handy for the backend setup.

## 2. Backend Deployment (Railway)

1.  Click **New** > **GitHub Repo** (ensure your code is pushed to a repository).
2.  Select the `backend` folder (or the root if it's a monorepo).
3.  Go to the **Variables** tab and add the following:
    - `PORT`: 5000
    - `NODE_ENV`: production
    - `FRONTEND_URL`: (Your Vercel URL - you'll update this later)
    - `DB_HOST`: `${{MySQL.MYSQLHOST}}`
    - `DB_USER`: `${{MySQL.MYSQLUSER}}`
    - `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
    - `DB_NAME`: `${{MySQL.MYSQLDATABASE}}`
    - `MONGODB_URI`: (You can also provision MongoDB on Railway or use Atlas)
    - `JWT_SECRET`: (A long random string)
    - `GOOGLE_CLIENT_ID`: (From Google Console)
    - `GOOGLE_CLIENT_SECRET`: (From Google Console)
    - `GITHUB_CLIENT_ID`: (From GitHub Developer Settings)
    - `GITHUB_CLIENT_SECRET`: (From GitHub Developer Settings)
    - `ENCRYPTION_KEY`: (Your 32-character key)
    - `BACKEND_URL`: (This Railway service's URL once generated)
4.  In **Settings**, ensure the **Start Command** is `npm start`.

## 3. Frontend Deployment (Vercel)

1.  Go to [Vercel](https://vercel.com/) and click **Add New** > **Project**.
2.  Import your GitHub repository.
3.  In the **Framework Preset**, select **Vite** (if prompted).
4.  Set the **Root Directory** to `frontend`.
5.  In **Environment Variables**, add:
    - `VITE_API_URL`: (Your Railway Backend URL)
6.  Click **Deploy**.

---

## 🔗 Final Connection Steps

Once both are deployed:
1.  **Vercel to Railway**: Ensure `VITE_API_URL` on Vercel matches your Railway URL.
2.  **Railway to Vercel**: Update the `FRONTEND_URL` on Railway to match your Vercel URL.
3.  **Third-Party OAuth**: 
    - Update the **Google Authorized Redirect URI** in Google Console.
    - Update the **GitHub Callback URL** in GitHub Developer Settings.

## 🛠️ Troubleshooting

- **CORS Error**: Double-check that `FRONTEND_URL` on the backend matches the Vercel URL exactly (no trailing slash).
- **Socket Connection**: Ensure the frontend `socket.js` is using the `VITE_API_URL` instead of `localhost`.
