import express from 'express';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import pool from '../config/db.js';
import { generateToken } from '../middleware/auth.js';
import {
    validateRegisterInput,
    validateLoginInput,
    sanitizeInput
} from '../utils/validation.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/register - Manual Registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Sanitize inputs
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email)?.toLowerCase();

        // Validate inputs
        const validation = validateRegisterInput(sanitizedName, sanitizedEmail, password);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Check if email already exists
        const [existingUsers] = await pool.query(
            'SELECT id, auth_provider FROM users WHERE email = ?',
            [sanitizedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert user into database
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password_hash, auth_provider) VALUES (?, ?, ?, ?)',
            [sanitizedName, sanitizedEmail, passwordHash, 'LOCAL']
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please login.',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// POST /api/auth/login - Manual Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Sanitize inputs
        const sanitizedEmail = sanitizeInput(email)?.toLowerCase();

        // Validate inputs
        const validation = validateLoginInput(sanitizedEmail, password);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Find user by email
        const [users] = await pool.query(
            'SELECT id, name, email, password_hash, auth_provider FROM users WHERE email = ?',
            [sanitizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Check if user registered with Google only
        if (user.auth_provider === 'GOOGLE' && !user.password_hash) {
            return res.status(400).json({
                success: false,
                message: 'This account uses Google login. Please use "Continue with Google".'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user.id, user.email, user.name);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// POST /api/auth/google - Google OAuth Login/Register
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: 'Google credential is required'
            });
        }

        // Verify Google token
        let ticket;
        try {
            ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID
            });
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Google token'
            });
        }

        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const email = payload.email?.toLowerCase();
        const name = payload.name;

        if (!email || !googleId) {
            return res.status(400).json({
                success: false,
                message: 'Unable to get user info from Google'
            });
        }

        // Check if user exists
        const [existingUsers] = await pool.query(
            'SELECT id, name, email, google_id, auth_provider FROM users WHERE email = ?',
            [email]
        );

        let user;

        if (existingUsers.length > 0) {
            // User exists - AUTO LOGIN
            user = existingUsers[0];

            // Update google_id if not set
            if (!user.google_id) {
                await pool.query(
                    'UPDATE users SET google_id = ?, auth_provider = ? WHERE id = ?',
                    [googleId, 'GOOGLE', user.id]
                );
            }

        } else {
            // User doesn't exist - AUTO REGISTER
            const [result] = await pool.query(
                'INSERT INTO users (name, email, google_id, auth_provider) VALUES (?, ?, ?, ?)',
                [name, email, googleId, 'GOOGLE']
            );

            user = {
                id: result.insertId,
                name,
                email,
                google_id: googleId,
                auth_provider: 'GOOGLE'
            };
        }

        // Generate JWT token
        const token = generateToken(user.id, user.email, user.name);

        res.json({
            success: true,
            message: existingUsers.length > 0 ? 'Login successful' : 'Registration and login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during Google authentication'
        });
    }
});

export default router;
