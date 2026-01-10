# CollabCode Live - Authentication System

A complete MERN stack authentication system with email/password and Google OAuth integration.

## Features

✅ **Manual Registration** - Register with email and password  
✅ **Manual Login** - Login with email and password  
✅ **Google OAuth** - Login/Register with Google (auto-register for new users)  
✅ **JWT Authentication** - Secure token-based authentication  
✅ **Protected Routes** - Dashboard accessible only to authenticated users  
✅ **Modern UI** - Premium glassmorphism design with dark mode  

## Tech Stack

### Backend
- Node.js + Express
- MySQL (database)
- bcrypt (password hashing)
- jsonwebtoken (JWT tokens)
- google-auth-library (Google OAuth verification)

### Frontend
- React + Vite
- React Router (navigation)
- @react-oauth/google (Google login)
- Axios (API calls)

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8 or higher)
- Google Cloud Console account (for OAuth credentials)

### 1. Clone the Repository
```bash
cd /home/karthik-sherigar/Desktop/CollabCode-Live
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Configure MySQL Database
1. Create a MySQL database:
```sql
CREATE DATABASE collabcode_db;
```

2. Update `backend/.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=collabcode_db
```

#### Configure Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized JavaScript origins: `http://localhost:5173`
6. Add authorized redirect URIs: `http://localhost:5173`
7. Copy Client ID and Client Secret

8. Update `backend/.env`:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

#### Generate JWT Secret
```bash
# Generate a random secret (or use any secure string)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update `backend/.env`:
```env
JWT_SECRET=your_generated_secret_here
```

#### Start Backend Server
```bash
npm start
```

Server will run on `http://localhost:5000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd ../frontend
npm install
```

#### Configure Google OAuth
Update `frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```
(Use the same Client ID from Google Cloud Console)

#### Start Frontend Dev Server
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication Routes

#### POST `/api/auth/register`
Register a new user with email and password.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful! Please login.",
  "userId": 1
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/api/auth/google`
Login or register with Google OAuth.

**Request:**
```json
{
  "credential": "google_id_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Protected Routes

#### GET `/api/protected`
Example protected route (requires JWT token).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "This is a protected route",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

## Database Schema

### users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NULL,
  google_id VARCHAR(255) NULL,
  auth_provider ENUM('LOCAL', 'GOOGLE') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_google_id (google_id)
);
```

## Usage Guide

### Manual Registration
1. Navigate to `http://localhost:5173/register`
2. Fill in name, email, password, and confirm password
3. Click "Create Account"
4. Redirect to login page

### Manual Login
1. Navigate to `http://localhost:5173/login`
2. Enter email and password
3. Click "Login"
4. Redirect to dashboard

### Google Login
1. Navigate to `http://localhost:5173/login`
2. Click "Continue with Google"
3. Select Google account
4. Auto-register (if new) or auto-login (if existing)
5. Redirect to dashboard

### Dashboard
- Protected page requiring authentication
- Displays user information
- Logout button to clear session

## Security Features

✅ Password hashing with bcrypt (10 salt rounds)  
✅ JWT tokens with 7-day expiration  
✅ Google token verification on server-side  
✅ Input validation and sanitization  
✅ CORS configuration  
✅ Protected routes with middleware  

## Edge Cases Handled

- Duplicate email registration → Error
- Google login with existing email → Auto-login
- Manual login for Google-only account → Error message
- Wrong password → Error
- Expired JWT token → Redirect to login
- Invalid Google token → Error

## Project Structure

```
CollabCode-Live/
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL connection
│   ├── middleware/
│   │   └── auth.js            # JWT verification
│   ├── routes/
│   │   └── auth.js            # Auth endpoints
│   ├── utils/
│   │   └── validation.js      # Input validation
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Express server
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   └── api.js         # API calls
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css          # Styles
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Troubleshooting

### Backend won't start
- Check MySQL is running: `sudo systemctl status mysql`
- Verify database credentials in `backend/.env`
- Ensure database exists: `CREATE DATABASE collabcode_db;`

### Google login not working
- Verify Google Client ID in both `backend/.env` and `frontend/.env`
- Check authorized origins in Google Cloud Console
- Ensure `http://localhost:5173` is added

### JWT token errors
- Check JWT_SECRET is set in `backend/.env`
- Clear localStorage and try logging in again

### CORS errors
- Verify FRONTEND_URL in `backend/.env` matches frontend URL
- Check backend is running on port 5000

## License

MIT
