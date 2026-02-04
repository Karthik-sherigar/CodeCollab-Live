import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { testConnection } from './config/db.js'; // testConnection is from db.js, not initDb.js
import { connectMongoDB } from './config/mongodb.js';
import SessionEvent from './models/SessionEvent.js';
import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspace.js';
import sessionRoutes from './routes/session.js';
import githubRoutes from './routes/github.js';
import executeRoutes from './routes/execute.js';
import { verifyToken } from './middleware/auth.js';
import { apiLimiter, authLimiter, githubLimiter } from './middleware/security.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import pool, { initializeDatabase } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Railway/Vercel (needed for express-rate-limit)
app.set('trust proxy', 1);

// Debugging logs for Railway deployment
console.log('--- Deployment Debug Info ---');
console.log(`PORT: ${PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`DB_HOST defined: ${!!process.env.DB_HOST || !!process.env.MYSQLHOST}`);
console.log(`MONGODB_URI defined: ${!!process.env.MONGODB_URI}`);
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
console.log('----------------------------');

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL, // Restrict to frontend URL
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
// Security middleware
app.use(helmet()); // Set security HTTP headers
app.use('/api', apiLimiter); // Apply rate limiting to all /api routes

app.use(cors({
    origin: process.env.FRONTEND_URL, // Restrict to frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/workspaces', verifyToken, workspaceRoutes);
app.use('/api/sessions', verifyToken, sessionRoutes);
app.use('/api/github', githubLimiter, githubRoutes);
app.use('/api/execute', verifyToken, executeRoutes);

// Protected route example
app.get('/api/protected', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: 'This is a protected route',
        user: req.user
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Test MySQL connection
        const isConnected = await testConnection();
        if (!isConnected) {
            console.error('❌ Failed to connect to database. Please check your .env configuration.');
            process.exit(1);
        }
        console.log('✅ MySQL connection successful');

        // Connect to MongoDB
        await connectMongoDB();
        console.log('✅ MongoDB connection successful');

        // Connect Mongoose for CommentThread model
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collabcode');
        console.log('✅ Mongoose connected for comments');

        // Initialize database
        await initializeDatabase();

        // Socket.IO authentication middleware
        io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.user = decoded;
                next();
            } catch (err) {
                next(new Error('Authentication error: Invalid token'));
            }
        });

        // Socket.IO connection handling
        io.on('connection', (socket) => {
            console.log(`🟢 User connected: ${socket.user.name} (${socket.id})`);

            socket.on('join-session', async ({ sessionId }) => {
                try {
                    // 1. Check if session exists and get workspace_id
                    const [sessions] = await pool.query(
                        'SELECT workspace_id FROM sessions WHERE id = ?',
                        [sessionId]
                    );

                    if (sessions.length === 0) {
                        return socket.emit('error', { message: 'Session not found' });
                    }

                    const workspaceId = sessions[0].workspace_id;

                    // 2. Check if user is a member of the workspace
                    const [members] = await pool.query(
                        'SELECT * FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
                        [workspaceId, socket.user.id]
                    );

                    if (members.length === 0) {
                        return socket.emit('error', { message: 'Access denied: You are not a member of this workspace' });
                    }

                    // 3. Join the room if authorized
                    socket.join(`session-${sessionId}`);
                    console.log(`✅ User ${socket.user.name} joined session-${sessionId}`);

                    // Broadcast that a user joined
                    socket.to(`session-${sessionId}`).emit('user-joined', {
                        userId: socket.user.id,
                        userName: socket.user.name
                    });
                } catch (err) {
                    console.error('Socket join-session error:', err);
                    socket.emit('error', { message: 'Failed to join session' });
                }
            });

            // Handle code changes
            socket.on('code-change', async ({ sessionId, code }) => {
                // Record event for playback
                try {
                    await SessionEvent.create({
                        sessionId: sessionId.toString(),
                        type: 'CODE_CHANGE',
                        payload: { code },
                        timestamp: new Date()
                    });
                } catch (err) {
                    console.error('Error recording code change:', err);
                }

                // Broadcast to all others in the room
                socket.to(`session-${sessionId}`).emit('code-update', code);
            });

            // Handle cursor movements
            socket.on('cursor-move', (data) => {
                // Broadcast cursor position to all others in the room
                socket.to(`session-${data.sessionId}`).emit('cursor-update', {
                    userId: data.userId,
                    userName: data.userName,
                    userColor: data.userColor,
                    position: data.position
                });
            });

            // Handle add comment
            socket.on('add-comment', async (data) => {
                console.log('💬 Comment added:', data);

                // Record event for playback
                try {
                    await SessionEvent.create({
                        sessionId: data.sessionId.toString(),
                        type: 'COMMENT_ADD',
                        payload: data,
                        timestamp: new Date()
                    });
                } catch (err) {
                    console.error('Error recording comment:', err);
                }

                // Broadcast to all in room (including sender for confirmation)
                io.to(`session-${data.sessionId}`).emit('comment-added', data);
            });

            // Handle add reply
            socket.on('add-reply', (data) => {
                console.log('💬 Reply added:', data);
                io.to(`session-${data.sessionId}`).emit('reply-added', data);
            });

            // Handle resolve comment
            socket.on('resolve-comment', async (data) => {
                console.log('✅ Comment resolved:', data);

                // Record event for playback
                try {
                    await SessionEvent.create({
                        sessionId: data.sessionId.toString(),
                        type: 'COMMENT_RESOLVE',
                        payload: data,
                        timestamp: new Date()
                    });
                } catch (err) {
                    console.error('Error recording resolve:', err);
                }

                io.to(`session-${data.sessionId}`).emit('comment-resolved', data);
            });

            // Handle reopen comment
            socket.on('reopen-comment', async (data) => {
                console.log('🔄 Comment reopened:', data);

                // Record event for playback
                try {
                    await SessionEvent.create({
                        sessionId: data.sessionId.toString(),
                        type: 'COMMENT_REOPEN',
                        payload: data,
                        timestamp: new Date()
                    });
                } catch (err) {
                    console.error('Error recording reopen:', err);
                }

                io.to(`session-${data.sessionId}`).emit('comment-reopened', data);
            });

            // Handle delete comment
            socket.on('delete-comment', (data) => {
                console.log('🗑️ Comment deleted:', data);
                io.to(`session-${data.sessionId}`).emit('comment-deleted', data);
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log('🔴 User disconnected:', socket.id);
                // Notify all rooms that this user left
                socket.broadcast.emit('user-left', {
                    userId: socket.id
                });
            });
        });

        // Start listening
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log('\n🚀 CollabCode Backend Server Started');
            console.log(`📡 Server running on port ${PORT} (bound to 0.0.0.0)`);
            console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`⚡ Socket.IO enabled for real-time collaboration`);
            console.log(`\n📋 Status: Online and ready for connections\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
